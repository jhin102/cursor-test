const database = require('../_lib/database');
const { logError } = require('../_lib/log');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET');
    return res.end('Method Not Allowed');
  }

  try {
    await database.connect();
    await database.init();

    const url = new URL(req.url, 'http://localhost');
    const username = decodeURIComponent(url.pathname.split('/').pop());

    const user = await database.get('SELECT * FROM users WHERE username = $1', [username]);
    if (!user) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: '사용자를 찾을 수 없습니다.' }));
    }

    const stats = await database.get(
      `SELECT 
          COUNT(*)::int as total_artworks,
          AVG(score)::float as avg_score,
          MAX(score)::int as best_score,
          SUM(price)::int as total_value
       FROM artworks 
       WHERE user_id = $1`,
      [user.id]
    );

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        daily_count: user.daily_count,
        total_score: user.total_score,
        created_at: user.created_at,
        stats: {
          total_artworks: stats.total_artworks || 0,
          avg_score: Math.round((stats.avg_score || 0) * 100) / 100,
          best_score: stats.best_score || 0,
          total_value: stats.total_value || 0
        }
      }
    }));
  } catch (error) {
    logError(req, error, 'users/[username]', { path: req.url });
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: '사용자 정보 조회 중 오류가 발생했습니다.' }));
  }
};

