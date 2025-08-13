// 메인 애플리케이션 클래스
class ArtApp {
    constructor() {
        this.canvas = null;
        this.gallery = null;
        this.ranking = null;
        this.api = null;
        this.currentUser = '게스트';
        this.userDailyCount = 3;
        
        this.init();
    }
    
    init() {
        console.log('🎨 AI Art Appraiser 초기화 중...');
        
        // 컴포넌트 초기화
        this.canvas = new DrawingCanvas('drawing-canvas');
        this.gallery = new Gallery();
        // 랭킹 기능 제거
        this.api = new ArtAPI();
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 사용자명 입력 모달 띄우고 초기 데이터 로드
        this.showUsernameModal();
        
        console.log('✅ AI Art Appraiser 초기화 완료');
    }
    
    setupEventListeners() {
        // 사용자명 입력 모달 이벤트
        const usernameModal = document.getElementById('username-modal');
        const usernameInput = document.getElementById('username-input');
        const usernameOkBtn = document.getElementById('username-ok-btn');
        if (usernameOkBtn) {
            usernameOkBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const name = (usernameInput.value || '').trim() || '게스트';
                this.currentUser = name;
                this.updateUserDisplay();
                if (usernameModal) usernameModal.classList.add('hidden');
                this.loadInitialData();
            });
        }
        if (usernameInput) {
            usernameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    usernameOkBtn.click();
                }
            });
        }
        
        // 평가 버튼
        const evaluateBtn = document.getElementById('evaluate-btn');
        evaluateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔘 평가 버튼 클릭됨');
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
        const saveArtworkBtn = document.getElementById('save-artwork-btn');
        saveArtworkBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.saveArtwork();
        });
        
        const newDrawingBtn = document.getElementById('new-drawing-btn');
        newDrawingBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.startNewDrawing();
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
            // 갤러리 데이터 로드
            await this.gallery.loadGallery();
            
            // 랭킹 기능 제거
            
        } catch (error) {
            console.error('초기 데이터 로드 실패:', error);
        }
    }
    
    updateUserDisplay() {
        const dailyCountDisplay = document.getElementById('daily-count-display');
        const usernameDisplay = document.getElementById('username-display');
        if (dailyCountDisplay) dailyCountDisplay.textContent = `남은 기회: ${this.userDailyCount}/3`;
        if (usernameDisplay) usernameDisplay.textContent = this.currentUser;
    }
    
    updateEvaluateButton(hasContent) {
        const evaluateBtn = document.getElementById('evaluate-btn');
        evaluateBtn.disabled = !hasContent || this.userDailyCount <= 0;
    }
    
    async evaluateArtwork() {
        try {
            console.log('🎨 작품 평가 시작');
            
            // 로딩 상태 시작
            this.showLoading();
            
            // 캔버스 이미지 데이터 가져오기
            const imageData = this.canvas.getImageData();
            console.log('📊 이미지 데이터 길이:', imageData.length);
            
            // API 호출
            console.log('📡 API 호출 중...');
            const result = await this.api.evaluateArtwork(imageData, this.currentUser);
            console.log('✅ API 응답 받음:', result);
            
            // 결과 표시
            console.log('📋 결과 표시 시작');
            this.showEvaluationResult(result);
            
            // 사용자 정보 업데이트
            this.userDailyCount = result.user.daily_count;
            this.updateUserDisplay();
            
            // 갤러리 새로고침 (비동기로 처리하여 모달 표시에 영향 주지 않도록)
            setTimeout(async () => {
                try {
                    await this.gallery.loadGallery();
                } catch (error) {
                    console.error('갤러리 새로고침 실패:', error);
                }
            }, 1000);
            
        } catch (error) {
            console.error('❌ 작품 평가 실패:', error);
            this.showError(this.api.handleError(error));
        } finally {
            this.hideLoading();
        }
    }
    
    showEvaluationResult(result) {
        console.log('🎨 평가 결과 표시 시작:', result);
        
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
        
        console.log('💰 가격 요소:', estimatedPriceElement);
        console.log('💰 가격 데이터:', result.evaluation.estimated_price);
        
        if (estimatedPriceElement) {
            estimatedPriceElement.textContent = result.evaluation.estimated_price;
            console.log('✅ 가격 설정 완료:', result.evaluation.estimated_price);
        } else {
            console.error('❌ 가격 요소를 찾을 수 없습니다');
        }
        
        // AI 코멘트 표시
        const commentElement = document.getElementById('ai-comment-text');
        console.log('💬 코멘트 요소:', commentElement);
        if (commentElement) {
            commentElement.textContent = result.artwork.comment;
            console.log('✅ 코멘트 설정 완료');
        }
        
        // 모달 표시
        console.log('📋 모달 표시 시도');
        
        // 모달 표시를 약간 지연시켜 DOM 업데이트가 완료된 후 실행
        setTimeout(() => {
            this.showResultModal();
        }, 50);
        
        // 세부 점수 표시 (모달이 표시된 후)
        setTimeout(() => {
            console.log('⏰ 점수 바 업데이트 시작');
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
            console.log(`📊 ${type} 점수 업데이트: ${score}/${maxScore} (${percentage}%)`);
            fillElement.style.width = `${percentage}%`;
            scoreElement.textContent = score;
        } else {
            console.error(`❌ ${type} 점수 바 요소를 찾을 수 없습니다`);
        }
    }
    
    animateScoreBars() {
        console.log('🎬 점수 바 애니메이션 시작');
        const scoreBars = document.querySelectorAll('.score-fill');
        scoreBars.forEach((bar, index) => {
            const targetWidth = bar.style.width;
            console.log(`📊 점수 바 ${index + 1}: ${targetWidth}`);
            bar.style.width = '0%';
            setTimeout(() => {
                bar.style.width = targetWidth;
            }, 100);
        });
    }
    
    showResultModal() {
        console.log('🔍 결과 모달 요소 검색 중...');
        const modal = document.getElementById('result-modal');
        console.log('📋 모달 요소:', modal);
        
        if (modal) {
            console.log('📋 결과 모달 표시 시도');
            console.log('📋 현재 모달 클래스:', modal.className);
            
            // 모달을 강제로 표시
            modal.style.display = 'flex';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
            modal.classList.remove('hidden');
            
            console.log('📋 hidden 클래스 제거 후:', modal.className);
            console.log('✅ 모달 표시 완료');
            
            // 추가 디버깅: 모달이 실제로 보이는지 확인
            setTimeout(() => {
                const computedStyle = window.getComputedStyle(modal);
                console.log('📋 모달 display 속성:', computedStyle.display);
                console.log('📋 모달 visibility 속성:', computedStyle.visibility);
                console.log('📋 모달 opacity 속성:', computedStyle.opacity);
            }, 100);
        } else {
            console.error('❌ 결과 모달을 찾을 수 없습니다');
            console.error('❌ DOM에 result-modal ID를 가진 요소가 없습니다');
            
            // 모든 모달 요소 확인
            const allModals = document.querySelectorAll('.modal');
            console.log('🔍 페이지의 모든 모달 요소:', allModals);
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

    showUsernameModal() {
        const usernameModal = document.getElementById('username-modal');
        const usernameInput = document.getElementById('username-input');
        if (usernameModal) {
            usernameModal.classList.remove('hidden');
            setTimeout(() => {
                if (usernameInput) usernameInput.focus();
            }, 50);
        }
    }
    
    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        const evaluateBtn = document.getElementById('evaluate-btn');
        
        loadingOverlay.classList.add('hidden');
        evaluateBtn.classList.remove('loading');
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
    
    saveArtwork() {
        // 갤러리에 저장 (이미 API에서 자동으로 저장됨)
        this.hideResultModal();
        this.startNewDrawing();
    }
    
    startNewDrawing() {
        this.canvas.clear();
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