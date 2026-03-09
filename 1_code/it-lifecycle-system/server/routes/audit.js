const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { listAuditLogs, exportAuditLogs } = require('../controllers/auditController');

router.get('/', authenticateToken, listAuditLogs);
router.get('/export', authenticateToken, exportAuditLogs);

module.exports = router;
