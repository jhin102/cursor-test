const { Anthropic } = require('@anthropic-ai/sdk');

class ClaudeService {
  constructor() {
    if (!process.env.CLAUDE_API_KEY) {
      throw new Error('CLAUDE_API_KEY 환경 변수가 필요합니다.');
    }
    this.anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
  }

  async evaluateArtwork(imageBase64) {
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
    return this.parseEvaluationResponse(response.content[0].text);
  }

  getEvaluationPrompt() {
    return `당신은 전문 미술 평가사이자 카피라이터입니다.
첨부된 그림을 다음 기준으로 평가해주세요:

1. 창의성 (0-10점): 독특한 아이디어와 표현
2. 기술적 완성도 (0-10점): 선의 정확성, 색채 사용, 선의 개수
3. 예술성 (0-10점): 감정 전달력, 미적 완성도
4. 독창성 (0-10점): 다른 작품과의 차별성

총점은 40점 만점이며, AI가 작품의 가치를 종합적으로 판단하여 적절한 가격을 자유롭게 책정해주세요.
가격을 결정할때, 기술적 완성도 보다 창의성과 예술성, 독창성에 더 높은 가중치를 두세요.
모든 그림은 제한된 디지털 환경에서 그려졌으므로, 표현력이 떨어질 수 있습니다. 그러나 그 부분을 감안하여 칭찬해주세요.
평가 코멘트에 디지털 환경에 대한 직접적인 언급은 제외해주세요.
좋은 그림에는 1000만원 이상의 높은 가격을 책정하고 낮은 가치의 그림에는 천원 이하 백원 이상의 낮은 가격을 책정하세요.
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

  parseEvaluationResponse(text) {
    try {
      let jsonText = text;
      const block = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (block) jsonText = block[1].trim();
      else {
        const obj = text.match(/\{[\s\S]*\}/);
        if (obj) jsonText = obj[0];
      }
      const e = JSON.parse(jsonText);
      const req = ['creativity','technical_skill','artistic_value','originality','total_score','estimated_price','comment'];
      for (const f of req) if (!(f in e)) throw new Error('필수 필드 누락');
      if (!e.title || String(e.title).trim().length === 0) e.title = '무제';
      if (e.total_score < 0 || e.total_score > 40) throw new Error('총점 범위 오류');
      return e;
    } catch {
      return { title: '무제', creativity: 5, technical_skill: 5, artistic_value: 5, originality: 5, total_score: 20, estimated_price: 1000, comment: '기본값', category: '기타' };
    }
  }
}

module.exports = new ClaudeService();

