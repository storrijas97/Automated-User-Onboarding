const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { listTasks, getTask, approveTask, rejectTask, getStats, setPriority } = require('../controllers/taskController');

router.get('/stats', authenticateToken, getStats);
router.get('/', authenticateToken, listTasks);
router.get('/:id', authenticateToken, getTask);
router.post('/:id/approve', authenticateToken, approveTask);
router.post('/:id/reject', authenticateToken, rejectTask);
router.put('/:id/priority', authenticateToken, setPriority);

module.exports = router;
