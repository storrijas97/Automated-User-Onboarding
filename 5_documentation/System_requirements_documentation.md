---
title: "System Requirements Documentation"
project: "IT Employee Lifecycle Automation System"
author: "Stephen Torrijas"
date: "March 2026"
---

# IT Employee Lifecycle Automation System

## System Requirements Documentation

**Stephen Torrijas**
**March 2026**

---

## Table of Contents

1. Customer Problem Statement
2. Glossary of Terms
3. System Requirements
   - 3.1 Functional Requirements
   - 3.2 Nonfunctional Requirements (FURPS)
4. Functional Requirements Specification
   - 4.1 Stakeholders
   - 4.2 Actors and Goals
   - 4.3 Use Cases
   - 4.4 Class Diagram — Component Overview
   - 4.5 Enumerations
   - 4.6 Data Types and Operation Signatures
   - 4.7 Class Relationships
5. System Sequence Diagrams
6. Activity Diagram
7. User Interface Specification
   - 7.1 Global Layout and Navigation
   - 7.2 UI-1: Main Dashboard
   - 7.3 UI-2: Department Mapping Configuration
   - 7.4 UI-3: Task Detail View
   - 7.5 UI-4: Audit Log Viewer
   - 7.6 UI-5: Report Generation
   - 7.7 UI-6: Employee Search & Status Lookup
   - 7.8 User Effort Estimation
8. Project Plan
9. References
10. Traceability Matrix
11. System Architecture and System Design
12. Algorithms and Data Structures
13. User Interface Design & Implementation / Design of Tests

---

## 1. Customer Problem Statement

Organizations of all sizes rely on IT departments to provision and deprovision user accounts throughout the employee lifecycle. When a new employee joins, IT administrators must create Active Directory accounts, assign appropriate security groups based on department and role, and grant access to necessary resources. This process typically begins when IT receives notification via email or helpdesk ticket — often the day of or after the employee starts — resulting in delayed access and lost productivity during critical onboarding periods.

The offboarding process presents even greater challenges. When employees depart, IT frequently receives late or incomplete notifications, leaving former employees with active credentials and access to sensitive company resources. These orphaned accounts create significant security vulnerabilities and compliance risks. Additionally, manual provisioning leads to inconsistency: different IT staff may assign different permissions to employees in identical roles, creating access disparities and audit failures.

An automated system is needed that continuously monitors the HR system for personnel changes and automatically executes corresponding account actions — creating accounts for new hires with role-appropriate permissions and promptly disabling accounts for departing employees. The system provides a centralized dashboard for oversight, manual intervention capabilities, and comprehensive audit logging to ensure compliance.

---

## 2. Glossary of Terms

| Term | Definition |
|------|------------|
| **Employee Lifecycle** | The stages an employee progresses through within an organization: onboarding (joining), active employment, role changes, and offboarding (departure). |
| **Provisioning** | The process of creating user accounts and assigning appropriate access permissions when an employee joins the organization. |
| **Deprovisioning** | The process of disabling or removing user accounts and revoking access when an employee leaves the organization. |
| **Orphaned Account** | A user account that remains active after an employee has left the organization, creating a security vulnerability. |
| **Role-Permission Mapping** | A configuration that defines which security groups and access levels are automatically assigned based on an employee's department and job title. |
| **Polling Interval** | The frequency at which the system checks the HR database for changes in employee status. |
| **Audit Log** | A chronological record of all account lifecycle events, including who performed actions and when. |
| **Distinguished Name (DN)** | The full LDAP path identifying a user or group object within Active Directory (e.g., CN=jsmith,OU=ITLifecycle,DC=stechlab,DC=net). |
| **LDAP** | Lightweight Directory Access Protocol — the protocol used to communicate with Active Directory. |
| **OrangeHRM** | The open-source Human Resource Management system used as the authoritative source of employee data. |

---

## 3. System Requirements

### 3.1 Functional Requirements

| No. | Priority | Description |
|-----|----------|-------------|
| REQ-1 | High | The system shall automatically detect new employees added to the HR management system. |
| REQ-2 | High | The system shall automatically create Active Directory accounts for new employees. |
| REQ-3 | High | The system shall assign security groups based on configured department and role mappings. |
| REQ-4 | High | The system shall automatically detect employee terminations in the HR management system. |
| REQ-5 | High | The system shall automatically disable Active Directory accounts for terminated employees. |
| REQ-6 | High | IT administrators shall be able to configure mappings between departments/roles and Active Directory security groups. |
| REQ-7 | High | IT administrators shall be able to manually approve, modify, or override automated account actions. |
| REQ-8 | Medium | IT administrators shall be able to configure the polling interval for HR system synchronization. |
| REQ-9 | High | The system shall maintain comprehensive audit logs of all account lifecycle events. |
| REQ-10 | Medium | IT administrators shall be able to generate compliance reports for specified date ranges. |
| REQ-11 | Medium | HR personnel shall be able to view the provisioning status of newly entered employees. |
| REQ-12 | Low | HR personnel shall be able to flag high-priority onboarding requests for expedited processing. |
| REQ-13 | Medium | Department managers shall be able to view account status for their direct reports. |
| REQ-14 | Low | Department managers shall be able to submit requests for additional access or permissions for team members. |
| REQ-15 | Medium | The system shall send notifications to stakeholders when account actions are completed or require attention. |

### 3.2 Nonfunctional Requirements (FURPS)

| No. | Category | Priority | Description |
|-----|----------|----------|-------------|
| NFR-1 | Functionality | High | The system shall integrate with OrangeHRM via direct MySQL database polling. |
| NFR-2 | Functionality | High | The system shall communicate with Active Directory via LDAP or LDAPS protocol. |
| NFR-3 | Usability | Medium | The dashboard shall display pending, completed, and failed tasks in a clear visual layout with status indicators. |
| NFR-4 | Usability | Medium | The system shall provide intuitive navigation between different functional areas via a persistent sidebar. |
| NFR-5 | Reliability | High | The system shall retry failed operations up to a configurable limit (default: 3) before marking them as failed. |
| NFR-6 | Reliability | High | The system shall continue operating normally if individual account operations fail (graceful degradation). |
| NFR-7 | Performance | Medium | The system shall detect and process new employee changes within 5 minutes of the configured polling interval. |
| NFR-8 | Performance | Medium | Account creation and disabling operations shall complete within 30 seconds. |
| NFR-9 | Supportability | Medium | The system shall log all errors with sufficient detail (timestamps, error codes, context) for troubleshooting. |
| NFR-10 | Supportability | Low | The system shall support configuration changes (mappings, intervals, notifications) without code modifications. |

---

## 4. Functional Requirements Specification

### 4.1 Stakeholders

