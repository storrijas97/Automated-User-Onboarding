'use strict';

// Mock database and poller before importing the app to prevent real connections
jest.mock('../../1_code/it-lifecycle-system/server/config/db', () => ({
  query: jest.fn().mockResolvedValue([[]])
}));

jest.mock('../../1_code/it-lifecycle-system/server/scheduler/poller', () => ({
  startPoller: jest.fn(),
  getSyncStatus: jest.fn(() => ({ lastRun: null, lastResult: null })),
  poll: jest.fn(),
}));

jest.mock('../../1_code/it-lifecycle-system/server/connectors/OrangeHRMDbConnector', () => ({
  fetchAllEmployees: jest.fn().mockResolvedValue([]),
  fetchTerminatedEmployees: jest.fn().mockResolvedValue([]),
  fetchDepartments: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../1_code/it-lifecycle-system/server/config/ad', () => ({
  bind: jest.fn(),
}));

process.env.JWT_SECRET = 'integration-test-secret';

const request = require('supertest');
const app = require('../../1_code/it-lifecycle-system/server/app');

describe('POST /api/auth/login', () => {
  test('returns 200 and a JWT token with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user.username).toBe('admin');
  });

  test('returns 401 with incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 401 with unknown username', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'notauser', password: 'admin123' });

    expect(res.status).toBe(401);
  });

  test('returns 400 when username is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'admin123' });

    expect(res.status).toBe(400);
  });

  test('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin' });

    expect(res.status).toBe(400);
  });
});

describe('JWT authentication enforcement', () => {
  test('returns 401 on protected route with no token', async () => {
    const res = await request(app).get('/api/employees');
    expect(res.status).toBe(401);
  });

  test('returns 401 on protected route with an invalid token', async () => {
    const res = await request(app)
      .get('/api/employees')
      .set('Authorization', 'Bearer this.is.not.valid');

    expect(res.status).toBe(401);
  });

  test('returns 200 on protected route with a valid token', async () => {
    // Get a real token first
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });

    const db = require('../../1_code/it-lifecycle-system/server/config/db');
    db.query.mockResolvedValue([[]]);

    const res = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${loginRes.body.token}`);

    expect(res.status).toBe(200);
  });
});

describe('GET /api/health', () => {
  test('returns 200 and status ok without authentication', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
