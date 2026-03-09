const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { listReports, generateReport, downloadReport } = require('../controllers/reportController');

router.get('/', authenticateToken, listReports);
router.post('/generate', authenticateToken, generateReport);
router.get('/:id/download', authenticateToken, downloadReport);

module.exports = router;
