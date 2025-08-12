const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, '../../database/data.db');
        this.db = null;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('데이터베이스 연결 실패:', err.message);
                    reject(err);
                } else {
                    console.log('✅ SQLite 데이터베이스에 연결되었습니다.');
                    resolve();
                }
            });
        });
    }

    async init() {
        const schema = `
            -- 사용자 테이블
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                daily_count INTEGER DEFAULT 3,
                total_score INTEGER DEFAULT 0
            );

            -- 작품 테이블
            CREATE TABLE IF NOT EXISTS artworks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                image_url TEXT NOT NULL,
                score INTEGER NOT NULL,
                price INTEGER NOT NULL,
                ai_comment TEXT,
                category TEXT,
                title TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            -- 인덱스 생성
            CREATE INDEX IF NOT EXISTS idx_artworks_user_id ON artworks(user_id);
            CREATE INDEX IF NOT EXISTS idx_artworks_created_at ON artworks(created_at);
            CREATE INDEX IF NOT EXISTS idx_artworks_score ON artworks(score);
        `;

        // 스키마 적용 후, 기존 DB에 title 컬럼이 없으면 추가
        return new Promise((resolve, reject) => {
            this.db.exec(schema, (err) => {
                if (err) {
                    console.error('스키마 생성 실패:', err.message);
                    reject(err);
                    return;
                }

                // artworks 테이블 컬럼 정보 조회
                this.db.all('PRAGMA table_info(artworks);', [], (pragmaErr, rows) => {
                    if (pragmaErr) {
                        console.error('PRAGMA 조회 실패:', pragmaErr.message);
                        reject(pragmaErr);
                        return;
                    }

                    const hasTitle = rows.some((col) => col.name === 'title');
                    if (hasTitle) {
                        console.log('✅ artworks.title 컬럼 확인됨.');
                        console.log('✅ 데이터베이스 스키마가 초기화되었습니다.');
                        resolve();
                        return;
                    }

                    console.log('ℹ️ artworks.title 컬럼이 없어 추가합니다...');
                    this.db.run('ALTER TABLE artworks ADD COLUMN title TEXT;', [], (alterErr) => {
                        if (alterErr) {
                            console.error('title 컬럼 추가 실패:', alterErr.message);
                            reject(alterErr);
                        } else {
                            console.log('✅ artworks.title 컬럼 추가 완료.');
                            console.log('✅ 데이터베이스 스키마가 초기화되었습니다.');
                            resolve();
                        }
                    });
                });
            });
        });
    }

    async query(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('데이터베이스 연결 종료 실패:', err.message);
                } else {
                    console.log('✅ 데이터베이스 연결이 종료되었습니다.');
                }
            });
        }
    }
}

module.exports = new Database(); 