| Stakeholder | Interest in the System |
|-------------|------------------------|
| **IT Administrators** | Primary users who manage account lifecycle operations, configure automation rules, handle exceptions, and ensure security compliance. They benefit from reduced manual workload and fewer errors. |
| **HR Personnel** | Staff who maintain employee records in OrangeHRM and need visibility into IT provisioning status to confirm that new hires receive timely access and departing employees are offboarded. |
| **Department Managers** | Leaders responsible for ensuring their new hires have appropriate access on day one and that departing team members are properly offboarded. They may request additional permissions for team members. |
| **Compliance Officers** | Reviewers who require audit trails to verify that account access changes follow organizational policies and regulatory requirements. |
| **CIO / IT Director** | Project sponsor who seeks reduced operational cost, improved security posture, and elimination of orphaned accounts through automation. |
| **Employees (End Users)** | Indirect beneficiaries who receive timely account access upon hiring, ensuring productive first days without waiting for manual IT provisioning. |

### 4.2 Actors and Goals

**Primary Actors**

- **IT Administrator:** Configures automation rules, manages department-to-security-group mappings, approves or overrides automated account actions, views audit logs, generates compliance reports, and searches employee account status. Has full control over system settings and can intervene in any automated workflow.

- **HR Personnel:** Views the provisioning status of newly entered employees, flags high-priority onboarding requests for expedited processing, confirms successful completion of offboarding procedures, and accesses a read-only view of employee account status.

- **Department Manager:** Views account status for their direct reports, submits requests for additional access or permissions for team members, and receives notifications when team member accounts are provisioned or modified.

**Secondary Actors**

- **System (Automation Engine):** Polls the OrangeHRM database at configured intervals to detect new hires and terminations, automatically creates or disables Active Directory accounts, assigns security groups based on configured role-permission mappings, sends notifications to stakeholders, and retries failed operations.

- **OrangeHRM (External System):** The human resource management system that serves as the authoritative source of employee data.

- **Active Directory (External System):** The directory service that receives account creation, modification, and disabling commands from the automation engine via LDAP protocol.

### 4.3 Use Cases

#### IT Administrator (total: 25 points)

| Use Case | Description | Est. |
|----------|-------------|------|
| Login/Logout | Authenticate to the system using credentials and manage session with JWT-based access control | 4 |
| View Dashboard | View a real-time dashboard displaying pending, in-progress, completed, and failed onboarding/offboarding tasks with statistics | 2 |
| Configure Role-Permission Mappings | Set up and maintain mappings between HR departments/job roles and Active Directory security groups | 4 |
| Approve/Override Account Actions | Review pending automated account actions and manually approve, modify, or reject them before execution | 4 |
| Configure Polling Interval | Set the frequency at which the system polls OrangeHRM for employee status changes | 2 |
| View Audit Logs | Browse and search a chronological record of all account lifecycle events for compliance and troubleshooting | 3 |
| Generate Compliance Reports | Create and export compliance or activity summary reports for specified date ranges and department filters | 4 |
| Search Employee Status | Look up any employee by name, ID, or email and view their current Active Directory account status | 2 |

#### HR Personnel (total: 8 points)

| Use Case | Description | Est. |
|----------|-------------|------|
| View Provisioning Status | Check the current provisioning status of newly entered employees to confirm account creation is underway | 2 |
| Flag High-Priority Onboarding | Mark an onboarding request as urgent so the system processes it ahead of normal-priority tasks | 2 |
| Confirm Offboarding | Verify and acknowledge that offboarding procedures have been successfully completed for a departed employee | 2 |
| View Employee Account Status | Access a read-only view of any employee's current Active Directory account status | 2 |

#### Department Manager (total: 7 points)

| Use Case | Description | Est. |
|----------|-------------|------|
| View Team Account Status | View the current account provisioning status for all direct reports in the department | 2 |
| Request Additional Access | Submit a request for additional security groups or permissions for a team member, routed to IT for approval | 3 |
| Receive Notifications | Receive alerts when team member accounts are provisioned, modified, or when actions require attention | 2 |

#### System — Automation Engine (total: 18 points)

| Use Case | Description | Est. |
|----------|-------------|------|
| Poll HRM for Changes | Periodically query the OrangeHRM database to detect new hires and terminations | 3 |
| Process Onboarding | Create a new AD account for a detected new hire and trigger security group assignment and notifications | 4 |
| Process Offboarding | Disable the AD account and revoke group memberships for a detected terminated employee | 3 |
| Assign Security Groups | Automatically assign AD security groups based on the employee's department and role mappings | 3 |
| Send Notifications | Dispatch in-app notifications to relevant stakeholders when account actions complete or fail | 3 |
| Retry Failed Operations | Automatically retry a failed account operation up to the configured limit before marking the task as failed | 2 |

**Grand Total: 58 points (~29 engineer-days)**

#### Use Case Relationships

**\<\<include\>\> relationships (mandatory behavior):**
- Process Onboarding **\<\<include\>\>** Assign Security Groups — Every onboarding task always assigns security groups based on department/role mappings.
- Process Onboarding **\<\<include\>\>** Send Notifications — Stakeholders are always notified after an onboarding action completes or fails.
- Process Offboarding **\<\<include\>\>** Send Notifications — Stakeholders are always notified after an offboarding action completes or fails.

**\<\<extend\>\> relationships (optional/conditional behavior):**
- Approve/Override Account Actions **\<\<extend\>\>** Process Onboarding — An IT administrator may optionally intervene before onboarding executes.
- Approve/Override Account Actions **\<\<extend\>\>** Process Offboarding — An IT administrator may optionally intervene before offboarding executes.
- Flag High-Priority Onboarding **\<\<extend\>\>** Process Onboarding — HR personnel may optionally flag a task for expedited processing.
- Retry Failed Operations **\<\<extend\>\>** Process Onboarding — The system retries only if the onboarding operation fails.
- Retry Failed Operations **\<\<extend\>\>** Process Offboarding — The system retries only if the offboarding operation fails.

### 4.4 Class Diagram — Component Overview

*See attached file: `Class-Diagram.drawio` (included in 1_code folder)*

| Category | Classes |
|----------|---------|
| **Core Entities** | Employee, ADAccount, Department, SecurityGroup |
| **Configuration** | RolePermissionMapping, SystemConfiguration |
| **Workflow** | LifecycleTask, TaskAction |
| **Audit and Reporting** | AuditLog, Notification, Report |
| **Access Control** | User |

### 4.5 Enumerations

