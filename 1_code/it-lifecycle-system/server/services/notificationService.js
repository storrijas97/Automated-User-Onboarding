const Notification = require('../models/Notification');
const SystemConfig = require('../models/SystemConfig');

async function isNotificationsEnabled() {
  const config = await SystemConfig.get();
  return !config || config.notifications_enabled !== 0;
}

/**
 * Create an in-app notification for provisioning events.
 */
async function notifyProvisioning(employeeId, message) {
  if (!await isNotificationsEnabled()) return;
  await Notification.create({ employee_id: employeeId, channel: 'IN_APP', message });
}

/**
 * Create an in-app notification for deprovisioning events.
 */
async function notifyDeprovisioning(employeeId, message) {
  if (!await isNotificationsEnabled()) return;
  await Notification.create({ employee_id: employeeId, channel: 'IN_APP', message });
}

/**
 * Create a generic notification.
 */
async function notify(employeeId, channel, message) {
  if (!await isNotificationsEnabled()) return null;
  const id = await Notification.create({ employee_id: employeeId, channel, message });
  // TODO: Implement actual email/SMS delivery here
  // For now, mark as sent immediately for in-app; leave pending for email/SMS
  if (channel === 'IN_APP') {
    await Notification.markSent(id);
  }
  return id;
}

module.exports = { notifyProvisioning, notifyDeprovisioning, notify };
