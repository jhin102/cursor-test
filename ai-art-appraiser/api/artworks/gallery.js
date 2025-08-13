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
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    const artworks = await database.query(
      `SELECT a.*, u.username 
       FROM artworks a 
       JOIN users u ON a.user_id = u.id 
       ORDER BY a.price DESC, a.created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, artworks, total: artworks.length }));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: '갤러리 조회 중 오류가 발생했습니다.' }));
  }
};

