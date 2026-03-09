const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  listAccessRequests, createAccessRequest, approveAccessRequest, rejectAccessRequest,
} = require('../controllers/accessRequestController');

router.get('/', authenticateToken, listAccessRequests);
router.post('/', authenticateToken, createAccessRequest);
router.post('/:id/approve', authenticateToken, approveAccessRequest);
router.post('/:id/reject', authenticateToken, rejectAccessRequest);

module.exports = router;
