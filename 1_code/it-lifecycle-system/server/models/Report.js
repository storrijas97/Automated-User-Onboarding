const db = require('../config/db');

const Report = {
  async findAll() {
    const [rows] = await db.query('SELECT * FROM reports ORDER BY created_at DESC');
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM reports WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create(data) {
    const { type, generated_by, file_path } = data;
    const [result] = await db.query(
      'INSERT INTO reports (type, generated_by, file_path) VALUES (?, ?, ?)',
      [type, generated_by, file_path]
    );
    return result.insertId;
  },
};

module.exports = Report;
