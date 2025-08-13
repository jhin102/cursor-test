# 🎨 AI Art Appraiser

AI가 당신의 그림을 평가하는 웹 애플리케이션입니다.

## 📋 프로젝트 개요

- **게임명**: AI Art Appraiser
- **장르**: 창작 + 경쟁 게임
- **플랫폼**: 웹 브라우저
- **핵심 기능**: 그림 그리기 → AI 평가 → 가격 책정 → 랭킹 경쟁

## 🚀 빠른 시작

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd ai-art-appraiser
```

### 2. 의존성 설치 (루트)
```bash
npm install
```

### 3. 환경 변수 설정(.env)
```bash
# Neon Postgres 연결 문자열
DATABASE_URL=postgres://user:pass@ep-xxxx-xxxxx.neon.tech/dbname?sslmode=require

# Anthropic Claude API Key
CLAUDE_API_KEY=sk-ant-...

# (로컬에서 Blob 쓰기 테스트 시)
BLOB_READ_WRITE_TOKEN=...
```

### 4. 로컬 서버 실행
```bash
npm run dev
```

### 5. 정적 파일
`public/` 디렉터리에서 제공됩니다. Vercel 배포 시 자동 서빙됩니다.

## 🛠️ 기술 스택

### Frontend
- HTML5 Canvas (그리기 기능)
- Vanilla JavaScript
- CSS3 (반응형 디자인)

### Backend
- Node.js + Express(Serverless on Vercel)
- Neon Postgres (데이터베이스)
- Vercel Blob (이미지 저장)
- Anthropic Claude API (AI 평가)

## 📁 프로젝트 구조

```
ai-art-appraiser/
├── api/                 # Serverless 함수 엔트리
│   └── index.js
├── backend/
│   └── src/
│       ├── app.js       # Express 앱(리스너 없음)
│       ├── local-server.js
│       ├── routes/
│       ├── services/
│       └── utils/
├── public/              # 정적 파일 (index.html, scripts, styles, assets)
├── vercel.json
├── package.json
└── docs/
```

## 🎮 게임 플로우

1. **그리기**: 웹 캔버스에서 그림 그리기
2. **평가**: Claude AI가 작품을 분석하고 점수 부여
3. **결과**: 창의성, 기술적 완성도, 예술성, 독창성 점수 확인
4. **갤러리**: 평가된 작품들을 갤러리에서 확인
5. **랭킹**: 다른 사용자들과 점수 경쟁

## 🔧 API 엔드포인트

### 작품 관련
- `POST /api/artworks/evaluate` - 작품 평가
- `GET /api/artworks/gallery` - 갤러리 조회
- `GET /api/artworks/user/:username` - 사용자 작품 조회

### 사용자 관련
- `GET /api/users/:username` - 사용자 정보 조회
- `POST /api/users` - 사용자 생성

### 랭킹 관련
- `GET /api/rankings` - 전체 랭킹
- `GET /api/rankings/weekly` - 주간 랭킹
- `GET /api/rankings/stats` - 통계 정보

## 🎯 평가 기준

- **창의성 (0-30점)**: 독특한 아이디어와 표현
- **기술적 완성도 (0-30점)**: 선의 정확성, 색채 사용
- **예술성 (0-25점)**: 감정 전달력, 미적 완성도
- **독창성 (0-15점)**: 다른 작품과의 차별성

## 🔒 제한사항

- 일일 3회 평가 제한
- 평가된 작품은 자동으로 갤러리에 저장
- 사용자명은 선택사항 (게스트로도 이용 가능)

## 🚀 개발 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 서버 실행
npm start

# 데이터베이스 초기화
npm run init-db

# 테스트 실행
npm test
```

## 📝 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `PORT` | 서버 포트 | 3000 |
| `CLAUDE_API_KEY` | Anthropic Claude API 키 | 필수 |
| `NODE_ENV` | 환경 설정 | development |

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해주세요.

---

**AI Art Appraiser** - AI가 당신의 예술성을 평가합니다! 🎨✨ 