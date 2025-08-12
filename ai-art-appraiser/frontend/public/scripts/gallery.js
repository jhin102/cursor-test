// 갤러리 클래스
class Gallery {
    constructor() {
        this.artworks = [];
        this.api = new ArtAPI();
    }
    
    async loadGallery() {
        try {
            console.log('🖼️ 갤러리 로딩 중...');
            
            this.artworks = await this.api.getGallery();
            // 가격 내림차순 정렬 (백엔드 정렬 보조)
            this.artworks.sort((a, b) => (b.price || 0) - (a.price || 0));
            this.renderGallery();
            
            console.log(`✅ 갤러리 로딩 완료: ${this.artworks.length}개 작품`);
        } catch (error) {
            console.error('갤러리 로딩 실패:', error);
            this.showEmptyState();
        }
    }
    
    renderGallery() {
        const galleryGrid = document.getElementById('gallery-grid');
        const galleryCount = document.getElementById('gallery-count');
        const galleryEmpty = document.getElementById('gallery-empty');
        
        if (!galleryGrid) return;
        
        // 갤러리 카운트 업데이트
        if (galleryCount) {
            galleryCount.textContent = `총 ${this.artworks.length}개 작품`;
        }
        
        // 빈 상태 처리
        if (this.artworks.length === 0) {
            this.showEmptyState();
            return;
        }
        
        // 갤러리 그리드 렌더링
        galleryGrid.innerHTML = '';
        galleryEmpty.classList.add('hidden');
        
        this.artworks.forEach(artwork => {
            const galleryItem = this.createGalleryItem(artwork);
            galleryGrid.appendChild(galleryItem);
        });
    }
    
    createGalleryItem(artwork) {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        
        const imageUrl = artwork.image_url.startsWith('http') ? 
            artwork.image_url : `${artwork.image_url}`;
        
        const date = new Date(artwork.created_at).toLocaleDateString('ko-KR');
        
        const avgScore = typeof artwork.score === 'number' ? (artwork.score / 4) : (parseFloat(artwork.score) / 4) || 0;
        item.innerHTML = `
            <img src="${imageUrl}" alt="작품" class="gallery-item-image" 
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjdGQUZDIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNzE4MDk2Ij7snbTrr7jsp4DtlZwg7J247ZmU7ZmUPC90ZXh0Pgo8L3N2Zz4K'">
            <div class="gallery-item-content">
                <div class="gallery-item-header">
                    <div class="gallery-item-title">${(artwork.title && artwork.title.trim()) ? artwork.title : `작품 #${artwork.id}`}</div>
                    <div class="gallery-item-score">평점 ${avgScore.toFixed(1)}점</div>
                </div>
                <div class="gallery-item-artist">작가: ${artwork.username}</div>
                <div class="gallery-item-price">AI 감정 가격: ${artwork.price.toLocaleString()}원</div>
                <div class="gallery-item-comment">${artwork.ai_comment || '평가 코멘트가 없습니다.'}</div>
                <div class="gallery-item-date">${date}</div>
            </div>
        `;
        // 클릭 시 결과 모달 열기
        item.addEventListener('click', () => {
            if (window.artApp && typeof window.artApp.showArtworkModal === 'function') {
                window.artApp.showArtworkModal(artwork);
            }
        });
        
        return item;
    }
    
    showEmptyState() {
        const galleryGrid = document.getElementById('gallery-grid');
        const galleryEmpty = document.getElementById('gallery-empty');
        const galleryCount = document.getElementById('gallery-count');
        
        if (galleryGrid) galleryGrid.innerHTML = '';
        if (galleryEmpty) galleryEmpty.classList.remove('hidden');
        if (galleryCount) galleryCount.textContent = '총 0개 작품';
    }
    
    // 작품 검색 기능 (향후 확장용)
    searchArtworks(query) {
        if (!query) {
            this.renderGallery();
            return;
        }
        
        const q = query.toLowerCase();
        const filteredArtworks = this.artworks.filter(artwork => {
            const title = (artwork.title || '').toLowerCase();
            const username = (artwork.username || '').toLowerCase();
            const comment = (artwork.ai_comment || '').toLowerCase();
            return title.includes(q) || username.includes(q) || comment.includes(q);
        });
        
        this.renderFilteredGallery(filteredArtworks);
    }
    
    renderFilteredGallery(artworks) {
        const galleryGrid = document.getElementById('gallery-grid');
        const galleryCount = document.getElementById('gallery-count');
        const galleryEmpty = document.getElementById('gallery-empty');
        
        if (!galleryGrid) return;
        
        galleryCount.textContent = `검색 결과: ${artworks.length}개 작품`;
        
        if (artworks.length === 0) {
            galleryEmpty.innerHTML = '<p>검색 결과가 없습니다.</p>';
            galleryEmpty.classList.remove('hidden');
            galleryGrid.innerHTML = '';
            return;
        }
        
        galleryEmpty.classList.add('hidden');
        galleryGrid.innerHTML = '';
        
        artworks.forEach(artwork => {
            const galleryItem = this.createGalleryItem(artwork);
            galleryGrid.appendChild(galleryItem);
        });
    }
} 