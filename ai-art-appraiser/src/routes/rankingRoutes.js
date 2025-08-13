const express = require('express');
const router = express.Router();

const database = require('../utils/database');

// 전체 랭킹 조회
router.get('/', async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
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
            [parseInt(limit), parseInt(offset)]
        );
        res.json({ success: true, rankings, total: rankings.length });
    } catch (error) {
        console.error('랭킹 조회 오류:', error);
        res.status(500).json({ error: '랭킹 조회 중 오류가 발생했습니다.' });
    }
});

// 주간 랭킹 조회 (최근 7일)
router.get('/weekly', async (req, res) => {
    try {
        const { limit = 20 } = req.query;
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
            [parseInt(limit)]
        );
        res.json({ success: true, rankings: weeklyRankings, period: 'weekly', total: weeklyRankings.length });
    } catch (error) {
        console.error('주간 랭킹 조회 오류:', error);
        res.status(500).json({ error: '주간 랭킹 조회 중 오류가 발생했습니다.' });
    }
});

// 사용자 랭킹 조회
router.get('/user/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const user = await database.get('SELECT * FROM users WHERE username = $1', [username]);
        if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });

        const userRanking = await database.get(
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
             WHERE u.username = $1
             GROUP BY u.id, u.username`,
            [username]
        );

        const topRankings = await database.query(
            `SELECT 
                u.id as user_id,
                u.username,
                COALESCE(SUM(a.score), 0)::int as total_score,
                ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(a.score), 0) DESC) as rank
             FROM users u
             LEFT JOIN artworks a ON u.id = a.user_id
             GROUP BY u.id, u.username
             ORDER BY total_score DESC
             LIMIT 10`
        );

        res.json({ success: true, user: userRanking, topRankings, totalUsers: topRankings.length });
    } catch (error) {
        console.error('사용자 랭킹 조회 오류:', error);
        res.status(500).json({ error: '사용자 랭킹 조회 중 오류가 발생했습니다.' });
    }
});

// 통계 정보 조회
router.get('/stats', async (req, res) => {
    try {
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
        res.json({
            success: true,
            stats: {
                total_users: totalStats.total_users || 0,
                total_artworks: totalStats.total_artworks || 0,
                avg_score: Math.round((totalStats.avg_score || 0) * 100) / 100,
                highest_score: totalStats.highest_score || 0,
                total_value: totalStats.total_value || 0,
                today_artworks: todayStats.today_artworks || 0
            }
        });
    } catch (error) {
        console.error('통계 조회 오류:', error);
        res.status(500).json({ error: '통계 조회 중 오류가 발생했습니다.' });
    }
});

module.exports = router;

