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

    const totalStats = await database.get(
      `SELECT 
          COUNT(DISTINCT u.id) as total_users,
          COUNT(a.id) as total_artworks,
          AVG(a.score) as avg_score,
          MAX(a.score) as highest_score,
          SUM(a.price) as total_value
       FROM users u
       LEFT JOIN artworks a ON u.id = a.user_id`
    );

    const todayStats = await database.get(
      `SELECT COUNT(*)::int as today_artworks
       FROM artworks 
       WHERE DATE(created_at) = CURRENT_DATE`
    );

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      stats: {
        total_users: totalStats.total_users || 0,
        total_artworks: totalStats.total_artworks || 0,
        avg_score: Math.round((totalStats.avg_score || 0) * 100) / 100,
        highest_score: totalStats.highest_score || 0,
        total_value: totalStats.total_value || 0,
        today_artworks: todayStats.today_artworks || 0
      }
    }));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: '통계 조회 중 오류가 발생했습니다.' }));
  }
};

