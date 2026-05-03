const schedule = require('node-schedule');
const OrangeHRMDbConnector = require('../connectors/OrangeHRMDbConnector');
const { provisionEmployee } = require('../services/provisioningService');
const { deprovisionEmployee } = require('../services/deprovisioningService');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const SystemConfig = require('../models/SystemConfig');
const ADAccount = require('../models/ADAccount');
const ADConnector = require('../connectors/ADConnector');
const Task = require('../models/Task');
const TaskStep = require('../models/TaskStep');
const AuditLog = require('../models/AuditLog');
const RoleMapping = require('../models/RoleMapping');
const resolveManagerDn = require('../utils/resolveManagerDn');

// Sync status exposed for /api/sync/status
const syncStatus = {
  lastRun: null,
  lastResult: null, // 'success' | 'error'
  lastError: null,
  employeesTracked: 0,
  departmentsTracked: 0,
};

function getSyncStatus() {
  return { ...syncStatus };
}

// Syncs departments from OrangeHRM custom field and returns a name→id map
async function syncDepartments(connector) {
  const depts = await connector.fetchDepartments();
  const nameToId = {};
  for (const d of depts) {
    const id = await Department.upsertByName(d.name);
    if (id) nameToId[d.name] = id;
  }
  syncStatus.departmentsTracked = depts.length;
  return nameToId;
}

// In-memory cache of last known OrangeHRM state: { empNumber -> status }
let lastKnownState = {};
let initialized = false;

async function poll() {
  console.log('[Poller] Running OrangeHRM sync...');
  try {
    const deptNameToId = await syncDepartments(OrangeHRMDbConnector);
    const allEmployees = await OrangeHRMDbConnector.fetchAllEmployees();

    // Resolve departmentId from the name→id map for each employee
    for (const emp of allEmployees) {
      if (emp.departmentName && deptNameToId[emp.departmentName]) {
        emp.departmentId = deptNameToId[emp.departmentName];
      }
    }

    for (const hrmEmp of allEmployees) {
      const empNumber = String(hrmEmp.empNumber);
      const currentStatus = hrmEmp.terminationDate ? 'TERMINATED' : 'ACTIVE';
      const previousStatus = lastKnownState[empNumber];

      if (!initialized) {
        // First run — seed state from DB, then sync profile for existing employees
        const dbEmployee = await Employee.findByOrangeHrmId(empNumber);
        if (dbEmployee) {
          lastKnownState[empNumber] = dbEmployee.status;
          // Still sync profile data in case it changed in OrangeHRM
          await syncEmployeeProfile(dbEmployee, hrmEmp).catch((err) =>
            console.error(`[Poller] Profile sync error for ${empNumber}:`, err.message)
          );
          continue;
        }
      }

      if (!previousStatus && currentStatus === 'ACTIVE') {
        // New active employee
        console.log(`[Poller] New employee detected: ${empNumber}`);
        await provisionEmployee(hrmEmp).catch((err) =>
          console.error(`[Poller] Provisioning error for ${empNumber}:`, err.message)
        );
      } else if (previousStatus === 'ACTIVE' && currentStatus === 'TERMINATED') {
        // Newly terminated employee
        console.log(`[Poller] Termination detected: ${empNumber}`);
        await deprovisionEmployee(hrmEmp).catch((err) =>
          console.error(`[Poller] Deprovisioning error for ${empNumber}:`, err.message)
        );
      } else if (previousStatus) {
        // Already known employee — sync profile updates (name, job title, department)
        const dbEmployee = await Employee.findByOrangeHrmId(empNumber);
        if (dbEmployee) {
          await syncEmployeeProfile(dbEmployee, hrmEmp).catch((err) =>
            console.error(`[Poller] Profile sync error for ${empNumber}:`, err.message)
          );
        }
      }

      lastKnownState[empNumber] = currentStatus;
    }

    initialized = true;
    syncStatus.lastRun = new Date().toISOString();
    syncStatus.lastResult = 'success';
    syncStatus.lastError = null;
    syncStatus.employeesTracked = allEmployees.length;
    console.log(`[Poller] Sync complete. Tracked ${allEmployees.length} employees.`);
    await SystemConfig.updateLastSync().catch(() => {});
  } catch (err) {
    syncStatus.lastRun = new Date().toISOString();
    syncStatus.lastResult = 'error';
    syncStatus.lastError = err.message;
    console.error('[Poller] Sync failed:', err.message);
  }
}

/**
 * Diff OrangeHRM data against the current DB record, persist any changes,
 * push updates to AD, and create a PROFILE_UPDATE task + audit log entry
 * for anything that actually changed.
 */
