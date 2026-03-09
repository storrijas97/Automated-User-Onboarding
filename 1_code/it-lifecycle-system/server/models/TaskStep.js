const db = require('../config/db');

const TaskStep = {
  async findByTaskId(taskId) {
    const [rows] = await db.query(
      'SELECT * FROM task_steps WHERE task_id = ? ORDER BY created_at ASC',
      [taskId]
    );
    return rows;
  },

  async create(data) {
    const { task_id, action_type, status, detail } = data;
    const [result] = await db.query(
      'INSERT INTO task_steps (task_id, action_type, status, detail) VALUES (?, ?, ?, ?)',
      [task_id, action_type, status || 'PENDING', detail]
    );
    return result.insertId;
  },

  async updateStatus(id, status, detail = null) {
    await db.query(
      'UPDATE task_steps SET status = ?, detail = COALESCE(?, detail) WHERE id = ?',
      [status, detail, id]
    );
  },
};

module.exports = TaskStep;
