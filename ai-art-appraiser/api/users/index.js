const database = require('../_lib/database');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end('Method Not Allowed');
  }

  try {
    await database.connect();
    await database.init();

    const buffers = [];
    for await (const chunk of req) buffers.push(chunk);
    const body = JSON.parse(Buffer.concat(buffers).toString('utf8') || '{}');
    const { username } = body;

    if (!username || username.trim() === '') {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: '사용자명이 필요합니다.' }));
    }

    const existingUser = await database.get('SELECT * FROM users WHERE username = $1', [username]);
    if (existingUser) {
      res.statusCode = 409;
      return res.end(JSON.stringify({ error: '이미 존재하는 사용자명입니다.' }));
    }

    const newUser = await database.get(
      'INSERT INTO users (username) VALUES ($1) RETURNING id, username, daily_count, total_score, created_at',
      [username.trim()]
    );

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 201;
    res.end(JSON.stringify({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        daily_count: newUser.daily_count,
        total_score: newUser.total_score,
        created_at: newUser.created_at
      }
    }));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: '사용자 생성 중 오류가 발생했습니다.' }));
  }
};

