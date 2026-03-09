const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');
const db = require('../config/db');

// GET /api/notifications — list recent notifications (newest first, limit 50)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const [rows] = await db.query(
      `SELECT n.*, e.first_name, e.last_name
       FROM notifications n
       LEFT JOIN employees e ON n.employee_id = e.id
       ORDER BY n.id DESC LIMIT ?`,
      [limit]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/notifications/unread-count — count PENDING notifications
router.get('/unread-count', authenticateToken, async (req, res, next) => {
  try {
    const [[row]] = await db.query("SELECT COUNT(*) AS count FROM notifications WHERE status = 'PENDING'");
    res.json({ count: row.count });
  } catch (err) {
    next(err);
  }
});

// POST /api/notifications/:id/read — mark a notification as sent/read
router.post('/:id/read', authenticateToken, async (req, res, next) => {
  try {
    await Notification.markSent(req.params.id);
    res.json({ message: 'Marked as read' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
