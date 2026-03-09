const db = require('../config/db');

const Notification = {
  async create(data) {
    const { employee_id, channel, message } = data;
    const [result] = await db.query(
      'INSERT INTO notifications (employee_id, channel, message) VALUES (?, ?, ?)',
      [employee_id, channel || 'IN_APP', message]
    );
    return result.insertId;
  },

  async markSent(id) {
    await db.query(
      'UPDATE notifications SET status = ?, sent_at = NOW() WHERE id = ?',
      ['SENT', id]
    );
  },

  async markFailed(id) {
    await db.query('UPDATE notifications SET status = ? WHERE id = ?', ['FAILED', id]);
  },

  async findPending() {
    const [rows] = await db.query('SELECT * FROM notifications WHERE status = ? ORDER BY id ASC', ['PENDING']);
    return rows;
  },

  async findByEmployee(employeeId) {
    const [rows] = await db.query(
      'SELECT * FROM notifications WHERE employee_id = ? ORDER BY created_at DESC',
      [employeeId]
    );
    return rows;
  },
};

module.exports = Notification;