| Enumeration | Values | Description |
|-------------|--------|-------------|
| UserRole | IT_ADMIN, HR_PERSONNEL, DEPT_MANAGER, COMPLIANCE_OFFICER | Defines the role-based access level of a system user |
| EmployeeStatus | ACTIVE, TERMINATED, PENDING | Represents the current lifecycle state of an employee |
| TaskType | ONBOARD, OFFBOARD | Categorizes a lifecycle task as either onboarding or offboarding |
| TaskStatus | PENDING, IN_PROGRESS, COMPLETED, FAILED | Tracks the execution state of a lifecycle task |
| ActionType | CREATE_ACCOUNT, DISABLE_ACCOUNT, ASSIGN_GROUP, REMOVE_GROUP | Specifies the type of Active Directory operation |
| ActionStatus | PENDING, EXECUTING, SUCCESS, FAILED | Tracks the execution state of an individual task action |
| Priority | NORMAL, HIGH | Indicates the processing priority of a lifecycle task |
| NotificationType | INFO, WARNING, ERROR | Categorizes the severity of a notification |
| ReportType | COMPLIANCE, ACTIVITY_SUMMARY, FAILED_ACTIONS | Specifies the type of report to generate |

### 4.6 Data Types and Operation Signatures

#### Class: User
A system user who accesses the application. Each user has a role that determines their permissions.

| Attribute | Type | Description |
|-----------|------|-------------|
| userId | int | Unique identifier for the user |
| username | String | Login username for authentication |
| passwordHash | String | Bcrypt-hashed password |
| email | String | Email address for notifications |
| role | UserRole | The user's role determining access level |
| departmentId | int | Foreign key referencing the user's department |
| createdAt | DateTime | Timestamp when the user account was created |

| Operation | Signature | Description |
|-----------|-----------|-------------|
| login | login(username: String, password: String): boolean | Authenticates credentials; returns true on success |
| logout | logout(): void | Terminates the user's active session |
| getPermissions | getPermissions(): List | Returns the list of permissions for the user's role |

#### Class: Employee
An employee record synchronized from OrangeHRM. Represents a person whose account lifecycle is managed by this system.

| Attribute | Type | Description |
|-----------|------|-------------|
| employeeId | int | Unique identifier in this system |
| hrmId | String | The employee's unique identifier in OrangeHRM |
| firstName | String | Employee's first name |
| lastName | String | Employee's last name |
| email | String | Employee's work email address |
| departmentId | int | Foreign key referencing the employee's department |
| jobTitle | String | The employee's job title/role |
| startDate | Date | The employee's hire date |
| terminationDate | Date | The employee's termination date (null if active) |
| status | EmployeeStatus | Current lifecycle state: ACTIVE, TERMINATED, or PENDING |

| Operation | Signature | Description |
|-----------|-----------|-------------|
| getFullName | getFullName(): String | Returns the concatenation of firstName and lastName |
| isNewHire | isNewHire(): boolean | Returns true if the employee was added within the current polling cycle |
| isTerminated | isTerminated(): boolean | Returns true if the employee's status is TERMINATED |

#### Class: Department

| Attribute | Type | Description |
|-----------|------|-------------|
| departmentId | int | Unique identifier for the department |
| name | String | Display name of the department |
| hrmDepartmentId | String | The department's unique identifier in OrangeHRM |

| Operation | Signature | Description |
|-----------|-----------|-------------|
| getMappings | getMappings(): List | Returns all role-permission mappings for this department |
| getEmployees | getEmployees(): List | Returns all employees belonging to this department |

#### Class: SecurityGroup
An Active Directory security group that controls access to resources.

| Attribute | Type | Description |
|-----------|------|-------------|
| groupId | int | Unique identifier for the security group |
| groupName | String | Display name of the AD security group |
| distinguishedName | String | The full LDAP distinguished name (DN) of the group in Active Directory |
| description | String | A brief description of the group's purpose |

#### Class: RolePermissionMapping
Maps a department and job role combination to an AD security group.

| Attribute | Type | Description |
|-----------|------|-------------|
| mappingId | int | Unique identifier for the mapping |
| departmentId | int | Foreign key referencing the department |
| roleName | String | The job title/role this mapping applies to |
| securityGroupId | int | Foreign key referencing the target security group |
| createdBy | int | Foreign key referencing the user who created this mapping |
| createdAt | DateTime | Timestamp when the mapping was created |

#### Class: LifecycleTask
A workflow task representing an onboarding or offboarding operation for a specific employee.

| Attribute | Type | Description |
|-----------|------|-------------|
| taskId | int | Unique identifier for the task |
| employeeId | int | Foreign key referencing the target employee |
| taskType | TaskType | ONBOARD or OFFBOARD |
| status | TaskStatus | PENDING, IN_PROGRESS, COMPLETED, or FAILED |
| priority | Priority | NORMAL or HIGH |
| assignedTo | int | Foreign key referencing the assigned user (null if automated) |
| createdAt | DateTime | Timestamp when the task was created |
| completedAt | DateTime | Timestamp when the task was completed |

| Operation | Signature | Description |
|-----------|-----------|-------------|
| approve | approve(): void | Marks the task as approved and triggers execution |
| reject | reject(reason: String): void | Cancels the task with a documented reason |
| retry | retry(): void | Resets failed actions and re-executes the task |
| getActions | getActions(): List | Returns all actions belonging to this task |

#### Class: TaskAction
An individual atomic action within a lifecycle task (e.g., create account, assign group).

| Attribute | Type | Description |
|-----------|------|-------------|
| actionId | int | Unique identifier for the action |
| taskId | int | Foreign key referencing the parent task |
| actionType | ActionType | CREATE_ACCOUNT, DISABLE_ACCOUNT, ASSIGN_GROUP, or REMOVE_GROUP |
| targetGroup | String | The DN of the target security group (null for account actions) |
| status | ActionStatus | PENDING, EXECUTING, SUCCESS, or FAILED |
| errorMessage | String | Error details if the action failed |
| executedAt | DateTime | Timestamp when the action was last executed |
| retryCount | int | Number of retry attempts made |

| Operation | Signature | Description |
|-----------|-----------|-------------|
| execute | execute(): boolean | Performs the AD operation; returns true on success |
| retry | retry(): void | Increments retryCount and re-executes the action |
| markFailed | markFailed(): void | Sets status to FAILED after exhausting retry attempts |

#### Class: AuditLog
A chronological, immutable record of an account lifecycle event.

| Attribute | Type | Description |
|-----------|------|-------------|
| logId | int | Unique identifier for the log entry |
| timestamp | DateTime | When the event occurred |
| actionType | String | Description of the action performed |
| targetEmployeeId | int | Foreign key referencing the affected employee |
| performedBy | String | Username of the actor, or "System" for automated actions |
| status | String | Outcome of the action (SUCCESS or FAILED) |
| details | String | Additional context or error messages |

#### Class: Notification

