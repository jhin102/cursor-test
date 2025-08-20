// 획(Stroke) 클래스 - 한 번의 그리기 동작을 나타냄
class Stroke {
    constructor(brushType, brushSize, brushColor) {
        this.brushType = brushType;
        this.brushSize = brushSize;
        this.brushColor = brushColor;
        this.inputPoints = []; // 사용자 입력 원본 점들
        this.drawingPoints = []; // 그리기용 점 집합 (벡터 연산으로 계산)
        this.isComplete = false;
    }
    
    // 입력 점 추가
    addInputPoint(x, y, time) {
        this.inputPoints.push({ x, y, time });
        this.calculateDrawingPoints();
    }
    
    // 벡터 연산을 통한 그리기용 점 집합 계산
    calculateDrawingPoints() {
        if (this.inputPoints.length < 2) return;
        
        this.drawingPoints = [];
        const m = this.brushSize / 2; // 브러시 반지름
        
        for (let i = 0; i < this.inputPoints.length; i++) {
            const current = this.inputPoints[i];
            
            if (i === 0) {
                // 첫 번째 점은 이전 점이 없으므로 다음 점과의 방향 사용
                if (this.inputPoints.length > 1) {
                    const next = this.inputPoints[i + 1];
                    const dx = next.x - current.x;
                    const dy = next.y - current.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 0) {
                        const p1 = {
                            x: current.x - m * dy / distance,
                            y: current.y + m * dx / distance
                        };
                        const p2 = {
                            x: current.x + m * dy / distance,
                            y: current.y - m * dx / distance
                        };
                        this.drawingPoints.push(p1, p2);
                    }
                }
            } else if (i === this.inputPoints.length - 1) {
                // 마지막 점은 다음 점이 없으므로 이전 점과의 방향 사용
                const prev = this.inputPoints[i - 1];
                const dx = current.x - prev.x;
                const dy = current.y - prev.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    const p1 = {
                        x: current.x - m * dy / distance,
                        y: current.y + m * dx / distance
                    };
                    const p2 = {
                        x: current.x + m * dy / distance,
                        y: current.y - m * dx / distance
                    };
                    this.drawingPoints.push(p1, p2);
                }
            } else {
                // 중간 점들은 이전과 다음 점의 평균 방향 사용
                const prev = this.inputPoints[i - 1];
                const next = this.inputPoints[i + 1];
                
                const dx1 = current.x - prev.x;
                const dy1 = current.y - prev.y;
                const dx2 = next.x - current.x;
                const dy2 = next.y - current.y;
                
                // 평균 방향 벡터 계산
                const avgDx = (dx1 + dx2) / 2;
                const avgDy = (dy1 + dy2) / 2;
                const avgDistance = Math.sqrt(avgDx * avgDx + avgDy * avgDy);
                
                if (avgDistance > 0) {
                    const p1 = {
                        x: current.x - m * avgDy / avgDistance,
                        y: current.y + m * avgDx / avgDistance
                    };
                    const p2 = {
                        x: current.x + m * avgDy / avgDistance,
                        y: current.y - m * avgDx / avgDistance
                    };
                    this.drawingPoints.push(p1, p2);
                }
            }
        }
    }
    
    // 획 완료 표시
    complete() {
        this.isComplete = true;
    }
    
    // 획 그리기
    draw(ctx) {
        if (this.drawingPoints.length < 4) return;
        
        ctx.save();
        
        switch (this.brushType) {
            case 'pen':
                this.drawPen(ctx);
                break;
            case 'watercolor':
                this.drawWatercolor(ctx);
                break;
            case 'highlighter':
                this.drawHighlighter(ctx);
                break;
            case 'eraser':
                this.drawEraser(ctx);
                break;
        }
        
        ctx.restore();
    }
    
    // 펜 그리기
    drawPen(ctx) {
        ctx.strokeStyle = this.brushColor;
        ctx.fillStyle = this.brushColor;
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // 2차 곡선으로 그리기
        ctx.beginPath();
        
        // 왼쪽 경계선
        for (let i = 0; i < this.drawingPoints.length; i += 2) {
            const point = this.drawingPoints[i];
            if (i === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        }
        
        // 오른쪽 경계선 (역순)
        for (let i = this.drawingPoints.length - 1; i >= 1; i -= 2) {
            const point = this.drawingPoints[i];
            ctx.lineTo(point.x, point.y);
        }
        
        ctx.closePath();
        ctx.fill();
        
        // 첫 입력과 마지막 입력에 원 그리기
        if (this.inputPoints.length > 0) {
            // 첫 번째 점에 원 그리기
            const firstPoint = this.inputPoints[0];
            ctx.beginPath();
            ctx.arc(firstPoint.x, firstPoint.y, this.brushSize / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // 마지막 점에 원 그리기 (첫 번째와 다른 경우에만)
            if (this.inputPoints.length > 1) {
                const lastPoint = this.inputPoints[this.inputPoints.length - 1];
                if (lastPoint.x !== firstPoint.x || lastPoint.y !== firstPoint.y) {
                    ctx.beginPath();
                    ctx.arc(lastPoint.x, lastPoint.y, this.brushSize / 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }
    
    // 붓 그리기
    drawWatercolor(ctx) {
        ctx.strokeStyle = this.brushColor;
        ctx.fillStyle = this.brushColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // 순서대로 점점 옅어지도록 그리기
        for (let i = 0; i < this.inputPoints.length; i++) {
            const point = this.inputPoints[i];
            const progress = i / 15 > 15 ? 15 : i / 15; // 0~1 사이의 진행도
            const alpha = 0.7 * (1 - progress * 0.7); // 시작 80%에서 끝 24%까지 점점 옅어짐
            
            ctx.globalAlpha = alpha;
            ctx.lineWidth = this.brushSize * (1 - progress * 0.25); // 브러시 크기도 점점 작아짐
            
            if (i === 0) {
                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
            ctx.stroke();
        }        
        // ctx.stroke();
        ctx.globalAlpha = 1.0; // 알파값 복원
    }
    
    // 지우개 그리기
    drawEraser(ctx) {
        ctx.strokeStyle = '#FFFFFF'; // 흰색 고정
        ctx.fillStyle = '#FFFFFF'; // 흰색 고정
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // 2차 곡선으로 그리기
        ctx.beginPath();
        
        // 왼쪽 경계선
        for (let i = 0; i < this.drawingPoints.length; i += 2) {
            const point = this.drawingPoints[i];
            if (i === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        }
        
        // 오른쪽 경계선 (역순)
        for (let i = this.drawingPoints.length - 1; i >= 1; i -= 2) {
            const point = this.drawingPoints[i];
            ctx.lineTo(point.x, point.y);
        }
        
        ctx.closePath();
        ctx.fill();
        
        // 첫 입력과 마지막 입력에 원 그리기
        if (this.inputPoints.length > 0) {
            // 첫 번째 점에 원 그리기
            const firstPoint = this.inputPoints[0];
            ctx.beginPath();
            ctx.arc(firstPoint.x, firstPoint.y, this.brushSize / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // 마지막 점에 원 그리기 (첫 번째와 다른 경우에만)
            if (this.inputPoints.length > 1) {
                const lastPoint = this.inputPoints[this.inputPoints.length - 1];
                if (lastPoint.x !== firstPoint.x || lastPoint.y !== firstPoint.y) {
                    ctx.beginPath();
                    ctx.arc(lastPoint.x, lastPoint.y, this.brushSize / 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }
    
    // 형광펜 그리기
    drawHighlighter(ctx) {
        ctx.strokeStyle = this.brushColor;
        ctx.fillStyle = this.brushColor;
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // 2차 곡선으로 그리기
        ctx.beginPath();
        ctx.globalAlpha = 0.5; // 알파값 복원

        // 왼쪽 경계선
        for (let i = 0; i < this.drawingPoints.length; i += 2) {
            const point = this.drawingPoints[i];
            if (i === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        }
        
        // 오른쪽 경계선 (역순)
        for (let i = this.drawingPoints.length - 1; i >= 1; i -= 2) {
            const point = this.drawingPoints[i];
            ctx.lineTo(point.x, point.y);
        }
        
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 0.1; // 알파값 복원
    }
}

// 고급 그리기 캔버스 클래스
class DrawingCanvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.brushSize = 5;
        this.brushColor = '#000000';
        this.brushType = 'pen';
        this.hasContent = false;
        this.onDrawingStateChange = null;
        
        // 획 관리
        this.strokes = []; // 완료된 획들
        this.currentStroke = null; // 현재 그리는 획
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.setupToolbar();
        this.startRenderLoop();
    }
    
    setupCanvas() {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    setupEventListeners() {
        // 마우스 이벤트
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
        
        // 터치 이벤트
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
                brushButtons.forEach(b => b.classList.remove('active'));
                e.target.closest('.brush-btn').classList.add('active');
                this.brushType = e.target.closest('.brush-btn').dataset.brush;
            });
        });
        
        // 브러시 크기 조절
        const brushSizeSlider = document.getElementById('brush-size');
        const brushSizeDisplay = document.getElementById('brush-size-display');
        
        brushSizeSlider.addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
            brushSizeDisplay.textContent = `${this.brushSize}px`;
        });
        
        // 색상 팔레트 설정
        this.setupColorPalette();
    }
    
    getCanvasPoint(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
            time: performance.now()
        };
    }
    
    startDrawing(e) {
        this.isDrawing = true;
        const point = this.getCanvasPoint(e);
        
        // 새로운 획 생성
        this.currentStroke = new Stroke(this.brushType, this.brushSize, this.brushColor);
        this.currentStroke.addInputPoint(point.x, point.y, point.time);
        
        // 오버레이 숨기기
        this.hideOverlay();
        
        this.hasContent = true;
        this.notifyDrawingStateChange();
    }
    
    draw(e) {
        if (!this.isDrawing || !this.currentStroke) return;

        const point = this.getCanvasPoint(e);
        this.currentStroke.addInputPoint(point.x, point.y, point.time);
    }
    
    stopDrawing() {
        if (!this.isDrawing || !this.currentStroke) return;
        
        this.isDrawing = false;
        
        // 현재 획 완료
        this.currentStroke.complete();
        
        // 완료된 획을 리스트에 추가
        this.strokes.push(this.currentStroke);
        this.currentStroke = null;
        
        this.notifyDrawingStateChange();
    }
    
    // 캔버스 다시 그리기 (매 프레임마다 호출)
    redraw() {
        // 캔버스 초기화
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 완료된 획들 그리기
        this.strokes.forEach(stroke => {
            stroke.draw(this.ctx);
        });
        
        // 현재 그리는 획 그리기
        if (this.currentStroke) {
            this.currentStroke.draw(this.ctx);
        }
    }
    
    startRenderLoop() {
        const renderFrame = () => {
            this.redraw();
            requestAnimationFrame(renderFrame);
        };
        
        renderFrame();
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
        this.strokes = [];
        this.currentStroke = null;
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
    
    hasDrawingContent() {
        return this.strokes.length > 0 || this.currentStroke !== null;
    }
    
    validateContent() {
        if (!this.hasDrawingContent()) {
            throw new Error('캔버스에 그려진 내용이 없습니다.');
        }
    }
    
    setupColorPalette() {
        const colorSwatches = document.querySelectorAll('.color-swatch');
        const colorInput = document.getElementById('color-input');
        const colorPickerPopup = document.getElementById('color-picker-popup');
        
        colorSwatches.forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                const clickedColor = e.target.dataset.color;
                const isCurrentlyActive = e.target.classList.contains('active');
                
                if (isCurrentlyActive) {
                    this.showColorPickerAtSwatch(e.target);
                } else {
                    colorSwatches.forEach(s => s.classList.remove('active'));
                    e.target.classList.add('active');
                    this.setColor(clickedColor);
                    colorPickerPopup.classList.remove('show');
                }
            });
        });
        
        colorInput.addEventListener('input', (e) => {
            const newColor = e.target.value;
            this.setColor(newColor);
            
            const activeSwatch = document.querySelector('.color-swatch.active');
            if (activeSwatch) {
                activeSwatch.style.backgroundColor = newColor;
                activeSwatch.dataset.color = newColor;
            }
        });
        
        colorInput.addEventListener('change', (e) => {
            colorPickerPopup.classList.remove('show');
        });
        
        document.addEventListener('click', (e) => {
            const colorPalette = document.querySelector('.color-palette');
            if (!colorPalette.contains(e.target) && !colorPickerPopup.contains(e.target)) {
                colorPickerPopup.classList.remove('show');
            }
        });
        
        this.setColor('#000000');
    }
    
    setColor(color) {
        this.brushColor = color;
        document.getElementById('color-input').value = color;
    }
    
    showColorPickerAtSwatch(swatch) {
        const colorPickerPopup = document.getElementById('color-picker-popup');
        const colorInput = document.getElementById('color-input');
        
        const swatchRect = swatch.getBoundingClientRect();
        const popup = colorPickerPopup;
        
        popup.style.position = 'fixed';
        popup.style.top = (swatchRect.bottom + 5) + 'px';
        popup.style.left = swatchRect.left + 'px';
        popup.style.margin = '0';
        popup.style.zIndex = '1000';
        
        popup.classList.add('show');
        
        setTimeout(() => {
            colorInput.click();
        }, 10);
    }

    // 마지막 획 삭제 (Ctrl+Z)
    undoLastStroke() {
        if (this.strokes.length === 0) return;
        
        this.strokes.pop();
        this.hasContent = this.hasDrawingContent();
        this.notifyDrawingStateChange();
    }
} 