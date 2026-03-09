const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { login, refresh, me } = require('../controllers/authController');

router.post('/login', login);
router.post('/refresh', authenticateToken, refresh);
router.get('/me', authenticateToken, me);

module.exports = router;
