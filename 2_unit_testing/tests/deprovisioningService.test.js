'use strict';

jest.mock('../../1_code/it-lifecycle-system/server/models/Employee', () => ({
  findByOrangeHrmId: jest.fn(),
  update: jest.fn(),
}));

jest.mock('../../1_code/it-lifecycle-system/server/models/ADAccount', () => ({
  findByEmployeeId: jest.fn(),
  updateStatus: jest.fn(),
}));

jest.mock('../../1_code/it-lifecycle-system/server/models/Task', () => ({
  create: jest.fn(),
  updateStatus: jest.fn(),
}));

jest.mock('../../1_code/it-lifecycle-system/server/models/TaskStep', () => ({
  create: jest.fn(),
}));

jest.mock('../../1_code/it-lifecycle-system/server/models/AuditLog', () => ({
  create: jest.fn(),
}));

jest.mock('../../1_code/it-lifecycle-system/server/models/SystemConfig', () => ({
  get: jest.fn(),
}));

jest.mock('../../1_code/it-lifecycle-system/server/connectors/ADConnector', () => ({
  disableUser: jest.fn(),
  removeFromGroups: jest.fn(),
}));

jest.mock('../../1_code/it-lifecycle-system/server/services/notificationService', () => ({
  notifyProvisioning: jest.fn(),
  notifyDeprovisioning: jest.fn(),
}));

const Employee = require('../../1_code/it-lifecycle-system/server/models/Employee');
const ADAccount = require('../../1_code/it-lifecycle-system/server/models/ADAccount');
const Task = require('../../1_code/it-lifecycle-system/server/models/Task');
const TaskStep = require('../../1_code/it-lifecycle-system/server/models/TaskStep');
const AuditLog = require('../../1_code/it-lifecycle-system/server/models/AuditLog');
const SystemConfig = require('../../1_code/it-lifecycle-system/server/models/SystemConfig');
const ADConnector = require('../../1_code/it-lifecycle-system/server/connectors/ADConnector');
const notificationService = require('../../1_code/it-lifecycle-system/server/services/notificationService');
const { deprovisionEmployee } = require('../../1_code/it-lifecycle-system/server/services/deprovisioningService');

const SAMPLE_HRM_EMPLOYEE = {
  empNumber: '42',
  terminationDate: '2026-05-01',
};

const SAMPLE_DB_EMPLOYEE = {
  id: 101,
  orangehrm_id: '42',
  first_name: 'John',
  last_name: 'Doe',
  status: 'ACTIVE',
};

