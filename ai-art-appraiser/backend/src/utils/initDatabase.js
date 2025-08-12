require('dotenv').config();
const database = require('./database');

async function initDatabase() {
    try {
        console.log('🗄️ 데이터베이스 초기화 시작...');
        
        // 데이터베이스 연결
        await database.connect();
        
        // 스키마 초기화
        await database.init();
        
        console.log('✅ 데이터베이스 초기화 완료!');
        
        // 연결 종료
        database.close();
        
        process.exit(0);
    } catch (error) {
        console.error('❌ 데이터베이스 초기화 실패:', error);
        process.exit(1);
    }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
    initDatabase();
}

module.exports = initDatabase; 