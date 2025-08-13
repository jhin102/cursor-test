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
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    const weeklyRankings = await database.query(
      `SELECT 
          u.id as user_id,
          u.username,
          COUNT(a.id)::int as artworks_this_week,
          MAX(a.score)::int as best_score,
          COALESCE(SUM(a.score), 0)::int as total_score,
          ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(a.score), 0) DESC) as rank
       FROM users u
       LEFT JOIN artworks a ON u.id = a.user_id
       WHERE a.created_at >= NOW() - INTERVAL '7 days'
       GROUP BY u.id, u.username
       ORDER BY total_score DESC, best_score DESC
       LIMIT $1`,
      [limit]
    );

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, rankings: weeklyRankings, period: 'weekly', total: weeklyRankings.length }));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: '주간 랭킹 조회 중 오류가 발생했습니다.' }));
  }
};

