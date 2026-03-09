# IT Employee Lifecycle Automation System

### Automate Onboarding & Offboarding — Zero Manual Steps, Zero Orphaned Accounts

---

**Author:** Stephen Torrijas
**Project:** IT Employee Lifecycle Automation System
**Demo:** http://localhost:3000 *(live demo — run locally)*
**Repository:** https://github.com/placeholder/it-lifecycle-system *(GitHub URL)*

---

## The Problem

IT administrators spend hours manually creating Active Directory accounts for new hires — often *after* the employee's first day — and frequently miss offboarding notifications, leaving former employees with active credentials and access to sensitive resources. Manual provisioning leads to inconsistent permissions, audit failures, and significant security risk.

## The Solution

The **IT Employee Lifecycle Automation System** continuously monitors OrangeHRM for personnel changes and automatically executes corresponding Active Directory actions. New hires get accounts on Day 1. Departing employees are disabled within minutes of termination. Every action is logged, auditable, and reviewable through a clean web dashboard.

---

## Key Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **OrangeHRM Sync** | Polls OrangeHRM at a configurable interval, syncing employee name, department, and job title in real time |
| 2 | **Auto AD Provisioning** | Creates Active Directory accounts via LDAP with correct OU placement, display name, email, and enabled status |
| 3 | **Role-Based Group Assignment** | Maps HR department + job title combinations to AD security groups; assignments applied automatically on creation |
| 4 | **Auto Deprovisioning** | Detects terminations and disables AD accounts immediately, removing group memberships to eliminate orphaned access |
| 5 | **Task Management** | Tracks every provisioning and deprovisioning task with status (Pending → In Progress → Completed/Failed), retry logic, and priority flagging |
| 6 | **Audit Log with CSV Export** | Full chronological record of all lifecycle events with date-range filtering and one-click CSV export for compliance reviews |
| 7 | **Notification System** | Real-time in-app notifications with unread badge counter; notifications toggle-able via system settings |
| 8 | **Access Request Workflow** | Department managers submit additional-access requests; IT Admins approve or reject with full audit trail |
| 9 | **Compliance Report Generation** | Generate activity summary reports filtered by date range and department; download as CSV |
| 10 | **System Configuration UI** | Adjust polling interval, retry limit, and notification settings at runtime — no code changes required |

---

*Continues on Page 2 →*

---
<div style="page-break-before: always"></div>

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        IT Admin Web Browser                          │
│                  React 18 + Material UI (Port 3000)                  │
│        Dashboard │ Employees │ Tasks │ Audit │ Reports │ Settings    │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ HTTPS / Axios + JWT
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     Node.js / Express API (Port 4000)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ Provisioning │  │Deprovisioning│  │  Task / Notification /   │   │
│  │   Service    │  │   Service    │  │  Audit / Report Services │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────────┘   │
│         │                 │                                          │
│  ┌──────▼─────────────────▼──────────────────────────────────────┐  │
│  │                 Scheduler / Poller (node-schedule)            │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────┬─────────────────────────────────────┬────────────────────────┘
       │                                     │
       ▼                                     ▼
┌──────────────────┐               ┌─────────────────────────┐
│   MySQL 8 DB     │               │  Windows Active Directory│
│  (it_lifecycle)  │               │  DC01.stechlab.net       │
│  12 tables:      │               │  LDAP via ldapjs         │
│  employees,      │               │  OU=ITLifecycle,         │
│  tasks, audit,   │               │  DC=stechlab,DC=net      │
│  notifications,  │               └─────────────────────────┘
│  reports, etc.   │
└──────────────────┘

       ▲ Poll every N minutes (configurable)
       │
┌──────────────────┐
│  OrangeHRM 5.x   │
│  MySQL DB        │
│  hs_hr_employee  │
│  + terminations  │
└──────────────────┘
```

---

## Screen Snapshots

### Dashboard — Real-time Task Statistics & OrangeHRM Sync Status
![Dashboard](screenshots/dashboard.png)

### Employee Search — Clickable Rows with AD Account Detail Modal
![Employee Search](screenshots/employee-search.png)

### Task List — Status/Type Filters, Priority Badges, Flag-Critical Button
![Task List](screenshots/task-list.png)

### Audit Log — Date Range Filtering & CSV Export
![Audit Log](screenshots/audit-log.png)

---

## System Requirements

| Component | Requirement |
|-----------|-------------|
| **Runtime** | Node.js 18+ (tested on v25.7.0) |
| **Database** | MySQL 8.0+ (schema: `it_lifecycle`) |
| **HR System** | OrangeHRM 5.x (direct DB access, user: `orange`) |
| **Directory** | Windows Server Active Directory (LDAP port 389) |
| **OS** | Windows Server 2019/2022 (for AD integration) |
| **Browser** | Chrome 120+, Edge 120+, Firefox 120+ |
| **Network** | Backend must reach AD DC and OrangeHRM DB host |

---

## Feature-to-Requirement Mapping

| Feature | Requirement(s) |
|---------|----------------|
| OrangeHRM Sync + Auto Provisioning | REQ-1, REQ-2, NFR-1 |
| Role-Based Group Assignment | REQ-3, REQ-6 |
| Auto Deprovisioning on Termination | REQ-4, REQ-5 |
| Task Management + Retry Logic | REQ-7, NFR-5, NFR-6 |
| Audit Log with CSV Export | REQ-9, NFR-9 |
| Notification System | REQ-15, NFR-3 |
| Access Request Workflow | REQ-14, REQ-7 |
| Compliance Report Generation | REQ-10 |
| System Configuration UI | REQ-8, NFR-10 |
| Employee Search with AD Detail | REQ-11, REQ-13 |

---

*IT Employee Lifecycle Automation System — Stephen Torrijas — 2026*
