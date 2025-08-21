// 메인 애플리케이션 클래스
class ArtApp {
    constructor() {
        this.canvas = null;
        this.gallery = null;
        this.ranking = null;
        this.api = null;
        this.googleClientId = '9576569609-vc9ppdgrs11blupa6a6qdvirfepseavh.apps.googleusercontent.com'; // Google Cloud Console에서 받은 클라이언트 ID (현재 비활성화)
        
        // 저장된 로그인 정보 복원
        this.restoreLoginState();
        
        this.init();
    }
    
    restoreLoginState() {
        try {
            const savedUser = localStorage.getItem('artApp_user');
            const savedToken = localStorage.getItem('artApp_token');
            const savedDailyCount = localStorage.getItem('artApp_dailyCount');
            
            if (savedUser && savedToken) {
                this.currentUser = savedUser;
                this.userToken = savedToken;
                this.userDailyCount = parseInt(savedDailyCount) || 0;
                console.log('로그인 상태 복원됨:', this.currentUser);
            } else {
                this.currentUser = null;
                this.userToken = null;
                this.userDailyCount = 0;
            }
        } catch (error) {
            console.error('로그인 상태 복원 실패:', error);
            this.currentUser = null;
            this.userToken = null;
            this.userDailyCount = 0;
        }
    }
    
    saveLoginState(user, token, dailyCount) {
        try {
            localStorage.setItem('artApp_user', user);
            localStorage.setItem('artApp_token', token);
            localStorage.setItem('artApp_dailyCount', dailyCount.toString());
        } catch (error) {
            console.error('로그인 상태 저장 실패:', error);
        }
    }
    
    clearLoginState() {
        try {
            localStorage.removeItem('artApp_user');
            localStorage.removeItem('artApp_token');
            localStorage.removeItem('artApp_dailyCount');
            console.log('로그인 상태가 초기화되었습니다.');
        } catch (error) {
            console.error('로그인 상태 삭제 실패:', error);
        }
    }
    
    // 개발자용: localStorage 완전 초기화
    forceClearAllData() {
        try {
            localStorage.clear();
            console.log('모든 localStorage 데이터가 초기화되었습니다.');
            location.reload();
        } catch (error) {
            console.error('localStorage 초기화 실패:', error);
        }
    }
    
    init() {
        try {
            // 컴포넌트 초기화
            this.canvas = new DrawingCanvas('drawing-canvas');
            this.gallery = new Gallery();
            // 랭킹 기능 제거
            this.api = new ArtAPI();
            
            // 이벤트 리스너 설정
            this.setupEventListeners();
            
            // 사용자 정보 표시 업데이트
            this.updateUserDisplay();
            
            // 페이지 첫 진입 시 갤러리 로드 (로그인 상태와 무관)
            this.loadInitialData();

            // 로그인 상태에 따라 Google Sign-In 초기화
            if (this.currentUser) {
                // 이미 로그인된 상태
                console.log('이미 로그인된 상태로 시작');
            } else {
                // 로그인되지 않은 상태 - Google Sign-In 초기화
                this.waitForGoogleAndInit();
            }
        } catch (error) {
            console.error('앱 초기화 실패:', error);
            this.showError('앱 초기화에 실패했습니다. 페이지를 새로고침해주세요.');
        }
    }
    
