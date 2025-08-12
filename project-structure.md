# AI Art Appraiser 프로젝트 구조

## 📁 프로젝트 루트 구조

```
ai-art-appraiser/
├── 📁 frontend/                 # 프론트엔드 (Vanilla JS)
│   ├── 📁 public/              # 정적 파일
│   │   ├── index.html          # 메인 페이지
│   │   ├── styles/             # CSS 파일들
│   │   │   ├── main.css       # 메인 스타일
│   │   │   ├── canvas.css     # 캔버스 관련 스타일
│   │   │   └── gallery.css    # 갤러리 스타일
│   │   ├── scripts/           # JavaScript 파일들
│   │   │   ├── app.js         # 메인 애플리케이션
│   │   │   ├── canvas.js      # 그리기 캔버스 기능
│   │   │   ├── gallery.js     # 갤러리 기능
│   │   │   ├── ranking.js     # 랭킹 시스템
│   │   │   └── api.js         # API 통신
│   │   └── assets/            # 이미지, 폰트 등
│   └── package.json           # 프론트엔드 의존성
├── 📁 backend/                # 백엔드 (Node.js + Express)
│   ├── 📁 src/
│   │   ├── 📁 controllers/    # 컨트롤러
│   │   │   ├── artworkController.js
│   │   │   ├── userController.js
│   │   │   └── rankingController.js
│   │   ├── 📁 models/         # 데이터 모델
│   │   │   ├── User.js
│   │   │   ├── Artwork.js
│   │   │   └── Ranking.js
│   │   ├── 📁 routes/         # API 라우트
│   │   │   ├── artworkRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   └── rankingRoutes.js
│   │   ├── 📁 services/       # 비즈니스 로직
│   │   │   ├── claudeService.js  # Claude API 연동
│   │   │   ├── imageService.js   # 이미지 처리
│   │   │   └── rankingService.js # 랭킹 계산
│   │   ├── 📁 middleware/     # 미들웨어
│   │   │   ├── auth.js        # 인증
│   │   │   ├── upload.js      # 파일 업로드
│   │   │   └── validation.js  # 데이터 검증
│   │   ├── 📁 utils/          # 유틸리티
│   │   │   ├── database.js    # DB 연결
│   │   │   └── helpers.js     # 헬퍼 함수
│   │   ├── 📁 uploads/        # 업로드된 이미지
│   │   └── app.js             # 메인 서버 파일
│   ├── 📁 database/           # 데이터베이스
│   │   ├── schema.sql         # DB 스키마
│   │   └── data.db            # SQLite 파일
│   ├── package.json           # 백엔드 의존성
│   └── .env                   # 환경 변수
├── 📁 docs/                   # 문서
│   ├── API.md                 # API 문서
│   ├── DEPLOYMENT.md          # 배포 가이드
│   └── CONTRIBUTING.md        # 기여 가이드
├── 📁 tests/                  # 테스트
│   ├── 📁 frontend/
│   └── 📁 backend/
├── .gitignore
├── README.md
└── docker-compose.yml         # 개발 환경 설정
```

## 🏗️ 상세 구조 설명

### Frontend 구조

#### 1. **public/index.html**
```html
<!DOCTYPE html>
<html>
<head>
    <title>AI Art Appraiser</title>
    <link rel="stylesheet" href="styles/main.css">
</head>
<body>
    <!-- 헤더: 로고, 유저명, 남은 기회 -->
    <header>
        <div class="logo">AI Art Appraiser</div>
        <div class="user-info">
            <span id="username">게스트</span>
            <span id="daily-count">남은 기회: 3/3</span>
        </div>
    </header>

    <!-- 메인 캔버스 영역 -->
    <main>
        <div class="canvas-container">
            <canvas id="drawing-canvas" width="500" height="500"></canvas>
            <div class="toolbar">
                <!-- 그리기 도구들 -->
            </div>
        </div>
        
        <div class="action-buttons">
            <button id="evaluate-btn" disabled>AI 평가 요청</button>
            <button id="clear-btn">캔버스 지우기</button>
        </div>
    </main>

    <!-- 결과 표시 영역 -->
    <div id="result-modal" class="modal hidden">
        <!-- 평가 결과 -->
    </div>

    <!-- 탭 네비게이션 -->
    <nav class="tabs">
        <button class="tab-btn active" data-tab="gallery">갤러리</button>
        <button class="tab-btn" data-tab="ranking">랭킹</button>
    </nav>

    <!-- 갤러리/랭킹 컨텐츠 -->
    <div id="gallery-content" class="tab-content active">
        <!-- 갤러리 그리드 -->
    </div>
    
    <div id="ranking-content" class="tab-content">
        <!-- 랭킹 리스트 -->
    </div>

    <script src="scripts/app.js"></script>
    <script src="scripts/canvas.js"></script>
    <script src="scripts/gallery.js"></script>
    <script src="scripts/ranking.js"></script>
    <script src="scripts/api.js"></script>
</body>
</html>
```

#### 2. **scripts/canvas.js** - 그리기 기능
```javascript
class DrawingCanvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.brushSize = 5;
        this.brushColor = '#000000';
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupToolbar();
    }
    
    setupEventListeners() {
        // 마우스 이벤트 리스너
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
    }
    
    // 그리기 메서드들...
    startDrawing(e) { /* 구현 */ }
    draw(e) { /* 구현 */ }
    stopDrawing() { /* 구현 */ }
    clear() { /* 구현 */ }
    getImageData() { /* 구현 */ }
}
```

