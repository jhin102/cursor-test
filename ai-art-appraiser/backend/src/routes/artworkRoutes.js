const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const database = require('../utils/database');
const claudeService = require('../services/claudeService');

// 작품 평가 API
router.post('/evaluate', async (req, res) => {
    try {
        const { image, username = '게스트' } = req.body;
        
        if (!image) {
            return res.status(400).json({ error: '이미지 데이터가 필요합니다.' });
        }

        console.log('🎨 작품 평가 요청 받음:', username);

        // 1. 사용자 확인/생성
        let user = await database.get('SELECT * FROM users WHERE username = ?', [username]);
        if (!user) {
            const result = await database.run(
                'INSERT INTO users (username) VALUES (?)',
                [username]
            );
            user = { id: result.id, username, daily_count: 3, total_score: 0 };
        }

        // 2. 일일 제한 확인
        if (user.daily_count <= 0) {
            return res.status(429).json({ 
                error: '오늘의 평가 기회를 모두 사용했습니다. 내일 다시 시도해주세요.' 
            });
        }

        // 3. 이미지 저장
        const imageBuffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        const filename = `${uuidv4()}.png`;
        const imagePath = path.join(__dirname, '../uploads', filename);
        
        await fs.writeFile(imagePath, imageBuffer);
        const imageUrl = `/uploads/${filename}`;

        // 4. Claude API로 평가
        const evaluation = await claudeService.evaluateArtwork(image);

        // 5. 작품 정보 저장 (제목 포함)
        const artworkResult = await database.run(
            `INSERT INTO artworks (user_id, image_url, score, price, ai_comment, category, title) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user.id, imageUrl, evaluation.total_score, evaluation.estimated_price, evaluation.comment, evaluation.category, evaluation.title || '무제']
        );

        // 6. 사용자 일일 카운트 감소 및 총점 업데이트
        await database.run(
            'UPDATE users SET daily_count = daily_count - 1, total_score = total_score + ? WHERE id = ?',
            [evaluation.total_score, user.id]
        );

        // 7. 업데이트된 사용자 정보 조회
        const updatedUser = await database.get('SELECT * FROM users WHERE id = ?', [user.id]);

        res.json({
            success: true,
            artwork: {
                id: artworkResult.id,
                image_url: imageUrl,
                score: evaluation.total_score,
                price: evaluation.estimated_price,
                comment: evaluation.comment,
                category: evaluation.category,
                title: evaluation.title || '무제',
                created_at: new Date().toISOString()
            },
            user: {
                username: updatedUser.username,
                daily_count: updatedUser.daily_count,
                total_score: updatedUser.total_score
            },
            evaluation: {
                title: evaluation.title || '무제',
                creativity: evaluation.creativity,
                technical_skill: evaluation.technical_skill,
                artistic_value: evaluation.artistic_value,
                originality: evaluation.originality,
                total_score: evaluation.total_score,
                estimated_price: evaluation.estimated_price
            }
        });

    } catch (error) {
        console.error('작품 평가 오류:', error);
        res.status(500).json({ 
            error: '작품 평가 중 오류가 발생했습니다.',
            message: error.message 
        });
    }
});

// 갤러리 작품 목록 조회
router.get('/gallery', async (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;
        
        const artworks = await database.query(
            `SELECT a.*, u.username 
             FROM artworks a 
             JOIN users u ON a.user_id = u.id 
             ORDER BY a.price DESC, a.created_at DESC 
             LIMIT ? OFFSET ?`,
            [parseInt(limit), parseInt(offset)]
        );

        res.json({
            success: true,
            artworks: artworks,
            total: artworks.length
        });

    } catch (error) {
        console.error('갤러리 조회 오류:', error);
        res.status(500).json({ 
            error: '갤러리 조회 중 오류가 발생했습니다.' 
        });
    }
});

// 사용자 작품 목록 조회
router.get('/user/:username', async (req, res) => {
    try {
        const { username } = req.params;
        
        const artworks = await database.query(
            `SELECT a.*, u.username 
             FROM artworks a 
             JOIN users u ON a.user_id = u.id 
             WHERE u.username = ? 
             ORDER BY a.created_at DESC`,
            [username]
        );

        res.json({
            success: true,
            artworks: artworks,
            total: artworks.length
        });

    } catch (error) {
        console.error('사용자 작품 조회 오류:', error);
        res.status(500).json({ 
            error: '사용자 작품 조회 중 오류가 발생했습니다.' 
        });
    }
});

module.exports = router; 