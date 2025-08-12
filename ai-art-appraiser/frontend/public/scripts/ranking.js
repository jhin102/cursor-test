// 랭킹 클래스
class Ranking {
    constructor() {
        this.rankings = [];
        this.currentType = 'total';
        this.api = new ArtAPI();
    }
    
    async loadRankings(type = 'total') {
        try {
            console.log(`🏆 랭킹 로딩 중... (${type})`);
            
            this.currentType = type;
            this.rankings = await this.api.getRankings(type);
            this.renderRankings();
            
            console.log(`✅ 랭킹 로딩 완료: ${this.rankings.length}명`);
        } catch (error) {
            console.error('랭킹 로딩 실패:', error);
            this.showEmptyState();
        }
    }
    
    renderRankings() {
        const rankingList = document.getElementById('ranking-list');
        const rankingEmpty = document.getElementById('ranking-empty');
        
        if (!rankingList) return;
        
        // 빈 상태 처리
        if (this.rankings.length === 0) {
            this.showEmptyState();
            return;
        }
        
        // 랭킹 리스트 렌더링
        rankingList.innerHTML = '';
        rankingEmpty.classList.add('hidden');
        
        this.rankings.forEach((ranking, index) => {
            const rankingItem = this.createRankingItem(ranking, index + 1);
            rankingList.appendChild(rankingItem);
        });
    }
    
    createRankingItem(ranking, rank) {
        const item = document.createElement('div');
        item.className = 'ranking-item';
        
        // 랭킹 배지 클래스 결정
        let rankClass = 'other';
        if (rank === 1) rankClass = 'gold';
        else if (rank === 2) rankClass = 'silver';
        else if (rank === 3) rankClass = 'bronze';
        
        // 통계 정보 구성
        const stats = [];
        if (this.currentType === 'total') {
            if (ranking.total_artworks > 0) {
                stats.push(`작품 ${ranking.total_artworks}개`);
            }
            if (ranking.avg_score > 0) {
                stats.push(`평균 ${ranking.avg_score}점`);
            }
        } else {
            if (ranking.artworks_this_week > 0) {
                stats.push(`이번 주 ${ranking.artworks_this_week}개`);
            }
        }
        
        item.innerHTML = `
            <div class="ranking-rank ${rankClass}">${rank}</div>
            <div class="ranking-info">
                <div class="ranking-username">${ranking.username}</div>
                <div class="ranking-stats">
                    <span class="ranking-score">총점: ${ranking.total_score.toLocaleString()}점</span>
                    ${stats.map(stat => `<span>${stat}</span>`).join('')}
                </div>
            </div>
        `;
        
        return item;
    }
    
    showEmptyState() {
        const rankingList = document.getElementById('ranking-list');
        const rankingEmpty = document.getElementById('ranking-empty');
        
        if (rankingList) rankingList.innerHTML = '';
        if (rankingEmpty) rankingEmpty.classList.remove('hidden');
    }
    
    // 랭킹 타입에 따른 제목 업데이트
    updateRankingTitle(type) {
        const title = type === 'weekly' ? '주간 랭킹' : '전체 랭킹';
        const rankingHeader = document.querySelector('.ranking-header h2');
        if (rankingHeader) {
            rankingHeader.textContent = `🏆 ${title}`;
        }
    }
    
    // 사용자 랭킹 위치 찾기
    findUserRank(username) {
        const userRanking = this.rankings.find(ranking => ranking.username === username);
        if (userRanking) {
            const rank = this.rankings.findIndex(ranking => ranking.username === username) + 1;
            return { rank, ...userRanking };
        }
        return null;
    }
    
    // 랭킹 통계 정보 표시
    async showRankingStats() {
        try {
            const stats = await this.api.getRankingStats();
            this.renderRankingStats(stats);
        } catch (error) {
            console.error('랭킹 통계 로딩 실패:', error);
        }
    }
    
    renderRankingStats(stats) {
        // 통계 정보를 화면에 표시하는 로직
        // 예: 전체 사용자 수, 총 작품 수, 평균 점수 등
        console.log('📊 랭킹 통계:', stats);
    }
} 