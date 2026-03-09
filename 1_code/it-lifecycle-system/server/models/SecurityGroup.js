const db = require('../config/db');

const SecurityGroup = {
  async findAll() {
    const [rows] = await db.query('SELECT * FROM security_groups ORDER BY name');
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM security_groups WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create(data) {
    const { name, ad_dn } = data;
    const [result] = await db.query(
      'INSERT INTO security_groups (name, ad_dn) VALUES (?, ?)',
      [name, ad_dn]
    );
    return result.insertId;
  },

  async update(id, data) {
    const { name, ad_dn } = data;
    await db.query('UPDATE security_groups SET name = ?, ad_dn = ? WHERE id = ?', [name, ad_dn, id]);
  },

  async delete(id) {
    await db.query('DELETE FROM security_groups WHERE id = ?', [id]);
  },
};

module.exports = SecurityGroup;