const SAMPLE_AD_ACCOUNT = {
  id: 5,
  employee_id: 101,
  username: 'johndoe',
  dn: 'CN=John Doe,OU=ITLifecycle,DC=stechlab,DC=net',
  status: 'ACTIVE',
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();

  Employee.findByOrangeHrmId.mockResolvedValue(SAMPLE_DB_EMPLOYEE);
  ADAccount.findByEmployeeId.mockResolvedValue(SAMPLE_AD_ACCOUNT);
  Task.create.mockResolvedValue(60);
  Task.updateStatus.mockResolvedValue(undefined);
  ADConnector.removeFromGroups.mockResolvedValue(undefined);
  ADConnector.disableUser.mockResolvedValue(undefined);
  ADAccount.updateStatus.mockResolvedValue(undefined);
  Employee.update.mockResolvedValue(undefined);
  AuditLog.create.mockResolvedValue(undefined);
  notificationService.notifyDeprovisioning.mockResolvedValue(undefined);
  SystemConfig.get.mockResolvedValue({ retry_limit: 3 });
  TaskStep.create.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('deprovisionEmployee — early exits', () => {
  test('returns without error when employee is not found in the local DB', async () => {
    Employee.findByOrangeHrmId.mockResolvedValue(null);
    await expect(deprovisionEmployee(SAMPLE_HRM_EMPLOYEE)).resolves.toBeUndefined();
    expect(Task.create).not.toHaveBeenCalled();
  });

  test('returns without error when employee is already TERMINATED', async () => {
    Employee.findByOrangeHrmId.mockResolvedValue({ ...SAMPLE_DB_EMPLOYEE, status: 'TERMINATED' });
    await expect(deprovisionEmployee(SAMPLE_HRM_EMPLOYEE)).resolves.toBeUndefined();
    expect(Task.create).not.toHaveBeenCalled();
  });
});

describe('deprovisionEmployee — happy path', () => {
  test('creates an OFFBOARDING task with IN_PROGRESS status', async () => {
    await deprovisionEmployee(SAMPLE_HRM_EMPLOYEE);
    expect(Task.create).toHaveBeenCalledWith(expect.objectContaining({
      type: 'OFFBOARDING',
      status: 'IN_PROGRESS',
    }));
  });

  test('removes user from all AD groups', async () => {
    await deprovisionEmployee(SAMPLE_HRM_EMPLOYEE);
    expect(ADConnector.removeFromGroups).toHaveBeenCalledWith('johndoe');
  });

  test('disables the AD account', async () => {
    await deprovisionEmployee(SAMPLE_HRM_EMPLOYEE);
    expect(ADConnector.disableUser).toHaveBeenCalledWith('johndoe');
  });

  test('marks the AD account DISABLED with a timestamp', async () => {
    await deprovisionEmployee(SAMPLE_HRM_EMPLOYEE);
    expect(ADAccount.updateStatus).toHaveBeenCalledWith(101, 'DISABLED', expect.any(Date));
  });

  test('marks the employee TERMINATED in the local DB', async () => {
    await deprovisionEmployee(SAMPLE_HRM_EMPLOYEE);
    expect(Employee.update).toHaveBeenCalledWith(101, expect.objectContaining({
      status: 'TERMINATED',
    }));
  });

  test('marks the task COMPLETED after successful deprovisioning', async () => {
    await deprovisionEmployee(SAMPLE_HRM_EMPLOYEE);
    expect(Task.updateStatus).toHaveBeenCalledWith(60, 'COMPLETED', expect.any(Date));
  });

  test('writes a DEPROVISIONED audit log entry', async () => {
    await deprovisionEmployee(SAMPLE_HRM_EMPLOYEE);
    expect(AuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      actor: 'system',
      action: 'EMPLOYEE_DEPROVISIONED',
    }));
  });

  test('sends a deprovisioning notification', async () => {
    await deprovisionEmployee(SAMPLE_HRM_EMPLOYEE);
    expect(notificationService.notifyDeprovisioning).toHaveBeenCalledWith(101, expect.any(String));
  });
});

describe('deprovisionEmployee — no AD account in DB', () => {
  test('records a SKIPPED step when no AD account record exists', async () => {
    ADAccount.findByEmployeeId.mockResolvedValue(null);
    await deprovisionEmployee(SAMPLE_HRM_EMPLOYEE);
    expect(ADConnector.disableUser).not.toHaveBeenCalled();
    expect(TaskStep.create).toHaveBeenCalledWith(expect.objectContaining({
      action_type: 'DISABLE_AD_ACCOUNT',
      status: 'SKIPPED',
    }));
  });

  test('still marks the employee TERMINATED even without an AD account', async () => {
    ADAccount.findByEmployeeId.mockResolvedValue(null);
    await deprovisionEmployee(SAMPLE_HRM_EMPLOYEE);
    expect(Employee.update).toHaveBeenCalledWith(101, expect.objectContaining({ status: 'TERMINATED' }));
  });
});

describe('deprovisionEmployee — failure handling', () => {
  test('marks task FAILED and writes error audit log when disableUser fails all retries', async () => {
    ADConnector.disableUser.mockRejectedValue(new Error('LDAP unreachable'));

    const prom = deprovisionEmployee(SAMPLE_HRM_EMPLOYEE);
    const assertion = expect(prom).rejects.toThrow('LDAP unreachable');
    await jest.runAllTimersAsync();
    await assertion;
    expect(Task.updateStatus).toHaveBeenCalledWith(60, 'FAILED');
    expect(AuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      action: 'DEPROVISIONING_ERROR',
    }));
  });

  test('continues to disable account even if group removal fails', async () => {
    ADConnector.removeFromGroups.mockRejectedValue(new Error('Group removal failed'));
    const prom = deprovisionEmployee(SAMPLE_HRM_EMPLOYEE);
    await jest.runAllTimersAsync();
    await prom;

    // Disable was still called despite group removal failure
    expect(ADConnector.disableUser).toHaveBeenCalled();
    expect(Task.updateStatus).toHaveBeenCalledWith(60, 'COMPLETED', expect.any(Date));
  });
});
