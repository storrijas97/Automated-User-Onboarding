# IT Employee Lifecycle Automation System

**Author:** Stephen Torrijas

A full-stack web application that automates IT account provisioning and deprovisioning by monitoring OrangeHRM for employee changes and automatically creating or disabling Windows Active Directory accounts.

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

---

## System Architecture

```
React Frontend (port 3000)
        |  HTTPS / JWT
Node.js / Express API (port 4000)
    |                    |
MySQL DB           Windows Active Directory
(it_lifecycle)     LDAP port 389
        ^
        | polls every N minutes
OrangeHRM MySQL DB (XAMPP)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Material UI |
| Backend | Node.js, Express 4 |
| Database | MySQL 8 |
| HR Integration | OrangeHRM 5.x on XAMPP (direct MySQL polling) |
| Directory | Windows Active Directory via ldapjs (LDAP) |
| Auth | JWT |
| Scheduler | node-schedule |

---

## Features

1. **OrangeHRM Sync** — polls HR database on a configurable interval, keeps employee name, department, and job title in sync
2. **Auto AD Provisioning** — creates AD accounts via LDAP with all profile attributes set
3. **Role-Based Group Assignment** — maps department + job title combinations to AD security groups
4. **Auto Deprovisioning** — disables accounts and removes group memberships on termination
5. **Task Management** — tracks every operation with status, retry logic, and priority flagging
6. **Audit Log** — full chronological event log with date-range filtering and CSV export
7. **Notification System** — in-app notifications with unread badge counter
8. **Access Request Workflow** — submit, approve, and reject additional-access requests
9. **Compliance Reports** — generate activity reports filtered by date and department, download as CSV
10. **System Configuration** — adjust polling interval, retry limit, and notification settings at runtime

---

## Prerequisites

- Node.js 18+
- XAMPP 8.x (for OrangeHRM hosting)
- OrangeHRM 5.x (installed in XAMPP)
- MySQL 8.0+ (XAMPP's MySQL can serve both OrangeHRM and the app database)
- Windows Server with Active Directory Domain Services
- Modern web browser (Chrome, Edge, or Firefox)

---

## Setup & Installation

### Step 1 — Install XAMPP and OrangeHRM

1. Download and install [XAMPP](https://www.apachefriends.org)
2. Open the XAMPP Control Panel and start **Apache** and **MySQL**
3. Download [OrangeHRM 5.x](https://www.orangehrm.com/download) and extract it to:
   ```
   C:\xampp\htdocs\orangehrm\
   ```
4. Go to `http://localhost/orangehrm` and complete the setup wizard:
   - Database host: `localhost`
   - Database name: `orangehrm`
   - Database user: `root` (no password by default in XAMPP)
5. Log in to OrangeHRM and confirm it is running

> The lifecycle system connects directly to OrangeHRM's MySQL database (not a web API), so XAMPP's MySQL must remain running whenever the backend is active.

---

### Step 2 — Create the Application Database

```bash
mysql -u root < 1_code/it-lifecycle-system/server/db/schema.sql
```

This creates the `it_lifecycle` database and all 12 tables.

---

### Step 3 — Configure Environment Variables

```bash
cp 1_code/it-lifecycle-system/server/.env.example 1_code/it-lifecycle-system/server/.env
```

Edit `server/.env`:

```env
# Application database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=it_lifecycle

# OrangeHRM database (XAMPP MySQL)
ORANGEHRM_DB_HOST=localhost
ORANGEHRM_DB_USER=root
ORANGEHRM_DB_PASS=
ORANGEHRM_DB_NAME=orangehrm

# Active Directory
AD_URL=ldap://DC01.yourdomain.net
AD_BASE_DN=DC=yourdomain,DC=net
AD_BIND_DN=CN=Administrator,CN=Users,DC=yourdomain,DC=net
AD_BIND_PASSWORD=youradpassword
AD_USERS_OU=OU=ITLifecycle,DC=yourdomain,DC=net

# Auth
JWT_SECRET=change-this-to-a-random-secret-string
```

---

### Step 4 — Start the Backend

```bash
cd 1_code/it-lifecycle-system/server
npm install
node index.js
```

The API starts at `http://localhost:4000`. The OrangeHRM poller begins automatically.

---

### Step 5 — Start the Frontend

```bash
cd 1_code/it-lifecycle-system/client
npm install
npm start
```

The app opens at `http://localhost:3000`.

---

### Step 6 — Log In

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |

---

## Repository Structure

```
├── 1_code/                         Source code + README1.txt
│   └── it-lifecycle-system/
│       ├── server/                 Node.js/Express backend
│       │   ├── connectors/         OrangeHRMDbConnector.js, ADConnector.js
│       │   ├── services/           provisioningService.js, deprovisioningService.js
│       │   ├── scheduler/          poller.js
│       │   ├── routes/             API route handlers
│       │   ├── models/             MySQL model classes
│       │   └── db/schema.sql       Full database schema
│       └── client/                 React frontend
│           └── src/pages/          Dashboard, Employees, Tasks, Audit, Reports, Settings
│
├── 2_unit_testing/                 README2.txt (planned for final submission)
├── 3_integration_testing/          README3.txt (planned for final submission)
├── 4_data_collection/              README4.txt (not applicable)
├── 5_documentation/                System requirements doc, brochure, slides, architecture diagram
└── Not Applicable.txt              Explains non-applicable submission items
```