| Attribute | Type | Description |
|-----------|------|-------------|
| notificationId | int | Unique identifier for the notification |
| recipientId | int | Foreign key referencing the recipient user |
| taskId | int | Foreign key referencing the related lifecycle task |
| message | String | The notification message body |
| type | NotificationType | Severity: INFO, WARNING, or ERROR |
| isRead | boolean | Whether the recipient has read the notification |
| createdAt | DateTime | Timestamp when the notification was created |

| Operation | Signature | Description |
|-----------|-----------|-------------|
| markAsRead | markAsRead(): void | Sets isRead to true |
| send | send(): void | Dispatches the notification to the recipient |

#### Class: Report

| Attribute | Type | Description |
|-----------|------|-------------|
| reportId | int | Unique identifier for the report |
| reportType | ReportType | COMPLIANCE, ACTIVITY_SUMMARY, or FAILED_ACTIONS |
| startDate | Date | Beginning of the report date range |
| endDate | Date | End of the report date range |
| generatedBy | int | Foreign key referencing the user who generated the report |
| generatedAt | DateTime | Timestamp when the report was generated |
| departmentFilter | String | Department IDs to filter by (null = all departments) |

| Operation | Signature | Description |
|-----------|-----------|-------------|
| generate | generate(): void | Queries audit logs and task data to populate the report |
| exportCSV | exportCSV(): File | Exports the report data as a CSV file |

#### Class: SystemConfiguration
Global settings controlling automation behavior.

| Attribute | Type | Description |
|-----------|------|-------------|
| configId | int | Unique identifier for the configuration record |
| pollingInterval | int | Interval in minutes between OrangeHRM polls |
| retryLimit | int | Maximum retry attempts for failed operations |
| notificationsEnabled | boolean | Whether the notification system is active |
| lastSyncTimestamp | DateTime | Timestamp of the most recent successful sync |

#### Class: ADAccount
An Active Directory user account managed by this system.

| Attribute | Type | Description |
|-----------|------|-------------|
| accountId | int | Unique identifier for the AD account record |
| employeeId | int | Foreign key referencing the associated employee |
| samAccountName | String | The AD sAMAccountName (login name) |
| distinguishedName | String | The full LDAP distinguished name |
| isEnabled | boolean | Whether the account is currently enabled |
| createdAt | DateTime | Timestamp when the AD account was created |
| disabledAt | DateTime | Timestamp when the account was disabled |

| Operation | Signature | Description |
|-----------|-----------|-------------|
| enable | enable(): void | Enables the AD account via LDAP |
| disable | disable(): void | Disables the AD account via LDAP |
| addToGroup | addToGroup(groupDN: String): void | Adds this account to the specified AD security group |
| removeFromGroup | removeFromGroup(groupDN: String): void | Removes this account from the specified AD security group |

### 4.7 Class Relationships

| Relationship | Type | Multiplicity | Description |
|--------------|------|--------------|-------------|
| User — Department | Association | Many-to-one | Each User belongs to one Department |
| Employee — Department | Association | Many-to-one | Each Employee belongs to one Department |
| Employee — ADAccount | Association | One-to-one | Each Employee has at most one ADAccount |
| Employee — LifecycleTask | Association | One-to-many | Each Employee may have multiple LifecycleTasks |
| Department — RolePermissionMapping | Association | One-to-many | Each Department may have multiple mappings |
| RolePermissionMapping — SecurityGroup | Association | Many-to-one | Each mapping references one SecurityGroup |
| LifecycleTask — TaskAction | Composition | One-to-many | Each task contains one or more TaskActions |
| LifecycleTask — AuditLog | Association | One-to-many | Each task generates one or more AuditLog entries |
| LifecycleTask — Notification | Association | One-to-many | Each task may trigger one or more Notifications |
| User — Notification | Association | One-to-many | Each User may receive multiple Notifications |
| User — Report | Association | One-to-many | Each User may generate multiple Reports |

---

## 5. System Sequence Diagrams

### SSd-1: Automatic Onboarding (New Hire Detected)

```
  Scheduler        OrangeHRM DB       ProvisioningService    ADConnector        MySQL DB
     |                  |                     |                   |                |
     |--pollForChanges()->|                   |                   |                |
     |<--[new employee]--|                   |                   |                |
     |--processOnboarding(employee)--------->|                   |                |
     |                  |          createADAccount(employee)---->|                |
     |                  |                   |<--[account created]|                |
     |                  |          assignGroups(mappings)------->|                |
     |                  |                   |<--[groups assigned]|                |
     |                  |          writeAuditLog(SUCCESS)------------------------>|
     |                  |          createNotification(INFO)---------------------->|
     |<--[task COMPLETED]                   |                   |                |
```

### SSd-2: Automatic Deprovisioning (Termination Detected)

```
  Scheduler        OrangeHRM DB     DeprovisioningService   ADConnector        MySQL DB
     |                  |                     |                   |                |
     |--pollForChanges()->|                   |                   |                |
     |<--[termination]--|                    |                   |                |
     |--processOffboarding(employee)-------->|                   |                |
     |                  |          disableADAccount(dn)--------->|                |
     |                  |                   |<--[account disabled]               |
     |                  |          removeGroups(memberships)---->|                |
     |                  |                   |<--[groups removed] |                |
     |                  |          writeAuditLog(SUCCESS)------------------------>|
     |                  |          createNotification(WARNING)-------------------->|
     |<--[task COMPLETED]                   |                   |                |
```

### SSd-3: IT Admin Approves a Task Override

```
  IT Admin        React Frontend       Express API        ProvisioningService   ADConnector
     |                  |                   |                     |                  |
     |--[click Approve]->|                  |                     |                  |
     |                  |--PUT /tasks/:id/approve---------------->|                  |
     |                  |                   |--approveTask(id)--->|                  |
     |                  |                   |           executeActions(overrides)--->|
     |                  |                   |                     |<--[AD response]--|
     |                  |                   |<--[200 OK]----------|                  |
     |                  |<--[task updated]--|                     |                  |
     |<--[Dashboard refreshes]             |                     |                  |
```

### SSd-4: Generate and Download Compliance Report

```
  IT Admin        React Frontend       Express API          MySQL DB
     |                  |                   |                   |
     |--[click Generate]->|                 |                   |
     |                  |--POST /reports--->|                   |
     |                  |                   |--queryAuditLogs()->|
     |                  |                   |<--[log rows]-------|
     |                  |                   |--queryTasks()----->|
     |                  |                   |<--[task rows]------|
     |                  |<--[report object]-|                   |
     |<--[preview shown] |                  |                   |
     |--[click Download CSV]->|             |                   |
     |                  |--GET /reports/:id/download----------->|
     |                  |<--[CSV file]------|                   |
     |<--[file saved]   |                  |                   |
```

