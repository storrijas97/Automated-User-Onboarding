const Task = require('../models/Task');
const TaskStep = require('../models/TaskStep');
const AuditLog = require('../models/AuditLog');
const db = require('../config/db');

async function listTasks(req, res, next) {
  try {
    const tasks = await Task.findAll(req.query);
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

async function getTask(req, res, next) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const steps = await TaskStep.findByTaskId(task.id);
    res.json({ ...task, steps });
  } catch (err) {
    next(err);
  }
}

async function approveTask(req, res, next) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    await Task.updateStatus(task.id, 'COMPLETED', new Date());
    await AuditLog.create({
      actor: req.user?.username || 'admin',
      action: 'TASK_APPROVED',
      target: String(task.id),
      detail: `Task #${task.id} approved`,
    });
    res.json({ message: 'Task approved' });
  } catch (err) {
    next(err);
  }
}

async function rejectTask(req, res, next) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    await Task.updateStatus(task.id, 'CANCELLED');
    await AuditLog.create({
      actor: req.user?.username || 'admin',
      action: 'TASK_REJECTED',
      target: String(task.id),
      detail: req.body.reason || `Task #${task.id} rejected`,
    });
    res.json({ message: 'Task rejected' });
  } catch (err) {
    next(err);
  }
}

async function getStats(req, res, next) {
  try {
    const [[row]] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM employees) AS total_employees,
        (SELECT COUNT(*) FROM tasks WHERE status = 'PENDING') AS pending_tasks,
        (SELECT COUNT(*) FROM tasks WHERE status = 'COMPLETED' AND DATE(completed_at) = CURDATE()) AS completed_today,
        (SELECT COUNT(*) FROM tasks WHERE status = 'FAILED') AS failed_tasks
    `);
    res.json(row);
  } catch (err) {
    next(err);
  }
}

async function setPriority(req, res, next) {
  try {
    const { priority } = req.body;
    const allowed = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    if (!priority || !allowed.includes(priority)) {
      return res.status(400).json({ error: `priority must be one of: ${allowed.join(', ')}` });
    }
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    await db.query('UPDATE tasks SET priority = ? WHERE id = ?', [priority, task.id]);
    await AuditLog.create({
      actor: req.user?.username || 'admin',
      action: 'TASK_PRIORITY_CHANGED',
      target: String(task.id),
      detail: `Task #${task.id} priority set to ${priority}`,
    });
    res.json({ message: 'Priority updated', priority });
  } catch (err) {
    next(err);
  }
}

module.exports = { listTasks, getTask, approveTask, rejectTask, getStats, setPriority };
