const db = require('../config/db');

const RoleMapping = {
  async findAll() {
    const [rows] = await db.query(`
      SELECT rm.*, d.name AS department_name, sg.name AS group_name, sg.ad_dn
      FROM role_mappings rm
      JOIN departments d ON rm.department_id = d.id
      JOIN security_groups sg ON rm.security_group_id = sg.id
      ORDER BY d.name, rm.job_title
    `);
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM role_mappings WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByDepartmentAndTitle(departmentId, jobTitle) {
    const [rows] = await db.query(
      'SELECT rm.*, sg.ad_dn FROM role_mappings rm JOIN security_groups sg ON rm.security_group_id = sg.id WHERE rm.department_id = ? AND rm.job_title = ?',
      [departmentId, jobTitle]
    );
    return rows;
  },

  async create(data) {
    const { department_id, job_title, security_group_id } = data;
    const [result] = await db.query(
      'INSERT INTO role_mappings (department_id, job_title, security_group_id) VALUES (?, ?, ?)',
      [department_id, job_title, security_group_id]
    );
    return result.insertId;
  },

  async update(id, data) {
    const { department_id, job_title, security_group_id } = data;
    await db.query(
      'UPDATE role_mappings SET department_id = ?, job_title = ?, security_group_id = ? WHERE id = ?',
      [department_id, job_title, security_group_id, id]
    );
  },

  async delete(id) {
    await db.query('DELETE FROM role_mappings WHERE id = ?', [id]);
  },
};

module.exports = RoleMapping;
