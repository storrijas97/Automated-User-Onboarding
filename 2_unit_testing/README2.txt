IT Employee Lifecycle Automation System
README2.txt - Unit Testing
Author: Stephen Torrijas
========================================

FRAMEWORK: Jest 29 (Node.js)

HOW TO RUN
----------
1. Navigate to this directory:
   cd Demo/2_unit_testing

2. Install dependencies (first run only):
   npm install

3. Run all unit tests with coverage:
   npm test

Expected output: all tests pass, coverage summary printed.
No database, Active Directory, or OrangeHRM connection is required --
all external dependencies are mocked with jest.fn().

TEST FILES
----------
tests/withRetry.test.js
  Tests the withRetry(fn, limit) retry utility used by both
  provisioning and deprovisioning services. Covers:
    - Success on first attempt (no retry needed)
    - Retry after transient failure, success on second attempt
    - Exhausting all retry attempts and throwing the last error
    - Correct attempt number passed to the callback function
    - Limit of 1 (zero retries)

tests/provisioningService.test.js
  Tests provisionEmployee() and reprovisionEmployee() in
  server/services/provisioningService.js. Covers:
    - Username generation (lowercase, stripped chars, 20-char truncation)
    - Happy path: employee created in DB, AD account created, groups
      assigned, task marked COMPLETED, audit log written, notification sent
    - Existing employee record is updated (not re-created)
    - AD account that already exists is enabled rather than created again
    - Role mapping groups are each assigned via ADConnector.addToGroup()
    - Group assignment failure is logged but does not abort the task
    - All retries exhausted: task marked FAILED, error audit log written
    - reprovisionEmployee delegates to provisionEmployee

tests/deprovisioningService.test.js
  Tests deprovisionEmployee() in
  server/services/deprovisioningService.js. Covers:
    - Early exit: employee not found in local DB (no error)
    - Early exit: employee already TERMINATED (idempotent)
    - Happy path: groups removed, AD account disabled, employee marked
      TERMINATED, task COMPLETED, audit log written, notification sent
    - SKIPPED step when no AD account record exists in DB
    - Employee still marked TERMINATED even without an AD account
    - All retries exhausted on disableUser: task FAILED, error audit log
    - Group removal failure does not abort the disable step

MOCKING STRATEGY
----------------
All database models (Employee, ADAccount, Task, TaskStep, AuditLog,
RoleMapping, SystemConfig), ADConnector, and notificationService are
replaced with jest.fn() mocks via jest.mock(). No real I/O occurs.

Fake timers (jest.useFakeTimers()) are used in tests that exercise
retry behavior to avoid real 2-second delays between attempts.
