const db = require('../config/db');

const AccessRequest = {
  async findAll(filters = {}) {
    let query = `
      SELECT ar.*, e.first_name, e.last_name, sg.name AS group_name
      FROM access_requests ar
      JOIN employees e ON ar.employee_id = e.id
      JOIN security_groups sg ON ar.group_id = sg.id
    `;
    const params = [];

    if (filters.status) {
      query += ' WHERE ar.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY ar.created_at DESC';
    const [rows] = await db.query(query, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM access_requests WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create(data) {
    const { employee_id, requested_by, group_id } = data;
    const [result] = await db.query(
      'INSERT INTO access_requests (employee_id, requested_by, group_id) VALUES (?, ?, ?)',
      [employee_id, requested_by, group_id]
    );
    return result.insertId;
  },

  async updateStatus(id, status) {
    await db.query('UPDATE access_requests SET status = ? WHERE id = ?', [status, id]);
  },
};

module.exports = AccessRequest;
