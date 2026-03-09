const db = require('../config/db');

const Task = {
  async findAll(filters = {}) {
    let query = `
      SELECT t.*, e.first_name, e.last_name, e.email
      FROM tasks t
      JOIN employees e ON t.employee_id = e.id
    `;
    const params = [];
    const conditions = [];

    if (filters.status) {
      conditions.push('t.status = ?');
      params.push(filters.status);
    }
    if (filters.type) {
      conditions.push('t.type = ?');
      params.push(filters.type);
    }
    if (filters.employee_id) {
      conditions.push('t.employee_id = ?');
      params.push(filters.employee_id);
    }

    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY t.created_at DESC';

    const [rows] = await db.query(query, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query(
      'SELECT t.*, e.first_name, e.last_name FROM tasks t JOIN employees e ON t.employee_id = e.id WHERE t.id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async create(data) {
    const { employee_id, type, status, priority } = data;
    const [result] = await db.query(
      'INSERT INTO tasks (employee_id, type, status, priority) VALUES (?, ?, ?, ?)',
      [employee_id, type, status || 'PENDING', priority || 'MEDIUM']
    );
    return result.insertId;
  },

  async updateStatus(id, status, completedAt = null) {
    await db.query(
      'UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?',
      [status, completedAt, id]
    );
  },

  async getRecentSummary(limit = 10) {
    const [rows] = await db.query(
      'SELECT t.*, e.first_name, e.last_name FROM tasks t JOIN employees e ON t.employee_id = e.id ORDER BY t.created_at DESC LIMIT ?',
      [limit]
    );
    return rows;
  },
};

module.exports = Task;
