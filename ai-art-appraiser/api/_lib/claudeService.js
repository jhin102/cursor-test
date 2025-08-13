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
    return `그림을 평가하고 점수/가격/코멘트/카테고리/제목을 JSON으로 응답해주세요.`;
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