---

## 6. Activity Diagram

### Employee Onboarding/Offboarding Automation Flow

```
[START]
   |
   v
[Scheduler fires (polling interval elapsed)]
   |
   v
[Query OrangeHRM DB for employee changes]
   |
   +--[No changes found]---> [Log "no changes"; wait for next interval] --> [END]
   |
   v
[Changes detected: new hires and/or terminations]
   |
   +--[New hire detected]------------------------+
   |                                             |
   |                                             v
   |                             [Create LifecycleTask (ONBOARD, PENDING)]
   |                                             |
   |                                             v
   |                             [Lookup role-permission mappings for
   |                              employee department + job title]
   |                                             |
   |                                             v
   |                             [ADConnector: createUser(employee)]
   |                                             |
   |                        +----[FAIL]----------+----------[SUCCESS]----+
   |                        |                                            |
   |                        v                                            v
   |              [retryCount < retryLimit?]              [ADConnector: addToGroup()
   |                 |              |                       for each mapped group]
   |              [YES]          [NO]                                    |
   |                |              |                        [Task -> COMPLETED]
   |           [Retry action] [Task -> FAILED]             [Write AuditLog: SUCCESS]
   |                              |                        [Create Notification: INFO]
   |                   [Write AuditLog: FAILED]                         |
   |                   [Create Notification: ERROR]                     |
   |                                                                    |
   +--[Termination detected]--------------------+                       |
                                                |                       |
                                                v                       |
                               [Create LifecycleTask (OFFBOARD, PENDING)]
                                                |
                                                v
                               [ADConnector: disableUser(employee.dn)]
                                                |
                               [ADConnector: removeFromGroups()]
                                                |
                        +----[FAIL]-------------+----------[SUCCESS]---+
                        |                                              |
                        v                                              v
              [Retry or mark FAILED]                    [Task -> COMPLETED]
              [Write AuditLog: FAILED]                  [Write AuditLog: SUCCESS]
              [Create Notification: ERROR]               [Create Notification: WARNING]
                                                                       |
                                                                       v
                                                               [END of cycle]
```

---

## 7. User Interface Specification

### 7.1 Global Layout and Navigation

Every screen in the system follows a consistent three-zone layout:

```
+------------------------------------------------------------------+
|  IT Lifecycle System                       [Bell 3] Admin|Logout |  <- Top Bar
+----------------+-------------------------------------------------+
| Navigation     |                                                  |
|                |           Main Content Area                      |
|  Dashboard     |                                                  |
|  Employees     |                                                  |
|  Tasks         |                                                  |
|  Mappings      |                                                  |
|  Audit Log     |                                                  |
|  Reports       |                                                  |
|  Access Reqs   |                                                  |
|  Notifications |                                                  |
|  Settings      |                                                  |
+----------------+-------------------------------------------------+
```

**Navigation Paths:**
```
Login
  └── Dashboard (default landing page after login)
        ├── [Employees]      → Employee Search (click row → AD detail modal)
        ├── [Tasks]          → Task List (filter by status/type, flag priority)
        ├── [Mappings]       → Role-Permission Mapping Configuration
        ├── [Audit Log]      → Audit Log Viewer (date filter + CSV export)
        ├── [Reports]        → Report Generation (filter + CSV download)
        ├── [Access Reqs]    → Access Request list (approve/reject)
        ├── [Notifications]  → Notification list (mark as read)
        └── [Settings]       → System Configuration (polling, retry, notifications)
```

### 7.2 UI-1: Main Dashboard

**Description:** The landing page after login. Provides a real-time overview of all lifecycle task activity and OrangeHRM sync status.

```
+------------------------------------------------------------------+
|  IT Lifecycle System                       [Bell 3] Admin|Logout |
+----------------+-----------------------------------+-------------+
| ► Dashboard    |  [Pending][In Progress][Done/Fail]|  Stats      |
|  Employees     | --------------------------------- |  +--------+ |
|  Tasks         | John Smith     [ONBOARD]          |  |   5    | |
|  Mappings      | Engineering | 2026-02-07 9:30AM   |  | Pending| |
|  Audit Log     | [View Details] [Approve] [Reject]  |  +--------+ |
|  Reports       | --------------------------------- |  +--------+ |
|  Access Reqs   | Jane Doe       [OFFBOARD]         |  |  12    | |
|  Notifications | Marketing | 2026-02-07 8:15AM     |  |Complete| |
|  Settings      | [View Details] [Approve] [Reject]  |  +--------+ |
|                |                                   |  +--------+ |
|                | [OrangeHRM Sync Panel]            |  |   2    | |
|                | Status: Connected                  |  | Failed | |
|                | [Sync Now]                        |  +--------+ |
+----------------+-----------------------------------+-------------+
```

### 7.3 UI-2: Department Mapping Configuration

**Description:** Allows IT Administrators to define which AD security groups are assigned to employees based on department and role.

```
+------------------------------------------------------------------+
|  Settings > Department Mappings                                  |
+---------------------------+--------------------------------------+
| Departments               | Engineering - Security Groups        |
|                           |                        [+ Add Group] |
| [Search departments..]    | Default Groups (all roles):          |
| ─────────────────────     | [Domain Users     ] [x]             |
| ■ Engineering             | [Engineering-All  ] [x]             |
|   Marketing               | [VPN-Access       ] [x]             |
|   Finance                 |                                      |
|   Human Resources         | Role-Specific Groups:                |
|   Sales                   | ▶ Software Engineer    3 groups      |
|   IT                      | ▶ Senior Engineer      5 groups      |
|                           |                    [Save Changes]    |
+---------------------------+--------------------------------------+
```

### 7.4 UI-3: Task Detail View (Modal)

**Description:** A modal overlay showing full employee details, proposed AD actions, and override options before approval.

```
+======================================================+
|  John Smith                       [ONBOARD]      [x] |
+======================================================+
|  Employee Information                                 |
|  Name: John Smith        Employee ID: EMP-2024-0156   |
|  Department: Engineering Job Title: Software Engineer |
+======================================================+
|  Proposed Actions                                     |
|  [ok] Create AD Account: jsmith@stechlab.net          |
|  [ok] Assign: Domain Users                            |
|  [ok] Assign: Engineering-All                         |
|  [ok] Assign: VPN-Access                              |
+======================================================+
|  Override (Add/Remove Groups)                         |
|  [ ] Add: Admin-Elevated    [ ] Add: AWS-Developers   |
|  [ ] Add: DB-ReadOnly       [x] Remove: VPN-Access    |
+======================================================+
|         [Reject with Reason] [Save for Later] [Approve]|
+======================================================+
```

