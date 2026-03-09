---
title: "Presentation Slides"
project: "IT Employee Lifecycle Automation System"
author: "Stephen Torrijas"
date: "March 2026"
note: "Convert to PDF or PowerPoint for submission. Each section below = one slide."
---

# IT Employee Lifecycle Automation System

## Presentation Slides

**Stephen Torrijas | March 2026**

---

---

## SLIDE 1 — Title

# IT Employee Lifecycle Automation System

**Stephen Torrijas**
March 2026

> *Automate onboarding and offboarding — zero manual steps, zero orphaned accounts.*

**Demo:** http://localhost:3000
**Repository:** https://github.com/placeholder/it-lifecycle-system

---

---

## SLIDE 2 — The Problem

# The Problem: Manual IT Account Management

**When a new employee joins:**
- IT receives notification via email or ticket — often the day of or after the start date
- An admin must manually create an AD account, assign security groups, and verify access
- Result: delayed first-day access, lost productivity

**When an employee leaves:**
- IT frequently receives late or incomplete notifications
- Former employee retains active credentials for days or weeks
- **Orphaned accounts** are a common vector for data breaches

**Additional issues:**
- Different IT staff assign different permissions to the same role → access disparities
- No centralized audit trail → compliance failures

---

---

## SLIDE 3 — The Solution

# The Solution: Automated Lifecycle Management

**What the system does:**

```
OrangeHRM detects change
        |
        v
Backend poller fires automatically
        |
        +-- New hire? → Create AD account + assign groups → Notify IT
        |
        +-- Termination? → Disable AD account + remove groups → Notify IT
```

- **No tickets. No emails. No manual steps.**
- IT administrators retain a full dashboard for oversight and manual override
- Every action is logged for compliance review

---

---

## SLIDE 4 — System Architecture

# System Architecture

```
+-----------------------------------------------+
|  React 18 + Material UI  (Port 3000)           |
|  Dashboard | Employees | Tasks | Audit | Settings|
+--------------------+--------------------------+
                     | JWT / Axios
                     v
+-----------------------------------------------+
|    Node.js / Express API  (Port 4000)          |
|  Provisioning | Deprovisioning | Notifications |
|  Poller (node-schedule) | Audit | Reports      |
+---------+-----------------------------+--------+
          |                             |
          v                             v
   +------------+             +---------------------+
   |  MySQL 8   |             | Windows Active Dir. |
   | it_lifecycle|             | DC01.stechlab.net   |
   | (12 tables) |             | LDAP via ldapjs     |
   +------------+             +---------------------+
          ^
          | poll every N minutes
   +------------+
   | OrangeHRM  |
   | MySQL DB   |
   +------------+
```

**Stack:** React · Node.js · Express · MySQL · ldapjs · JWT · node-schedule

---

---

## SLIDE 5 — Demo Roadmap

# What You'll See in the Demo

| # | Feature | What it demonstrates |
|---|---------|----------------------|
| 1 | **Dashboard** | Real-time task stats + manual OrangeHRM sync |
| 2 | **Employee Search** | Find employee, click to view AD account detail |
| 3 | **Task Management** | Filter tasks, flag as Critical, view retry logic |
| 4 | **Audit Log** | Date-range filtering + CSV export |
| 5 | **Access Requests** | Submit and approve additional-access requests |
| 6 | **Reports** | Generate compliance report + download CSV |
| 7 | **System Config** | Adjust polling interval, retry limit, notifications |

**Total runtime: ~7 minutes**

---

---

## SLIDE 6 — Feature Highlights

# 10 Implemented Features

| Feature | Requirement |
|---------|-------------|
| OrangeHRM DB polling (name, dept, title sync) | REQ-1, REQ-4, NFR-1 |
| Automatic AD account provisioning via LDAP | REQ-2, NFR-2 |
| Role-based AD group assignment from mappings | REQ-3, REQ-6 |
| Automatic deprovisioning on termination | REQ-5 |
| Task management with retry logic + priority flag | REQ-7, REQ-12, NFR-5 |
| Audit log with date filter and CSV export | REQ-9 |
| In-app notifications with unread badge | REQ-15 |
| Access request workflow (submit / approve / reject) | REQ-14 |
| Compliance report generation + CSV download | REQ-10 |
| System configuration UI (no code changes needed) | REQ-8, NFR-10 |

**All 15 functional requirements implemented.**

---

---

## SLIDE 7 — Live Demo

# Live Demo

*(Switch to browser — http://localhost:3000)*

**Stops:**
1. Dashboard → stat cards + Sync Now
2. Employee Search → click row → AD account modal
3. Task List → filters, priority badge, flag Critical
4. Audit Log → set date range → Export CSV
5. Access Requests → approve a request
6. Reports → generate + download CSV
7. Settings → polling interval, retry limit, notifications toggle

---

---

## SLIDE 8 — Current Progress vs. Plan

# Progress vs. Original Plan

| Week | Planned | Actual |
|------|---------|--------|
| 1–4 | Project proposal + system requirements | **Complete** |
| 5–7 | Environment setup + core dashboard | **Complete** |
| 8 | Mid-term: core onboarding automation | **Complete** |
| 9–11 | Offboarding, notifications, audit log | **Complete** |
| 12–14 | Reports, access requests, config UI | **Complete** |

**Ahead of schedule:** All 15 requirements done at Week 8 milestone.
Full feature set (10 features) implemented and running end-to-end on live AD + OrangeHRM.

---

---

## SLIDE 9 — Plan for the Rest of the Semester

# Remaining Work (Weeks 12–15)

**Quality & Security**
- LDAPS (encrypted LDAP on port 636) — currently plain LDAP port 389
- Input validation hardening on all API endpoints

**Role-Based UI**
- HR Personnel view: read-only employee status, flag high-priority tasks
- Department Manager view: team account status + access request submission

**Testing**
- Unit tests (Jest): provisioningService, deprovisioningService, ADConnector, notificationService
- Integration tests: end-to-end lifecycle flows against a test DB instance

**Documentation**
- Final system documentation with test results
- README updates for deployment

---

---

## SLIDE 10 — Summary

# Summary

**Problem solved:** Manual IT provisioning causes delayed access, orphaned accounts, and compliance risk.

**Solution delivered:** Fully automated lifecycle system that detects HR changes and acts on them — no human in the loop required for standard cases.

**Technical achievement:**
- Live integration: OrangeHRM MySQL → Node.js poller → LDAP → Active Directory
- 12-table MySQL schema, 15 API routes, 9 React pages
- Retry logic, priority queuing, full audit trail, CSV exports

**Still to come:** LDAPS, role-scoped UI views, automated test suite

---

*IT Employee Lifecycle Automation System — Stephen Torrijas — March 2026*
