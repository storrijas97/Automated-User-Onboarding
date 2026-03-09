const Employee = require('../models/Employee');

async function listEmployees(req, res, next) {
  try {
    const employees = await Employee.findAll();
    res.json(employees);
  } catch (err) {
    next(err);
  }
}

async function searchEmployees(req, res, next) {
  try {
    const { q } = req.query;
    if (!q) return res.json(await Employee.findAll());
    const results = await Employee.search(q);
    res.json(results);
  } catch (err) {
    next(err);
  }
}

async function getEmployee(req, res, next) {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    next(err);
  }
}

module.exports = { listEmployees, searchEmployees, getEmployee };