    setupEventListeners() {
        // Google 로그인 모달 이벤트 (게스트 로그인 제거됨)
        
        // 로그아웃 버튼
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.logout();
            });
        }
        

        
        // 평가 버튼
        const evaluateBtn = document.getElementById('evaluate-btn');
        evaluateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            this.evaluateArtwork();
        });
        
        // 캔버스 지우기 버튼
        const clearBtn = document.getElementById('clear-btn');
        clearBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.canvas.clear();
        });
        
        // 모달 닫기
        const modalClose = document.getElementById('modal-close');
        modalClose.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.hideResultModal();
        });
        
        // 모달 외부 클릭으로 닫기
        const resultModal = document.getElementById('result-modal');
        resultModal.addEventListener('click', (e) => {
            if (e.target === resultModal) {
                this.hideResultModal();
            }
        }, { passive: true });
        
        // 에러 모달 닫기
        const errorClose = document.getElementById('error-close');
        const errorOkBtn = document.getElementById('error-ok-btn');
        const errorModal = document.getElementById('error-modal');
        
        if (errorClose) {
            errorClose.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideErrorModal();
            });
        }
        
        if (errorOkBtn) {
            errorOkBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideErrorModal();
            });
        }
        
        if (errorModal) {
            errorModal.addEventListener('click', (e) => {
                if (e.target === errorModal) {
                    this.hideErrorModal();
                }
            }, { passive: true });
        }
        
        // 모달 액션 버튼들
        const closeResultBtn = document.getElementById('close-result-btn');
        closeResultBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.closeResultModal();
        });
        
        // 탭 네비게이션
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // 랭킹 탭 제거됨
        
        // 캔버스 그리기 상태 변경 감지
        this.canvas.onDrawingStateChange = (hasContent) => {
            this.updateEvaluateButton(hasContent);
        };
    }
    
    async loadInitialData() {
        try {
            // 페이지 첫 진입 시 갤러리 로딩 (로그인 상태와 무관)
            this.showGalleryLoading();
            
            // 갤러리 데이터 로드
            await this.gallery.loadGallery();
            
            // 랭킹 기능 제거
            
        } catch (error) {
            console.error('초기 데이터 로드 실패:', error);
        } finally {
            // 갤러리 로딩 숨김
            this.hideGalleryLoading();
        }
    }
    
    updateUserDisplay() {
        const dailyCountDisplay = document.getElementById('daily-count-display');
        const usernameDisplay = document.getElementById('username-display');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (dailyCountDisplay) {
            if (this.currentUser) {
                dailyCountDisplay.textContent = `남은 기회: ${this.userDailyCount}/10`;
            } else {
                dailyCountDisplay.textContent = '로그인이 필요합니다';
            }
        }
        
        if (usernameDisplay) {
            usernameDisplay.textContent = this.currentUser || '로그인 필요';
        }
        
        // 로그아웃 버튼 표시/숨김 처리
        if (logoutBtn) {
            if (this.currentUser) {
                logoutBtn.classList.remove('hidden');
            } else {
                logoutBtn.classList.add('hidden');
            }
        }
    }
    
    updateEvaluateButton(hasContent) {
        const evaluateBtn = document.getElementById('evaluate-btn');
        evaluateBtn.disabled = !hasContent || !this.currentUser || this.userDailyCount <= 0;
    }
    
    async evaluateArtwork() {
        try {
            // 로그인 상태 확인
            if (!this.currentUser) {
                this.showError('로그인이 필요합니다.');
                this.showLoginModal();
                return;
            }
            
            // 로딩 상태 시작
            this.showLoading();
            
            // 캔버스가 초기화되었는지 확인
            if (!this.canvas) {
                this.showError('캔버스가 초기화되지 않았습니다. 페이지를 새로고침해주세요.');
                return;
            }
            
            // 캔버스 이미지 데이터 가져오기
            const imageData = this.canvas.getImageData();

            
            // API 호출
            const result = await this.api.evaluateArtwork(imageData, this.currentUser);
            
            // 결과 표시

            this.showEvaluationResult(result);
            
            // 사용자 정보 업데이트
            this.userDailyCount = result.user.daily_count;
            // 서버에서 새로운 토큰이 반환된 경우 업데이트
            if (result.user.token) {
                this.userToken = result.user.token;
            }
            this.saveLoginState(this.currentUser, this.userToken, this.userDailyCount);
            this.updateUserDisplay();
            
            // 평가 버튼 상태 업데이트
            this.updateEvaluateButton(this.canvas.hasContent());
            
            // 캔버스 지우기 (평가 완료 후)
            this.canvas.clear();
            
            // 갤러리 새로고침 (비동기로 처리하여 모달 표시에 영향 주지 않도록)
            setTimeout(async () => {
                try {
                    this.showGalleryLoading();
                    await this.gallery.loadGallery();
                } catch (error) {
                    console.error('갤러리 새로고침 실패:', error);
                } finally {
                    this.hideGalleryLoading();
                }
            }, 1000);
            
        } catch (error) {
            console.error('❌ 작품 평가 실패:', error);
            
            // JWT 토큰 관련 에러인 경우 로그아웃 처리
            if (error.message.includes('토큰이 만료되었거나 유효하지 않습니다') || 
                error.message.includes('invalid algorithm')) {
                console.log('JWT 토큰 에러 감지, 로그아웃 처리');
                this.clearLoginState();
                this.currentUser = null;
                this.userToken = null;
                this.userDailyCount = 0;
                this.updateUserDisplay();
                this.showError('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
                this.showLoginModal();
                return;
            }
            
            this.showError(this.api.handleError(error));
        } finally {
            this.hideLoading();
        }
    }
    
    showEvaluationResult(result) {

        
        // 제목 표시
        const titleElement = document.getElementById('result-artwork-title');
        if (titleElement) {
            const title = (result.evaluation && result.evaluation.title) || (result.artwork && result.artwork.title) || '무제';
            titleElement.textContent = title;
        }

        // 그린 그림 이미지 표시
        const imageElement = document.getElementById('result-artwork-image');
        if (imageElement) {
            const imageUrl = (result.artwork && result.artwork.image_url) ? (
                result.artwork.image_url.startsWith('http') ? result.artwork.image_url : `${result.artwork.image_url}`
            ) : '';
            if (imageUrl) {
                imageElement.src = imageUrl;
            } else {
                imageElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiNGN0ZBRkMiLz48dGV4dCB4PSI2MCIgeT0iNjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTRweCIgZmlsbD0iIzcxODA5NiI+7JuN7Z6IIOyngO2VnDwvdGV4dD48L3N2Zz4=';
            }
        }

        // 가격 표시
        const estimatedPriceElement = document.getElementById('estimated-price');
        

        
        if (estimatedPriceElement) {
            estimatedPriceElement.textContent = result.evaluation.estimated_price;
        }
        
        // AI 코멘트 표시
        const commentElement = document.getElementById('ai-comment-text');
        if (commentElement) {
            commentElement.textContent = result.artwork.comment;
        }
        
        // 모달 표시

        
        // 모달 표시를 약간 지연시켜 DOM 업데이트가 완료된 후 실행
        setTimeout(() => {
            this.showResultModal();
        }, 50);
        
        // 세부 점수 표시 (모달이 표시된 후)
        setTimeout(() => {

            this.updateScoreBar('creativity', result.evaluation.creativity, 10);
            this.updateScoreBar('technical', result.evaluation.technical_skill, 10);
            this.updateScoreBar('artistic', result.evaluation.artistic_value, 10);
            this.updateScoreBar('originality', result.evaluation.originality, 10);
            
            // 점수 애니메이션
            this.animateScoreBars();
        }, 100);
    }

    // 갤러리 아이템 클릭 시 결과 모달 재사용
    showArtworkModal(artwork) {
        const evenSplit = Math.round((artwork.score || 0) / 4);
        const pseudoResult = {
            evaluation: {
                title: artwork.title || '무제',
                creativity: evenSplit,
                technical_skill: evenSplit,
                artistic_value: evenSplit,
                originality: (artwork.score || 0) - (evenSplit * 3),
                total_score: artwork.score || 0,
                estimated_price: artwork.price || 0,
            },
            artwork: {
                image_url: artwork.image_url,
                comment: artwork.ai_comment,
                title: artwork.title || '무제',
            }
        };
        this.showEvaluationResult(pseudoResult);
    }
    
    updateScoreBar(type, score, maxScore) {
        const fillElement = document.getElementById(`${type}-fill`);
        const scoreElement = document.getElementById(`${type}-score`);
        
        if (fillElement && scoreElement) {
            const percentage = (score / maxScore) * 100;
            fillElement.style.width = `${percentage}%`;
            scoreElement.textContent = score;
        }
    }
    
    animateScoreBars() {
        const scoreBars = document.querySelectorAll('.score-fill');
        scoreBars.forEach((bar, index) => {
            const targetWidth = bar.style.width;
            bar.style.width = '0%';
            setTimeout(() => {
                bar.style.width = targetWidth;
            }, 100);
        });
    }
    
    showResultModal() {
        const modal = document.getElementById('result-modal');
        
        if (modal) {
            // 모달을 강제로 표시
            modal.style.display = 'flex';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
            modal.classList.remove('hidden');
        }
    }
    
    hideResultModal() {
        const modal = document.getElementById('result-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.style.visibility = 'hidden';
            modal.style.opacity = '0';
            modal.classList.add('hidden');
        }
    }
    
    hideErrorModal() {
        const modal = document.getElementById('error-modal');
        modal.classList.add('hidden');
    }
    
    showLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        const evaluateBtn = document.getElementById('evaluate-btn');
        
        loadingOverlay.classList.remove('hidden');
        evaluateBtn.classList.add('loading');
    }

    waitForGoogleAndInit() {
        // 로그인 대기 표시
        this.showLoginWaiting();
        
        // Google 클라이언트 ID가 없으면 바로 게스트 모드로 진행
        if (!this.googleClientId) {
            this.hideLoginWaiting();
            this.showLoginModalWithoutGoogle();
            return;
        }
        
        // Google 라이브러리가 로드될 때까지 대기 (최대 5초)
        let attempts = 0;
        const maxAttempts = 50; // 5초 (100ms * 50)
        
        const checkGoogle = () => {
            attempts++;
            
            if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
                this.hideLoginWaiting();
                this.initializeGoogleSignIn();
                this.showLoginModal();
            } else if (attempts >= maxAttempts) {
                console.warn('⚠️ Google Sign-In 라이브러리 로드 실패, 게스트 모드로 진행');
                this.hideLoginWaiting();
                this.showLoginModalWithoutGoogle();
            } else {
                setTimeout(checkGoogle, 100);
            }
        };
        
        checkGoogle();
    }
    
    initializeGoogleSignIn() {
        // Google Sign-In 초기화
        google.accounts.id.initialize({
            client_id: this.googleClientId,
            callback: this.handleGoogleSignIn.bind(this)
        });
        
        // Google Sign-In 버튼 렌더링
        this.renderGoogleSignInButton();
    }

    renderGoogleSignInButton() {
        const container = document.getElementById('google-signin-container');
        
        if (container && typeof google !== 'undefined' && google.accounts && google.accounts.id) {
            // 기존 버튼 제거
            container.innerHTML = '';
            
            // 새 버튼 렌더링
            google.accounts.id.renderButton(
                container,
                { 
                    theme: 'outline', 
                    size: 'large',
                    text: 'signin_with',
                    shape: 'rectangular'
                }
            );
        }
    }
    

    
    handleGoogleSignIn(response) {

        
        // ID 토큰을 서버로 전송하여 검증
        this.verifyGoogleToken(response.credential);
    }
    
    async verifyGoogleToken(idToken) {
        try {
            // JWT 토큰을 디코딩하여 사용자 정보 추출 (임시 테스트용)
            const payload = this.decodeJWT(idToken);

            
                        // Google ID 토큰을 직접 사용하지 않고 서버 검증을 통해 JWT 토큰을 받아야 함
            // 이 부분은 제거하고 서버 검증만 사용
            
            // 서버 검증 시도
            const result = await this.api.verifyGoogleToken(idToken);

            
            // 사용자 정보 설정
            this.currentUser = result.user.name || result.user.email;
            this.userToken = result.token;
            this.userDailyCount = result.user.daily_count || 10;
            
            // 로그인 상태 저장
            this.saveLoginState(this.currentUser, this.userToken, this.userDailyCount);
            
            // UI 업데이트
            this.updateUserDisplay();
            this.hideLoginModal();
            
            // 갤러리 새로고침 (사용자별 필터링이 필요한 경우에만)
            // 현재는 모든 작품을 보여주므로 새로고침 제거
            // this.showGalleryLoading();
            // await this.gallery.loadGallery();
            // this.hideGalleryLoading();
            
        } catch (error) {
            console.error('Google 토큰 검증 실패:', error);
            this.showError('로그인에 실패했습니다. 다시 시도해주세요.');
        }
    }
    
    decodeJWT(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            
            const payload = parts[1];
            // 한글을 포함한 UTF-8 문자열을 올바르게 디코딩
            const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
            const rawData = atob(base64);
            const outputArray = new Uint8Array(rawData.length);
            for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
            }
            const decoded = new TextDecoder().decode(outputArray);
            return JSON.parse(decoded);
        } catch (error) {
            console.error('JWT 디코딩 실패:', error);
            return null;
        }
    }
    

    
    logout() {
        // localStorage에서 로그인 정보 삭제
        this.clearLoginState();
        
        // 페이지 새로고침으로 모든 상태 초기화
        location.reload();
    }
    
    showLoginModal() {
        const loginModal = document.getElementById('login-modal');
        const googleContainer = document.getElementById('google-signin-container');
        
        if (loginModal) {
            // Google 로그인 버튼이 보이도록 설정
            if (googleContainer) {
                googleContainer.style.display = 'block';
            }
            
            loginModal.classList.remove('hidden');
        }
    }
    
    showLoginModalWithoutGoogle() {
        const loginModal = document.getElementById('login-modal');
        const googleContainer = document.getElementById('google-signin-container');
        
        if (loginModal) {
            // Google 로그인 버튼 숨기기 (Google 라이브러리 로드 실패 시에만)
            if (googleContainer) {
                googleContainer.style.display = 'none';
            }
            
            // 모달 내용 수정
            const modalBody = loginModal.querySelector('.modal-body p');
            if (modalBody) {
                modalBody.textContent = 'Google 로그인을 사용할 수 없습니다. 잠시 후 다시 시도해주세요.';
            }
            
            loginModal.classList.remove('hidden');
        }
    }
    
    hideLoginModal() {
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            loginModal.classList.add('hidden');
        }
    }
    
    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        const evaluateBtn = document.getElementById('evaluate-btn');
        
        loadingOverlay.classList.add('hidden');
        evaluateBtn.classList.remove('loading');
    }

    showGalleryLoading() {
        const galleryLoadingOverlay = document.getElementById('gallery-loading-overlay');
        if (galleryLoadingOverlay) {
            galleryLoadingOverlay.classList.remove('hidden');
        }
    }

    hideGalleryLoading() {
        const galleryLoadingOverlay = document.getElementById('gallery-loading-overlay');
        if (galleryLoadingOverlay) {
            galleryLoadingOverlay.classList.add('hidden');
        }
    }

    showLoginWaiting() {
        const loginWaitingOverlay = document.getElementById('login-waiting-overlay');
        if (loginWaitingOverlay) {
            loginWaitingOverlay.classList.remove('hidden');
        }
    }

    hideLoginWaiting() {
        const loginWaitingOverlay = document.getElementById('login-waiting-overlay');
        if (loginWaitingOverlay) {
            loginWaitingOverlay.classList.add('hidden');
        }
    }
    
    showError(message) {
        // 에러 모달 표시
        const errorModal = document.getElementById('error-modal');
        const errorMessage = document.getElementById('error-message');
        
        if (errorModal && errorMessage) {
            errorMessage.textContent = message;
            errorModal.classList.remove('hidden');
        } else {
            // 모달이 없으면 alert 사용
            alert(message);
        }
    }
    
    closeResultModal() {
        this.hideResultModal();
    }
    
    switchTab(tabName) {
        // 탭 버튼 상태 변경
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // 탭 패널 상태 변경
        const tabPanels = document.querySelectorAll('.tab-panel');
        tabPanels.forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${tabName}-content`).classList.add('active');
    }
    
    async switchRankingType(type) {
        // 랭킹 탭 버튼 상태 변경
        const rankingTabs = document.querySelectorAll('.ranking-tab');
        rankingTabs.forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-ranking="${type}"]`).classList.add('active');
        
        // 랭킹 데이터 로드
        await this.ranking.loadRankings(type);
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.artApp = new ArtApp();
}); 