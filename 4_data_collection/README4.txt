IT Employee Lifecycle Automation System
README4.txt - Data Collection
Author: Stephen Torrijas
========================================

STATUS: This project does not have a separate data collection phase.

See explanation.txt in the main Demo folder for full details.

The system's data comes from two live integrated sources:

1. OrangeHRM MySQL Database
   - Employee records are continuously polled by the scheduler
     (server/scheduler/poller.js) at a configurable interval.
   - No separate data collection script is needed; the poller IS
     the data collection mechanism, running as part of the backend.

2. Active Directory (Windows Server)
   - AD account status is read on demand via LDAP when the
     Employee Search detail modal is opened.
   - No batch data collection from AD is performed.

The it-lifecycle-system database is seeded by normal system operation
(employee sync, task creation, audit logging) rather than by a
dedicated data collection script.
