// API 통신 클래스
class ArtAPI {
    constructor() {
        this.baseURL = '/api';
    }
    
    async evaluateArtwork(imageData, username) {
        try {
            console.log('🎨 작품 평가 요청 중...');
            
            const headers = {
                'Content-Type': 'application/json',
            };
            
            // 토큰이 있으면 Authorization 헤더 추가
            if (window.artApp && window.artApp.userToken) {
                headers['Authorization'] = `Bearer ${window.artApp.userToken}`;
                console.log('Using token for authorization, token length:', window.artApp.userToken.length);
            } else {
                console.log('No token available for authorization');
            }
            
            // 디버깅을 위한 로그
            console.log('Sending image data length:', imageData ? imageData.length : 'undefined');
            console.log('Image data starts with:', imageData ? imageData.substring(0, 50) + '...' : 'undefined');
            
            const requestBody = { 
                image: imageData,
                username: username 
            };
            
            const response = await fetch(`${this.baseURL}/artworks/evaluate`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '평가 요청 실패');
            }
            
            const result = await response.json();
            console.log('✅ 작품 평가 완료:', result);
            
            return result;
        } catch (error) {
            console.error('❌ 평가 요청 실패:', error);
            throw error;
        }
    }
    
    async getGallery(limit = 20, offset = 0) {
        try {
            const response = await fetch(`${this.baseURL}/artworks/gallery?limit=${limit}&offset=${offset}`);
            
            if (!response.ok) {
                throw new Error('갤러리 조회 실패');
            }
            
            const result = await response.json();
            return result.artworks || [];
        } catch (error) {
            console.error('갤러리 조회 실패:', error);
            throw error;
        }
    }
    
    async getRankings(type = 'total', limit = 50) {
        try {
            const endpoint = type === 'weekly' ? '/rankings/weekly' : '/rankings';
            const response = await fetch(`${this.baseURL}${endpoint}?limit=${limit}`);
            
            if (!response.ok) {
                throw new Error('랭킹 조회 실패');
            }
            
            const result = await response.json();
            return result.rankings || [];
        } catch (error) {
            console.error('랭킹 조회 실패:', error);
            throw error;
        }
    }
    
    async getUserInfo(username) {
        try {
            const response = await fetch(`${this.baseURL}/users/${username}`);
            
            if (!response.ok) {
                throw new Error('사용자 정보 조회 실패');
            }
            
            const result = await response.json();
            return result.user;
        } catch (error) {
            console.error('사용자 정보 조회 실패:', error);
            throw error;
        }
    }
    
    async getUserArtworks(username) {
        try {
            const response = await fetch(`${this.baseURL}/artworks/user/${username}`);
            
            if (!response.ok) {
                throw new Error('사용자 작품 조회 실패');
            }
            
            const result = await response.json();
            return result.artworks || [];
        } catch (error) {
            console.error('사용자 작품 조회 실패:', error);
            throw error;
        }
    }
    
    async getRankingStats() {
        try {
            const response = await fetch(`${this.baseURL}/rankings/stats`);
            
            if (!response.ok) {
                throw new Error('통계 조회 실패');
            }
            
            const result = await response.json();
            return result.stats;
        } catch (error) {
            console.error('통계 조회 실패:', error);
            throw error;
        }
    }
    
    async verifyGoogleToken(idToken) {
        try {
            console.log('🔐 Google 토큰 검증 중...');
            console.log('Token length:', idToken ? idToken.length : 0);
            
            const requestBody = { 
                id_token: idToken 
            };
            console.log('Request body:', JSON.stringify(requestBody));
            
            const response = await fetch(`${this.baseURL}/auth/google`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '토큰 검증 실패');
            }
            
            const result = await response.json();
            console.log('✅ Google 토큰 검증 완료:', result);
            
            return result;
        } catch (error) {
            console.error('❌ Google 토큰 검증 실패:', error);
            throw error;
        }
    }
    
    // 에러 메시지 처리
    handleError(error) {
        if (error.message.includes('일일 평가 기회를 모두 사용했습니다')) {
            return '오늘의 평가 기회를 모두 사용했습니다. 내일 다시 시도해주세요.';
        } else if (error.message.includes('캔버스에 그려진 내용이 없습니다')) {
            return '캔버스에 그려진 내용이 없습니다.';
        } else if (error.message.includes('평가 요청 실패')) {
            return 'AI 평가 서비스에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.';
        } else {
            return '알 수 없는 오류가 발생했습니다. 다시 시도해주세요.';
        }
    }
} 