async function syncEmployeeProfile(dbEmployee, hrmEmp) {
  const employeeId = dbEmployee.id;

  // ── 1. Detect changed scalar fields ─────────────────────────────────────────
  const scalarFields = [
    { label: 'First Name',  dbKey: 'first_name',           newVal: hrmEmp.firstName           || null },
    { label: 'Last Name',   dbKey: 'last_name',            newVal: hrmEmp.lastName            || null },
    { label: 'Email',       dbKey: 'email',                newVal: hrmEmp.email               || null },
    { label: 'Job Title',   dbKey: 'job_title',            newVal: hrmEmp.jobTitle            || null },
    { label: 'Company',     dbKey: 'company',              newVal: hrmEmp.company             || null },
    { label: 'Supervisor',  dbKey: 'supervisor_emp_number', newVal: hrmEmp.supervisorEmpNumber || null },
  ];

  const updates = {};
  const changedLabels = [];

  for (const f of scalarFields) {
    const oldStr = dbEmployee[f.dbKey] == null ? null : String(dbEmployee[f.dbKey]);
    const newStr = f.newVal == null ? null : String(f.newVal);
    if (oldStr !== newStr) {
      updates[f.dbKey] = f.newVal;
      changedLabels.push(`${f.label}: "${dbEmployee[f.dbKey] ?? ''}" → "${f.newVal ?? ''}"`);
    }
  }

  // Department: compare by ID, display by name
  const oldDeptId = dbEmployee.department_id == null ? null : String(dbEmployee.department_id);
  const newDeptId = hrmEmp.departmentId      == null ? null : String(hrmEmp.departmentId);
  if (oldDeptId !== newDeptId) {
    updates.department_id = hrmEmp.departmentId || null;
    changedLabels.push(`Department → "${hrmEmp.departmentName ?? ''}"`);
  }

  // ── 2. Push to Active Directory first ────────────────────────────────────────
  // AD is attempted before the DB write so that a failed AD update leaves the DB
  // unchanged — the next poll cycle will re-detect the diff and retry.
  const adAccount = await ADAccount.findByEmployeeId(employeeId);
  if (!adAccount || adAccount.status !== 'ACTIVE') return;

  const company = hrmEmp.company || process.env.AD_COMPANY || '';
  const managerDn = await resolveManagerDn(hrmEmp.supervisorEmpNumber);
  await ADConnector.updateUserAttributes(adAccount.username, {
    email:          hrmEmp.email          || null,
    jobTitle:       hrmEmp.jobTitle        || null,
    departmentName: hrmEmp.departmentName  || null,
    company:        company                || null,
    managerDn:      managerDn              || null,
  });

  // ── 3. Persist local DB changes (only after AD succeeds) ─────────────────────
  if (Object.keys(updates).length > 0) {
    await Employee.update(employeeId, updates);
  }

  // ── 4. Sync group memberships based on current role mappings ─────────────────
  // Runs every cycle so newly added mappings are applied to existing employees.
  const effectiveDeptId = updates.department_id ?? dbEmployee.department_id;
  const effectiveTitle  = updates.job_title     ?? dbEmployee.job_title;
  if (effectiveDeptId && effectiveTitle) {
    const mappings = await RoleMapping.findByDepartmentAndTitle(effectiveDeptId, effectiveTitle);
    for (const mapping of mappings) {
      await ADConnector.addToGroup(adAccount.username, mapping.ad_dn).catch((err) => {
        // "Already a member" errors are expected when the employee is already in the group
        if (!/already/i.test(err.message)) {
          console.warn(`[Poller] Group sync for ${adAccount.username} → ${mapping.ad_dn}: ${err.message}`);
        }
      });
    }
  }

  // ── 5. Task + audit log (only when something actually changed) ───────────────
  if (changedLabels.length === 0) return;

  const fullName = `${hrmEmp.firstName} ${hrmEmp.lastName}`;
  const taskId = await Task.create({
    employee_id: employeeId,
    type:        'PROFILE_UPDATE',
    status:      'IN_PROGRESS',
    priority:    'LOW',
  });

  for (const change of changedLabels) {
    await TaskStep.create({
      task_id:     taskId,
      action_type: 'UPDATE_AD_ATTRIBUTE',
      status:      'SUCCESS',
      detail:      change,
    });
  }

  await Task.updateStatus(taskId, 'COMPLETED', new Date());

  await AuditLog.create({
    actor:  'system',
    action: 'EMPLOYEE_PROFILE_UPDATED',
    target: adAccount.username,
    detail: `Profile sync for ${fullName} (emp #${hrmEmp.empNumber}): ${changedLabels.join('; ')}`,
  });
}

async function startPoller() {
  let cronExpr = process.env.ORANGEHRM_POLL_INTERVAL || '*/5 * * * *';
  try {
    const config = await SystemConfig.get();
    if (config && config.polling_interval_min) {
      cronExpr = `*/${config.polling_interval_min} * * * *`;
    }
  } catch {
    // DB may not be ready yet — fall back to env/default
  }
  console.log(`[Poller] Scheduling OrangeHRM poll: ${cronExpr}`);
  schedule.scheduleJob(cronExpr, poll);

  // Run once immediately on startup
  poll().catch((err) => console.error('[Poller] Initial poll error:', err.message));
}

module.exports = { startPoller, poll, getSyncStatus };
