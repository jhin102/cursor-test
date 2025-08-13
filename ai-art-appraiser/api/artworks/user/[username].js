const database = require('../../_lib/database');

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

    const artworks = await database.query(
      `SELECT a.*, u.username 
       FROM artworks a 
       JOIN users u ON a.user_id = u.id 
       WHERE u.username = $1 
       ORDER BY a.created_at DESC`,
      [username]
    );

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, artworks, total: artworks.length }));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: '사용자 작품 조회 중 오류가 발생했습니다.' }));
  }
};

