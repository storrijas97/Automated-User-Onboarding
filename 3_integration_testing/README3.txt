IT Employee Lifecycle Automation System
README3.txt - Integration Testing
Author: Stephen Torrijas
========================================

STATUS: Integration tests are planned for the final demo submission but
are not yet implemented at this stage of development.

See explanation.txt in the main Demo folder for full details.

PLANNED COVERAGE (for final submission):
- End-to-end onboarding flow: OrangeHRM new hire detected ->
  provisioning service -> AD account created -> audit log written ->
  notification created
- End-to-end offboarding flow: OrangeHRM termination detected ->
  deprovisioning service -> AD account disabled -> audit log written
- API endpoint tests: all REST endpoints tested with valid and invalid
  JWT tokens, valid and invalid payloads
- Database integration: verify correct data written to MySQL after
  each lifecycle operation
