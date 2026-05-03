#!/usr/bin/env node
/**
 * PDF Generator for IT Employee Lifecycle Automation System
 * Generates three PDFs:
 *   1. System_requirements_documentation.pdf
 *   2. Brochure.pdf
 *   3. Presentation_slides.pdf
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.resolve(__dirname, '5_documentation');
const SCREENSHOTS_DIR = path.resolve(__dirname, 'screenshots');
const UI_PNGS_DIR = path.resolve(__dirname, '../UI-PNGs');
const DIAGRAMS_DIR = path.resolve(__dirname, '5_documentation/diagrams');

function imgBase64(imgPath) {
  try {
    const data = fs.readFileSync(imgPath);
    const ext = path.extname(imgPath).replace('.', '').toLowerCase();
    const mime = ext === 'jpg' ? 'jpeg' : ext;
    return `data:image/${mime};base64,${data.toString('base64')}`;
  } catch (e) {
    return '';
  }
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const BASE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #1a1a2e;
    background: white;
  }
  h1 { font-size: 22pt; font-weight: 700; color: #0d47a1; margin: 18px 0 10px; }
  h2 { font-size: 15pt; font-weight: 600; color: #1565c0; margin: 16px 0 8px; border-bottom: 2px solid #e3f2fd; padding-bottom: 4px; }
  h3 { font-size: 12pt; font-weight: 600; color: #1976d2; margin: 14px 0 6px; }
  h4 { font-size: 11pt; font-weight: 600; color: #1a237e; margin: 10px 0 4px; }
  p { margin-bottom: 8px; }
  ul, ol { margin: 6px 0 8px 20px; }
  li { margin-bottom: 3px; }
  strong { font-weight: 600; color: #0d47a1; }
  em { font-style: italic; color: #37474f; }
  a { color: #1565c0; text-decoration: none; }
  hr { border: none; border-top: 1.5px solid #bbdefb; margin: 16px 0; }
  pre, code {
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 8.5pt;
    background: #f5f5f5;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
  }
  pre { padding: 10px 14px; overflow: hidden; white-space: pre-wrap; word-break: break-all; margin: 8px 0; }
  code { padding: 1px 4px; }
  pre code { background: none; border: none; padding: 0; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9.5pt; }
  th { background: #1565c0; color: white; padding: 7px 10px; text-align: left; font-weight: 600; }
  td { padding: 6px 10px; border-bottom: 1px solid #e3f2fd; vertical-align: top; }
  tr:nth-child(even) td { background: #f8fbff; }
  img { max-width: 100%; height: auto; border-radius: 6px; border: 1px solid #e0e0e0; margin: 8px 0; }
  .page-break { page-break-before: always; }
  .cover-page {
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    background: linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1976d2 100%);
    color: white;
    padding: 60px 40px;
  }
  .cover-logo {
    width: 80px; height: 80px;
    background: rgba(255,255,255,0.2);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 36pt;
    margin: 0 auto 30px;
    border: 3px solid rgba(255,255,255,0.4);
  }
  .cover-title { font-size: 28pt; font-weight: 700; color: white; border: none; margin: 0 0 16px; }
  .cover-subtitle { font-size: 15pt; font-weight: 300; color: rgba(255,255,255,0.85); margin: 0 0 40px; }
  .cover-divider { width: 60px; height: 3px; background: rgba(255,255,255,0.5); margin: 20px auto; border-radius: 2px; }
  .cover-meta { font-size: 12pt; color: rgba(255,255,255,0.9); line-height: 2.0; }
  .cover-meta strong { color: white; font-weight: 600; }
  .content { padding: 30px 40px; }
  .toc { background: #f8fbff; border: 1px solid #bbdefb; border-radius: 8px; padding: 20px 28px; margin: 16px 0; }
  .toc h2 { border: none; margin-top: 0; }
  .toc ol { counter-reset: item; list-style: none; margin-left: 0; }
  .toc li { counter-increment: item; padding: 3px 0; }
  .toc li::before { content: counters(item, '.') '. '; font-weight: 600; color: #1565c0; min-width: 30px; display: inline-block; }
  .toc .toc-sub { margin-left: 24px; font-size: 10pt; }
  .section { margin-bottom: 20px; }
  .highlight-box {
    background: #fff8e1;
    border-left: 4px solid #ffa000;
    padding: 10px 16px;
    margin: 8px 0;
    border-radius: 0 6px 6px 0;
  }
  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 8pt;
    font-weight: 600;
  }
  .badge-high { background: #ffebee; color: #c62828; }
  .badge-med { background: #fff3e0; color: #e65100; }
  .badge-low { background: #e8f5e9; color: #2e7d32; }
  .badge-complete { background: #e8f5e9; color: #2e7d32; }
  .badge-progress { background: #e3f2fd; color: #1565c0; }
  .badge-planned { background: #f3e5f5; color: #6a1b9a; }
`;

// ─── HELPER: table from 2D array ─────────────────────────────────────────────
function htmlTable(headers, rows) {
  const ths = headers.map(h => `<th>${h}</th>`).join('');
  const trs = rows.map(r =>
    `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`
  ).join('');
  return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT 1: System Requirements Documentation
// ─────────────────────────────────────────────────────────────────────────────
function buildSysReqHTML() {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
${BASE_CSS}
.section-num { color: #1565c0; margin-right: 6px; }
.ssd-box { background: #1a1a2e; color: #a5d6a7; font-family: monospace; font-size: 8pt; padding: 12px; border-radius: 6px; white-space: pre; overflow-x: hidden; line-height: 1.5; margin: 8px 0; }
</style>
</head>
<body>

<!-- ═══════════════════════════════════════════ COVER PAGE ══════════════════ -->
<div class="cover-page">
  <div class="cover-logo">⚙</div>
  <h1 class="cover-title">IT Employee Lifecycle<br/>Automation System</h1>
  <div class="cover-divider"></div>
  <div class="cover-subtitle">System Requirements Documentation</div>
  <div class="cover-meta">
    Stephen Torrijas
  </div>
</div>

<!-- ═══════════════════════════════════════════ TABLE OF CONTENTS ═══════════ -->
<div class="page-break"></div>
<div class="content">
<div class="toc">
  <h2>Table of Contents</h2>
  <ol>
    <li>Customer Problem Statement</li>
    <li>Glossary of Terms</li>
    <li>System Requirements
      <ol class="toc-sub">
        <li>Functional Requirements</li>
        <li>Nonfunctional Requirements (FURPS)</li>
      </ol>
    </li>
    <li>Functional Requirements Specification
      <ol class="toc-sub">
        <li>Stakeholders</li>
        <li>Actors and Goals</li>
        <li>Use Cases</li>
        <li>Class Diagram — Component Overview</li>
        <li>Enumerations</li>
        <li>Data Types and Operation Signatures</li>
        <li>Class Relationships</li>
      </ol>
    </li>
    <li>System Sequence Diagrams</li>
    <li>Activity Diagram</li>
    <li>User Interface Specification
      <ol class="toc-sub">
        <li>Global Layout and Navigation</li>
        <li>UI-1: Main Dashboard</li>
        <li>UI-2: Department Mapping Configuration</li>
        <li>UI-3: Task Detail View</li>
        <li>UI-4: Audit Log Viewer</li>
        <li>UI-5: Report Generation</li>
        <li>UI-6: Employee Search &amp; Status Lookup</li>
        <li>User Effort Estimation</li>
      </ol>
    </li>
    <li>Project Plan</li>
    <li>References</li>
    <li>Traceability Matrix</li>
    <li>System Architecture and System Design</li>
    <li>Algorithms and Data Structures</li>
    <li>UI Design &amp; Implementation / Design of Tests</li>
  </ol>
</div>
</div>

<!-- ═══════════════════════════════════════════ SECTION 1 ═══════════════════ -->
<div class="page-break"></div>
<div class="content">
<div class="section">
  <h2><span class="section-num">1.</span> Customer Problem Statement</h2>
  <p>Organizations of all sizes rely on IT departments to provision and deprovision user accounts throughout the employee lifecycle. When a new employee joins, IT administrators must create Active Directory accounts, assign appropriate security groups based on department and role, and grant access to necessary resources. This process typically begins when IT receives notification via email or helpdesk ticket — often the day of or after the employee starts — resulting in delayed access and lost productivity during critical onboarding periods.</p>
  <p>The offboarding process presents even greater challenges. When employees depart, IT frequently receives late or incomplete notifications, leaving former employees with active credentials and access to sensitive company resources. These orphaned accounts create significant security vulnerabilities and compliance risks. Additionally, manual provisioning leads to inconsistency: different IT staff may assign different permissions to employees in identical roles, creating access disparities and audit failures.</p>
  <p>An automated system is needed that continuously monitors the HR system for personnel changes and automatically executes corresponding account actions — creating accounts for new hires with role-appropriate permissions and promptly disabling accounts for departing employees. The system provides a centralized dashboard for oversight, manual intervention capabilities, and comprehensive audit logging to ensure compliance.</p>
</div>

<!-- ═══════════════════════════════════════════ SECTION 2 ═══════════════════ -->
<div class="section">
  <h2><span class="section-num">2.</span> Glossary of Terms</h2>
  ${htmlTable(['Term', 'Definition'], [
    ['<strong>Employee Lifecycle</strong>', 'The stages an employee progresses through within an organization: onboarding (joining), active employment, role changes, and offboarding (departure).'],
    ['<strong>Provisioning</strong>', 'The process of creating user accounts and assigning appropriate access permissions when an employee joins the organization.'],
    ['<strong>Deprovisioning</strong>', 'The process of disabling or removing user accounts and revoking access when an employee leaves the organization.'],
    ['<strong>Orphaned Account</strong>', 'A user account that remains active after an employee has left the organization, creating a security vulnerability.'],
    ['<strong>Role-Permission Mapping</strong>', 'A configuration that defines which security groups and access levels are automatically assigned based on an employee\'s department and job title.'],
    ['<strong>Polling Interval</strong>', 'The frequency at which the system checks the HR database for changes in employee status.'],
    ['<strong>Audit Log</strong>', 'A chronological record of all account lifecycle events, including who performed actions and when.'],
    ['<strong>Distinguished Name (DN)</strong>', 'The full LDAP path identifying a user or group object within Active Directory (e.g., CN=jsmith,OU=ITLifecycle,DC=stechlab,DC=net).'],
    ['<strong>LDAP</strong>', 'Lightweight Directory Access Protocol — the protocol used to communicate with Active Directory.'],
    ['<strong>OrangeHRM</strong>', 'The open-source Human Resource Management system used as the authoritative source of employee data.'],
  ])}
</div>
</div>

<!-- ═══════════════════════════════════════════ SECTION 3 ═══════════════════ -->
<div class="page-break"></div>
<div class="content">
<div class="section">
  <h2><span class="section-num">3.</span> System Requirements</h2>

  <h3>3.1 Functional Requirements</h3>
  ${htmlTable(['No.', 'Priority', 'Description'], [
    ['REQ-1', '<span class="badge badge-high">High</span>', 'The system shall automatically detect new employees added to the HR management system.'],
    ['REQ-2', '<span class="badge badge-high">High</span>', 'The system shall automatically create Active Directory accounts for new employees.'],
    ['REQ-3', '<span class="badge badge-high">High</span>', 'The system shall assign security groups based on configured department and role mappings.'],
    ['REQ-4', '<span class="badge badge-high">High</span>', 'The system shall automatically detect employee terminations in the HR management system.'],
    ['REQ-5', '<span class="badge badge-high">High</span>', 'The system shall automatically disable Active Directory accounts for terminated employees.'],
    ['REQ-6', '<span class="badge badge-high">High</span>', 'IT administrators shall be able to configure mappings between departments/roles and Active Directory security groups.'],
    ['REQ-7', '<span class="badge badge-high">High</span>', 'IT administrators shall be able to manually approve, modify, or override automated account actions.'],
    ['REQ-8', '<span class="badge badge-med">Medium</span>', 'IT administrators shall be able to configure the polling interval for HR system synchronization.'],
    ['REQ-9', '<span class="badge badge-high">High</span>', 'The system shall maintain comprehensive audit logs of all account lifecycle events.'],
    ['REQ-10', '<span class="badge badge-med">Medium</span>', 'IT administrators shall be able to generate compliance reports for specified date ranges.'],
    ['REQ-11', '<span class="badge badge-med">Medium</span>', 'HR personnel shall be able to view the provisioning status of newly entered employees.'],
    ['REQ-12', '<span class="badge badge-low">Low</span>', 'HR personnel shall be able to flag high-priority onboarding requests for expedited processing.'],
    ['REQ-13', '<span class="badge badge-med">Medium</span>', 'Department managers shall be able to view account status for their direct reports.'],
    ['REQ-14', '<span class="badge badge-low">Low</span>', 'Department managers shall be able to submit requests for additional access or permissions for team members.'],
    ['REQ-15', '<span class="badge badge-med">Medium</span>', 'The system shall send notifications to stakeholders when account actions are completed or require attention.'],
  ])}

  <h3>3.2 Nonfunctional Requirements (FURPS)</h3>
  ${htmlTable(['No.', 'Category', 'Priority', 'Description'], [
    ['NFR-1', 'Functionality', '<span class="badge badge-high">High</span>', 'The system shall integrate with OrangeHRM via direct MySQL database polling.'],
    ['NFR-2', 'Functionality', '<span class="badge badge-high">High</span>', 'The system shall communicate with Active Directory via LDAP or LDAPS protocol.'],
    ['NFR-3', 'Usability', '<span class="badge badge-med">Medium</span>', 'The dashboard shall display pending, completed, and failed tasks in a clear visual layout with status indicators.'],
    ['NFR-4', 'Usability', '<span class="badge badge-med">Medium</span>', 'The system shall provide intuitive navigation between different functional areas via a persistent sidebar.'],
    ['NFR-5', 'Reliability', '<span class="badge badge-high">High</span>', 'The system shall retry failed operations up to a configurable limit (default: 3) before marking them as failed.'],
    ['NFR-6', 'Reliability', '<span class="badge badge-high">High</span>', 'The system shall continue operating normally if individual account operations fail (graceful degradation).'],
    ['NFR-7', 'Performance', '<span class="badge badge-med">Medium</span>', 'The system shall detect and process new employee changes within 5 minutes of the configured polling interval.'],
    ['NFR-8', 'Performance', '<span class="badge badge-med">Medium</span>', 'Account creation and disabling operations shall complete within 30 seconds.'],
    ['NFR-9', 'Supportability', '<span class="badge badge-med">Medium</span>', 'The system shall log all errors with sufficient detail (timestamps, error codes, context) for troubleshooting.'],
    ['NFR-10', 'Supportability', '<span class="badge badge-low">Low</span>', 'The system shall support configuration changes (mappings, intervals, notifications) without code modifications.'],
  ])}
</div>
</div>

<!-- ═══════════════════════════════════════════ SECTION 4 ═══════════════════ -->
<div class="page-break"></div>
<div class="content">
<div class="section">
  <h2><span class="section-num">4.</span> Functional Requirements Specification</h2>

  <h3>4.1 Stakeholders</h3>
  ${htmlTable(['Stakeholder', 'Interest in the System'], [
    ['<strong>IT Administrators</strong>', 'Primary users who manage account lifecycle operations, configure automation rules, handle exceptions, and ensure security compliance. They benefit from reduced manual workload and fewer errors.'],
    ['<strong>HR Personnel</strong>', 'Staff who maintain employee records in OrangeHRM and need visibility into IT provisioning status to confirm that new hires receive timely access and departing employees are offboarded.'],
    ['<strong>Department Managers</strong>', 'Leaders responsible for ensuring their new hires have appropriate access on day one and that departing team members are properly offboarded. They may request additional permissions for team members.'],
    ['<strong>Compliance Officers</strong>', 'Reviewers who require audit trails to verify that account access changes follow organizational policies and regulatory requirements.'],
    ['<strong>CIO / IT Director</strong>', 'Project sponsor who seeks reduced operational cost, improved security posture, and elimination of orphaned accounts through automation.'],
    ['<strong>Employees (End Users)</strong>', 'Indirect beneficiaries who receive timely account access upon hiring, ensuring productive first days without waiting for manual IT provisioning.'],
  ])}

  <h3>4.2 Actors and Goals</h3>
  <h4>Primary Actors</h4>
  <ul>
    <li><strong>IT Administrator:</strong> Configures automation rules, manages department-to-security-group mappings, approves or overrides automated account actions, views audit logs, generates compliance reports, and searches employee account status.</li>
    <li><strong>HR Personnel:</strong> Views the provisioning status of newly entered employees, flags high-priority onboarding requests for expedited processing, confirms successful completion of offboarding procedures, and accesses a read-only view of employee account status.</li>
    <li><strong>Department Manager:</strong> Views account status for their direct reports, submits requests for additional access or permissions for team members, and receives notifications when team member accounts are provisioned or modified.</li>
  </ul>
  <h4>Secondary Actors</h4>
  <ul>
    <li><strong>System (Automation Engine):</strong> Polls the OrangeHRM database at configured intervals, automatically creates or disables Active Directory accounts, assigns security groups based on role-permission mappings, sends notifications, and retries failed operations.</li>
    <li><strong>OrangeHRM (External System):</strong> The human resource management system that serves as the authoritative source of employee data.</li>
    <li><strong>Active Directory (External System):</strong> The directory service that receives account creation, modification, and disabling commands via LDAP protocol.</li>
  </ul>

  <h3>4.3 Use Cases</h3>

  <h4>IT Administrator (total: 25 points)</h4>
  ${htmlTable(['Use Case', 'Description', 'Est.'], [
    ['Login/Logout', 'Authenticate to the system using credentials and manage session with JWT-based access control', '4'],
    ['View Dashboard', 'View a real-time dashboard displaying pending, in-progress, completed, and failed onboarding/offboarding tasks with statistics', '2'],
    ['Configure Role-Permission Mappings', 'Set up and maintain mappings between HR departments/job roles and Active Directory security groups', '4'],
    ['Approve/Override Account Actions', 'Review pending automated account actions and manually approve, modify, or reject them before execution', '4'],
    ['Configure Polling Interval', 'Set the frequency at which the system polls OrangeHRM for employee status changes', '2'],
    ['View Audit Logs', 'Browse and search a chronological record of all account lifecycle events for compliance and troubleshooting', '3'],
    ['Generate Compliance Reports', 'Create and export compliance or activity summary reports for specified date ranges and department filters', '4'],
    ['Search Employee Status', 'Look up any employee by name, ID, or email and view their current Active Directory account status', '2'],
  ])}

  <h4>HR Personnel (total: 8 points)</h4>
  ${htmlTable(['Use Case', 'Description', 'Est.'], [
    ['View Provisioning Status', 'Check the current provisioning status of newly entered employees to confirm account creation is underway', '2'],
    ['Flag High-Priority Onboarding', 'Mark an onboarding request as urgent so the system processes it ahead of normal-priority tasks', '2'],
    ['Confirm Offboarding', 'Verify and acknowledge that offboarding procedures have been successfully completed for a departed employee', '2'],
    ['View Employee Account Status', 'Access a read-only view of any employee\'s current Active Directory account status', '2'],
  ])}

  <h4>Department Manager (total: 7 points)</h4>
  ${htmlTable(['Use Case', 'Description', 'Est.'], [
    ['View Team Account Status', 'View the current account provisioning status for all direct reports in the department', '2'],
    ['Request Additional Access', 'Submit a request for additional security groups or permissions for a team member, routed to IT for approval', '3'],
    ['Receive Notifications', 'Receive alerts when team member accounts are provisioned, modified, or when actions require attention', '2'],
  ])}

  <h4>System — Automation Engine (total: 18 points)</h4>
  ${htmlTable(['Use Case', 'Description', 'Est.'], [
    ['Poll HRM for Changes', 'Periodically query the OrangeHRM database to detect new hires and terminations', '3'],
    ['Process Onboarding', 'Create a new AD account for a detected new hire and trigger security group assignment and notifications', '4'],
    ['Process Offboarding', 'Disable the AD account and revoke group memberships for a detected terminated employee', '3'],
    ['Assign Security Groups', 'Automatically assign AD security groups based on the employee\'s department and role mappings', '3'],
    ['Send Notifications', 'Dispatch in-app notifications to relevant stakeholders when account actions complete or fail', '3'],
    ['Retry Failed Operations', 'Automatically retry a failed account operation up to the configured limit before marking the task as failed', '2'],
  ])}

  <p><strong>Grand Total: 58 points (~29 engineer-days)</strong></p>

  <h4>Use Case Relationships</h4>
  <p><strong>&lt;&lt;include&gt;&gt; relationships (mandatory behavior):</strong></p>
  <ul>
    <li>Process Onboarding <strong>&lt;&lt;include&gt;&gt;</strong> Assign Security Groups — Every onboarding task always assigns security groups based on department/role mappings.</li>
    <li>Process Onboarding <strong>&lt;&lt;include&gt;&gt;</strong> Send Notifications — Stakeholders are always notified after an onboarding action completes or fails.</li>
    <li>Process Offboarding <strong>&lt;&lt;include&gt;&gt;</strong> Send Notifications — Stakeholders are always notified after an offboarding action completes or fails.</li>
  </ul>
  <p><strong>&lt;&lt;extend&gt;&gt; relationships (optional/conditional behavior):</strong></p>
  <ul>
    <li>Approve/Override Account Actions <strong>&lt;&lt;extend&gt;&gt;</strong> Process Onboarding — An IT administrator may optionally intervene before onboarding executes.</li>
    <li>Approve/Override Account Actions <strong>&lt;&lt;extend&gt;&gt;</strong> Process Offboarding — An IT administrator may optionally intervene before offboarding executes.</li>
    <li>Flag High-Priority Onboarding <strong>&lt;&lt;extend&gt;&gt;</strong> Process Onboarding — HR personnel may optionally flag a task for expedited processing.</li>
    <li>Retry Failed Operations <strong>&lt;&lt;extend&gt;&gt;</strong> Process Onboarding — The system retries only if the onboarding operation fails.</li>
    <li>Retry Failed Operations <strong>&lt;&lt;extend&gt;&gt;</strong> Process Offboarding — The system retries only if the offboarding operation fails.</li>
  </ul>
</div>
</div>

<!-- Section 4.4–4.7 -->
<div class="page-break"></div>
<div class="content">
<div class="section">
  <h3>4.4 Class Diagram — Component Overview</h3>
  <img src="${imgBase64(path.join(DIAGRAMS_DIR, 'ClassDiagram.png'))}" alt="Class Diagram" style="width:100%;border:1px solid #bbdefb;border-radius:6px;margin:8px 0;"/>
  <p style="margin-top:4px;font-size:9pt;color:#546e7a;text-align:center;"><em>Figure: Class Diagram — 13 classes covering core entities, configuration, workflow, audit, and access control</em></p>
  <br/>
  <h4>Use Case Diagram</h4>
  <img src="${imgBase64(path.join(DIAGRAMS_DIR, 'UseCaseDiagram.png'))}" alt="Use Case Diagram" style="width:100%;border:1px solid #bbdefb;border-radius:6px;margin:8px 0;"/>
  <p style="margin-top:4px;font-size:9pt;color:#546e7a;text-align:center;"><em>Figure: Use Case Diagram — all actors and use cases for the IT Employee Lifecycle Automation System</em></p>
  ${htmlTable(['Category', 'Classes'], [
    ['<strong>Core Entities</strong>', 'Employee, ADAccount, Department, SecurityGroup'],
    ['<strong>Configuration</strong>', 'RolePermissionMapping, SystemConfiguration'],
    ['<strong>Workflow</strong>', 'LifecycleTask, TaskAction'],
    ['<strong>Audit and Reporting</strong>', 'AuditLog, Notification, Report'],
    ['<strong>Access Control</strong>', 'User'],
  ])}

  <h3>4.5 Enumerations</h3>
  ${htmlTable(['Enumeration', 'Values', 'Description'], [
    ['UserRole', 'IT_ADMIN, HR_PERSONNEL, DEPT_MANAGER, COMPLIANCE_OFFICER', 'Defines the role-based access level of a system user'],
    ['EmployeeStatus', 'ACTIVE, TERMINATED, PENDING', 'Represents the current lifecycle state of an employee'],
    ['TaskType', 'ONBOARD, OFFBOARD', 'Categorizes a lifecycle task as either onboarding or offboarding'],
    ['TaskStatus', 'PENDING, IN_PROGRESS, COMPLETED, FAILED', 'Tracks the execution state of a lifecycle task'],
    ['ActionType', 'CREATE_ACCOUNT, DISABLE_ACCOUNT, ASSIGN_GROUP, REMOVE_GROUP', 'Specifies the type of Active Directory operation'],
    ['ActionStatus', 'PENDING, EXECUTING, SUCCESS, FAILED', 'Tracks the execution state of an individual task action'],
    ['Priority', 'NORMAL, HIGH', 'Indicates the processing priority of a lifecycle task'],
    ['NotificationType', 'INFO, WARNING, ERROR', 'Categorizes the severity of a notification'],
    ['ReportType', 'COMPLIANCE, ACTIVITY_SUMMARY, FAILED_ACTIONS', 'Specifies the type of report to generate'],
  ])}

  <h3>4.6 Data Types and Operation Signatures</h3>

  <h4>Class: User</h4>
  <p>A system user who accesses the application. Each user has a role that determines their permissions.</p>
  ${htmlTable(['Attribute', 'Type', 'Description'], [
    ['userId', 'int', 'Unique identifier for the user'],
    ['username', 'String', 'Login username for authentication'],
    ['passwordHash', 'String', 'Bcrypt-hashed password'],
    ['email', 'String', 'Email address for notifications'],
    ['role', 'UserRole', 'The user\'s role determining access level'],
    ['departmentId', 'int', 'Foreign key referencing the user\'s department'],
    ['createdAt', 'DateTime', 'Timestamp when the user account was created'],
  ])}
  ${htmlTable(['Operation', 'Signature', 'Description'], [
    ['login', 'login(username: String, password: String): boolean', 'Authenticates credentials; returns true on success'],
    ['logout', 'logout(): void', 'Terminates the user\'s active session'],
    ['getPermissions', 'getPermissions(): List', 'Returns the list of permissions for the user\'s role'],
  ])}

  <h4>Class: Employee</h4>
  <p>An employee record synchronized from OrangeHRM. Represents a person whose account lifecycle is managed by this system.</p>
  ${htmlTable(['Attribute', 'Type', 'Description'], [
    ['employeeId', 'int', 'Unique identifier in this system'],
    ['hrmId', 'String', 'The employee\'s unique identifier in OrangeHRM'],
    ['firstName', 'String', 'Employee\'s first name'],
    ['lastName', 'String', 'Employee\'s last name'],
    ['email', 'String', 'Employee\'s work email address'],
    ['departmentId', 'int', 'Foreign key referencing the employee\'s department'],
    ['jobTitle', 'String', 'The employee\'s job title/role'],
    ['startDate', 'Date', 'The employee\'s hire date'],
    ['terminationDate', 'Date', 'The employee\'s termination date (null if active)'],
    ['status', 'EmployeeStatus', 'Current lifecycle state: ACTIVE, TERMINATED, or PENDING'],
  ])}
  ${htmlTable(['Operation', 'Signature', 'Description'], [
    ['getFullName', 'getFullName(): String', 'Returns the concatenation of firstName and lastName'],
    ['isNewHire', 'isNewHire(): boolean', 'Returns true if the employee was added within the current polling cycle'],
    ['isTerminated', 'isTerminated(): boolean', 'Returns true if the employee\'s status is TERMINATED'],
  ])}

  <h4>Class: Department</h4>
  ${htmlTable(['Attribute', 'Type', 'Description'], [
    ['departmentId', 'int', 'Unique identifier for the department'],
    ['name', 'String', 'Display name of the department'],
    ['hrmDepartmentId', 'String', 'The department\'s unique identifier in OrangeHRM'],
  ])}
  ${htmlTable(['Operation', 'Signature', 'Description'], [
    ['getMappings', 'getMappings(): List', 'Returns all role-permission mappings for this department'],
    ['getEmployees', 'getEmployees(): List', 'Returns all employees belonging to this department'],
  ])}

  <h4>Class: SecurityGroup</h4>
  <p>An Active Directory security group that controls access to resources.</p>
  ${htmlTable(['Attribute', 'Type', 'Description'], [
    ['groupId', 'int', 'Unique identifier for the security group'],
    ['groupName', 'String', 'Display name of the AD security group'],
    ['distinguishedName', 'String', 'The full LDAP distinguished name (DN) of the group in Active Directory'],
    ['description', 'String', 'A brief description of the group\'s purpose'],
  ])}

  <h4>Class: RolePermissionMapping</h4>
  <p>Maps a department and job role combination to an AD security group.</p>
  ${htmlTable(['Attribute', 'Type', 'Description'], [
    ['mappingId', 'int', 'Unique identifier for the mapping'],
    ['departmentId', 'int', 'Foreign key referencing the department'],
    ['roleName', 'String', 'The job title/role this mapping applies to'],
    ['securityGroupId', 'int', 'Foreign key referencing the target security group'],
    ['createdBy', 'int', 'Foreign key referencing the user who created this mapping'],
    ['createdAt', 'DateTime', 'Timestamp when the mapping was created'],
  ])}

  <h4>Class: LifecycleTask</h4>
  <p>A workflow task representing an onboarding or offboarding operation for a specific employee.</p>
  ${htmlTable(['Attribute', 'Type', 'Description'], [
    ['taskId', 'int', 'Unique identifier for the task'],
    ['employeeId', 'int', 'Foreign key referencing the target employee'],
    ['taskType', 'TaskType', 'ONBOARD or OFFBOARD'],
    ['status', 'TaskStatus', 'PENDING, IN_PROGRESS, COMPLETED, or FAILED'],
    ['priority', 'Priority', 'NORMAL or HIGH'],
    ['assignedTo', 'int', 'Foreign key referencing the assigned user (null if automated)'],
    ['createdAt', 'DateTime', 'Timestamp when the task was created'],
    ['completedAt', 'DateTime', 'Timestamp when the task was completed'],
  ])}
  ${htmlTable(['Operation', 'Signature', 'Description'], [
    ['approve', 'approve(): void', 'Marks the task as approved and triggers execution'],
    ['reject', 'reject(reason: String): void', 'Cancels the task with a documented reason'],
    ['retry', 'retry(): void', 'Resets failed actions and re-executes the task'],
    ['getActions', 'getActions(): List', 'Returns all actions belonging to this task'],
  ])}

  <h4>Class: TaskAction</h4>
  <p>An individual atomic action within a lifecycle task.</p>
  ${htmlTable(['Attribute', 'Type', 'Description'], [
    ['actionId', 'int', 'Unique identifier for the action'],
    ['taskId', 'int', 'Foreign key referencing the parent task'],
    ['actionType', 'ActionType', 'CREATE_ACCOUNT, DISABLE_ACCOUNT, ASSIGN_GROUP, or REMOVE_GROUP'],
    ['targetGroup', 'String', 'The DN of the target security group (null for account actions)'],
    ['status', 'ActionStatus', 'PENDING, EXECUTING, SUCCESS, or FAILED'],
    ['errorMessage', 'String', 'Error details if the action failed'],
    ['executedAt', 'DateTime', 'Timestamp when the action was last executed'],
    ['retryCount', 'int', 'Number of retry attempts made'],
  ])}
  ${htmlTable(['Operation', 'Signature', 'Description'], [
    ['execute', 'execute(): boolean', 'Performs the AD operation; returns true on success'],
    ['retry', 'retry(): void', 'Increments retryCount and re-executes the action'],
    ['markFailed', 'markFailed(): void', 'Sets status to FAILED after exhausting retry attempts'],
  ])}

  <h4>Class: AuditLog</h4>
  <p>A chronological, immutable record of an account lifecycle event.</p>
  ${htmlTable(['Attribute', 'Type', 'Description'], [
    ['logId', 'int', 'Unique identifier for the log entry'],
    ['timestamp', 'DateTime', 'When the event occurred'],
    ['actionType', 'String', 'Description of the action performed'],
    ['targetEmployeeId', 'int', 'Foreign key referencing the affected employee'],
    ['performedBy', 'String', 'Username of the actor, or "System" for automated actions'],
    ['status', 'String', 'Outcome of the action (SUCCESS or FAILED)'],
    ['details', 'String', 'Additional context or error messages'],
  ])}

  <h4>Class: Notification</h4>
  ${htmlTable(['Attribute', 'Type', 'Description'], [
    ['notificationId', 'int', 'Unique identifier for the notification'],
    ['recipientId', 'int', 'Foreign key referencing the recipient user'],
    ['taskId', 'int', 'Foreign key referencing the related lifecycle task'],
    ['message', 'String', 'The notification message body'],
    ['type', 'NotificationType', 'Severity: INFO, WARNING, or ERROR'],
    ['isRead', 'boolean', 'Whether the recipient has read the notification'],
    ['createdAt', 'DateTime', 'Timestamp when the notification was created'],
  ])}
  ${htmlTable(['Operation', 'Signature', 'Description'], [
    ['markAsRead', 'markAsRead(): void', 'Sets isRead to true'],
    ['send', 'send(): void', 'Dispatches the notification to the recipient'],
  ])}

  <h4>Class: Report</h4>
  ${htmlTable(['Attribute', 'Type', 'Description'], [
    ['reportId', 'int', 'Unique identifier for the report'],
    ['reportType', 'ReportType', 'COMPLIANCE, ACTIVITY_SUMMARY, or FAILED_ACTIONS'],
    ['startDate', 'Date', 'Beginning of the report date range'],
    ['endDate', 'Date', 'End of the report date range'],
    ['generatedBy', 'int', 'Foreign key referencing the user who generated the report'],
    ['generatedAt', 'DateTime', 'Timestamp when the report was generated'],
    ['departmentFilter', 'String', 'Department IDs to filter by (null = all departments)'],
  ])}
  ${htmlTable(['Operation', 'Signature', 'Description'], [
    ['generate', 'generate(): void', 'Queries audit logs and task data to populate the report'],
    ['exportCSV', 'exportCSV(): File', 'Exports the report data as a CSV file'],
  ])}

  <h4>Class: SystemConfiguration</h4>
  <p>Global settings controlling automation behavior.</p>
  ${htmlTable(['Attribute', 'Type', 'Description'], [
    ['configId', 'int', 'Unique identifier for the configuration record'],
    ['pollingInterval', 'int', 'Interval in minutes between OrangeHRM polls'],
    ['retryLimit', 'int', 'Maximum retry attempts for failed operations'],
    ['notificationsEnabled', 'boolean', 'Whether the notification system is active'],
    ['lastSyncTimestamp', 'DateTime', 'Timestamp of the most recent successful sync'],
  ])}

  <h4>Class: ADAccount</h4>
  <p>An Active Directory user account managed by this system.</p>
  ${htmlTable(['Attribute', 'Type', 'Description'], [
    ['accountId', 'int', 'Unique identifier for the AD account record'],
    ['employeeId', 'int', 'Foreign key referencing the associated employee'],
    ['samAccountName', 'String', 'The AD sAMAccountName (login name)'],
    ['distinguishedName', 'String', 'The full LDAP distinguished name'],
    ['isEnabled', 'boolean', 'Whether the account is currently enabled'],
    ['createdAt', 'DateTime', 'Timestamp when the AD account was created'],
    ['disabledAt', 'DateTime', 'Timestamp when the account was disabled'],
  ])}
  ${htmlTable(['Operation', 'Signature', 'Description'], [
    ['enable', 'enable(): void', 'Enables the AD account via LDAP'],
    ['disable', 'disable(): void', 'Disables the AD account via LDAP'],
    ['addToGroup', 'addToGroup(groupDN: String): void', 'Adds this account to the specified AD security group'],
    ['removeFromGroup', 'removeFromGroup(groupDN: String): void', 'Removes this account from the specified AD security group'],
  ])}

  <h3>4.7 Class Relationships</h3>
  ${htmlTable(['Relationship', 'Type', 'Multiplicity', 'Description'], [
    ['User — Department', 'Association', 'Many-to-one', 'Each User belongs to one Department'],
    ['Employee — Department', 'Association', 'Many-to-one', 'Each Employee belongs to one Department'],
    ['Employee — ADAccount', 'Association', 'One-to-one', 'Each Employee has at most one ADAccount'],
    ['Employee — LifecycleTask', 'Association', 'One-to-many', 'Each Employee may have multiple LifecycleTasks'],
    ['Department — RolePermissionMapping', 'Association', 'One-to-many', 'Each Department may have multiple mappings'],
    ['RolePermissionMapping — SecurityGroup', 'Association', 'Many-to-one', 'Each mapping references one SecurityGroup'],
    ['LifecycleTask — TaskAction', 'Composition', 'One-to-many', 'Each task contains one or more TaskActions'],
    ['LifecycleTask — AuditLog', 'Association', 'One-to-many', 'Each task generates one or more AuditLog entries'],
    ['LifecycleTask — Notification', 'Association', 'One-to-many', 'Each task may trigger one or more Notifications'],
    ['User — Notification', 'Association', 'One-to-many', 'Each User may receive multiple Notifications'],
    ['User — Report', 'Association', 'One-to-many', 'Each User may generate multiple Reports'],
  ])}
</div>
</div>

<!-- ═══════════════════════════════════════════ SECTION 5 ═══════════════════ -->
<div class="page-break"></div>
<div class="content">
<div class="section">
  <h2><span class="section-num">5.</span> System Sequence Diagrams</h2>

  <h3>SSd-1: Automatic Onboarding (New Hire Detected)</h3>
  <img src="${imgBase64(path.join(DIAGRAMS_DIR, 'SSD1-Onboarding.png'))}" alt="SSd-1 Onboarding Sequence Diagram" style="width:100%;border:1px solid #bbdefb;border-radius:6px;"/>

  <h3>SSd-2: Automatic Deprovisioning (Termination Detected)</h3>
  <img src="${imgBase64(path.join(DIAGRAMS_DIR, 'SSD2-Offboarding.png'))}" alt="SSd-2 Offboarding Sequence Diagram" style="width:100%;border:1px solid #ffcdd2;border-radius:6px;"/>

  <h3>SSd-3: IT Admin Approves a Task Override</h3>
  <img src="${imgBase64(path.join(DIAGRAMS_DIR, 'SSD3-Override.png'))}" alt="SSd-3 Override Sequence Diagram" style="width:100%;border:1px solid #e1bee7;border-radius:6px;"/>

  <h3>SSd-4: Generate and Download Compliance Report</h3>
  <img src="${imgBase64(path.join(DIAGRAMS_DIR, 'SSD4-Report.png'))}" alt="SSd-4 Report Sequence Diagram" style="width:100%;border:1px solid #c8e6c9;border-radius:6px;"/>
</div>
</div>

<!-- ═══════════════════════════════════════════ SECTION 6 ═══════════════════ -->
<div class="page-break"></div>
<div class="content">
<div class="section">
  <h2><span class="section-num">6.</span> Activity Diagram</h2>
  <h3>Employee Onboarding/Offboarding Automation Flow</h3>
  <img src="${imgBase64(path.join(DIAGRAMS_DIR, 'ActivityDiagram.png'))}" alt="Activity Diagram" style="width:100%;border:1px solid #bbdefb;border-radius:6px;"/>
</div>
</div>

<!-- ═══════════════════════════════════════════ SECTION 7 ═══════════════════ -->
<div class="page-break"></div>
<div class="content">
<div class="section">
  <h2><span class="section-num">7.</span> User Interface Specification</h2>

  <h3>7.1 Global Layout and Navigation</h3>
  <p>Every screen follows a consistent three-zone layout: a top AppBar with notification bell and user session, a persistent left sidebar with navigation links, and a main content area.</p>
  <img src="${imgBase64(path.join(UI_PNGS_DIR, 'UI-0-Navigation-Structure.png'))}" alt="Navigation Structure" style="width:100%;border:1px solid #e0e0e0;border-radius:6px;margin:8px 0;"/>

  <h3>7.2 UI-1: Main Dashboard</h3>
  <p><strong>Description:</strong> The landing page after login. Provides a real-time overview of all lifecycle task activity and OrangeHRM sync status.</p>
  <img src="${imgBase64(path.join(UI_PNGS_DIR, 'UI-1-Main-Dashboard.png'))}" alt="Main Dashboard" style="width:100%;border:1px solid #e0e0e0;border-radius:6px;margin:6px 0;"/>
  <img src="${imgBase64(path.join(SCREENSHOTS_DIR, 'dashboard.png'))}" alt="Dashboard Screenshot" style="width:100%;border:1px solid #e0e0e0;border-radius:6px;margin:4px 0;"/>

  <h3>7.3 UI-2: Department Mapping Configuration</h3>
  <p><strong>Description:</strong> Allows IT Administrators to define which AD security groups are assigned to employees based on department and role.</p>
  <img src="${imgBase64(path.join(UI_PNGS_DIR, 'UI-2-Mapping-Configuration.png'))}" alt="Mapping Configuration" style="width:100%;border:1px solid #e0e0e0;border-radius:6px;margin:6px 0;"/>

  <h3>7.4 UI-3: Task Detail View (Modal)</h3>
  <p><strong>Description:</strong> A modal overlay showing full employee details, proposed AD actions, and override options before approval.</p>
  <img src="${imgBase64(path.join(UI_PNGS_DIR, 'UI-3-Task-Detail.png'))}" alt="Task Detail" style="width:100%;border:1px solid #e0e0e0;border-radius:6px;margin:6px 0;"/>
  <img src="${imgBase64(path.join(SCREENSHOTS_DIR, 'task-list.png'))}" alt="Task List Screenshot" style="width:100%;border:1px solid #e0e0e0;border-radius:6px;margin:4px 0;"/>

  <h3>7.5 UI-4: Audit Log Viewer</h3>
  <p><strong>Description:</strong> Searchable, filterable record of all account lifecycle events with CSV export.</p>
  <img src="${imgBase64(path.join(UI_PNGS_DIR, 'UI-4-Audit-Log.png'))}" alt="Audit Log" style="width:100%;border:1px solid #e0e0e0;border-radius:6px;margin:6px 0;"/>
  <img src="${imgBase64(path.join(SCREENSHOTS_DIR, 'audit-log.png'))}" alt="Audit Log Screenshot" style="width:100%;border:1px solid #e0e0e0;border-radius:6px;margin:4px 0;"/>

  <h3>7.6 UI-5: Report Generation</h3>
  <p><strong>Description:</strong> Form-based interface for generating and downloading compliance and activity reports.</p>
  <img src="${imgBase64(path.join(UI_PNGS_DIR, 'UI-5-Report-Generation.png'))}" alt="Report Generation" style="width:100%;border:1px solid #e0e0e0;border-radius:6px;margin:6px 0;"/>

  <h3>7.7 UI-6: Employee Search &amp; Status Lookup</h3>
  <p><strong>Description:</strong> Search employees by name, ID, or email; click a row to view AD account details.</p>
  <img src="${imgBase64(path.join(UI_PNGS_DIR, 'UI-6-Employee-Search.png'))}" alt="Employee Search" style="width:100%;border:1px solid #e0e0e0;border-radius:6px;margin:6px 0;"/>
  <img src="${imgBase64(path.join(SCREENSHOTS_DIR, 'employee-search.png'))}" alt="Employee Search Screenshot" style="width:100%;border:1px solid #e0e0e0;border-radius:6px;margin:4px 0;"/>

  <h3>7.8 User Effort Estimation</h3>
  ${htmlTable(['Scenario', 'Mouse Clicks', 'Keystrokes', 'Total'], [
    ['A: Quick-approve a pending task', '2', '0', '2'],
    ['B: Approve with group override', '6', '0', '6'],
    ['C: Search for employee by name', '4', '5–6', '9–10'],
    ['D: Add a new group mapping', '7', '7', '14'],
    ['E: Generate and download a report', '13', '0', '13'],
    ['F: Filter audit logs for failures', '5', '0', '5'],
  ])}
  <p>The most common operations (approving a task, searching for an employee, viewing audit logs) require 5 or fewer total interactions, consistent with the system's goal of reducing IT workload.</p>
</div>
</div>

<!-- ═══════════════════════════════════════════ SECTION 8 ═══════════════════ -->
<div class="page-break"></div>
<div class="content">
<div class="section">
  <h2><span class="section-num">8.</span> Project Plan</h2>

  <h3>Development Schedule</h3>
  ${htmlTable(['Week', 'Status', 'Milestones'], [
    ['1–2', '<span class="badge badge-complete">Complete</span>', 'Project proposal submitted and approved'],
    ['3–4', '<span class="badge badge-complete">Complete</span>', 'System requirements documentation; environment setup (OrangeHRM + AD VM)'],
    ['5–7', '<span class="badge badge-complete">Complete</span>', 'MySQL schema deployed; React frontend connected to Node.js backend; core dashboard UI built'],
    ['8', '<span class="badge badge-complete">Complete</span>', 'Mid-term milestone: core onboarding automation working end-to-end; demo recording'],
    ['9–11', '<span class="badge badge-complete">Complete</span>', 'Offboarding automation; notification system; audit logging; access request workflow'],
    ['12–14', '<span class="badge badge-progress">In Progress</span>', 'Reporting and analytics; approval workflow refinements; unit and integration tests'],
    ['15', '<span class="badge badge-planned">Planned</span>', 'Final integration testing; final demo recording; complete project documentation'],
  ])}

  <h3>Current Implementation Status</h3>
  <p>All 15 functional requirements (REQ-1 through REQ-15) have been implemented:</p>
  ${htmlTable(['REQ', 'Feature', 'Status'], [
    ['REQ-1, REQ-4', 'OrangeHRM polling (new hires + terminations)', '<span class="badge badge-complete">Complete</span>'],
    ['REQ-2', 'AD account creation via LDAP', '<span class="badge badge-complete">Complete</span>'],
    ['REQ-3', 'Security group assignment from mappings', '<span class="badge badge-complete">Complete</span>'],
    ['REQ-5', 'AD account disable on termination', '<span class="badge badge-complete">Complete</span>'],
    ['REQ-6', 'Role-permission mapping configuration UI', '<span class="badge badge-complete">Complete</span>'],
    ['REQ-7', 'Task approve/reject/override workflow', '<span class="badge badge-complete">Complete</span>'],
    ['REQ-8', 'Configurable polling interval', '<span class="badge badge-complete">Complete</span>'],
    ['REQ-9', 'Audit log with date filter and CSV export', '<span class="badge badge-complete">Complete</span>'],
    ['REQ-10', 'Compliance report generation + CSV download', '<span class="badge badge-complete">Complete</span>'],
    ['REQ-11, REQ-13', 'Employee search with AD account detail', '<span class="badge badge-complete">Complete</span>'],
    ['REQ-12', 'High-priority task flagging', '<span class="badge badge-complete">Complete</span>'],
    ['REQ-14', 'Access request submission and approval', '<span class="badge badge-complete">Complete</span>'],
    ['REQ-15', 'In-app notifications with unread badge', '<span class="badge badge-complete">Complete</span>'],
  ])}

  <h3>Planned for Final Submission</h3>
  <ul>
    <li>LDAPS (encrypted AD communication on port 636)</li>
    <li>Role-based UI views (HR Personnel, Department Manager scoped views)</li>
    <li>Unit tests (Jest) for provisioning, deprovisioning, and notification services</li>
    <li>Integration tests for end-to-end lifecycle flows</li>
  </ul>

  <h3>Software Stack</h3>
  ${htmlTable(['Layer', 'Technology'], [
    ['Frontend', 'React 18, Material UI (MUI)'],
    ['Backend', 'Node.js, Express 4'],
    ['Database', 'MySQL 8 (12-table schema)'],
    ['HR Integration', 'OrangeHRM 5.x (direct MySQL polling via node-schedule)'],
    ['Directory', 'Windows Active Directory, ldapjs (LDAP)'],
    ['Auth', 'JWT (jsonwebtoken)'],
  ])}
</div>
</div>

<!-- ═══════════════════════════════════════════ SECTION 9 ═══════════════════ -->
<div class="page-break"></div>
<div class="content">
<div class="section">
  <h2><span class="section-num">9.</span> References</h2>
  <ol>
    <li>OrangeHRM. (2024). <em>OrangeHRM Open Source Documentation</em>. https://www.orangehrm.com</li>
    <li>Microsoft Corporation. (2024). <em>Active Directory Domain Services Overview</em>. Microsoft Docs. https://docs.microsoft.com/en-us/windows-server/identity/ad-ds/get-started/virtual-dc/active-directory-domain-services-overview</li>
    <li>ldapjs Contributors. (2024). <em>ldapjs — LDAP Client and Server for Node.js</em>. http://ldapjs.org</li>
    <li>OpenJS Foundation. (2024). <em>Node.js Documentation</em>. https://nodejs.org/en/docs</li>
    <li>Meta Open Source. (2024). <em>React Documentation</em>. https://react.dev</li>
    <li>MUI. (2024). <em>Material UI Component Library</em>. https://mui.com</li>
    <li>MySQL AB. (2024). <em>MySQL 8.0 Reference Manual</em>. https://dev.mysql.com/doc/refman/8.0/en</li>
    <li>OWASP Foundation. (2024). <em>OWASP Top Ten</em>. https://owasp.org/www-project-top-ten</li>
  </ol>
</div>
</div>

<!-- ═══════════════════════════════════════════ SECTION 10 ══════════════════ -->
<div class="page-break"></div>
<div class="content">
<div class="section">
  <h2><span class="section-num">10.</span> Traceability Matrix</h2>
  <p>Maps each functional requirement to the implementing source files and the corresponding automated test coverage.</p>

  <h3>10.1 Functional Requirements</h3>
  ${htmlTable(['REQ', 'Description', 'Implementing Files', 'Test File'], [
    ['REQ-1', 'Auto-detect new employees', 'scheduler/poller.js', 'provisioningService.test.js'],
    ['REQ-2', 'Create AD accounts', 'services/provisioningService.js, connectors/ADConnector.js', 'provisioningService.test.js'],
    ['REQ-3', 'Assign AD security groups', 'models/RoleMapping.js, services/provisioningService.js', 'provisioningService.test.js'],
    ['REQ-4', 'Auto-detect terminations', 'scheduler/poller.js', 'deprovisioningService.test.js'],
    ['REQ-5', 'Disable AD accounts', 'services/deprovisioningService.js, connectors/ADConnector.js', 'deprovisioningService.test.js'],
    ['REQ-6', 'Configure dept/role→group mappings', 'controllers/mappingController.js, models/RoleMapping.js, pages/MappingConfig.jsx', 'tasks.test.js'],
    ['REQ-7', 'Approve/override automated actions', 'controllers/taskController.js, routes/tasks.js', 'tasks.test.js'],
    ['REQ-8', 'Configure polling interval', 'controllers/configController.js, models/SystemConfig.js', 'auth.test.js'],
    ['REQ-9', 'Audit log of all lifecycle events', 'models/AuditLog.js, controllers/auditController.js', 'audit.test.js'],
    ['REQ-10', 'Generate compliance reports', 'controllers/reportController.js, models/Report.js', 'auth.test.js'],
    ['REQ-11', 'View provisioning status', 'controllers/employeeController.js, pages/EmployeeSearch.jsx', 'employees.test.js'],
    ['REQ-12', 'Flag high-priority onboarding', 'controllers/taskController.js (setPriority)', 'tasks.test.js'],
    ['REQ-13', 'View team account status', 'controllers/employeeController.js', 'employees.test.js'],
    ['REQ-14', 'Submit additional-access requests', 'controllers/accessRequestController.js', 'auth.test.js'],
    ['REQ-15', 'Notifications on account actions', 'services/notificationService.js, models/Notification.js', 'provisioningService.test.js, deprovisioningService.test.js'],
  ])}

  <h3>10.2 Nonfunctional Requirements</h3>
  ${htmlTable(['NFR', 'Description', 'Implementing Files'], [
    ['NFR-1', 'OrangeHRM integration', 'connectors/OrangeHRMDbConnector.js, scheduler/poller.js'],
    ['NFR-2', 'LDAP communication', 'connectors/ADConnector.js, config/ad.js'],
    ['NFR-3', 'Clear dashboard layout', 'pages/Dashboard.jsx, components/Layout.jsx'],
    ['NFR-4', 'Intuitive sidebar navigation', 'components/Layout.jsx'],
    ['NFR-5', 'Retry up to configurable limit', 'withRetry() inline in both services, models/SystemConfig.js'],
    ['NFR-6', 'Graceful degradation on failure', 'services/provisioningService.js (per-group try/catch), services/deprovisioningService.js'],
    ['NFR-7', 'Process changes within poll interval', 'scheduler/poller.js (node-schedule)'],
    ['NFR-8', 'AD operations complete in &lt;30s', 'connectors/ADConnector.js (ldapjs synchronous LDAP ops)'],
    ['NFR-9', 'Detailed error logging', 'All services log to AuditLog and console.error'],
    ['NFR-10', 'Runtime config changes without code', 'controllers/configController.js, models/SystemConfig.js'],
  ])}
</div>
</div>

<!-- ═══════════════════════════════════════════ SECTION 11 ══════════════════ -->
<div class="page-break"></div>
<div class="content">
<div class="section">
  <h2><span class="section-num">11.</span> System Architecture and System Design</h2>

  <h3>11.1 Architecture Overview</h3>
  <img src="${imgBase64(path.join(DIAGRAMS_DIR, 'SystemArchitecture.png'))}" alt="System Architecture" style="width:100%;border:1px solid #bbdefb;border-radius:6px;margin:8px 0;"/>

  <div class="ssd-box">OrangeHRM MySQL ──(direct SQL, every N min)──► OrangeHRMDbConnector.js
                                              │
                                     scheduler/poller.js (node-schedule cron)
                                              │
         ┌────────────────────────────────────┼──────────────────────────────┐
         ▼                                    ▼                              ▼
provisionEmployee()                syncEmployeeProfile()        deprovisionEmployee()
         │                                    │                              │
         └────────────────────────────────────┴──────────────────────────────┘
                                              │
                                     ADConnector.js (ldapjs)
                                              │
                                 Windows Active Directory (LDAP 389)

React :3000 ── axios + JWT ──► Express API :4000 ──► MySQL it_lifecycle</div>

  <h3>11.2 Component Descriptions</h3>
  ${htmlTable(['Component', 'Technology', 'Role'], [
    ['React Frontend', 'React 18, Material UI', 'IT Admin dashboard; 10 pages: Dashboard, Task List, Audit Log, Mappings, Reports, etc.'],
    ['Express API', 'Node.js, Express 4', '15 REST endpoints; JWT authentication; routes to controllers and models'],
    ['MySQL (it_lifecycle)', 'MySQL 8', '12-table application database: employees, tasks, audit_logs, notifications, etc.'],
    ['OrangeHRM MySQL', 'MySQL 8 (XAMPP)', 'Read-only source of employee data; polled via direct SQL'],
    ['OrangeHRMDbConnector', 'mysql2', 'Executes 3 queries: fetchAllEmployees, fetchTerminatedEmployees, fetchDepartments'],
    ['poller.js', 'node-schedule', 'Cron-driven poll loop; maintains in-memory lastKnownState map; routes changes to provision/deprovision/sync'],
    ['provisioningService', 'Node.js', 'Orchestrates onboarding: DB upsert → AD create → group assignment → task steps → audit log'],
    ['deprovisioningService', 'Node.js', 'Orchestrates offboarding: group removal → AD disable → DB update → audit log'],
    ['ADConnector', 'ldapjs', '7 LDAP operations: createUser, enableUser, disableUser, updateUserAttributes, addToGroup, removeFromGroups, userExists'],
  ])}

  <h3>11.3 Key Design Decisions</h3>
  <ol>
    <li><strong>Direct MySQL polling instead of OrangeHRM REST API</strong> — The REST API requires OAuth token management and has rate limits. Direct MySQL read access (read-only) is simpler and more reliable for this on-premise deployment.</li>
    <li><strong>userAccountControl = 544 (NORMAL_ACCOUNT + PASSWD_NOTREQD)</strong> — Allows account creation over plain LDAP without needing to set a password in the create operation. Terminations use flag 514 (ACCOUNTDISABLE).</li>
    <li><strong>In-memory lastKnownState map</strong> — The poller maintains <code>{ empNumber → status }</code> in memory. This avoids a DB query per employee per poll cycle. The map is seeded from the local DB on first run, then kept current each subsequent cycle.</li>
    <li><strong>AD update before DB update in syncEmployeeProfile</strong> — If the LDAP operation fails, the local DB is left unchanged so the next poll re-detects the diff and retries automatically (NFR-6).</li>
    <li><strong>Single system_config row (id=1)</strong> — Seeded by schema.sql. All callers treat a null response as defaults, so the system works even if the row is accidentally deleted.</li>
  </ol>
</div>
</div>

<!-- ═══════════════════════════════════════════ SECTION 12 ══════════════════ -->
<div class="page-break"></div>
<div class="content">
<div class="section">
  <h2><span class="section-num">12.</span> Algorithms and Data Structures</h2>

  <h3>12.1 Username Generation Algorithm</h3>
  <p><strong>Location:</strong> <code>server/services/provisioningService.js</code> — <code>generateUsername(firstName, lastName)</code></p>
  <div class="ssd-box">Input:  firstName (String), lastName (String)
Output: sAMAccountName (String, max 20 chars, lowercase alphanumeric)

1. base = lowercase(firstName + lastName)
2. base = remove all non-alphanumeric characters from base
3. username = base[0 .. 19]   // truncate to 20 chars
4. If username already exists in AD:
     append "2", retry checkExists; if still taken, try "3" ... "99"
Return username</div>
  <p><strong>Example:</strong> <code>firstName="Mary Ann"</code>, <code>lastName="O'Brien"</code> → <code>base="maryannobrien"</code> → <code>username="maryannobrien"</code></p>

  <h3>12.2 Retry Algorithm</h3>
  <p><strong>Location:</strong> Inline function <code>withRetry(fn, limit)</code> in both service files. Also tested standalone in <code>2_unit_testing/tests/withRetry.test.js</code>.</p>
  <div class="ssd-box">Input:  fn    — async function to attempt
        limit — maximum attempts (default: 3, from system_config.retry_limit)

for attempt = 1 to limit:
    try:
        return await fn(attempt)
    catch error:
        lastError = error
        if attempt &lt; limit:
            await sleep(2000 ms)

throw lastError   // all attempts failed</div>
  <p><strong>Complexity:</strong> O(limit) time, O(1) space. The 2-second inter-attempt delay prevents thundering-herd load on a momentarily unavailable Active Directory server (NFR-5).</p>

  <h3>12.3 Polling State Machine</h3>
  <p><strong>Location:</strong> <code>server/scheduler/poller.js</code> — <code>poll()</code> and <code>lastKnownState</code></p>
  <p><strong>Data structure:</strong> <code>lastKnownState: Object&lt;empNumber: String, status: 'ACTIVE' | 'TERMINATED'&gt;</code></p>
  ${htmlTable(['Previous State', 'Current OrangeHRM Status', 'Action Taken'], [
    ['NOT IN MAP', 'ACTIVE', 'provisionEmployee() — new hire detected'],
    ['NOT IN MAP', 'TERMINATED', '(skip — was terminated before system was deployed)'],
    ['ACTIVE', 'TERMINATED', 'deprovisionEmployee() — termination detected'],
    ['ACTIVE', 'ACTIVE', 'syncEmployeeProfile() — check for profile changes'],
    ['TERMINATED', 'TERMINATED', '(skip — already offboarded)'],
    ['FIRST RUN (any)', 'any', 'Seed lastKnownState from local DB; no provisioning actions'],
  ])}

  <h3>12.4 Department Sync Map</h3>
  <p>Before processing employees each poll cycle, <code>syncDepartments()</code> builds a <code>nameToId</code> map:</p>
  <div class="ssd-box">nameToId = {}
for each dept in OrangeHRM.fetchDepartments():
    id = Department.upsertByName(dept.name)
    nameToId[dept.name] = id

// Used by each employee record: emp.departmentId = nameToId[emp.departmentName]</div>
  <p>This resolves the human-readable OrangeHRM department name (from <code>custom1</code>) to the local integer ID before provisioning.</p>

  <h3>12.5 Key Database Tables</h3>
  <h4>employees</h4>
  ${htmlTable(['Column', 'Type', 'Notes'], [
    ['orangehrm_id', 'VARCHAR UNIQUE', 'External key from OrangeHRM emp_number; used for state lookups'],
    ['status', 'ENUM(ACTIVE, TERMINATED, SUSPENDED)', 'Drives state machine transitions in the poller'],
    ['department_id', 'FK → departments', 'Resolved from OrangeHRM custom1 field via syncDepartments()'],
    ['supervisor_emp_number', 'VARCHAR', 'OrangeHRM emp_number; resolved to AD DN by resolveManagerDn()'],
  ])}
  <h4>ad_accounts</h4>
  ${htmlTable(['Column', 'Type', 'Notes'], [
    ['username', 'VARCHAR UNIQUE', 'sAMAccountName; max 20 chars; generated by generateUsername()'],
    ['dn', 'VARCHAR', 'Full LDAP distinguished name; used for group operations'],
    ['status', 'ENUM(ACTIVE, DISABLED, DELETED)', 'Mirrors AD account state; updated after each LDAP operation'],
  ])}
</div>
</div>

<!-- ═══════════════════════════════════════════ SECTION 13 ══════════════════ -->
<div class="page-break"></div>
<div class="content">
<div class="section">
  <h2><span class="section-num">13.</span> UI Design &amp; Implementation / Design of Tests</h2>

  <h3>13.1 UI Implementation</h3>
  <p>The React frontend (<code>client/src/</code>) is built with React 18 and Material UI v5.</p>
  ${htmlTable(['Concern', 'Implementation'], [
    ['Authentication', 'App.js — RequireAuth HOC checks for JWT in localStorage; redirects to /login if absent'],
    ['API calls', 'api/client.js — Axios instance; request interceptor attaches Authorization: Bearer token; 401 response interceptor clears token and redirects'],
    ['Notification badge', 'components/Layout.jsx — polls GET /api/notifications/unread-count every 30 seconds'],
    ['MUI Theme', 'theme.js — primary #1565c0 (blue), secondary #00897b (teal)'],
    ['Routing', 'React Router v6; all routes except /login wrapped in RequireAuth'],
  ])}

  <h4>Page Component Summary</h4>
  ${htmlTable(['Page', 'File', 'Key MUI Components Used'], [
    ['Dashboard', 'pages/Dashboard.jsx', 'Card, Grid, Button (Sync Now), CircularProgress'],
    ['Employee Search', 'pages/EmployeeSearch.jsx', 'TextField (search), Table, Dialog (AD detail modal), Chip (status)'],
    ['Task List', 'pages/TaskList.jsx', 'Table, Select (status/type filters), Chip (priority badge), IconButton (flag Critical)'],
    ['Task Detail', 'pages/TaskDetail.jsx', 'Card, List (steps), Button (approve/reject), Alert (error)'],
    ['Mapping Config', 'pages/MappingConfig.jsx', 'List, Dialog, Autocomplete (group picker), Chip'],
    ['Audit Log', 'pages/AuditLog.jsx', 'Table, TextField (date pickers), Button (CSV export), Pagination'],
    ['Access Requests', 'pages/AccessRequests.jsx', 'Table, Button (approve/reject), Chip (status badge)'],
    ['Reports', 'pages/ReportGeneration.jsx', 'Select (type), TextField (date range), Button (generate), Link (download)'],
    ['Settings', 'pages/Settings.jsx', 'TextField (polling interval, retry limit), Switch (notifications), Button (restart server)'],
    ['Notifications', 'pages/Notifications.jsx', 'List, ListItem, IconButton (mark read), Badge'],
  ])}

  <h3>13.2 Design of Tests</h3>

  <h4>Unit Tests (<code>2_unit_testing/</code>)</h4>
  ${htmlTable(['Test File', 'Mocking Strategy', 'Coverage Focus'], [
    ['withRetry.test.js', 'jest.useFakeTimers() for setTimeout; no external dependencies', 'Retry count, return value, error propagation, attempt numbering'],
    ['provisioningService.test.js', 'All models, ADConnector, notificationService replaced with jest.fn(); fake timers for retry delays', 'Username generation, DB upserts, AD createUser call, group assignment, task state transitions, failure handling'],
    ['deprovisioningService.test.js', 'Same mock pattern as provisioning; fake timers', 'Early-exit conditions (not found, already terminated), group removal, AD disable, employee status update, SKIPPED step when no AD account'],
  ])}

  <h4>Integration Tests (<code>3_integration_testing/</code>)</h4>
  ${htmlTable(['Test File', 'Mocking Strategy', 'Coverage Focus'], [
    ['auth.test.js', 'MySQL pool mocked; poller, OrangeHRM connector, AD config mocked; real Express app loaded via supertest', 'Login 200/401/400, JWT enforcement (401 without token, 401 bad token, 200 good token), health endpoint'],
    ['employees.test.js', 'DB mock returns configurable row arrays per test case; JWT signed with test secret', 'GET /employees 200+array, 401; search query passthrough; GET/:id 200 or 404'],
    ['tasks.test.js', 'DB mock sequenced per test (findById, UPDATE, INSERT); JWT signed with test secret', 'GET /tasks, GET /tasks/stats, GET /tasks/:id, PUT /tasks/:id/priority (valid/invalid), POST /tasks/:id/approve'],
    ['audit.test.js', 'DB mock returns sample log rows; JWT signed with test secret', 'GET /audit 200+array, 401, empty DB; date filter params; GET /audit/export CSV content-type and header row'],
  ])}

  <h4>Test Isolation</h4>
  <p>Each test suite calls <code>jest.clearAllMocks()</code> in <code>beforeEach</code> to reset call counts and return values between tests. Integration tests sign their own short-lived JWT tokens (secret: <code>integration-test-secret</code>) so no sequential login request is required. Unit tests use <code>jest.useFakeTimers()</code> / <code>jest.useRealTimers()</code> in <code>beforeEach</code> / <code>afterEach</code> to prevent timer leaks between test cases.</p>
</div>
</div>

</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT 2: Brochure / Flyer
// ─────────────────────────────────────────────────────────────────────────────
function buildBrochureHTML() {
  const dash = imgBase64(path.join(SCREENSHOTS_DIR, 'dashboard.png'));
  const emp  = imgBase64(path.join(SCREENSHOTS_DIR, 'employee-search.png'));
  const task = imgBase64(path.join(SCREENSHOTS_DIR, 'task-list.png'));
  const audit= imgBase64(path.join(SCREENSHOTS_DIR, 'audit-log.png'));

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
${BASE_CSS}
body { font-size: 10.5pt; }
.brochure-cover {
  height: 100vh;
  background: linear-gradient(160deg, #0d47a1 0%, #1976d2 60%, #42a5f5 100%);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 50px 40px;
  position: relative;
}
.brochure-cover::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 60px;
  background: white;
  clip-path: ellipse(55% 100% at 50% 100%);
}
.brochure-tagline {
  font-size: 13pt;
  font-style: italic;
  color: rgba(255,255,255,0.85);
  margin: 10px 0 30px;
}
.feature-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 12px 0;
}
.feature-card {
  background: #f8fbff;
  border: 1px solid #bbdefb;
  border-radius: 8px;
  padding: 12px 14px;
}
.feature-card h4 { margin: 0 0 5px; color: #0d47a1; }
.feature-num {
  display: inline-block;
  background: #1565c0;
  color: white;
  width: 22px; height: 22px;
  border-radius: 50%;
  text-align: center;
  line-height: 22px;
  font-size: 9pt;
  font-weight: 700;
  margin-right: 6px;
}
.screenshot-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 12px 0;
}
.screenshot-row img {
  width: 100%;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}
.screenshot-caption {
  font-size: 8pt;
  color: #555;
  text-align: center;
  margin-top: 2px;
}
.arch-box {
  background: #1a1a2e;
  color: #80cbc4;
  font-family: monospace;
  font-size: 7.5pt;
  padding: 12px;
  border-radius: 6px;
  white-space: pre;
  line-height: 1.5;
}
.footer-bar {
  background: #0d47a1;
  color: rgba(255,255,255,0.9);
  text-align: center;
  padding: 14px;
  font-size: 9pt;
  border-radius: 0 0 8px 8px;
  margin-top: 20px;
}
</style>
</head>
<body>

<!-- COVER -->
<div class="brochure-cover">
  <div style="font-size:52pt;margin-bottom:16px;">⚙</div>
  <h1 class="cover-title" style="font-size:26pt;color:white;border:none;margin:0 0 8px;">IT Employee Lifecycle<br/>Automation System</h1>
  <div class="brochure-tagline">Automate Onboarding &amp; Offboarding — Zero Manual Steps, Zero Orphaned Accounts</div>
  <div class="cover-divider"></div>
  <div style="font-size:11pt;color:rgba(255,255,255,0.85);line-height:2;">
    <strong style="color:white;">Author:</strong> Stephen Torrijas<br/>
    <strong style="color:white;">Project:</strong> IT Employee Lifecycle Automation System
  </div>
</div>

<!-- PAGE 2 -->
<div class="page-break"></div>
<div class="content">

  <h2 style="color:#c62828;">The Problem</h2>
  <p>IT administrators spend hours <strong>manually creating Active Directory accounts</strong> for new hires — often <em>after</em> the employee's first day — and frequently miss offboarding notifications, leaving former employees with active credentials and access to sensitive resources. Manual provisioning leads to inconsistent permissions, audit failures, and significant security risk.</p>

  <h2 style="color:#2e7d32;">The Solution</h2>
  <p>The <strong>IT Employee Lifecycle Automation System</strong> continuously monitors OrangeHRM for personnel changes and automatically executes corresponding Active Directory actions. New hires get accounts on <strong>Day 1</strong>. Departing employees are disabled within <strong>minutes of termination</strong>. Every action is logged, auditable, and reviewable through a clean web dashboard.</p>

  <hr/>

  <h2>Key Features</h2>
  <div class="feature-grid">
    <div class="feature-card"><h4><span class="feature-num">1</span>OrangeHRM Sync</h4><p>Polls OrangeHRM at a configurable interval, syncing employee name, department, and job title in real time.</p></div>
    <div class="feature-card"><h4><span class="feature-num">2</span>Auto AD Provisioning</h4><p>Creates Active Directory accounts via LDAP with correct OU placement, display name, email, and enabled status.</p></div>
    <div class="feature-card"><h4><span class="feature-num">3</span>Role-Based Group Assignment</h4><p>Maps HR department + job title combinations to AD security groups; assignments applied automatically on creation.</p></div>
    <div class="feature-card"><h4><span class="feature-num">4</span>Auto Deprovisioning</h4><p>Detects terminations and disables AD accounts immediately, removing group memberships to eliminate orphaned access.</p></div>
    <div class="feature-card"><h4><span class="feature-num">5</span>Task Management</h4><p>Tracks every provisioning task with status (Pending → In Progress → Completed/Failed), retry logic, and priority flagging.</p></div>
    <div class="feature-card"><h4><span class="feature-num">6</span>Audit Log + CSV Export</h4><p>Full chronological record of all lifecycle events with date-range filtering and one-click CSV export for compliance reviews.</p></div>
    <div class="feature-card"><h4><span class="feature-num">7</span>Notification System</h4><p>Real-time in-app notifications with unread badge counter; notifications toggle-able via system settings.</p></div>
    <div class="feature-card"><h4><span class="feature-num">8</span>Access Request Workflow</h4><p>Department managers submit additional-access requests; IT Admins approve or reject with full audit trail.</p></div>
    <div class="feature-card"><h4><span class="feature-num">9</span>Compliance Reports</h4><p>Generate activity summary reports filtered by date range and department; download as CSV.</p></div>
    <div class="feature-card"><h4><span class="feature-num">10</span>System Configuration UI</h4><p>Adjust polling interval, retry limit, and notification settings at runtime — no code changes required.</p></div>
  </div>

  <h2>System Architecture</h2>
  <img src="${imgBase64(path.join(DIAGRAMS_DIR, 'SystemArchitecture.png'))}" alt="System Architecture" style="width:100%;border:1px solid #e0e0e0;border-radius:6px;margin:8px 0;"/>

</div>

<!-- PAGE 3 — Screenshots -->
<div class="page-break"></div>
<div class="content">
  <h2>Screen Snapshots</h2>

  <h3>Dashboard — Real-time Task Statistics &amp; OrangeHRM Sync Status</h3>
  <img src="${dash}" alt="Dashboard" style="width:100%;"/>

  <h3>Employee Search — Clickable Rows with AD Account Detail Modal</h3>
  <img src="${emp}" alt="Employee Search" style="width:100%;"/>

  <h3>Task List — Status/Type Filters, Priority Badges, Flag-Critical Button</h3>
  <img src="${task}" alt="Task List" style="width:100%;"/>

  <h3>Audit Log — Date Range Filtering &amp; CSV Export</h3>
  <img src="${audit}" alt="Audit Log" style="width:100%;"/>

  <hr/>

  <h2>System Requirements</h2>
  ${htmlTable(['Component', 'Requirement'], [
    ['<strong>Runtime</strong>', 'Node.js 18+ (tested on v25.7.0)'],
    ['<strong>Database</strong>', 'MySQL 8.0+ (schema: it_lifecycle)'],
    ['<strong>HR System</strong>', 'OrangeHRM 5.x (direct DB access)'],
    ['<strong>Directory</strong>', 'Windows Server Active Directory (LDAP port 389)'],
    ['<strong>OS</strong>', 'Windows Server 2019/2022 (for AD integration)'],
    ['<strong>Browser</strong>', 'Chrome 120+, Edge 120+, Firefox 120+'],
  ])}

  <h2>Feature-to-Requirement Mapping</h2>
  ${htmlTable(['Feature', 'Requirement(s)'], [
    ['OrangeHRM Sync + Auto Provisioning', 'REQ-1, REQ-2, NFR-1'],
    ['Role-Based Group Assignment', 'REQ-3, REQ-6'],
    ['Auto Deprovisioning on Termination', 'REQ-4, REQ-5'],
    ['Task Management + Retry Logic', 'REQ-7, NFR-5, NFR-6'],
    ['Audit Log with CSV Export', 'REQ-9, NFR-9'],
    ['Notification System', 'REQ-15, NFR-3'],
    ['Access Request Workflow', 'REQ-14, REQ-7'],
    ['Compliance Report Generation', 'REQ-10'],
    ['System Configuration UI', 'REQ-8, NFR-10'],
    ['Employee Search with AD Detail', 'REQ-11, REQ-13'],
  ])}

  <div class="footer-bar">
    IT Employee Lifecycle Automation System — Stephen Torrijas — March 2026
  </div>
</div>

</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT 3: Presentation Slides
// ─────────────────────────────────────────────────────────────────────────────
function buildSlidesHTML() {
  const slideCss = `
    ${BASE_CSS}
    body { background: #1a1a2e; }
    .slide {
      width: 100%;
      min-height: 100vh;
      background: white;
      display: flex;
      flex-direction: column;
      page-break-after: always;
      position: relative;
      overflow: hidden;
    }
    .slide:last-child { page-break-after: avoid; }
    .slide-header {
      background: linear-gradient(135deg, #0d47a1, #1976d2);
      color: white;
      padding: 20px 36px 16px;
      min-height: 80px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }
    .slide-title { font-size: 18pt; font-weight: 700; color: white; margin: 0; }
    .slide-subtitle { font-size: 11pt; color: rgba(255,255,255,0.8); margin: 4px 0 0; }
    .slide-number {
      position: absolute;
      bottom: 14px; right: 20px;
      font-size: 8pt;
      color: #90a4ae;
    }
    .slide-footer {
      position: absolute;
      bottom: 14px; left: 20px;
      font-size: 8pt;
      color: #90a4ae;
    }
    .slide-body {
      flex: 1;
      padding: 20px 36px 40px;
    }
    .slide-body h2 { font-size: 14pt; border: none; margin: 10px 0 8px; }
    .slide-body h3 { font-size: 12pt; margin: 10px 0 6px; }
    .slide-body ul { margin: 6px 0 10px 18px; }
    .slide-body li { margin-bottom: 5px; font-size: 10.5pt; }
    .code-box {
      background: #1a1a2e;
      color: #a5d6a7;
      font-family: monospace;
      font-size: 8pt;
      padding: 12px;
      border-radius: 6px;
      white-space: pre;
      margin: 8px 0;
      line-height: 1.5;
    }
    .title-slide {
      background: linear-gradient(145deg, #0d47a1 0%, #1565c0 50%, #1976d2 100%);
      color: white;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 40px;
    }
    .title-slide h1 { font-size: 28pt; color: white; border: none; margin: 0 0 12px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .problem-box { background: #fff8e1; border-left: 4px solid #f57f17; padding: 10px 14px; border-radius: 0 6px 6px 0; margin-bottom: 10px; }
    .solution-box { background: #e8f5e9; border-left: 4px solid #2e7d32; padding: 10px 14px; border-radius: 0 6px 6px 0; margin-bottom: 10px; }
  `;

  const slides = [
    // Slide 1 — Title
    `<div class="slide">
      <div class="title-slide">
        <div style="font-size:48pt;margin-bottom:16px;">⚙</div>
        <h1>IT Employee Lifecycle<br/>Automation System</h1>
        <div style="width:60px;height:3px;background:rgba(255,255,255,0.4);border-radius:2px;margin:16px auto;"></div>
        <div style="font-size:14pt;color:rgba(255,255,255,0.85);font-style:italic;margin-bottom:24px;">Automate onboarding and offboarding — zero manual steps, zero orphaned accounts.</div>
        <div style="font-size:11pt;color:rgba(255,255,255,0.9);line-height:2.2;">
          <strong style="color:white;">Stephen Torrijas</strong><br/>
          March 2026
        </div>
      </div>
      <div class="slide-number">1 / 10</div>
    </div>`,

    // Slide 2 — The Problem
    `<div class="slide">
      <div class="slide-header">
        <div class="slide-title">The Problem: Manual IT Account Management</div>
      </div>
      <div class="slide-body">
        <div class="two-col">
          <div>
            <h3 style="color:#c62828;">When a new employee joins:</h3>
            <ul>
              <li>IT receives notification via email or ticket — often the day of or after the start date</li>
              <li>Admin must manually create an AD account, assign security groups, and verify access</li>
              <li>Result: <strong>delayed first-day access, lost productivity</strong></li>
            </ul>
          </div>
          <div>
            <h3 style="color:#c62828;">When an employee leaves:</h3>
            <ul>
              <li>IT frequently receives <strong>late or incomplete notifications</strong></li>
              <li>Former employee retains active credentials for days or weeks</li>
              <li><strong>Orphaned accounts</strong> are a common vector for data breaches</li>
            </ul>
          </div>
        </div>
        <h3 style="color:#c62828;">Additional Issues:</h3>
        <ul>
          <li>Different IT staff assign different permissions to the same role → <strong>access disparities</strong></li>
          <li>No centralized audit trail → <strong>compliance failures</strong></li>
          <li>Manual effort is time-consuming, error-prone, and hard to scale</li>
        </ul>
      </div>
      <div class="slide-footer">IT Employee Lifecycle Automation System — Stephen Torrijas</div>
      <div class="slide-number">2 / 10</div>
    </div>`,

    // Slide 3 — The Solution
    `<div class="slide">
      <div class="slide-header">
        <div class="slide-title">The Solution: Automated Lifecycle Management</div>
      </div>
      <div class="slide-body">
        <h3>What the system does:</h3>
        <div class="code-box">OrangeHRM detects change
        |
        v
Backend poller fires automatically
        |
        +-- New hire?    → Create AD account + assign groups → Notify IT
        |
        +-- Termination? → Disable AD account + remove groups → Notify IT</div>
        <div class="solution-box">
          <strong>No tickets. No emails. No manual steps.</strong><br/>
          IT administrators retain a full dashboard for oversight and manual override.<br/>
          Every action is logged for compliance review.
        </div>
        <h3>Key Benefits:</h3>
        <ul>
          <li>New hires have accounts ready on <strong>Day 1</strong></li>
          <li>Terminated employees are disabled within <strong>minutes</strong></li>
          <li>Consistent permissions via <strong>role-based group mappings</strong></li>
          <li>Complete <strong>audit trail</strong> for compliance and security reviews</li>
          <li>IT team freed from repetitive provisioning tasks</li>
        </ul>
      </div>
      <div class="slide-footer">IT Employee Lifecycle Automation System — Stephen Torrijas</div>
      <div class="slide-number">3 / 10</div>
    </div>`,

    // Slide 4 — Architecture
    `<div class="slide">
      <div class="slide-header">
        <div class="slide-title">System Architecture</div>
      </div>
      <div class="slide-body">
        <img src="${imgBase64(path.join(DIAGRAMS_DIR, 'SystemArchitecture.png'))}" alt="System Architecture" style="width:100%;border:1px solid #e0e0e0;border-radius:6px;"/>
        <p style="margin-top:8px;"><strong>Stack:</strong> React · Node.js · Express · MySQL · ldapjs · JWT · node-schedule</p>
      </div>
      <div class="slide-footer">IT Employee Lifecycle Automation System — Stephen Torrijas</div>
      <div class="slide-number">4 / 10</div>
    </div>`,

    // Slide 5 — Demo Roadmap
    `<div class="slide">
      <div class="slide-header">
        <div class="slide-title">What You'll See in the Demo</div>
      </div>
      <div class="slide-body">
        ${htmlTable(['#', 'Feature', 'What it demonstrates'], [
          ['1', '<strong>Dashboard</strong>', 'Real-time task stats + manual OrangeHRM sync'],
          ['2', '<strong>Employee Search</strong>', 'Find employee, click to view AD account detail'],
          ['3', '<strong>Task Management</strong>', 'Filter tasks, flag as Critical, view retry logic'],
          ['4', '<strong>Audit Log</strong>', 'Date-range filtering + CSV export'],
          ['5', '<strong>Access Requests</strong>', 'Submit and approve additional-access requests'],
          ['6', '<strong>Reports</strong>', 'Generate compliance report + download CSV'],
          ['7', '<strong>System Config</strong>', 'Adjust polling interval, retry limit, notifications'],
        ])}
        <p style="margin-top:14px;"><strong>Total runtime: ~7 minutes</strong></p>
      </div>
      <div class="slide-footer">IT Employee Lifecycle Automation System — Stephen Torrijas</div>
      <div class="slide-number">5 / 10</div>
    </div>`,

    // Slide 6 — Feature Highlights
    `<div class="slide">
      <div class="slide-header">
        <div class="slide-title">10 Implemented Features</div>
      </div>
      <div class="slide-body">
        ${htmlTable(['Feature', 'Requirement(s)'], [
          ['OrangeHRM DB polling (name, dept, title sync)', 'REQ-1, REQ-4, NFR-1'],
          ['Automatic AD account provisioning via LDAP', 'REQ-2, NFR-2'],
          ['Role-based AD group assignment from mappings', 'REQ-3, REQ-6'],
          ['Automatic deprovisioning on termination', 'REQ-5'],
          ['Task management with retry logic + priority flag', 'REQ-7, REQ-12, NFR-5'],
          ['Audit log with date filter and CSV export', 'REQ-9'],
          ['In-app notifications with unread badge', 'REQ-15'],
          ['Access request workflow (submit / approve / reject)', 'REQ-14'],
          ['Compliance report generation + CSV download', 'REQ-10'],
          ['System configuration UI (no code changes needed)', 'REQ-8, NFR-10'],
        ])}
        <div class="solution-box" style="margin-top:12px;">
          <strong>All 15 functional requirements implemented.</strong>
        </div>
      </div>
      <div class="slide-footer">IT Employee Lifecycle Automation System — Stephen Torrijas</div>
      <div class="slide-number">6 / 10</div>
    </div>`,

    // Slide 7 — Live Demo
    `<div class="slide">
      <div class="slide-header">
        <div class="slide-title">Live Demo</div>
        <div class="slide-subtitle">Switch to browser — http://localhost:3000</div>
      </div>
      <div class="slide-body">
        <h3>Demo Stops:</h3>
        <ol style="font-size:11pt;line-height:2.2;margin-left:20px;">
          <li><strong>Dashboard</strong> → stat cards + Sync Now button</li>
          <li><strong>Employee Search</strong> → click row → AD account modal</li>
          <li><strong>Task List</strong> → filters, priority badge, flag Critical</li>
          <li><strong>Audit Log</strong> → set date range → Export CSV</li>
          <li><strong>Access Requests</strong> → approve a request</li>
          <li><strong>Reports</strong> → generate + download CSV</li>
          <li><strong>Settings</strong> → polling interval, retry limit, notifications toggle</li>
        </ol>
      </div>
      <div class="slide-footer">IT Employee Lifecycle Automation System — Stephen Torrijas</div>
      <div class="slide-number">7 / 10</div>
    </div>`,

    // Slide 8 — Progress vs Plan
    `<div class="slide">
      <div class="slide-header">
        <div class="slide-title">Progress vs. Original Plan</div>
      </div>
      <div class="slide-body">
        ${htmlTable(['Week', 'Planned', 'Actual'], [
          ['1–4', 'Project proposal + system requirements', '<span class="badge badge-complete">Complete</span>'],
          ['5–7', 'Environment setup + core dashboard', '<span class="badge badge-complete">Complete</span>'],
          ['8', 'Mid-term: core onboarding automation', '<span class="badge badge-complete">Complete</span>'],
          ['9–11', 'Offboarding, notifications, audit log', '<span class="badge badge-complete">Complete</span>'],
          ['12–14', 'Reports, access requests, config UI', '<span class="badge badge-complete">Complete</span>'],
        ])}
        <div class="solution-box" style="margin-top:14px;">
          <strong>Ahead of schedule:</strong> All 15 requirements done at Week 8 milestone. Full feature set (10 features) implemented and running end-to-end on live AD + OrangeHRM.
        </div>
      </div>
      <div class="slide-footer">IT Employee Lifecycle Automation System — Stephen Torrijas</div>
      <div class="slide-number">8 / 10</div>
    </div>`,

    // Slide 9 — Remaining Work
    `<div class="slide">
      <div class="slide-header">
        <div class="slide-title">Remaining Work (Weeks 12–15)</div>
      </div>
      <div class="slide-body">
        <div class="two-col">
          <div>
            <h3>Quality &amp; Security</h3>
            <ul>
              <li>LDAPS (encrypted LDAP on port 636) — currently plain LDAP port 389</li>
              <li>Input validation hardening on all API endpoints</li>
            </ul>
            <h3>Role-Based UI</h3>
            <ul>
              <li>HR Personnel view: read-only employee status, flag high-priority tasks</li>
              <li>Department Manager view: team account status + access request submission</li>
            </ul>
          </div>
          <div>
            <h3>Testing</h3>
            <ul>
              <li>Unit tests (Jest): provisioningService, deprovisioningService, ADConnector, notificationService</li>
              <li>Integration tests: end-to-end lifecycle flows against a test DB instance</li>
            </ul>
            <h3>Documentation</h3>
            <ul>
              <li>Final system documentation with test results</li>
              <li>README updates for deployment</li>
            </ul>
          </div>
        </div>
      </div>
      <div class="slide-footer">IT Employee Lifecycle Automation System — Stephen Torrijas</div>
      <div class="slide-number">9 / 10</div>
    </div>`,

    // Slide 10 — Summary
    `<div class="slide">
      <div class="slide-header">
        <div class="slide-title">Summary</div>
      </div>
      <div class="slide-body">
        <div class="problem-box">
          <strong>Problem solved:</strong> Manual IT provisioning causes delayed access, orphaned accounts, and compliance risk.
        </div>
        <div class="solution-box">
          <strong>Solution delivered:</strong> Fully automated lifecycle system that detects HR changes and acts on them — no human in the loop required for standard cases.
        </div>
        <h3>Technical Achievement:</h3>
        <ul>
          <li>Live integration: OrangeHRM MySQL → Node.js poller → LDAP → Active Directory</li>
          <li>12-table MySQL schema, 15 API routes, 9 React pages</li>
          <li>Retry logic, priority queuing, full audit trail, CSV exports</li>
        </ul>
        <h3>Still to Come:</h3>
        <ul>
          <li>LDAPS, role-scoped UI views, automated test suite</li>
        </ul>
        <div style="text-align:center;margin-top:20px;padding:14px;background:#e3f2fd;border-radius:8px;">
          <strong style="font-size:13pt;color:#0d47a1;">Thank you — Questions?</strong>
        </div>
      </div>
      <div class="slide-footer">IT Employee Lifecycle Automation System — Stephen Torrijas</div>
      <div class="slide-number">10 / 10</div>
    </div>`,
  ];

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>${slideCss}</style>
</head>
<body>
${slides.join('\n')}
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Launching Puppeteer...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  async function makePDF(html, filename, opts = {}) {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });
    const outPath = path.join(OUTPUT_DIR, filename);
    await page.pdf({
      path: outPath,
      format: 'Letter',
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      printBackground: true,
      ...opts,
    });
    await page.close();
    console.log(`✓ Created: ${outPath}`);
  }

  try {
    // 1. System Requirements Documentation
    console.log('\n[1/3] Generating System_requirements_documentation.pdf...');
    await makePDF(buildSysReqHTML(), 'System_requirements_documentation.pdf', {
      margin: { top: '0.5in', right: '0.6in', bottom: '0.6in', left: '0.6in' },
    });

    // 2. Brochure
    console.log('[2/3] Generating Brochure.pdf...');
    await makePDF(buildBrochureHTML(), 'Brochure.pdf', {
      margin: { top: '0.4in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
    });

    // 3. Presentation Slides
    console.log('[3/3] Generating Presentation_slides.pdf...');
    await makePDF(buildSlidesHTML(), 'Presentation_slides.pdf', {
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    console.log('\n✓ All 3 PDFs generated in:', OUTPUT_DIR);
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
