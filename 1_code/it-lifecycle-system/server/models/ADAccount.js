const db = require('../config/db');

const ADAccount = {
  async findByEmployeeId(employeeId) {
    const [rows] = await db.query('SELECT * FROM ad_accounts WHERE employee_id = ?', [employeeId]);
    return rows[0] || null;
  },

  async findByUsername(username) {
    const [rows] = await db.query('SELECT * FROM ad_accounts WHERE username = ?', [username]);
    return rows[0] || null;
  },

  async create(data) {
    const { employee_id, username, dn, status } = data;
    const [result] = await db.query(
      'INSERT INTO ad_accounts (employee_id, username, dn, status) VALUES (?, ?, ?, ?)',
      [employee_id, username, dn, status || 'ACTIVE']
    );
    return result.insertId;
  },

  async updateStatus(employeeId, status, disabledAt = null) {
    await db.query(
      'UPDATE ad_accounts SET status = ?, disabled_at = ? WHERE employee_id = ?',
      [status, disabledAt, employeeId]
    );
  },

  async findAll() {
    const [rows] = await db.query(
      'SELECT a.*, e.first_name, e.last_name FROM ad_accounts a JOIN employees e ON a.employee_id = e.id'
    );
    return rows;
  },
};

module.exports = ADAccount;
