const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { listEmployees, searchEmployees, getEmployee } = require('../controllers/employeeController');
const { reprovisionEmployee } = require('../services/provisioningService');
const Employee = require('../models/Employee');
const OrangeHRMDbConnector = require('../connectors/OrangeHRMDbConnector');

router.get('/', authenticateToken, listEmployees);
router.get('/search', authenticateToken, searchEmployees);
router.get('/:id', authenticateToken, getEmployee);

// POST /api/employees/:id/reprovision — re-run onboarding for a FAILED or missing-AD employee
router.post('/:id/reprovision', authenticateToken, async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    // Fetch fresh data from OrangeHRM so we have up-to-date job title / department
    const allHrm = await OrangeHRMDbConnector.fetchAllEmployees();
    const hrmEmp = allHrm.find((e) => String(e.empNumber) === String(employee.orangehrm_id));
    if (!hrmEmp) return res.status(404).json({ error: 'Employee not found in OrangeHRM' });

    await reprovisionEmployee(hrmEmp);
    res.json({ message: `Re-provisioning started for ${employee.first_name} ${employee.last_name}` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
