const db = require('../config/db');

const Department = {
  async findAll() {
    const [rows] = await db.query('SELECT * FROM departments ORDER BY name');
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM departments WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByName(name) {
    const [rows] = await db.query('SELECT * FROM departments WHERE name = ?', [name]);
    return rows[0] || null;
  },

  async create(name) {
    const [result] = await db.query('INSERT INTO departments (name) VALUES (?)', [name]);
    return result.insertId;
  },

  async update(id, name) {
    await db.query('UPDATE departments SET name = ? WHERE id = ?', [name, id]);
  },

  async delete(id) {
    await db.query('DELETE FROM departments WHERE id = ?', [id]);
  },

  async upsertByOrangeHrmId(orangehrmSubunitId, name) {
    await db.query(
      `INSERT INTO departments (id, name) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [orangehrmSubunitId, name]
    );
  },

  // Upsert a department by name (used when syncing from the custom Department field).
  // Returns the department's id.
  async upsertByName(name) {
    await db.query(
      `INSERT INTO departments (name) VALUES (?)
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [name]
    );
    const [rows] = await db.query('SELECT id FROM departments WHERE name = ?', [name]);
    return rows[0]?.id || null;
  },
};

module.exports = Department;
