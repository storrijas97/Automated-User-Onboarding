const db = require('../config/db');

const SystemConfig = {
  async get() {
    const [rows] = await db.query('SELECT * FROM system_config WHERE id = 1');
    return rows[0] || null;
  },

  async update(data) {
    const { polling_interval_min, retry_limit, notifications_enabled } = data;
    await db.query(
      'UPDATE system_config SET polling_interval_min = ?, retry_limit = ?, notifications_enabled = ? WHERE id = 1',
      [polling_interval_min, retry_limit, notifications_enabled ? 1 : 0]
    );
  },

  async updateLastSync() {
    await db.query('UPDATE system_config SET last_sync_at = NOW() WHERE id = 1');
  },
};

module.exports = SystemConfig;
