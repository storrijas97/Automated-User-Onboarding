A web application that automates IT account provisioning and deprovisioning by monitoring a self-hosted OrangeHRM for employee changes and automatically creating or disabling Windows Active Directory accounts.

---

## What It Does

When a new employee is added to OrangeHRM, the system automatically:
- Creates an Active Directory account with the correct name, email, job title, and department
- Assigns AD security groups based on the employee's department and role (configured via the UI)
- Logs every action to a full audit trail
- Sends an in-app notification to the IT admin

When an employee is terminated in OrangeHRM, the system automatically:
- Disables their Active Directory account
- Removes all group memberships
- Logs the action and notifies the IT admin

Everything is visible through a React dashboard with no manual steps required.