### 7.5 UI-4: Audit Log Viewer

**Description:** Searchable, filterable record of all account lifecycle events with CSV export.

```
+------------------------------------------------------------------+
|  Audit Logs                               [Export CSV]           |
+------------------------------------------------------------------+
|  From: [02/01/2026]  To: [03/09/2026]  [Apply Filters]          |
+------------------------------------------------------------------+
| Timestamp           | Action        | Employee        | Status   |
| 2026-03-09 09:45:23 | Acct Created  | Stephen T.      |[Success] |
| 2026-03-09 08:30:15 | Acct Disabled | John Doe        |[Success] |
| 2026-03-08 16:22:08 | Group Modified| Stephen T.      |[Success] |
+------------------------------------------------------------------+
|  Showing 1-25 of 156 entries         [< Prev] [1][2] [Next >]   |
+------------------------------------------------------------------+
```

### 7.6 UI-5: Report Generation

**Description:** Form-based interface for generating and downloading compliance and activity reports.

```
+------------------------------------------------------------------+
|  Reports                                                         |
+----------------------+-------------------------------------------+
| Report Configuration | Report Preview          [Download CSV]    |
|                      | +---------------------------------------+ |
| Report Type:         | | Compliance Report                     | |
| [Compliance Report v]| | Period: Jan 1 – Mar 9, 2026           | |
|                      | +---------------------------------------+ |
| Date Range:          | | Summary                               | |
| [Start Date]         | | [45 Created][12 Disabled][2% Fail]    | |
| [End Date  ]         | +---------------------------------------+ |
|                      | | By Department                         | |
| Department:          | | Engineering | 18 | 5 | 100%           | |
| [All Departments  v] | | Marketing   | 12 | 3 | 93%            | |
|                      | +---------------------------------------+ |
| [Generate Preview]   |                                          |
+----------------------+-------------------------------------------+
```

### 7.7 UI-6: Employee Search & Status Lookup

**Description:** Search employees by name, ID, or email; click a row to view AD account details.

```
+------------------------------------------------------------------+
|  Employee Lookup                                                  |
+------------------------------------------------------------------+
|  [Search by name, ID, or email...]                    [Search]   |
+------------------------------------------------------------------+
| Name           | ID            | Dept       | Status   | Action  |
| Stephen T.     | EMP-2024-0001 | IT         | [Active] | Mar 9   |
| John Doe       | EMP-2024-0002 | Accounting | [Active] | Mar 9   |
+------------------------------------------------------------------+
|  Click a row to view Active Directory account details            |
+------------------------------------------------------------------+
```

### 7.8 User Effort Estimation

| Scenario | Mouse Clicks | Keystrokes | Total |
|----------|-------------|------------|-------|
| A: Quick-approve a pending task | 2 | 0 | 2 |
| B: Approve with group override | 6 | 0 | 6 |
| C: Search for employee by name | 4 | 5–6 | 9–10 |
| D: Add a new group mapping | 7 | 7 | 14 |
| E: Generate and download a report | 13 | 0 | 13 |
| F: Filter audit logs for failures | 5 | 0 | 5 |

The most common operations (approving a task, searching for an employee, viewing audit logs) require 5 or fewer total interactions, consistent with the system's goal of reducing IT workload.

---

## 8. Project Plan

### Development Schedule

| Week | Status | Milestones |
|------|--------|------------|
| 1–2 | **Complete** | Project proposal submitted and approved |
| 3–4 | **Complete** | System requirements documentation; environment setup (OrangeHRM + AD VM) |
| 5–7 | **Complete** | MySQL schema deployed; React frontend connected to Node.js backend; core dashboard UI built |
| 8 | **Complete** | Mid-term milestone: core onboarding automation working end-to-end; demo recording |
| 9–11 | **Complete** | Offboarding automation; notification system; audit logging; access request workflow |
| 12–14 | **In Progress** | Reporting and analytics; approval workflow refinements; unit and integration tests |
| 15 | **Planned** | Final integration testing; final demo recording; complete project documentation |

### Current Implementation Status (Mid-Term)

All 15 functional requirements (REQ-1 through REQ-15) have been implemented:

| REQ | Feature | Status |
|-----|---------|--------|
| REQ-1, REQ-4 | OrangeHRM polling (new hires + terminations) | Complete |
| REQ-2 | AD account creation via LDAP | Complete |
| REQ-3 | Security group assignment from mappings | Complete |
| REQ-5 | AD account disable on termination | Complete |
| REQ-6 | Role-permission mapping configuration UI | Complete |
| REQ-7 | Task approve/reject/override workflow | Complete |
| REQ-8 | Configurable polling interval | Complete |
| REQ-9 | Audit log with date filter and CSV export | Complete |
| REQ-10 | Compliance report generation + CSV download | Complete |
| REQ-11, REQ-13 | Employee search with AD account detail | Complete |
| REQ-12 | High-priority task flagging | Complete |
| REQ-14 | Access request submission and approval | Complete |
| REQ-15 | In-app notifications with unread badge | Complete |

### Planned for Final Submission

- LDAPS (encrypted AD communication on port 636)
- Role-based UI views (HR Personnel, Department Manager scoped views)
- Unit tests (Jest) for provisioning, deprovisioning, and notification services
- Integration tests for end-to-end lifecycle flows

### Software Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Material UI (MUI) |
| Backend | Node.js, Express 4 |
| Database | MySQL 8 (12-table schema) |
| HR Integration | OrangeHRM 5.x (direct MySQL polling via node-schedule) |
| Directory | Windows Active Directory, ldapjs (LDAP) |
| Auth | JWT (jsonwebtoken) |

---

## 9. References

1. OrangeHRM. (2024). *OrangeHRM Open Source Documentation*. https://www.orangehrm.com
2. Microsoft Corporation. (2024). *Active Directory Domain Services Overview*. Microsoft Docs. https://docs.microsoft.com/en-us/windows-server/identity/ad-ds/get-started/virtual-dc/active-directory-domain-services-overview
3. ldapjs Contributors. (2024). *ldapjs — LDAP Client and Server for Node.js*. http://ldapjs.org
4. OpenJS Foundation. (2024). *Node.js Documentation*. https://nodejs.org/en/docs
5. Meta Open Source. (2024). *React Documentation*. https://react.dev
6. MUI. (2024). *Material UI Component Library*. https://mui.com
7. MySQL AB. (2024). *MySQL 8.0 Reference Manual*. https://dev.mysql.com/doc/refman/8.0/en
8. OWASP Foundation. (2024). *OWASP Top Ten*. https://owasp.org/www-project-top-ten
9. JSON Web Tokens. (2024). *Introduction to JSON Web Tokens*. https://jwt.io/introduction

