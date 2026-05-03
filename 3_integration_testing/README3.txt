IT Employee Lifecycle Automation System
README3.txt - Integration Testing
Author: Stephen Torrijas
========================================

FRAMEWORK: Jest 29 + Supertest 6 (Node.js)

HOW TO RUN
----------
1. Navigate to this directory:
   cd Demo/3_integration_testing

2. Install dependencies (first run only):
   npm install

3. Run all integration tests:
   npm test

Expected output: all tests pass.
No real database, Active Directory, or OrangeHRM connection is required --
the MySQL pool (config/db.js) and poller scheduler are mocked so the
Express API can be tested in isolation.

TEST FILES
----------
tests/auth.test.js
  Tests JWT authentication at the Express API layer. Covers:
    - POST /api/auth/login with valid credentials (admin/admin123) -> 200 + token
    - POST /api/auth/login with wrong password -> 401
    - POST /api/auth/login with unknown username -> 401
    - POST /api/auth/login with missing fields -> 400
    - GET /api/employees without token -> 401
    - GET /api/employees with invalid token -> 401
    - GET /api/employees with valid token -> 200
    - GET /api/health (unauthenticated) -> 200

tests/employees.test.js
  Tests the employee REST endpoints. Covers:
    - GET /api/employees -> 200 + array (authenticated)
    - GET /api/employees -> 401 (unauthenticated)
    - GET /api/employees with empty DB -> 200 + []
    - GET /api/employees/search?q=... -> 200 + filtered array
    - GET /api/employees/:id (found) -> 200 + employee object
    - GET /api/employees/:id (not found) -> 404

tests/tasks.test.js
  Tests the task REST endpoints. Covers:
    - GET /api/tasks -> 200 + array (authenticated)
    - GET /api/tasks -> 401 (unauthenticated)
    - GET /api/tasks/stats -> 200 + counts object
    - GET /api/tasks/:id (found) -> 200 + task with steps array
    - GET /api/tasks/:id (not found) -> 404
    - PUT /api/tasks/:id/priority with valid priority -> 200
    - PUT /api/tasks/:id/priority with invalid priority -> 400
    - PUT /api/tasks/:id/priority without auth -> 401
    - POST /api/tasks/:id/approve -> 200

tests/audit.test.js
  Tests the audit log REST endpoints. Covers:
    - GET /api/audit -> 200 + array (authenticated)
    - GET /api/audit -> 401 (unauthenticated)
    - GET /api/audit with empty DB -> 200 + []
    - GET /api/audit?from=&to= (date filters passed to DB)
    - Response entries have required fields (id, actor, action, target)
    - GET /api/audit/export -> 200 + CSV content-type
    - CSV output has header row (ID, Actor, Action, Target, Detail, Timestamp)

MOCKING STRATEGY
----------------
jest.mock() replaces config/db.js with a fake pool (query: jest.fn())
before the Express app module is loaded. Each test suite configures
mock return values per test case. The OrangeHRM connector and AD config
are also mocked to prevent startup connection attempts.

JWT tokens used in tests are signed with the test secret
'integration-test-secret' and are valid for 1 hour.
