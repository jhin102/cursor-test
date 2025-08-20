# Google OAuth 설정 가이드

## 1. Google Cloud Console 설정

### 1.1 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택

### 1.2 OAuth 동의 화면 설정
1. "API 및 서비스" > "OAuth 동의 화면" 메뉴로 이동
2. 사용자 유형 선택 (외부 또는 내부)
3. 앱 정보 입력:
   - 앱 이름: "AI Art Appraiser"
   - 사용자 지원 이메일: 본인 이메일
   - 개발자 연락처 정보: 본인 이메일

### 1.3 OAuth 2.0 클라이언트 ID 생성
1. "API 및 서비스" > "사용자 인증 정보" 메뉴로 이동
2. "사용자 인증 정보 만들기" > "OAuth 2.0 클라이언트 ID" 선택
3. 애플리케이션 유형: "웹 애플리케이션" 선택
4. 승인된 JavaScript 원본:
   - `http://localhost:3000` (개발용)
   - `https://your-domain.vercel.app` (배포용)
5. 승인된 리디렉션 URI:
   - `http://localhost:3000` (개발용)
   - `https://your-domain.vercel.app` (배포용)

### 1.4 클라이언트 ID 복사
생성된 클라이언트 ID를 복사하여 저장

## 2. Vercel 환경 변수 설정

### 2.1 Vercel CLI 사용 (권장)
```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 디렉토리에서 로그인
vercel login

# 환경 변수 설정
vercel env add GOOGLE_CLIENT_ID
vercel env add JWT_SECRET

# 프로덕션 환경에도 설정
vercel env add GOOGLE_CLIENT_ID production
vercel env add JWT_SECRET production
```

### 2.2 Vercel 대시보드 사용
1. [Vercel 대시보드](https://vercel.com/dashboard)에 접속
2. 프로젝트 선택
3. "Settings" > "Environment Variables" 메뉴로 이동
4. 다음 환경 변수 추가:

#### GOOGLE_CLIENT_ID
- **Name**: `GOOGLE_CLIENT_ID`
- **Value**: Google Cloud Console에서 받은 클라이언트 ID
- **Environment**: Production, Preview, Development 모두 선택

#### JWT_SECRET
- **Name**: `JWT_SECRET`
- **Value**: 랜덤한 32자 이상의 문자열 (예: `your-super-secret-jwt-key-here`)
- **Environment**: Production, Preview, Development 모두 선택

## 3. 프론트엔드 설정

### 3.1 클라이언트 ID 업데이트
`public/scripts/app.js` 파일에서 클라이언트 ID를 실제 값으로 변경:

```javascript
this.googleClientId = 'your-actual-google-client-id.apps.googleusercontent.com';
```

## 4. 배포

### 4.1 Vercel에 배포
```bash
vercel --prod
```

### 4.2 도메인 확인
배포 후 실제 도메인을 Google Cloud Console의 승인된 JavaScript 원본에 추가

## 5. 테스트

1. 앱에 접속
2. Google 로그인 버튼 클릭
3. Google 계정으로 로그인
4. 성공적으로 로그인되면 사용자 정보가 표시됨

## 6. 문제 해결

### 6.1 "Invalid Client" 오류
- 클라이언트 ID가 올바른지 확인
- 승인된 JavaScript 원본에 도메인이 포함되어 있는지 확인

### 6.2 "Redirect URI Mismatch" 오류
- 승인된 리디렉션 URI에 도메인이 포함되어 있는지 확인

### 6.3 환경 변수 오류
- Vercel 환경 변수가 올바르게 설정되어 있는지 확인
- 배포 후 환경 변수가 적용되었는지 확인

## 7. 보안 주의사항

- JWT_SECRET은 안전하게 보관하고 공개하지 마세요
- Google 클라이언트 ID는 프론트엔드에 노출되어도 안전합니다
- 프로덕션 환경에서는 HTTPS를 사용해야 합니다
