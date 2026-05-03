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

const SAMPLE_TASKS = [
  {
    id: 1, employee_id: 1, type: 'ONBOARDING', status: 'COMPLETED',
    priority: 'HIGH', created_at: '2026-05-01T10:00:00.000Z', completed_at: '2026-05-01T10:01:00.000Z',
  },
  {
    id: 2, employee_id: 2, type: 'OFFBOARDING', status: 'PENDING',
    priority: 'MEDIUM', created_at: '2026-05-01T11:00:00.000Z', completed_at: null,
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockDb.query.mockResolvedValue([[]]);
});

describe('GET /api/tasks', () => {
  test('returns 401 without authentication', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });

  test('returns 200 and task list with valid token', async () => {
    mockDb.query.mockResolvedValue([SAMPLE_TASKS]);

    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });
});

describe('GET /api/tasks/stats', () => {
  test('returns 200 with stats object', async () => {
    const statsRow = {
      total_employees: 10,
      pending_tasks: 2,
      completed_today: 5,
      failed_tasks: 1,
    };
    mockDb.query.mockResolvedValue([[statsRow]]);

    const res = await request(app)
      .get('/api/tasks/stats')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('pending_tasks');
    expect(res.body).toHaveProperty('completed_today');
  });
});

describe('GET /api/tasks/:id', () => {
  test('returns 200 with task and steps when task is found', async () => {
    // First query returns task, second returns steps
    mockDb.query
      .mockResolvedValueOnce([[SAMPLE_TASKS[0]]])
      .mockResolvedValueOnce([[]]);

    const res = await request(app)
      .get('/api/tasks/1')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
    expect(res.body).toHaveProperty('steps');
  });

  test('returns 404 when task is not found', async () => {
    mockDb.query.mockResolvedValue([[]]);

    const res = await request(app)
      .get('/api/tasks/9999')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/tasks/:id/priority', () => {
  test('returns 200 when setting a valid priority', async () => {
    // findById returns the task, then UPDATE query, then AuditLog.create INSERT
    mockDb.query
      .mockResolvedValueOnce([[SAMPLE_TASKS[0]]])   // Task.findById
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // UPDATE priority
      .mockResolvedValueOnce([{ insertId: 1 }]);    // AuditLog.create

    const res = await request(app)
      .put('/api/tasks/1/priority')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ priority: 'CRITICAL' });

    expect(res.status).toBe(200);
    expect(res.body.priority).toBe('CRITICAL');
  });

  test('returns 400 for invalid priority value', async () => {
    const res = await request(app)
      .put('/api/tasks/1/priority')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ priority: 'INVALID' });

    expect(res.status).toBe(400);
  });

  test('returns 401 without authentication', async () => {
    const res = await request(app)
      .put('/api/tasks/1/priority')
      .send({ priority: 'HIGH' });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/tasks/:id/approve', () => {
  test('returns 200 when approving an existing task', async () => {
    mockDb.query
      .mockResolvedValueOnce([[SAMPLE_TASKS[0]]])   // Task.findById
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // Task.updateStatus
      .mockResolvedValueOnce([{ insertId: 1 }]);    // AuditLog.create

    const res = await request(app)
      .post('/api/tasks/1/approve')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Task approved');
  });
});
