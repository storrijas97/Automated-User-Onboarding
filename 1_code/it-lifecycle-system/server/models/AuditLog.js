const db = require('../config/db');

const AuditLog = {
  async findAll(filters = {}) {
    let query = 'SELECT * FROM audit_logs';
    const params = [];
    const conditions = [];

    if (filters.actor) {
      conditions.push('actor LIKE ?');
      params.push(`%${filters.actor}%`);
    }
    if (filters.action) {
      conditions.push('action LIKE ?');
      params.push(`%${filters.action}%`);
    }
    if (filters.from) {
      conditions.push('created_at >= ?');
      params.push(filters.from);
    }
    if (filters.to) {
      conditions.push('created_at <= ?');
      params.push(filters.to);
    }

    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit, 10));
    }

    const [rows] = await db.query(query, params);
    return rows;
  },

  async create(data) {
    const { actor, action, target, detail } = data;
    const [result] = await db.query(
      'INSERT INTO audit_logs (actor, action, target, detail) VALUES (?, ?, ?, ?)',
      [actor, action, target, detail]
    );
    return result.insertId;
  },
};

module.exports = AuditLog;
