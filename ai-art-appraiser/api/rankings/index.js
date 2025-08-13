const database = require('../_lib/database');

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
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    const rankings = await database.query(
      `SELECT 
          u.id as user_id,
          u.username,
          COUNT(a.id)::int as total_artworks,
          MAX(a.score)::int as best_score,
          AVG(a.score)::float as avg_score,
          COALESCE(SUM(a.score), 0)::int as total_score,
          ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(a.score), 0) DESC) as rank
       FROM users u
       LEFT JOIN artworks a ON u.id = a.user_id
       GROUP BY u.id, u.username
       ORDER BY total_score DESC, best_score DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, rankings, total: rankings.length }));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: '랭킹 조회 중 오류가 발생했습니다.' }));
  }
};

