// 그리기 캔버스 클래스
class DrawingCanvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.brushSize = 5;
        this.brushColor = '#000000';
        this.brushType = 'pen'; // 기본 펜
        this.hasContent = false;
        this.onDrawingStateChange = null;
        this.lastX = 0;
        this.lastY = 0;
        this.history = [];
        this.maxHistory = 50;
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.setupToolbar();
    }
    
    setupCanvas() {
        // 캔버스 초기 설정
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 그리기 설정
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = this.brushColor;
        this.ctx.lineWidth = this.brushSize;
    }
    
    setupEventListeners() {
        // 마우스 이벤트
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
        
        // 터치 이벤트 (모바일 지원)
        this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
        
        // 캔버스 클릭 시 오버레이 숨기기
        this.canvas.addEventListener('click', () => {
            this.hideOverlay();
        });

        // 키보드 이벤트 (Ctrl/Cmd + Z 실행 취소)
        document.addEventListener('keydown', (e) => {
            const isUndoKey = (e.key === 'z' || e.key === 'Z');
            const isCtrlOrMeta = e.ctrlKey || e.metaKey;
            const isShiftHeld = e.shiftKey;
            const active = document.activeElement;
            const isTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
            if (isCtrlOrMeta && isUndoKey && !isShiftHeld && !isTyping) {
                e.preventDefault();
                this.undoLastStroke();
            }
        });
    }
    
    setupToolbar() {
        // 브러시 종류 선택
        const brushButtons = document.querySelectorAll('.brush-btn');
        brushButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // 활성 브러시 버튼 변경
                brushButtons.forEach(b => b.classList.remove('active'));
                e.target.closest('.brush-btn').classList.add('active');
                
                // 브러시 타입 설정
                this.brushType = e.target.closest('.brush-btn').dataset.brush;
                this.updateBrushSettings();
            });
        });
        
        // 브러시 크기 조절
        const brushSizeSlider = document.getElementById('brush-size');
        const brushSizeDisplay = document.getElementById('brush-size-display');
        
        brushSizeSlider.addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
            this.updateBrushSettings();
            brushSizeDisplay.textContent = `${this.brushSize}px`;
        });
        
        // 색상 팔레트 설정
        this.setupColorPalette();
    }
    
    updateBrushSettings() {
        switch (this.brushType) {
            case 'pen':
                this.ctx.lineCap = 'round';
                this.ctx.lineJoin = 'round';
                this.ctx.lineWidth = this.brushSize;
                this.ctx.strokeStyle = this.brushColor;
                this.ctx.globalAlpha = 1.0;
                break;
                
            case 'watercolor':
                this.ctx.lineCap = 'round';
                this.ctx.lineJoin = 'round';
                this.ctx.lineWidth = this.brushSize * 1.5;
                this.ctx.strokeStyle = this.brushColor;
                this.ctx.globalAlpha = 0.35; // 더 연하게
                break;
                
            case 'highlighter':
                this.ctx.lineCap = 'square';
                this.ctx.lineJoin = 'bevel';
                this.ctx.lineWidth = this.brushSize * 2;
                this.ctx.strokeStyle = this.brushColor;
                this.ctx.globalAlpha = 0.4;
                break;
        }
    }
    
    startDrawing(e) {
        // 현재 상태 저장 (실행 취소용)
        this.saveState();
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.lastX = e.clientX - rect.left;
        this.lastY = e.clientY - rect.top;
        this.draw(e);
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        switch (this.brushType) {
            case 'pen':
                this.drawPen(x, y);
                break;
            case 'watercolor':
                this.drawWatercolor(x, y);
                break;
            case 'highlighter':
                this.drawHighlighter(x, y);
                break;
        }
        
        this.lastX = x;
        this.lastY = y;
        this.hasContent = true;
        this.notifyDrawingStateChange();
    }
    
    drawPen(x, y) {
        // 기본 펜: 부드럽고 정확한 선
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
    }
    
    drawWatercolor(x, y) {
        // 수채화 효과: 더 연하고 부드럽게
        const steps = 5;
        const pressure = Math.random() * 0.25 + 0.6; // 더 낮은 압력 범위
        
        for (let i = 0; i < steps; i++) {
            const offsetX = (Math.random() - 0.5) * this.brushSize * 0.35;
            const offsetY = (Math.random() - 0.5) * this.brushSize * 0.35;
            const alpha = 0.35 * pressure * (1 - i / steps); // 알파 더 낮춤
            
            this.ctx.globalAlpha = alpha;
            this.ctx.lineWidth = this.brushSize * 1.4 * pressure;
            
            this.ctx.beginPath();
            this.ctx.moveTo(this.lastX + offsetX, this.lastY + offsetY);
            this.ctx.lineTo(x + offsetX, y + offsetY);
            this.ctx.stroke();
        }
        
        // 수채화 확산 효과 (원형 번짐)
        this.drawWatercolorSpread(x, y);
    }
    
    drawWatercolorSpread(x, y) {
        // 수채화의 확산 효과 - 원형 번짐으로 복원하고 더 연하게
        const distance = Math.sqrt((x - this.lastX) ** 2 + (y - this.lastY) ** 2);
        if (distance > 4) {
            const dropCount = Math.floor(distance / 3);
            
            for (let i = 0; i < dropCount; i++) {
                const t = i / dropCount;
                const cx = this.lastX + (x - this.lastX) * t + (Math.random() - 0.5) * this.brushSize * 0.4;
                const cy = this.lastY + (y - this.lastY) * t + (Math.random() - 0.5) * this.brushSize * 0.4;
                const radius = (Math.random() * 0.5 + 0.3) * this.brushSize; // 작은 방울들
                const alpha = 0.12 * (1 - t) * (Math.random() * 0.8 + 0.2); // 훨씬 연하게
                
                this.ctx.save();
                this.ctx.globalAlpha = alpha;
                this.ctx.fillStyle = this.brushColor;
                this.ctx.beginPath();
                this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            }
        }
    }
    
    drawHighlighter(x, y) {
        // 형광펜 효과: 넓고 평평한 선
        const distance = Math.sqrt((x - this.lastX) ** 2 + (y - this.lastY) ** 2);
        
        if (distance > 2) {
            // // 메인 하이라이트 선
            // this.ctx.globalAlpha = 0.4;
            // this.ctx.lineWidth = this.brushSize * 2;
            // this.ctx.beginPath();
            // this.ctx.moveTo(this.lastX, this.lastY);
            // this.ctx.lineTo(x, y);
            // this.ctx.stroke();
            
            // 추가 하이라이트 효과 (더 넓은 배경)
            this.ctx.globalAlpha = 0.2;
            this.ctx.lineWidth = this.brushSize * 4;
            this.ctx.beginPath();
            this.ctx.moveTo(this.lastX, this.lastY);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
            
            // // 형광펜의 끝 부분 강조
            // this.ctx.globalAlpha = 0.6;
            // this.ctx.lineWidth = this.brushSize * 1.5;
            // this.ctx.beginPath();
            // this.ctx.moveTo(this.lastX, this.lastY);
            // this.ctx.lineTo(x, y);
            // this.ctx.stroke();
        }
        
        // 형광펜의 점 효과 제거 (원형 패턴 제거)
    }
    
    drawHighlighterDots(x, y) {
        // 형광펜의 점진적 효과 - 원형 대신 선형으로 변경
        const dotCount = 2;
        for (let i = 0; i < dotCount; i++) {
            const dotX = this.lastX + (x - this.lastX) * (i / dotCount);
            const dotY = this.lastY + (y - this.lastY) * (i / dotCount);
            const offsetX = (Math.random() - 0.5) * this.brushSize * 0.5;
            const offsetY = (Math.random() - 0.5) * this.brushSize * 0.5;
            const alpha = 0.3 * (1 - i / dotCount);
            const width = this.brushSize * 0.8 * (1 - i / dotCount);
            
            this.ctx.globalAlpha = alpha;
            this.ctx.lineWidth = width;
            this.ctx.beginPath();
            this.ctx.moveTo(dotX + offsetX, dotY + offsetY);
            this.ctx.lineTo(dotX + offsetX * 1.5, dotY + offsetY * 1.5);
            this.ctx.stroke();
        }
    }
    
    stopDrawing() {
        this.isDrawing = false;
        this.ctx.globalAlpha = 1.0;
    }
    
    handleTouch(e) {
        e.preventDefault();
        
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                        e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        
        this.canvas.dispatchEvent(mouseEvent);
    }
    
    clear() {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.hasContent = false;
        this.notifyDrawingStateChange();
    }
    
    getImageData() {
        return this.canvas.toDataURL('image/png');
    }
    
    hideOverlay() {
        const overlay = document.getElementById('canvas-overlay');
        if (overlay && !overlay.classList.contains('hidden')) {
            overlay.classList.add('hidden');
        }
    }
    
    notifyDrawingStateChange() {
        if (this.onDrawingStateChange) {
            this.onDrawingStateChange(this.hasContent);
        }
    }
    
    // 캔버스에 내용이 있는지 확인
    hasDrawingContent() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        // 모든 픽셀이 흰색인지 확인
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) {
                return true;
            }
        }
        return false;
    }
    
    // 캔버스 내용 검증
    validateContent() {
        if (!this.hasDrawingContent()) {
            throw new Error('캔버스에 그려진 내용이 없습니다.');
        }
    }
    
    setupColorPalette() {
        const colorSwatches = document.querySelectorAll('.color-swatch');
        const colorInput = document.getElementById('color-input');
        const colorPickerPopup = document.getElementById('color-picker-popup');
        
        // 색상 스와치 클릭 이벤트
        colorSwatches.forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                const clickedColor = e.target.dataset.color;
                const isCurrentlyActive = e.target.classList.contains('active');
                
                if (isCurrentlyActive) {
                    // 현재 선택된 색상을 다시 클릭하면 색상 선택기를 해당 스와치 아래에 표시
                    this.showColorPickerAtSwatch(e.target);
                } else {
                    // 새로운 색상 선택
                    colorSwatches.forEach(s => s.classList.remove('active'));
                    e.target.classList.add('active');
                    this.setColor(clickedColor);
                    colorPickerPopup.classList.remove('show');
                }
            });
        });
        
        // 색상 입력 이벤트 - 색상이 변경되면 현재 활성 스와치 업데이트
        colorInput.addEventListener('input', (e) => {
            const newColor = e.target.value;
            this.setColor(newColor);
            
            // 현재 활성 스와치를 새로운 색상으로 업데이트
            const activeSwatch = document.querySelector('.color-swatch.active');
            if (activeSwatch) {
                activeSwatch.style.backgroundColor = newColor;
                activeSwatch.dataset.color = newColor;
            }
        });
        
        // 색상 선택 완료 시 팝업 숨기기
        colorInput.addEventListener('change', (e) => {
            colorPickerPopup.classList.remove('show');
        });
        
        // 색상 선택기 외부 클릭 시 팝업 숨기기
        document.addEventListener('click', (e) => {
            const colorPalette = document.querySelector('.color-palette');
            if (!colorPalette.contains(e.target) && !colorPickerPopup.contains(e.target)) {
                colorPickerPopup.classList.remove('show');
            }
        });
        
        // 초기 색상 설정
        this.setColor('#000000');
    }
    
    setColor(color) {
        this.brushColor = color;
        document.getElementById('color-input').value = color;
        this.updateBrushSettings();
    }
    
    showColorPickerAtSwatch(swatch) {
        const colorPickerPopup = document.getElementById('color-picker-popup');
        const colorInput = document.getElementById('color-input');
        
        // 스와치의 위치 계산
        const swatchRect = swatch.getBoundingClientRect();
        const popup = colorPickerPopup;
        
        // 팝업을 스와치 아래에 위치시키기
        popup.style.position = 'fixed';
        popup.style.top = (swatchRect.bottom + 5) + 'px';
        popup.style.left = swatchRect.left + 'px';
        popup.style.margin = '0';
        popup.style.zIndex = '1000';
        
        // 팝업 표시
        popup.classList.add('show');
        
        // 색상 선택기 클릭
        setTimeout(() => {
            colorInput.click();
        }, 10);
    }

    // 실행 취소 스냅샷 저장
    saveState() {
        try {
            const snapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            this.history.push(snapshot);
            if (this.history.length > this.maxHistory) {
                this.history.shift();
            }
        } catch (err) {
            console.error('캔버스 상태 저장 실패:', err);
        }
    }

    // 마지막 획 실행 취소
    undoLastStroke() {
        if (this.history.length === 0) return;
        const snapshot = this.history.pop();
        try {
            this.ctx.putImageData(snapshot, 0, 0);
        } catch (err) {
            console.error('캔버스 실행 취소 실패:', err);
            return;
        }
        this.hasContent = this.hasDrawingContent();
        this.notifyDrawingStateChange();
    }
} 