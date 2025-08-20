const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const database = require('../_lib/database');

// Google OAuth 클라이언트 초기화
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('Allow', 'POST');
        return res.end('Method Not Allowed');
    }

    try {
        await database.connect();
        await database.init();

        // JSON Body 파싱
        let body = {};
        let bodyText = '';
        
        try {
            // Vercel에서는 req.body가 이미 파싱되어 있을 수 있습니다
            if (req.body) {
                console.log('Using pre-parsed body:', req.body);
                body = req.body;
            } else {
                // 수동으로 파싱
                const buffers = [];
                for await (const chunk of req) buffers.push(chunk);
                bodyText = Buffer.concat(buffers).toString('utf8');
                console.log('Received raw body:', bodyText);
                body = JSON.parse(bodyText || '{}');
            }
        } catch (error) {
            console.error('Body parsing error:', error);
            console.error('Raw body text:', bodyText);
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: 'Invalid JSON body' }));
        }

        const { id_token } = body;
        console.log('Extracted id_token:', id_token ? 'present' : 'missing');
        console.log('Full body object:', body);

        if (!id_token) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: 'ID token is required' }));
        }

        // Google ID 토큰 검증
        const ticket = await client.verifyIdToken({
            idToken: id_token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        console.log('Google 토큰 검증 성공:', { 
            googleId, 
            email, 
            name,
            nameLength: name ? name.length : 0,
            nameBytes: name ? Buffer.from(name, 'utf8').length : 0
        });

        // 데이터베이스에서 사용자 조회 또는 생성
        let user = await database.get('SELECT * FROM users WHERE google_id = $1', [googleId]);

        if (!user) {
            // 새 사용자 생성 (username은 Google name을 사용)
            const username = name || email.split('@')[0];
            
            const result = await database.get(
                'INSERT INTO users (google_id, username, email, name, picture, daily_count, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, google_id, username, email, name, picture, daily_count, created_at',
                [googleId, username, email, name, picture, 10, new Date().toISOString()]
            );
            
            user = result;
            
            console.log('새 사용자 생성:', {
                id: user.id,
                google_id: user.google_id,
                username: user.username,
                email: user.email,
                name: user.name,
                usernameLength: user.username ? user.username.length : 0,
                nameLength: user.name ? user.name.length : 0
            });
        } else {
            // 기존 사용자 정보 업데이트 (username을 Google name으로 업데이트)
            const username = name || user.username || email.split('@')[0];
            
            await database.run(
                'UPDATE users SET username = $1, email = $2, name = $3, picture = $4, last_login = $5 WHERE google_id = $6',
                [username, email, name, picture, new Date().toISOString(), googleId]
            );
            
            user.username = username;
            user.email = email;
            user.name = name;
            user.picture = picture;
            user.last_login = new Date().toISOString();
            
            console.log('기존 사용자 로그인:', {
                id: user.id,
                google_id: user.google_id,
                username: user.username,
                email: user.email,
                name: user.name,
                usernameLength: user.username ? user.username.length : 0,
                nameLength: user.name ? user.name.length : 0
            });
        }

        // JWT 토큰 생성 (알고리즘 명시)
        const token = jwt.sign(
            { 
                userId: user.id, 
                googleId: user.google_id,
                email: user.email 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { 
                expiresIn: '7d',
                algorithm: 'HS256'
            }
        );

        // 응답
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            success: true,
            token: token,
            user: {
                id: user.id,
                google_id: user.google_id,
                email: user.email,
                name: user.name,
                picture: user.picture,
                daily_count: user.daily_count
            }
        }));

    } catch (error) {
        console.error('Google 인증 오류:', error);
        
        if (error.message.includes('Token used too late')) {
            res.statusCode = 401;
            return res.end(JSON.stringify({ error: '토큰이 만료되었습니다. 다시 로그인해주세요.' }));
        }
        
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: '인증 처리 중 오류가 발생했습니다.' }));
    }
};
