'use strict';

// Mock all external dependencies before requiring the service
jest.mock('../../1_code/it-lifecycle-system/server/models/Employee', () => ({
  findByOrangeHrmId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
}));

jest.mock('../../1_code/it-lifecycle-system/server/models/ADAccount', () => ({
  findByEmployeeId: jest.fn(),
  create: jest.fn(),
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

jest.mock('../../1_code/it-lifecycle-system/server/models/RoleMapping', () => ({
  findByDepartmentAndTitle: jest.fn(),
}));

jest.mock('../../1_code/it-lifecycle-system/server/models/SystemConfig', () => ({
  get: jest.fn(),
}));

jest.mock('../../1_code/it-lifecycle-system/server/connectors/ADConnector', () => ({
  createUser: jest.fn(),
  enableUser: jest.fn(),
  updateUserAttributes: jest.fn(),
  userExists: jest.fn(),
  addToGroup: jest.fn(),
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
const RoleMapping = require('../../1_code/it-lifecycle-system/server/models/RoleMapping');
const SystemConfig = require('../../1_code/it-lifecycle-system/server/models/SystemConfig');
const ADConnector = require('../../1_code/it-lifecycle-system/server/connectors/ADConnector');
const notificationService = require('../../1_code/it-lifecycle-system/server/services/notificationService');
const { provisionEmployee, reprovisionEmployee } = require('../../1_code/it-lifecycle-system/server/services/provisioningService');

const SAMPLE_HRM_EMPLOYEE = {
  empNumber: '42',
  firstName: 'John',
  lastName: 'Doe',
  workEmail: 'john.doe@company.com',
  jobTitle: 'Software Engineer',
  departmentId: 3,
  departmentName: 'Engineering',
  hireDate: '2026-01-15',
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();

  // Default setup: new employee (not in DB), AD account does not exist
  Employee.findByOrangeHrmId.mockResolvedValue(null);
  Employee.create.mockResolvedValue(101);
  Task.create.mockResolvedValue(50);
  ADAccount.findByEmployeeId.mockResolvedValue(null);
  ADConnector.userExists.mockResolvedValue(false);
  ADConnector.createUser.mockResolvedValue({ dn: 'CN=John Doe,OU=ITLifecycle,DC=stechlab,DC=net' });
  ADAccount.create.mockResolvedValue(undefined);
  RoleMapping.findByDepartmentAndTitle.mockResolvedValue([]);
  Task.updateStatus.mockResolvedValue(undefined);
  AuditLog.create.mockResolvedValue(undefined);
  notificationService.notifyProvisioning.mockResolvedValue(undefined);
  SystemConfig.get.mockResolvedValue({ retry_limit: 3 });
  TaskStep.create.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('generateUsername (via provisionEmployee)', () => {
  test('formats firstName+lastName lowercase, truncated to 20 chars', async () => {
    const longEmployee = {
      ...SAMPLE_HRM_EMPLOYEE,
      firstName: 'Bartholomew',
      lastName: 'Worthington',
    };
    await provisionEmployee(longEmployee);
    const callArg = ADConnector.createUser.mock.calls[0][0];
    expect(callArg.username).toBe('bartholomewworthingt'); // 20 chars
  });

  test('strips non-alphanumeric characters from username', async () => {
    const specialEmployee = {
      ...SAMPLE_HRM_EMPLOYEE,
      firstName: "O'Brien",
      lastName: 'Smith-Jones',
    };
    await provisionEmployee(specialEmployee);
    const callArg = ADConnector.createUser.mock.calls[0][0];
    expect(callArg.username).toMatch(/^[a-z0-9]+$/);
    expect(callArg.username).not.toContain("'");
    expect(callArg.username).not.toContain('-');
  });
});

describe('provisionEmployee — happy path', () => {
  test('creates employee record in DB when not found', async () => {
    await provisionEmployee(SAMPLE_HRM_EMPLOYEE);
    expect(Employee.create).toHaveBeenCalledWith(expect.objectContaining({
      orangehrm_id: '42',
      first_name: 'John',
      last_name: 'Doe',
      status: 'ACTIVE',
    }));
  });

  test('updates existing employee record instead of creating a new one', async () => {
    Employee.findByOrangeHrmId.mockResolvedValue({ id: 99, status: 'ACTIVE' });
    await provisionEmployee(SAMPLE_HRM_EMPLOYEE);
    expect(Employee.create).not.toHaveBeenCalled();
    expect(Employee.update).toHaveBeenCalledWith(99, expect.objectContaining({ status: 'ACTIVE' }));
  });

  test('creates an ONBOARDING task with IN_PROGRESS status', async () => {
    await provisionEmployee(SAMPLE_HRM_EMPLOYEE);
    expect(Task.create).toHaveBeenCalledWith(expect.objectContaining({
      type: 'ONBOARDING',
      status: 'IN_PROGRESS',
    }));
  });

  test('calls ADConnector.createUser with correct attributes', async () => {
    await provisionEmployee(SAMPLE_HRM_EMPLOYEE);
    expect(ADConnector.createUser).toHaveBeenCalledWith(expect.objectContaining({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@company.com',
    }));
  });

  test('persists the AD account record to the database', async () => {
    await provisionEmployee(SAMPLE_HRM_EMPLOYEE);
    expect(ADAccount.create).toHaveBeenCalledWith(expect.objectContaining({
      employee_id: 101,
      status: 'ACTIVE',
    }));
  });

  test('assigns each role mapping group via addToGroup', async () => {
    RoleMapping.findByDepartmentAndTitle.mockResolvedValue([
      { ad_dn: 'CN=Engineers,OU=Groups,DC=stechlab,DC=net' },
      { ad_dn: 'CN=VPN-Users,OU=Groups,DC=stechlab,DC=net' },
    ]);
    await provisionEmployee(SAMPLE_HRM_EMPLOYEE);
    expect(ADConnector.addToGroup).toHaveBeenCalledTimes(2);
  });

  test('marks the task COMPLETED after successful provisioning', async () => {
    await provisionEmployee(SAMPLE_HRM_EMPLOYEE);
    expect(Task.updateStatus).toHaveBeenCalledWith(50, 'COMPLETED', expect.any(Date));
  });

  test('writes a PROVISIONED audit log entry', async () => {
    await provisionEmployee(SAMPLE_HRM_EMPLOYEE);
    expect(AuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      actor: 'system',
      action: 'EMPLOYEE_PROVISIONED',
    }));
  });

  test('sends a provisioning notification', async () => {
    await provisionEmployee(SAMPLE_HRM_EMPLOYEE);
    expect(notificationService.notifyProvisioning).toHaveBeenCalledWith(101, expect.stringContaining('John Doe'));
  });
});

describe('provisionEmployee — account already exists in AD', () => {
  test('enables existing account instead of creating a new one', async () => {
    ADConnector.userExists.mockResolvedValue(true);
    ADConnector.enableUser.mockResolvedValue(undefined);
    ADConnector.updateUserAttributes.mockResolvedValue(undefined);
    ADAccount.findByEmployeeId.mockResolvedValue({ id: 5, username: 'johndoe' });

    await provisionEmployee(SAMPLE_HRM_EMPLOYEE);

    expect(ADConnector.createUser).not.toHaveBeenCalled();
    expect(ADConnector.enableUser).toHaveBeenCalled();
  });
});

describe('provisionEmployee — failure handling', () => {
  test('marks task FAILED and writes error audit log when AD creation fails', async () => {
    ADConnector.createUser.mockRejectedValue(new Error('LDAP connection refused'));
    ADConnector.userExists.mockResolvedValue(false);

    const prom = provisionEmployee(SAMPLE_HRM_EMPLOYEE);
    const assertion = expect(prom).rejects.toThrow('LDAP connection refused');
    await jest.runAllTimersAsync();
    await assertion;

    expect(Task.updateStatus).toHaveBeenCalledWith(50, 'FAILED');
    expect(AuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      action: 'PROVISIONING_ERROR',
    }));
  });

  test('continues assigning groups even if one group assignment fails', async () => {
    SystemConfig.get.mockResolvedValue({ retry_limit: 1 }); // 1 attempt per group, no timer delays
    RoleMapping.findByDepartmentAndTitle.mockResolvedValue([
      { ad_dn: 'CN=Engineers,OU=Groups,DC=stechlab,DC=net' },
      { ad_dn: 'CN=VPN,OU=Groups,DC=stechlab,DC=net' },
    ]);
    ADConnector.addToGroup
      .mockRejectedValueOnce(new Error('Group not found'))
      .mockResolvedValueOnce(undefined);

    await provisionEmployee(SAMPLE_HRM_EMPLOYEE);

    // Task still completes even though one group assignment failed
    expect(Task.updateStatus).toHaveBeenCalledWith(50, 'COMPLETED', expect.any(Date));
    // Both groups were attempted
    expect(ADConnector.addToGroup).toHaveBeenCalledTimes(2);
  });
});

describe('reprovisionEmployee', () => {
  test('delegates to provisionEmployee and creates a new task', async () => {
    await reprovisionEmployee(SAMPLE_HRM_EMPLOYEE);
    expect(Task.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'ONBOARDING' }));
  });
});