---

## 10. Traceability Matrix

The following table maps each functional requirement to the implementing source files and the corresponding test coverage.

| REQ | Description (short) | Implementing Files | Test File |
|-----|---------------------|--------------------|-----------|
| REQ-1 | Auto-detect new employees | `scheduler/poller.js` | `provisioningService.test.js` |
| REQ-2 | Create AD accounts | `services/provisioningService.js`, `connectors/ADConnector.js` | `provisioningService.test.js` |
| REQ-3 | Assign AD security groups | `models/RoleMapping.js`, `services/provisioningService.js` | `provisioningService.test.js` |
| REQ-4 | Auto-detect terminations | `scheduler/poller.js` | `deprovisioningService.test.js` |
| REQ-5 | Disable AD accounts | `services/deprovisioningService.js`, `connectors/ADConnector.js` | `deprovisioningService.test.js` |
| REQ-6 | Configure dept/role→group mappings | `controllers/mappingController.js`, `models/RoleMapping.js`, `pages/MappingConfig.jsx` | `tasks.test.js` |
| REQ-7 | Approve/override automated actions | `controllers/taskController.js`, `routes/tasks.js` | `tasks.test.js` |
| REQ-8 | Configure polling interval | `controllers/configController.js`, `models/SystemConfig.js`, `pages/Settings.jsx` | `auth.test.js` |
| REQ-9 | Audit log of all lifecycle events | `models/AuditLog.js`, `controllers/auditController.js` | `audit.test.js` |
| REQ-10 | Generate compliance reports | `controllers/reportController.js`, `models/Report.js`, `pages/ReportGeneration.jsx` | `auth.test.js` |
| REQ-11 | View provisioning status | `controllers/employeeController.js`, `pages/EmployeeSearch.jsx` | `employees.test.js` |
| REQ-12 | Flag high-priority onboarding | `controllers/taskController.js` (setPriority), `pages/TaskList.jsx` | `tasks.test.js` |
| REQ-13 | View team account status | `controllers/employeeController.js`, `pages/EmployeeSearch.jsx` | `employees.test.js` |
| REQ-14 | Submit additional-access requests | `controllers/accessRequestController.js`, `pages/AccessRequests.jsx` | `auth.test.js` |
| REQ-15 | Notifications on account actions | `services/notificationService.js`, `models/Notification.js`, `components/Layout.jsx` | `provisioningService.test.js`, `deprovisioningService.test.js` |

**NFR Traceability**

| NFR | Description (short) | Implementing Files |
|-----|---------------------|--------------------|
| NFR-1 | OrangeHRM integration | `connectors/OrangeHRMDbConnector.js`, `scheduler/poller.js` |
| NFR-2 | LDAP communication | `connectors/ADConnector.js`, `config/ad.js` |
| NFR-3 | Clear dashboard layout | `pages/Dashboard.jsx`, `components/Layout.jsx` |
| NFR-4 | Intuitive sidebar navigation | `components/Layout.jsx` |
| NFR-5 | Retry up to configurable limit | `utils/withRetry` (inline in services), `models/SystemConfig.js` |
| NFR-6 | Graceful degradation on failure | `services/provisioningService.js` (try/catch per group), `services/deprovisioningService.js` |
| NFR-7 | Process changes within poll interval | `scheduler/poller.js` (node-schedule) |
| NFR-8 | AD operations complete in <30s | `connectors/ADConnector.js` (ldapjs synchronous LDAP ops) |
| NFR-9 | Detailed error logging | All services log to `AuditLog` and `console.error` |
| NFR-10 | Runtime config changes | `controllers/configController.js`, `models/SystemConfig.js` |

---

## 11. System Architecture and System Design

*See also: `diagrams/SystemArchitecture.png`*

### 11.1 Component Overview

```
OrangeHRM MySQL ──(direct SQL, every N min)──► OrangeHRMDbConnector.js
                                                        │
                                               scheduler/poller.js
                                             (node-schedule cron)
                                                        │
                   ┌────────────────────────────────────┼──────────────────────┐
                   ▼                                    ▼                      ▼
         provisionEmployee()              syncEmployeeProfile()    deprovisionEmployee()
                   │                                    │                      │
                   └────────────────────────────────────┘──────────────────────┘
                                                        │
                                               ADConnector.js (ldapjs)
                                                        │
                                           Windows Active Directory (LDAP 389)

React :3000 ──── axios (api/client.js) ──► Express API :4000 ──► MySQL it_lifecycle
                  (JWT Bearer header)
```

### 11.2 Component Descriptions

| Component | Technology | Role |
|-----------|-----------|------|
| **React Frontend** | React 18, Material UI | IT Admin dashboard; 10 pages including Dashboard, Task List, Audit Log, Mappings, Reports |
| **Express API** | Node.js, Express 4 | 15 REST endpoints; JWT authentication; routes to controllers |
| **MySQL (it_lifecycle)** | MySQL 8 | 12-table application database: employees, tasks, audit_logs, notifications, etc. |
| **OrangeHRM MySQL** | MySQL 8 (XAMPP) | Read-only source of employee data; polled via direct SQL |
| **OrangeHRMDbConnector** | mysql2 | Executes 3 queries: fetchAllEmployees, fetchTerminatedEmployees, fetchDepartments |
| **poller.js** | node-schedule | Cron-driven poll loop; maintains in-memory `lastKnownState` map; routes changes to provision/deprovision/sync |
| **provisioningService** | Node.js | Orchestrates onboarding: DB upsert → AD create → group assignment → task steps → audit log |
| **deprovisioningService** | Node.js | Orchestrates offboarding: group removal → AD disable → DB update → audit log |
| **ADConnector** | ldapjs | 7 LDAP operations: createUser, enableUser, disableUser, updateUserAttributes, addToGroup, removeFromGroups, userExists |

### 11.3 Key Design Decisions

1. **Direct MySQL polling instead of OrangeHRM REST API** — The OrangeHRM REST API requires OAuth and has rate limits. Direct MySQL access (read-only) is simpler and more reliable for this deployment.

2. **`userAccountControl = 544` (NORMAL_ACCOUNT + PASSWD_NOTREQD)** — Allows account creation over plain LDAP without needing to set a password in the create operation. Accounts are disabled with flag `514`.

3. **In-memory `lastKnownState` map** — The poller maintains `{ empNumber → status }` in memory. This avoids a DB query per employee per poll cycle. The map is seeded from the local DB on first run.

4. **AD update before DB update in `syncEmployeeProfile`** — If the LDAP operation fails, the local DB is left unchanged so the next poll re-detects the diff and retries automatically.

5. **`system_config` always id=1** — Single-row config table seeded by `schema.sql`. All callers treat a null response as defaults.

