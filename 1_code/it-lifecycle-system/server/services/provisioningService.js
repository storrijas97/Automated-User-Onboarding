const Employee = require('../models/Employee');
const ADAccount = require('../models/ADAccount');
const RoleMapping = require('../models/RoleMapping');
const Task = require('../models/Task');
const TaskStep = require('../models/TaskStep');
const AuditLog = require('../models/AuditLog');
const ADConnector = require('../connectors/ADConnector');
const notificationService = require('./notificationService');
const SystemConfig = require('../models/SystemConfig');

/**
 * Generate a sAMAccountName from first/last name.
 * Format: firstlast (truncated to 20 chars, lowercased)
 */
function generateUsername(firstName, lastName) {
  const base = `${firstName.toLowerCase()}${lastName.toLowerCase()}`.replace(/[^a-z0-9]/g, '');
  return base.substring(0, 20);
}

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
 * Main onboarding orchestration for a newly detected employee.
 * @param {Object} hrmEmployee - Raw OrangeHRM employee data
 */
async function provisionEmployee(hrmEmployee) {
  const { empNumber, firstName, lastName, email, jobTitle, departmentId, departmentName } = normalizeHRMEmployee(hrmEmployee);
  const company = process.env.AD_COMPANY || departmentName || '';

  // Get retry limit from config
  let retryLimit = 3;
  try {
    const cfg = await SystemConfig.get();
    if (cfg && cfg.retry_limit != null) retryLimit = cfg.retry_limit;
  } catch { /* use default */ }

  // 1. Upsert employee record
  let employee = await Employee.findByOrangeHrmId(String(empNumber));
  let employeeId;
  if (!employee) {
    employeeId = await Employee.create({
      orangehrm_id: String(empNumber),
      first_name: firstName,
      last_name: lastName,
      email,
      job_title: jobTitle,
      department_id: departmentId,
      status: 'ACTIVE',
      hire_date: hrmEmployee.hireDate || null,
    });
  } else {
    employeeId = employee.id;
    await Employee.update(employeeId, { status: 'ACTIVE', first_name: firstName, last_name: lastName, email, job_title: jobTitle });
  }

  // 2. Create task
  const taskId = await Task.create({ employee_id: employeeId, type: 'ONBOARDING', status: 'IN_PROGRESS', priority: 'HIGH' });

  try {
    const username = generateUsername(firstName, lastName);

    // 3. Create AD account (with retry)
    await withRetry(async (attempt) => {
      if (attempt > 1) {
        await TaskStep.create({ task_id: taskId, action_type: 'CREATE_AD_ACCOUNT', status: 'PENDING', detail: `Retry attempt ${attempt}` });
      }
      const exists = await ADConnector.userExists(username);
      if (exists) {
        // Account already exists — ensure it's enabled and attributes are up to date
        await ADConnector.enableUser(username).catch(() => {});
        await ADConnector.updateUserAttributes(username, { jobTitle, departmentName, company, email }).catch(() => {});
        const existingAccount = await ADAccount.findByEmployeeId(employeeId);
        if (!existingAccount) {
          const userDn = `CN=${firstName} ${lastName},${process.env.AD_USERS_OU || 'OU=ITLifecycle,DC=stechlab,DC=net'}`;
          await ADAccount.create({ employee_id: employeeId, username, dn: userDn, status: 'ACTIVE' });
        } else {
          await ADAccount.updateStatus(employeeId, 'ACTIVE');
        }
        await TaskStep.create({ task_id: taskId, action_type: 'CREATE_AD_ACCOUNT', status: 'SUCCESS', detail: `Account ${username} already existed — enabled and attributes updated` });
        return;
      }
      const { dn } = await ADConnector.createUser({ firstName, lastName, username, email, jobTitle, departmentName, company });
      await ADAccount.create({ employee_id: employeeId, username, dn, status: 'ACTIVE' });
      await TaskStep.create({ task_id: taskId, action_type: 'CREATE_AD_ACCOUNT', status: 'SUCCESS', detail: `Created ${username} at ${dn}` });
    }, retryLimit);

    // 4. Assign security groups based on role mappings
    const mappings = await RoleMapping.findByDepartmentAndTitle(departmentId, jobTitle);
    for (const mapping of mappings) {
      try {
        await withRetry(() => ADConnector.addToGroup(username, mapping.ad_dn), retryLimit);
        await TaskStep.create({ task_id: taskId, action_type: 'ADD_TO_GROUP', status: 'SUCCESS', detail: `Added to ${mapping.ad_dn}` });
      } catch (err) {
        await TaskStep.create({ task_id: taskId, action_type: 'ADD_TO_GROUP', status: 'FAILED', detail: err.message });
      }
    }

    // 5. Complete task
    await Task.updateStatus(taskId, 'COMPLETED', new Date());

    // 6. Audit + notify
    await AuditLog.create({ actor: 'system', action: 'EMPLOYEE_PROVISIONED', target: username, detail: `Employee ${firstName} ${lastName} (${empNumber}) provisioned` });
    await notificationService.notifyProvisioning(employeeId, `AD account created for ${firstName} ${lastName}`);

  } catch (err) {
    await Task.updateStatus(taskId, 'FAILED');
    await TaskStep.create({ task_id: taskId, action_type: 'PROVISION_ERROR', status: 'FAILED', detail: `All ${retryLimit} attempts failed: ${err.message}` });
    await AuditLog.create({ actor: 'system', action: 'PROVISIONING_ERROR', target: String(empNumber), detail: err.message });
    throw err;
  }
}

function normalizeHRMEmployee(raw) {
  return {
    empNumber:      raw.empNumber,
    firstName:      raw.firstName      || raw.name?.first   || '',
    lastName:       raw.lastName       || raw.name?.last    || '',
    email:          raw.workEmail      || raw.email         || '',
    jobTitle:       raw.jobTitle?.title || raw.jobTitle     || '',
    departmentId:   raw.department?.id  || raw.departmentId || null,
    departmentName: raw.departmentName  || raw.department?.name || '',
  };
}

/**
 * Re-provision an employee — used to retry a FAILED task or fix an existing AD account.
 * Creates a new task and runs full provisioning (handles already-existing AD accounts too).
 */
async function reprovisionEmployee(hrmEmployee) {
  return provisionEmployee(hrmEmployee);
}

module.exports = { provisionEmployee, reprovisionEmployee };
