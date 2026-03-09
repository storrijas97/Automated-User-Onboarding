const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { getConfig, updateConfig } = require('../controllers/configController');

router.get('/', authenticateToken, getConfig);
router.put('/', authenticateToken, updateConfig);

module.exports = router;
