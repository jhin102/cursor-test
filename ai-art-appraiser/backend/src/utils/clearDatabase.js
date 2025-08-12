require('dotenv').config();
const database = require('./database');

async function clearDatabase() {
    try {
        console.log('🗑️ 데이터베이스 데이터 삭제 시작...');
        
        // 데이터베이스 연결
        await database.connect();
        
        // 모든 테이블의 데이터 삭제
        console.log('📝 artworks 테이블 데이터 삭제 중...');
        await database.run('DELETE FROM artworks');
        
        console.log('👥 users 테이블 데이터 삭제 중...');
        await database.run('DELETE FROM users');
        
        console.log('🏆 rankings 테이블 데이터 삭제 중...');
        await database.run('DELETE FROM rankings');
        
        console.log('✅ 데이터베이스 데이터 삭제 완료!');
        console.log('📊 삭제된 데이터:');
        console.log('   - 모든 작품 데이터');
        console.log('   - 모든 사용자 데이터');
        console.log('   - 모든 랭킹 데이터');
        
        // 연결 종료
        database.close();
        
        process.exit(0);
    } catch (error) {
        console.error('❌ 데이터베이스 데이터 삭제 실패:', error);
        process.exit(1);
    }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
    clearDatabase();
}

module.exports = clearDatabase; 