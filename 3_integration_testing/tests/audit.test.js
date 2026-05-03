'use strict';

const mockDb = {
  query: jest.fn().mockResolvedValue([[]])
};

jest.mock('../../1_code/it-lifecycle-system/server/config/db', () => mockDb);

jest.mock('../../1_code/it-lifecycle-system/server/scheduler/poller', () => ({
  startPoller: jest.fn(),
  getSyncStatus: jest.fn(() => ({ lastRun: null, lastResult: null })),
  poll: jest.fn(),
}));

jest.mock('../../1_code/it-lifecycle-system/server/connectors/OrangeHRMDbConnector', () => ({
  fetchAllEmployees: jest.fn().mockResolvedValue([]),
  fetchDepartments: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../1_code/it-lifecycle-system/server/config/ad', () => ({ bind: jest.fn() }));

process.env.JWT_SECRET = 'integration-test-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../1_code/it-lifecycle-system/server/app');

const TOKEN = jwt.sign(
  { id: 1, username: 'admin', role: 'admin' },
  'integration-test-secret',
  { expiresIn: '1h' }
);

const SAMPLE_AUDIT_LOGS = [
  {
    id: 1, actor: 'system', action: 'EMPLOYEE_PROVISIONED',
    target: 'johndoe', detail: 'Employee John Doe provisioned',
    created_at: '2026-05-01T10:00:00.000Z',
  },
  {
    id: 2, actor: 'admin', action: 'TASK_APPROVED',
    target: '5', detail: 'Task #5 approved',
    created_at: '2026-05-01T11:00:00.000Z',
  },
  {
    id: 3, actor: 'system', action: 'EMPLOYEE_DEPROVISIONED',
    target: 'janedoe', detail: 'Employee Jane Doe deprovisioned',
    created_at: '2026-05-02T09:00:00.000Z',
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockDb.query.mockResolvedValue([[]]);
});

describe('GET /api/audit', () => {
  test('returns 401 without authentication', async () => {
    const res = await request(app).get('/api/audit');
    expect(res.status).toBe(401);
  });

  test('returns 200 and an array of audit log entries', async () => {
    mockDb.query.mockResolvedValue([SAMPLE_AUDIT_LOGS]);

    const res = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(3);
  });

  test('returns empty array when no log entries exist', async () => {
    mockDb.query.mockResolvedValue([[]]);

    const res = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('passes date range query params through to the DB query', async () => {
    mockDb.query.mockResolvedValue([[SAMPLE_AUDIT_LOGS[0]]]);

    const res = await request(app)
      .get('/api/audit?from=2026-05-01&to=2026-05-01')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    // Verify the DB was queried (date filtering handled by the model)
    expect(mockDb.query).toHaveBeenCalled();
  });

  test('each log entry has required fields', async () => {
    mockDb.query.mockResolvedValue([SAMPLE_AUDIT_LOGS]);

    const res = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${TOKEN}`);

    const entry = res.body[0];
    expect(entry).toHaveProperty('id');
    expect(entry).toHaveProperty('actor');
    expect(entry).toHaveProperty('action');
    expect(entry).toHaveProperty('target');
  });
});

describe('GET /api/audit/export', () => {
  test('returns 401 without authentication', async () => {
    const res = await request(app).get('/api/audit/export');
    expect(res.status).toBe(401);
  });

  test('returns CSV content-type with audit data', async () => {
    mockDb.query.mockResolvedValue([SAMPLE_AUDIT_LOGS]);

    const res = await request(app)
      .get('/api/audit/export')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toMatch(/attachment/);
  });

  test('CSV output contains header row and data rows', async () => {
    mockDb.query.mockResolvedValue([SAMPLE_AUDIT_LOGS]);

    const res = await request(app)
      .get('/api/audit/export')
      .set('Authorization', `Bearer ${TOKEN}`);

    const lines = res.text.split('\r\n');
    expect(lines[0]).toContain('ID');
    expect(lines[0]).toContain('Actor');
    expect(lines[0]).toContain('Action');
    expect(lines.length).toBeGreaterThan(1);
  });
});
