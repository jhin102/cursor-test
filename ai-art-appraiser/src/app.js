require('dotenv').config();
const express = require('express');
const cors = require('cors');
const database = require('./utils/database');

const app = express();

// 미들웨어 설정
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 서버리스 환경에서 최초 요청 시 1회만 DB 초기화
let isDatabaseInitialized = false;
async function ensureDatabaseInitialized(req, res, next) {
    try {
        if (!isDatabaseInitialized) {
            await database.connect();
            await database.init();
            isDatabaseInitialized = true;
        }
        next();
    } catch (error) {
        next(error);
    }
}

app.use(ensureDatabaseInitialized);

// API 라우트 설정
app.use('/api/artworks', require('./routes/artworkRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/rankings', require('./routes/rankingRoutes'));

app.get('/api', (req, res) => {
    res.json({ 
        message: 'AI Art Appraiser API',
        version: '1.0.0',
        status: 'running'
    });
});

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: '서버 내부 오류가 발생했습니다.',
        message: err.message 
    });
});

// 404 핸들러
app.use((req, res) => {
    res.status(404).json({ error: '요청한 리소스를 찾을 수 없습니다.' });
});

module.exports = app;

