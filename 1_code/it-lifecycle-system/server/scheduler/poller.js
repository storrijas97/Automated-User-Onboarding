const schedule = require('node-schedule');
const OrangeHRMDbConnector = require('../connectors/OrangeHRMDbConnector');
const { provisionEmployee } = require('../services/provisioningService');
const { deprovisionEmployee } = require('../services/deprovisioningService');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const SystemConfig = require('../models/SystemConfig');

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
          await syncEmployeeProfile(dbEmployee.id, hrmEmp).catch((err) =>
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
          await syncEmployeeProfile(dbEmployee.id, hrmEmp).catch((err) =>
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
 * Sync employee profile fields from OrangeHRM into the local DB.
 * Updates first_name, last_name, email, job_title, and department_id
 * only when values have actually changed.
 */
async function syncEmployeeProfile(employeeId, hrmEmp) {
  const updates = {};
  if (hrmEmp.firstName) updates.first_name = hrmEmp.firstName;
  if (hrmEmp.lastName)  updates.last_name  = hrmEmp.lastName;
  if (hrmEmp.email)     updates.email      = hrmEmp.email;
  if (hrmEmp.jobTitle !== undefined) updates.job_title = hrmEmp.jobTitle;
  if (hrmEmp.departmentId !== undefined) updates.department_id = hrmEmp.departmentId || null;

  if (Object.keys(updates).length > 0) {
    await Employee.update(employeeId, updates);
  }
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
