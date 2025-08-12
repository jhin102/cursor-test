require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const database = require('./utils/database');

// 환경 변수 디버깅
console.log('🔍 서버 시작 시 환경 변수 확인:');
console.log('CLAUDE_API_KEY 존재 여부:', !!process.env.CLAUDE_API_KEY);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('현재 작업 디렉토리:', process.cwd());
console.log('.env 파일 경로:', require('path').resolve('.env'));

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 프론트엔드 정적 파일 서빙
app.use(express.static(path.join(__dirname, '../../frontend/public')));

// API 라우트 설정
app.use('/api/artworks', require('./routes/artworkRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/rankings', require('./routes/rankingRoutes'));

// 기본 라우트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/public/index.html'));
});

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

// 서버 시작
async function startServer() {
    try {
        // 데이터베이스 연결 및 스키마 초기화
        await database.connect();
        console.log('✅ 데이터베이스 연결 성공');
        await database.init();
        console.log('✅ 데이터베이스 스키마 초기화 성공');
        
        // 서버 시작
        app.listen(PORT, () => {
            console.log(`🚀 AI Art Appraiser 서버가 포트 ${PORT}에서 실행 중입니다.`);
            console.log(`📡 API 엔드포인트: http://localhost:${PORT}/api`);
            console.log(`🌐 프론트엔드: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ 서버 시작 실패:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app; 