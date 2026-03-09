const db = require('../config/db');

const Employee = {
  async findAll() {
    const [rows] = await db.query(
      'SELECT e.*, d.name AS department_name FROM employees e LEFT JOIN departments d ON e.department_id = d.id ORDER BY e.last_name, e.first_name'
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query(
      `SELECT e.*, d.name AS department_name,
              a.username AS ad_username, a.dn AS ad_dn,
              a.status AS ad_status, a.disabled_at AS ad_disabled_at
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN ad_accounts a ON a.employee_id = e.id
       WHERE e.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async findByOrangeHrmId(orangehrmId) {
    const [rows] = await db.query('SELECT * FROM employees WHERE orangehrm_id = ?', [orangehrmId]);
    return rows[0] || null;
  },

  async search(query) {
    const like = `%${query}%`;
    const [rows] = await db.query(
      'SELECT e.*, d.name AS department_name FROM employees e LEFT JOIN departments d ON e.department_id = d.id WHERE e.first_name LIKE ? OR e.last_name LIKE ? OR e.email LIKE ? OR e.job_title LIKE ?',
      [like, like, like, like]
    );
    return rows;
  },

  async create(data) {
    const { orangehrm_id, first_name, last_name, email, job_title, department_id, status, hire_date } = data;
    const [result] = await db.query(
      'INSERT INTO employees (orangehrm_id, first_name, last_name, email, job_title, department_id, status, hire_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [orangehrm_id, first_name, last_name, email, job_title, department_id, status || 'ACTIVE', hire_date]
    );
    return result.insertId;
  },

  async update(id, data) {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(data), id];
    await db.query(`UPDATE employees SET ${fields} WHERE id = ?`, values);
  },

  async findByStatus(status) {
    const [rows] = await db.query('SELECT * FROM employees WHERE status = ?', [status]);
    return rows;
  },
};

module.exports = Employee;
