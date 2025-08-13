const database = require('../_lib/database');
const claudeService = require('../_lib/claudeService');
const { v4: uuidv4 } = require('uuid');
const { put } = require('@vercel/blob');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end('Method Not Allowed');
  }

  try {
    await database.connect();
    await database.init();

    // JSON Body 파싱
    const buffers = [];
    for await (const chunk of req) buffers.push(chunk);
    const body = JSON.parse(Buffer.concat(buffers).toString('utf8') || '{}');

    const { image, username = '게스트' } = body;
    if (!image) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: '이미지 데이터가 필요합니다.' }));
    }

    let user = await database.get('SELECT * FROM users WHERE username = $1', [username]);
    if (!user) {
      const created = await database.get(
        'INSERT INTO users (username) VALUES ($1) RETURNING id, username, daily_count, total_score, created_at',
        [username]
      );
      user = created || { id: null, username, daily_count: 3, total_score: 0 };
    }

    if (user.daily_count <= 0) {
      res.statusCode = 429;
      return res.end(JSON.stringify({ error: '오늘의 평가 기회를 모두 사용했습니다. 내일 다시 시도해주세요.' }));
    }

    const base64 = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');
    const filename = `${uuidv4()}.png`;
    const { url: imageUrl } = await put(`artworks/${filename}`, buffer, { access: 'public', contentType: 'image/png' });

    const evaluation = await claudeService.evaluateArtwork(image);

    const artworkInserted = await database.get(
      `INSERT INTO artworks (user_id, image_url, score, price, ai_comment, category, title) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [user.id, imageUrl, evaluation.total_score, evaluation.estimated_price, evaluation.comment, evaluation.category, evaluation.title || '무제']
    );

    await database.run(
      'UPDATE users SET daily_count = daily_count - 1, total_score = total_score + $1 WHERE id = $2',
      [evaluation.total_score, user.id]
    );

    const updatedUser = await database.get('SELECT * FROM users WHERE id = $1', [user.id]);

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      artwork: {
        id: artworkInserted && artworkInserted.id,
        image_url: imageUrl,
        score: evaluation.total_score,
        price: evaluation.estimated_price,
        comment: evaluation.comment,
        category: evaluation.category,
        title: evaluation.title || '무제',
        created_at: new Date().toISOString()
      },
      user: {
        username: updatedUser.username,
        daily_count: updatedUser.daily_count,
        total_score: updatedUser.total_score
      },
      evaluation: {
        title: evaluation.title || '무제',
        creativity: evaluation.creativity,
        technical_skill: evaluation.technical_skill,
        artistic_value: evaluation.artistic_value,
        originality: evaluation.originality,
        total_score: evaluation.total_score,
        estimated_price: evaluation.estimated_price
      }
    }));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: '작품 평가 중 오류가 발생했습니다.', message: error.message }));
  }
};

