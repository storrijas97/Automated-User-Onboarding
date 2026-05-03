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

const SAMPLE_EMPLOYEES = [
  {
    id: 1, orangehrm_id: '10', first_name: 'Alice', last_name: 'Smith',
    email: 'alice@company.com', job_title: 'Engineer', department_name: 'Engineering',
    status: 'ACTIVE',
  },
  {
    id: 2, orangehrm_id: '11', first_name: 'Bob', last_name: 'Jones',
    email: 'bob@company.com', job_title: 'Manager', department_name: 'IT',
    status: 'ACTIVE',
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockDb.query.mockResolvedValue([[]]);
});

describe('GET /api/employees', () => {
  test('returns 401 without authentication', async () => {
    const res = await request(app).get('/api/employees');
    expect(res.status).toBe(401);
  });

  test('returns 200 and an array of employees with valid token', async () => {
    mockDb.query.mockResolvedValue([SAMPLE_EMPLOYEES]);

    const res = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(res.body[0].first_name).toBe('Alice');
  });

  test('returns an empty array when no employees exist', async () => {
    mockDb.query.mockResolvedValue([[]]);

    const res = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('GET /api/employees/search', () => {
  test('returns 200 with filtered results for query param', async () => {
    const filtered = [SAMPLE_EMPLOYEES[0]];
    mockDb.query.mockResolvedValue([filtered]);

    const res = await request(app)
      .get('/api/employees/search?q=alice')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('returns all employees when no query param is given', async () => {
    mockDb.query.mockResolvedValue([SAMPLE_EMPLOYEES]);

    const res = await request(app)
      .get('/api/employees/search')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
  });
});

describe('GET /api/employees/:id', () => {
  test('returns 200 with the employee record when found', async () => {
    mockDb.query.mockResolvedValue([[SAMPLE_EMPLOYEES[0]]]);

    const res = await request(app)
      .get('/api/employees/1')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.first_name).toBe('Alice');
  });

  test('returns 404 when employee does not exist', async () => {
    mockDb.query.mockResolvedValue([[]]); // empty result

    const res = await request(app)
      .get('/api/employees/999')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
