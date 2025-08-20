const { Pool } = require('pg');

class Database {
    constructor() {
        this.pool = null;
        this.isInitialized = false;
    }

    async connect() {
        if (this.pool) return;
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            throw new Error('DATABASE_URL 환경 변수가 필요합니다.');
        }
        this.pool = new Pool({
            connectionString,
            ssl: connectionString.includes('sslmode=require') ? undefined : { rejectUnauthorized: false },
            // 한글 인코딩 설정
            client_encoding: 'utf8'
        });
        
        // 연결 후 인코딩 설정
        await this.pool.query('SELECT 1');
        await this.pool.query("SET client_encoding TO 'UTF8'");
        console.log('✅ Postgres 데이터베이스에 연결되었습니다. (UTF-8 인코딩 설정됨)');
    }

    async init() {
        if (this.isInitialized) return;
        
        // 기본 스키마 생성 (인덱스 제외)
        const schema = `
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                daily_count INTEGER DEFAULT 10,
                total_score INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS artworks (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                image_url TEXT NOT NULL,
                score INTEGER NOT NULL,
                price INTEGER NOT NULL,
                ai_comment TEXT,
                category TEXT,
                title TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `;
        await this.pool.query(schema);
        
        // 기존 테이블에 컬럼 추가 (마이그레이션)
        await this.migrateSchema();
        
        // 인덱스 생성 (컬럼이 추가된 후)
        await this.createIndexes();
        
        this.isInitialized = true;
        console.log('✅ 데이터베이스 스키마가 초기화되었습니다.');
    }
    
    async migrateSchema() {
        try {
            // google_id 컬럼이 있는지 확인
            const hasGoogleId = await this.pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'google_id'
            `);
            
            if (hasGoogleId.rows.length === 0) {
                console.log('🔄 google_id 컬럼 추가 중...');
                await this.pool.query('ALTER TABLE users ADD COLUMN google_id TEXT UNIQUE');
                console.log('✅ google_id 컬럼 추가 완료');
            }
            
            // email 컬럼이 있는지 확인
            const hasEmail = await this.pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'email'
            `);
            
            if (hasEmail.rows.length === 0) {
                console.log('🔄 email 컬럼 추가 중...');
                await this.pool.query('ALTER TABLE users ADD COLUMN email TEXT');
                console.log('✅ email 컬럼 추가 완료');
            }
            
            // name 컬럼이 있는지 확인
            const hasName = await this.pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'name'
            `);
            
            if (hasName.rows.length === 0) {
                console.log('🔄 name 컬럼 추가 중...');
                await this.pool.query('ALTER TABLE users ADD COLUMN name TEXT');
                console.log('✅ name 컬럼 추가 완료');
            }
            
            // picture 컬럼이 있는지 확인
            const hasPicture = await this.pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'picture'
            `);
            
            if (hasPicture.rows.length === 0) {
                console.log('🔄 picture 컬럼 추가 중...');
                await this.pool.query('ALTER TABLE users ADD COLUMN picture TEXT');
                console.log('✅ picture 컬럼 추가 완료');
            }
            
            // last_login 컬럼이 있는지 확인
            const hasLastLogin = await this.pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'last_login'
            `);
            
            if (hasLastLogin.rows.length === 0) {
                console.log('🔄 last_login 컬럼 추가 중...');
                await this.pool.query('ALTER TABLE users ADD COLUMN last_login TIMESTAMP');
                console.log('✅ last_login 컬럼 추가 완료');
            }
            
            // username 컬럼을 NULL 허용으로 변경
            const usernameConstraint = await this.pool.query(`
                SELECT is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'username'
            `);
            
            if (usernameConstraint.rows.length > 0 && usernameConstraint.rows[0].is_nullable === 'NO') {
                console.log('🔄 username 컬럼을 NULL 허용으로 변경 중...');
                await this.pool.query('ALTER TABLE users ALTER COLUMN username DROP NOT NULL');
                console.log('✅ username 컬럼 NULL 허용 변경 완료');
            }
            
        } catch (error) {
            console.error('❌ 스키마 마이그레이션 오류:', error);
            throw error;
        }
    }
    
    async createIndexes() {
        try {
            // google_id 인덱스가 있는지 확인
            const hasGoogleIdIndex = await this.pool.query(`
                SELECT indexname 
                FROM pg_indexes 
                WHERE tablename = 'users' AND indexname = 'idx_users_google_id'
            `);
            
            if (hasGoogleIdIndex.rows.length === 0) {
                console.log('🔄 google_id 인덱스 추가 중...');
                await this.pool.query('CREATE INDEX idx_users_google_id ON users(google_id)');
                console.log('✅ google_id 인덱스 추가 완료');
            }
            
            // artworks 테이블 인덱스들
            const hasArtworksUserIdIndex = await this.pool.query(`
                SELECT indexname 
                FROM pg_indexes 
                WHERE tablename = 'artworks' AND indexname = 'idx_artworks_user_id'
            `);
            
            if (hasArtworksUserIdIndex.rows.length === 0) {
                console.log('🔄 artworks user_id 인덱스 추가 중...');
                await this.pool.query('CREATE INDEX idx_artworks_user_id ON artworks(user_id)');
                console.log('✅ artworks user_id 인덱스 추가 완료');
            }
            
            const hasArtworksCreatedAtIndex = await this.pool.query(`
                SELECT indexname 
                FROM pg_indexes 
                WHERE tablename = 'artworks' AND indexname = 'idx_artworks_created_at'
            `);
            
            if (hasArtworksCreatedAtIndex.rows.length === 0) {
                console.log('🔄 artworks created_at 인덱스 추가 중...');
                await this.pool.query('CREATE INDEX idx_artworks_created_at ON artworks(created_at)');
                console.log('✅ artworks created_at 인덱스 추가 완료');
            }
            
            const hasArtworksScoreIndex = await this.pool.query(`
                SELECT indexname 
                FROM pg_indexes 
                WHERE tablename = 'artworks' AND indexname = 'idx_artworks_score'
            `);
            
            if (hasArtworksScoreIndex.rows.length === 0) {
                console.log('🔄 artworks score 인덱스 추가 중...');
                await this.pool.query('CREATE INDEX idx_artworks_score ON artworks(score)');
                console.log('✅ artworks score 인덱스 추가 완료');
            }
            
        } catch (error) {
            console.error('❌ 인덱스 생성 오류:', error);
            throw error;
        }
    }

    async query(sql, params = []) {
        const result = await this.pool.query(sql, params);
        return result.rows;
    }

    async run(sql, params = []) {
        const result = await this.pool.query(sql, params);
        const id = result.rows && result.rows[0] && result.rows[0].id;
        return { id: id || null, changes: result.rowCount };
    }

    async get(sql, params = []) {
        const result = await this.pool.query(sql, params);
        return result.rows[0] || null;
    }
}

module.exports = new Database();

