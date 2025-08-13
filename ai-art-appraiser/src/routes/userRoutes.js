const express = require('express');
const router = express.Router();

const database = require('../utils/database');

// 사용자 정보 조회
router.get('/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const user = await database.get('SELECT * FROM users WHERE username = $1', [username]);
        if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });

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

        res.json({
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
        });
    } catch (error) {
        console.error('사용자 정보 조회 오류:', error);
        res.status(500).json({ error: '사용자 정보 조회 중 오류가 발생했습니다.' });
    }
});

// 사용자 생성
router.post('/', async (req, res) => {
    try {
        const { username } = req.body;
        if (!username || username.trim() === '') {
            return res.status(400).json({ error: '사용자명이 필요합니다.' });
        }

        const existingUser = await database.get('SELECT * FROM users WHERE username = $1', [username]);
        if (existingUser) return res.status(409).json({ error: '이미 존재하는 사용자명입니다.' });

        const newUser = await database.get(
            'INSERT INTO users (username) VALUES ($1) RETURNING id, username, daily_count, total_score, created_at',
            [username.trim()]
        );

        res.status(201).json({
            success: true,
            user: {
                id: newUser.id,
                username: newUser.username,
                daily_count: newUser.daily_count,
                total_score: newUser.total_score,
                created_at: newUser.created_at
            }
        });
    } catch (error) {
        console.error('사용자 생성 오류:', error);
        res.status(500).json({ error: '사용자 생성 중 오류가 발생했습니다.' });
    }
});

// 일일 카운트 리셋 (관리자용)
router.post('/reset-daily-count', async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) return res.status(400).json({ error: '사용자명이 필요합니다.' });

        const result = await database.run(
            'UPDATE users SET daily_count = 3 WHERE username = $1',
            [username]
        );

        if (result.changes === 0) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });

        res.json({ success: true, message: `${username}의 일일 평가 기회가 리셋되었습니다.` });
    } catch (error) {
        console.error('일일 카운트 리셋 오류:', error);
        res.status(500).json({ error: '일일 카운트 리셋 중 오류가 발생했습니다.' });
    }
});

module.exports = router;