#### 3. **scripts/api.js** - API 통신
```javascript
class ArtAPI {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
    }
    
    async evaluateArtwork(imageData) {
        try {
            const response = await fetch(`${this.baseURL}/artworks/evaluate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image: imageData })
            });
            return await response.json();
        } catch (error) {
            console.error('평가 요청 실패:', error);
            throw error;
        }
    }
    
    async getGallery() {
        // 갤러리 작품 목록 조회
    }
    
    async getRankings() {
        // 랭킹 목록 조회
    }
}
```

### Backend 구조

#### 1. **src/app.js** - 메인 서버
```javascript
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 라우트 설정
app.use('/api/artworks', require('./routes/artworkRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/rankings', require('./routes/rankingRoutes'));

// 정적 파일 서빙
app.use('/uploads', express.static('uploads'));

app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
```

#### 2. **src/services/claudeService.js** - Claude API 연동
```javascript
const { Anthropic } = require('@anthropic-ai/sdk');

class ClaudeService {
    constructor() {
        this.anthropic = new Anthropic({
            apiKey: process.env.CLAUDE_API_KEY,
        });
    }
    
    async evaluateArtwork(imageBase64) {
        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 1000,
                messages: [{
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: this.getEvaluationPrompt()
                        },
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: 'image/png',
                                data: imageBase64
                            }
                        }
                    ]
                }]
            });
            
            return this.parseEvaluationResponse(response.content[0].text);
        } catch (error) {
            console.error('Claude API 오류:', error);
            throw error;
        }
    }
    
    getEvaluationPrompt() {
        return `당신은 전문 미술 평가사입니다. 
        첨부된 그림을 다음 기준으로 평가해주세요:
        
        1. 창의성 (0-30점): 독특한 아이디어와 표현
        2. 기술적 완성도 (0-30점): 선의 정확성, 색채 사용
        3. 예술성 (0-25점): 감정 전달력, 미적 완성도
        4. 독창성 (0-15점): 다른 작품과의 차별성
        
        JSON 형태로 응답해주세요:
        {
            "creativity": 25,
            "technical_skill": 20,
            "artistic_value": 18,
            "originality": 12,
            "total_score": 75,
            "estimated_price": 750,
            "comment": "색채 사용이 독창적이며 구성이 균형잡혀 있습니다.",
            "category": "추상화"
        }`;
    }
    
    parseEvaluationResponse(responseText) {
        try {
            // JSON 파싱 및 검증
            const evaluation = JSON.parse(responseText);
            return evaluation;
        } catch (error) {
            throw new Error('평가 결과 파싱 실패');
        }
    }
}

module.exports = new ClaudeService();
```

#### 3. **database/schema.sql** - 데이터베이스 스키마
```sql
-- 사용자 테이블
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    daily_count INTEGER DEFAULT 3,
    total_score INTEGER DEFAULT 0
);

-- 작품 테이블
CREATE TABLE artworks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    score INTEGER NOT NULL,
    price INTEGER NOT NULL,
    ai_comment TEXT,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 랭킹 뷰
CREATE VIEW rankings AS
SELECT 
    u.id as user_id,
    u.username,
    MAX(a.score) as best_score,
    SUM(a.score) as total_score,
    ROW_NUMBER() OVER (ORDER BY SUM(a.score) DESC) as rank
FROM users u
LEFT JOIN artworks a ON u.id = a.user_id
GROUP BY u.id, u.username;

-- 인덱스
CREATE INDEX idx_artworks_user_id ON artworks(user_id);
CREATE INDEX idx_artworks_created_at ON artworks(created_at);
CREATE INDEX idx_artworks_score ON artworks(score);
```

## 🚀 개발 환경 설정

### 1. **package.json (Backend)**
```json
{
  "name": "ai-art-appraiser-backend",
  "version": "1.0.0",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "sqlite3": "^5.1.6",
    "@anthropic-ai/sdk": "^0.18.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.7.0"
  }
}
```

### 2. **.env 파일**
```env
PORT=3000
CLAUDE_API_KEY=your_claude_api_key_here
NODE_ENV=development
```

### 3. **docker-compose.yml**
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - database
  
  database:
    image: sqlite:latest
    volumes:
      - ./database:/data
```

## 📋 개발 단계별 구현 계획

### Phase 1: MVP (2주)
- [ ] 기본 그리기 캔버스 구현
- [ ] Claude API 연동
- [ ] 간단한 평가 결과 표시
- [ ] 기본 갤러리 시스템

### Phase 2: 핵심 기능 (2주)
- [ ] 랭킹 시스템
- [ ] 일일 제한 기능
- [ ] 사용자 관리
- [ ] 이미지 저장/로드

### Phase 3: UI/UX 개선 (1주)
- [ ] 반응형 디자인
- [ ] 애니메이션 효과
- [ ] 사용자 경험 최적화

### Phase 4: 배포 및 최적화 (1주)
- [ ] 성능 최적화
- [ ] 보안 강화
- [ ] 배포 환경 구성

이 구조를 바탕으로 단계별로 개발을 진행하면 효율적으로 프로젝트를 완성할 수 있습니다. 