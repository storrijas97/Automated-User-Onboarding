const SystemConfig = require('../models/SystemConfig');
const AuditLog = require('../models/AuditLog');

async function getConfig(req, res, next) {
  try {
    const config = await SystemConfig.get();
    if (!config) return res.status(404).json({ error: 'Configuration not found' });
    res.json(config);
  } catch (err) {
    next(err);
  }
}

async function updateConfig(req, res, next) {
  try {
    const { polling_interval_min, retry_limit, notifications_enabled } = req.body;

    if (polling_interval_min !== undefined && (polling_interval_min < 1 || polling_interval_min > 1440)) {
      return res.status(400).json({ error: 'polling_interval_min must be between 1 and 1440' });
    }
    if (retry_limit !== undefined && (retry_limit < 0 || retry_limit > 10)) {
      return res.status(400).json({ error: 'retry_limit must be between 0 and 10' });
    }

    const current = await SystemConfig.get();
    const merged = {
      polling_interval_min: polling_interval_min ?? current.polling_interval_min,
      retry_limit: retry_limit ?? current.retry_limit,
      notifications_enabled: notifications_enabled !== undefined ? notifications_enabled : current.notifications_enabled,
    };

    await SystemConfig.update(merged);
    await AuditLog.create({
      actor: req.user?.username || 'admin',
      action: 'CONFIG_UPDATED',
      target: 'system_config',
      detail: `Updated: ${JSON.stringify(merged)}`,
    });
    res.json({ message: 'Configuration updated', config: merged });
  } catch (err) {
    next(err);
  }
}

module.exports = { getConfig, updateConfig };
