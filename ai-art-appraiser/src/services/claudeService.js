const { Anthropic } = require('@anthropic-ai/sdk');

class ClaudeService {
    constructor() {
        if (!process.env.CLAUDE_API_KEY) {
            console.error('❌ CLAUDE_API_KEY가 설정되지 않았습니다!');
            throw new Error('CLAUDE_API_KEY 환경 변수가 필요합니다.');
        }
        this.anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
    }

    async evaluateArtwork(imageBase64) {
        try {
            let cleanBase64 = imageBase64;
            if (cleanBase64.startsWith('data:image/')) cleanBase64 = cleanBase64.split(',')[1];
            if (!cleanBase64 || cleanBase64.length === 0) throw new Error('유효하지 않은 이미지 데이터입니다.');

            const response = await this.anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1000,
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'text', text: this.getEvaluationPrompt() },
                        { type: 'image', source: { type: 'base64', media_type: 'image/png', data: cleanBase64 } }
                    ]
                }]
            });

            const evaluation = this.parseEvaluationResponse(response.content[0].text);
            return evaluation;
        } catch (error) {
            throw new Error('AI 평가 중 오류가 발생했습니다: ' + error.message);
        }
    }

    getEvaluationPrompt() {
        return `당신은 전문 미술 평가사이자 카피라이터입니다.
첨부된 그림을 다음 기준으로 평가해주세요:

1. 창의성 (0-10점)
2. 기술적 완성도 (0-10점)
3. 예술성 (0-10점)
4. 독창성 (0-10점)

총점은 40점 만점이며, 가격, 코멘트, 카테고리, 제목을 JSON으로 주세요.`;
    }

    parseEvaluationResponse(responseText) {
        try {
            let jsonText = responseText;
            const jsonBlockMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonBlockMatch) jsonText = jsonBlockMatch[1].trim();
            else {
                const jsonObjectMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonObjectMatch) jsonText = jsonObjectMatch[0];
            }
            const evaluation = JSON.parse(jsonText);
            const required = ['creativity','technical_skill','artistic_value','originality','total_score','estimated_price','comment'];
            for (const f of required) if (!(f in evaluation)) throw new Error(`필수 필드 누락: ${f}`);
            if (!evaluation.title || String(evaluation.title).trim().length === 0) evaluation.title = '무제';
            if (evaluation.total_score < 0 || evaluation.total_score > 40) throw new Error('총점이 유효하지 않습니다 (0-40)');
            return evaluation;
        } catch {
            return {
                title: '무제',
                creativity: 5,
                technical_skill: 5,
                artistic_value: 5,
                originality: 5,
                total_score: 20,
                estimated_price: 1000,
                comment: '평가 중 오류가 발생했습니다. 기본 점수가 부여됩니다.',
                category: '기타'
            };
        }
    }
}

module.exports = new ClaudeService();

