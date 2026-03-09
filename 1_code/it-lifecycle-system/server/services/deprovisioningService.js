const Employee = require('../models/Employee');
const ADAccount = require('../models/ADAccount');
const Task = require('../models/Task');
const TaskStep = require('../models/TaskStep');
const AuditLog = require('../models/AuditLog');
const ADConnector = require('../connectors/ADConnector');
const notificationService = require('./notificationService');
const SystemConfig = require('../models/SystemConfig');

/**
 * Retry an async operation up to `limit` times with a 2-second delay between attempts.
 */
async function withRetry(fn, limit = 3) {
  let lastErr;
  for (let attempt = 1; attempt <= limit; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastErr = err;
      if (attempt < limit) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }
  throw lastErr;
}

/**
 * Main offboarding orchestration for a terminated employee.
 * @param {Object} hrmEmployee - Raw OrangeHRM employee data
 */
async function deprovisionEmployee(hrmEmployee) {
  const empNumber = String(hrmEmployee.empNumber);

  const employee = await Employee.findByOrangeHrmId(empNumber);
  if (!employee) {
    console.warn(`[Deprovisioning] Employee ${empNumber} not found in local DB — skipping`);
    return;
  }

  const employeeId = employee.id;

  // Skip if already terminated
  if (employee.status === 'TERMINATED') {
    return;
  }

  // Get retry limit from config
  let retryLimit = 3;
  try {
    const cfg = await SystemConfig.get();
    if (cfg && cfg.retry_limit != null) retryLimit = cfg.retry_limit;
  } catch { /* use default */ }

  // Create task
  const taskId = await Task.create({ employee_id: employeeId, type: 'OFFBOARDING', status: 'IN_PROGRESS', priority: 'HIGH' });

  try {
    const adAccount = await ADAccount.findByEmployeeId(employeeId);

    if (!adAccount) {
      await TaskStep.create({ task_id: taskId, action_type: 'DISABLE_AD_ACCOUNT', status: 'SKIPPED', detail: 'No AD account found in DB' });
    } else {
      const { username } = adAccount;

      // 1. Remove from all groups (with retry)
      try {
        await withRetry(async (attempt) => {
          if (attempt > 1) {
            await TaskStep.create({ task_id: taskId, action_type: 'REMOVE_FROM_GROUPS', status: 'PENDING', detail: `Retry attempt ${attempt}` });
          }
          await ADConnector.removeFromGroups(username);
        }, retryLimit);
        await TaskStep.create({ task_id: taskId, action_type: 'REMOVE_FROM_GROUPS', status: 'SUCCESS', detail: `Removed ${username} from all groups` });
      } catch (err) {
        await TaskStep.create({ task_id: taskId, action_type: 'REMOVE_FROM_GROUPS', status: 'FAILED', detail: `All ${retryLimit} attempts failed: ${err.message}` });
      }

      // 2. Disable AD account (with retry)
      await withRetry(async (attempt) => {
        if (attempt > 1) {
          await TaskStep.create({ task_id: taskId, action_type: 'DISABLE_AD_ACCOUNT', status: 'PENDING', detail: `Retry attempt ${attempt}` });
        }
        await ADConnector.disableUser(username);
      }, retryLimit);
      await ADAccount.updateStatus(employeeId, 'DISABLED', new Date());
      await TaskStep.create({ task_id: taskId, action_type: 'DISABLE_AD_ACCOUNT', status: 'SUCCESS', detail: `Disabled ${username}` });
    }

    // 3. Mark employee terminated
    await Employee.update(employeeId, {
      status: 'TERMINATED',
      termination_date: hrmEmployee.terminationDate || new Date().toISOString().split('T')[0],
    });

    // 4. Complete task
    await Task.updateStatus(taskId, 'COMPLETED', new Date());

    // 5. Audit + notify
    await AuditLog.create({
      actor: 'system',
      action: 'EMPLOYEE_DEPROVISIONED',
      target: adAccount?.username || empNumber,
      detail: `Employee ${employee.first_name} ${employee.last_name} (${empNumber}) deprovisioned`,
    });
    await notificationService.notifyDeprovisioning(employeeId, `AD account disabled for ${employee.first_name} ${employee.last_name}`);

  } catch (err) {
    await Task.updateStatus(taskId, 'FAILED');
    await TaskStep.create({ task_id: taskId, action_type: 'DEPROVISION_ERROR', status: 'FAILED', detail: `All ${retryLimit} attempts failed: ${err.message}` });
    await AuditLog.create({ actor: 'system', action: 'DEPROVISIONING_ERROR', target: empNumber, detail: err.message });
    throw err;
  }
}

module.exports = { deprovisionEmployee };
