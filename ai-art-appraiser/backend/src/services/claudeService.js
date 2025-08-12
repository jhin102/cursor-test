const { Anthropic } = require('@anthropic-ai/sdk');

class ClaudeService {
    constructor() {
        // 환경 변수 디버깅
        console.log('🔍 환경 변수 디버깅:');
        console.log('CLAUDE_API_KEY 존재 여부:', !!process.env.CLAUDE_API_KEY);
        console.log('CLAUDE_API_KEY 길이:', process.env.CLAUDE_API_KEY ? process.env.CLAUDE_API_KEY.length : 0);
        console.log('CLAUDE_API_KEY 앞 10자리:', process.env.CLAUDE_API_KEY ? process.env.CLAUDE_API_KEY.substring(0, 10) + '...' : 'undefined');
        console.log('NODE_ENV:', process.env.NODE_ENV);
        console.log('PORT:', process.env.PORT);
        
        if (!process.env.CLAUDE_API_KEY) {
            console.error('❌ CLAUDE_API_KEY가 설정되지 않았습니다!');
            throw new Error('CLAUDE_API_KEY 환경 변수가 필요합니다.');
        }
        
        this.anthropic = new Anthropic({
            apiKey: process.env.CLAUDE_API_KEY,
        });
    }
    
    async evaluateArtwork(imageBase64) {
        try {
            console.log('🎨 Claude API로 작품 평가 시작...');
            
            // base64 데이터 정리
            let cleanBase64 = imageBase64;
            
            // data:image/png;base64, 접두사 제거
            if (cleanBase64.startsWith('data:image/')) {
                cleanBase64 = cleanBase64.split(',')[1];
            }
            
            // base64 유효성 검사
            if (!cleanBase64 || cleanBase64.length === 0) {
                throw new Error('유효하지 않은 이미지 데이터입니다.');
            }
            
            console.log('📊 base64 데이터 길이:', cleanBase64.length);
            console.log('📊 base64 데이터 앞 20자리:', cleanBase64.substring(0, 20));
            
            const response = await this.anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
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
                                data: cleanBase64
                            }
                        }
                    ]
                }]
            });
            
            const evaluation = this.parseEvaluationResponse(response.content[0].text);
            console.log('✅ 작품 평가 완료:', evaluation.total_score, '점');
            
            return evaluation;
        } catch (error) {
            console.error('❌ Claude API 오류:', error);
            throw new Error('AI 평가 중 오류가 발생했습니다: ' + error.message);
        }
    }
    
    getEvaluationPrompt() {
        return `당신은 전문 미술 평가사이자 카피라이터입니다.
첨부된 그림을 다음 기준으로 평가해주세요:

1. 창의성 (0-10점): 독특한 아이디어와 표현
2. 기술적 완성도 (0-10점): 선의 정확성, 색채 사용
3. 예술성 (0-10점): 감정 전달력, 미적 완성도
4. 독창성 (0-10점): 다른 작품과의 차별성

총점은 40점 만점이며, AI가 작품의 가치를 종합적으로 판단하여 적절한 가격을 자유롭게 책정해주세요.
단 가격을 결정할때, 기술적 완성도 보다 창의성과 예술성, 독창성에 더 높은 가중치를 두세요.
높은 점수의 그림에는 1000만원 이상의 높은 가격을 책정하고 낮은 가치의 그림에는 천원 이하의 낮은 가격을 책정하세요.
점수에 정비례하여 가격을 책정 하지는 마세요.
모든 그림은 디지털 환경에서 그려졌으므로 환경에 대한 코멘트는 작성하지 마세요.
또한 이 그림에 어울리는 짧고 재치있는 한국어 제목을 10자 내외로 지어주세요. (작가명은 포함하지 말 것)
간단한 평가 코멘트와 작품 카테고리도 함께 작성해주세요.

JSON 형태로 응답해주세요:
{
    "title": "별빛 달리기",
    "creativity": 8,
    "technical_skill": 7,
    "artistic_value": 9,
    "originality": 6,
    "total_score": 30,
    "estimated_price": 1500,
    "comment": "색채 사용이 독창적이며 구성이 균형잡혀 있습니다.",
    "category": "추상화"
}`;
    }
    
    parseEvaluationResponse(responseText) {
        try {
            console.log('📝 원본 응답:', responseText);

            // JSON 블록 추출 (```json ... ``` 또는 { ... } 형태)
            let jsonText = responseText;
            
            // ```json ... ``` 형태인 경우 추출
            const jsonBlockMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonBlockMatch) {
                jsonText = jsonBlockMatch[1].trim();
                console.log('📋 추출된 JSON 블록:', jsonText);
            } else {
                // { ... } 형태의 JSON 객체 찾기
                const jsonObjectMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonObjectMatch) {
                    jsonText = jsonObjectMatch[0];
                    console.log('📋 추출된 JSON 객체:', jsonText);
                }
            }

            // JSON 파싱 시도
            const evaluation = JSON.parse(jsonText);
            
            // 필수 필드 검증
            const requiredFields = ['creativity', 'technical_skill', 'artistic_value', 'originality', 'total_score', 'estimated_price', 'comment'];
            for (const field of requiredFields) {
                if (!(field in evaluation)) {
                    throw new Error(`필수 필드 누락: ${field}`);
                }
            }
            // 제목 폴백 처리
            if (!evaluation.title || String(evaluation.title).trim().length === 0) {
                evaluation.title = '무제';
            }
            
            // 점수 범위 검증
            if (evaluation.total_score < 0 || evaluation.total_score > 40) {
                throw new Error('총점이 유효하지 않습니다 (0-40)');
            }
            
            console.log('✅ JSON 파싱 성공:', evaluation);
            return evaluation;
        } catch (error) {
            console.error('❌ 평가 결과 파싱 실패:', error);
            console.error('📝 파싱 시도한 텍스트:', jsonText || responseText);
            
            // 기본 평가 결과 반환
            return {
                title: "무제",
                creativity: 5,
                technical_skill: 5,
                artistic_value: 5,
                originality: 5,
                total_score: 20,
                estimated_price: 1000,
                comment: "평가 중 오류가 발생했습니다. 기본 점수가 부여됩니다.",
                category: "기타"
            };
        }
    }
}

module.exports = new ClaudeService(); 