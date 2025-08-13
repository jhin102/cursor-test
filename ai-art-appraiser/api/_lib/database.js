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
            ssl: connectionString.includes('sslmode=require') ? undefined : { rejectUnauthorized: false }
        });
        await this.pool.query('SELECT 1');
        console.log('✅ Postgres 데이터베이스에 연결되었습니다.');
    }

    async init() {
        if (this.isInitialized) return;
        const schema = `
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                daily_count INTEGER DEFAULT 3,
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

            CREATE INDEX IF NOT EXISTS idx_artworks_user_id ON artworks(user_id);
            CREATE INDEX IF NOT EXISTS idx_artworks_created_at ON artworks(created_at);
            CREATE INDEX IF NOT EXISTS idx_artworks_score ON artworks(score);
        `;
        await this.pool.query(schema);
        this.isInitialized = true;
        console.log('✅ 데이터베이스 스키마가 초기화되었습니다.');
    }

    async query(sql, params = []) {
        const result = await this.pool.query(sql, params);
        return result.rows;
    }

    async run(sql, params = []) {
        const result = await this.pool.query(sql, params);
        const id = result.rows && result.rows[0] && (result.rows[0].id || result.rows[0].last_insert_rowid);
        return { id: id || null, changes: result.rowCount };
    }

    async get(sql, params = []) {
        const result = await this.pool.query(sql, params);
        return result.rows[0] || null;
    }
}

module.exports = new Database();

