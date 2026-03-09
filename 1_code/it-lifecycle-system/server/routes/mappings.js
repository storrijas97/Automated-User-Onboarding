const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  listMappings, createMapping, updateMapping, deleteMapping,
  listDepartments, listGroups, createGroup,
} = require('../controllers/mappingController');

router.get('/', authenticateToken, listMappings);
router.post('/', authenticateToken, createMapping);
router.put('/:id', authenticateToken, updateMapping);
router.delete('/:id', authenticateToken, deleteMapping);

router.get('/departments', authenticateToken, listDepartments);
router.get('/groups', authenticateToken, listGroups);
router.post('/groups', authenticateToken, createGroup);

module.exports = router;
