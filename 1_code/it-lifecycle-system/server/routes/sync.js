const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { poll, getSyncStatus } = require('../scheduler/poller');
const OrangeHRMDbConnector = require('../connectors/OrangeHRMDbConnector');
const Department = require('../models/Department');

// GET /api/sync/status — current sync status + OrangeHRM employee list preview
router.get('/status', authenticateToken, async (req, res, next) => {
  try {
    const status = getSyncStatus();
    let hrmEmployees = [];
    let hrmConnected = false;
    let hrmError = null;
    try {
      hrmEmployees = await OrangeHRMDbConnector.fetchAllEmployees();
      hrmConnected = true;
      // Resolve departmentId from our DB for display
      const allDepts = await Department.findAll();
      const nameToId = Object.fromEntries(allDepts.map((d) => [d.name, d.id]));
      for (const emp of hrmEmployees) {
        if (emp.departmentName && nameToId[emp.departmentName]) {
          emp.departmentId = nameToId[emp.departmentName];
        }
      }
    } catch (err) {
      hrmError = err.message;
    }
    res.json({
      ...status,
      hrmConnected,
      hrmError,
      hrmEmployeeCount: hrmEmployees.length,
      hrmEmployees: hrmEmployees.map((e) => ({
        empNumber:      e.empNumber,
        firstName:      e.firstName,
        lastName:       e.lastName,
        email:          e.email,
        jobTitle:       e.jobTitle,
        departmentId:   e.departmentId,
        departmentName: e.departmentName,
        status:         e.status,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/sync/trigger — manually trigger a sync now
router.post('/trigger', authenticateToken, async (req, res, next) => {
  try {
    // Run async, respond immediately with accepted
    poll().catch((err) => console.error('[Sync API] Manual trigger error:', err.message));
    res.json({ message: 'Sync triggered. Check /api/sync/status for results.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