---

## 12. Algorithms and Data Structures

### 12.1 Username Generation Algorithm

**Location:** `server/services/provisioningService.js` — `generateUsername(firstName, lastName)`

```
Input:  firstName (String), lastName (String)
Output: sAMAccountName (String, max 20 chars, lowercase, alphanumeric only)

1. base = lowercase(firstName + lastName)
2. base = remove all non-alphanumeric characters from base
3. username = base[0 .. 19]   // truncate to 20 chars
4. If username already exists in AD:
     append "2", retry
     append "3", retry
     ... up to "99"
Return username
```

**Example:** `firstName="Mary Ann"`, `lastName="O'Brien"` → `base="maryannobrien"` → `username="maryannobrien"`

### 12.2 Retry Algorithm

**Location:** Inline function `withRetry(fn, limit)` in both `provisioningService.js` and `deprovisioningService.js`

```
Input:  fn    — async function to attempt
        limit — maximum attempts (default: 3, configurable via system_config)
Output: result of fn(), or throws last error if all attempts fail

for attempt = 1 to limit:
    try:
        return await fn(attempt)
    catch error:
        lastError = error
        if attempt < limit:
            await sleep(2000 ms)

throw lastError
```

**Complexity:** O(limit) time, O(1) space. The 2-second inter-attempt delay prevents thundering-herd load on a recovering AD server.

### 12.3 Polling State Machine

**Location:** `server/scheduler/poller.js` — `poll()` and `lastKnownState`

**Data structure:** `lastKnownState: Map<empNumber: String, status: 'ACTIVE' | 'TERMINATED'>`

```
State transitions on each poll cycle:
┌─────────────────────┬──────────────────┬─────────────────────────┐
│ Previous State      │ Current OrangeHRM│ Action                  │
├─────────────────────┼──────────────────┼─────────────────────────┤
│ NOT IN MAP          │ ACTIVE           │ provisionEmployee()      │
│ NOT IN MAP          │ TERMINATED       │ (no action — skip)       │
│ ACTIVE              │ TERMINATED       │ deprovisionEmployee()    │
│ ACTIVE              │ ACTIVE           │ syncEmployeeProfile()    │
│ TERMINATED          │ TERMINATED       │ (no action — skip)       │
│ FIRST RUN (any)     │ any              │ seed lastKnownState from │
│                     │                  │ local DB; no provisioning│
└─────────────────────┴──────────────────┴─────────────────────────┘
```

**Department name→id map:** `syncDepartments()` builds `{ "Engineering": 3, "IT": 5, ... }` each poll cycle by upserting department names. This map is passed to each employee during normalization so `departmentId` is resolved before provisioning.

### 12.4 Key Data Structures

**employees table (local DB cache):**

| Column | Type | Notes |
|--------|------|-------|
| `orangehrm_id` | VARCHAR UNIQUE | External key from OrangeHRM `emp_number` |
| `status` | ENUM(ACTIVE, TERMINATED, SUSPENDED) | Drives state machine transitions |
| `department_id` | FK → departments | Resolved from OrangeHRM `custom1` field |
| `supervisor_emp_number` | VARCHAR | Used to resolve manager DN at sync time |

**ad_accounts table:**

| Column | Type | Notes |
|--------|------|-------|
| `username` | VARCHAR UNIQUE | sAMAccountName (max 20 chars) |
| `dn` | VARCHAR | Full LDAP distinguished name |
| `status` | ENUM(ACTIVE, DISABLED, DELETED) | Mirrors AD account state |

---

## 13. User Interface Design & Implementation / Design of Tests

### 13.1 UI Implementation Details

The React frontend (`client/src/`) is built with React 18 and Material UI (MUI v5).

| Concern | Implementation |
|---------|---------------|
| **Authentication** | `App.js` — `RequireAuth` HOC checks for JWT in localStorage; redirects to login if absent |
| **API calls** | `api/client.js` — Axios instance with `baseURL` from `REACT_APP_API_URL`; request interceptor attaches `Authorization: Bearer <token>`; 401 response interceptor redirects to login |
| **Notification badge** | `components/Layout.jsx` — polls `GET /api/notifications/unread-count` every 30 seconds; badge shows count |
| **Theme** | `theme.js` — MUI theme: primary `#1565c0` (blue), secondary `#00897b` (teal) |
| **Routing** | React Router v6; all routes except `/login` wrapped in `RequireAuth` |

**Key pages:**

| Page | File | Key MUI Components |
|------|------|--------------------|
| Dashboard | `pages/Dashboard.jsx` | Card, Grid, Button, CircularProgress |
| Employee Search | `pages/EmployeeSearch.jsx` | TextField, Table, Dialog, Chip |
| Task List | `pages/TaskList.jsx` | Table, Select (filters), Chip (priority badge) |
| Mapping Config | `pages/MappingConfig.jsx` | List, Dialog, Autocomplete |
| Audit Log | `pages/AuditLog.jsx` | Table, DatePicker, Button (CSV export) |
| Access Requests | `pages/AccessRequests.jsx` | Table, Button (approve/reject), Chip (status) |
| Reports | `pages/ReportGeneration.jsx` | Select, DatePicker, Button, Link (download) |
| Settings | `pages/Settings.jsx` | TextField, Switch, Button |

### 13.2 Design of Tests

**Unit Test Design**

| File | Strategy | What is mocked | Assertions focus |
|------|----------|----------------|-----------------|
| `withRetry.test.js` | Pure function isolation | `jest.useFakeTimers()` for setTimeout | Call count, return value, error propagation |
| `provisioningService.test.js` | Service layer isolation | All models, ADConnector, notificationService | Correct calls to each dependency; task state transitions |
| `deprovisioningService.test.js` | Service layer isolation | All models, ADConnector, notificationService | Correct calls to each dependency; early-exit conditions |

**Integration Test Design**

| File | Strategy | What is mocked | Assertions focus |
|------|----------|----------------|-----------------|
| `auth.test.js` | HTTP request/response | MySQL pool, poller, OrangeHRM connector, AD config | Status codes, JWT token presence, field values |
| `employees.test.js` | HTTP request/response | MySQL pool returns configurable rows | Status codes, array shape, 404 for missing records |
| `tasks.test.js` | HTTP request/response | MySQL pool returns configurable rows | Status codes, stats object shape, validation errors |
| `audit.test.js` | HTTP request/response | MySQL pool returns configurable rows | Status codes, array shape, CSV content-type header |

**Test isolation:** Each test suite calls `jest.clearAllMocks()` in `beforeEach` to reset call counts and return values. Integration tests sign their own JWT tokens using the test secret (`integration-test-secret`) so no login request is needed before each protected-route test.
