-- IT Employee Lifecycle Automation System
-- Full MySQL DDL

CREATE DATABASE IF NOT EXISTS it_lifecycle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE it_lifecycle;

-- ─── Departments ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255) NOT NULL UNIQUE,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── Security Groups ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS security_groups (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255) NOT NULL UNIQUE,
  ad_dn       VARCHAR(512) NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── Role Mappings ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS role_mappings (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  department_id       INT UNSIGNED NOT NULL,
  job_title           VARCHAR(255) NOT NULL,
  security_group_id   INT UNSIGNED NOT NULL,
  FOREIGN KEY (department_id)     REFERENCES departments(id)     ON DELETE CASCADE,
  FOREIGN KEY (security_group_id) REFERENCES security_groups(id) ON DELETE CASCADE,
  UNIQUE KEY uq_mapping (department_id, job_title, security_group_id)
);

-- ─── Employees ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  orangehrm_id      VARCHAR(64)  NOT NULL UNIQUE,
  first_name        VARCHAR(100) NOT NULL,
  last_name         VARCHAR(100) NOT NULL,
  email             VARCHAR(255),
  job_title         VARCHAR(255),
  department_id     INT UNSIGNED,
  status            ENUM('ACTIVE','TERMINATED','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  hire_date         DATE,
  termination_date  DATE,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- ─── AD Accounts ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_accounts (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id INT UNSIGNED NOT NULL UNIQUE,
  username    VARCHAR(64)  NOT NULL UNIQUE,
  dn          VARCHAR(512) NOT NULL,
  status      ENUM('ACTIVE','DISABLED','DELETED') NOT NULL DEFAULT 'ACTIVE',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  disabled_at DATETIME,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- ─── Tasks ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id  INT UNSIGNED NOT NULL,
  type         ENUM('ONBOARDING','OFFBOARDING','ACCESS_CHANGE','PASSWORD_RESET') NOT NULL,
  status       ENUM('PENDING','IN_PROGRESS','COMPLETED','FAILED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  priority     ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- ─── Task Steps ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_steps (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  task_id     INT UNSIGNED NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  status      ENUM('PENDING','SUCCESS','FAILED','SKIPPED') NOT NULL DEFAULT 'PENDING',
  detail      TEXT,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- ─── Audit Logs ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor      VARCHAR(255) NOT NULL,
  action     VARCHAR(255) NOT NULL,
  target     VARCHAR(255),
  detail     TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_actor  (actor),
  INDEX idx_action (action),
  INDEX idx_created (created_at)
);

-- ─── Notifications ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id INT UNSIGNED,
  channel     ENUM('EMAIL','IN_APP','SMS') NOT NULL DEFAULT 'IN_APP',
  message     TEXT NOT NULL,
  sent_at     DATETIME,
  status      ENUM('PENDING','SENT','FAILED') NOT NULL DEFAULT 'PENDING',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- ─── Reports ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type          VARCHAR(100) NOT NULL,
  generated_by  VARCHAR(255) NOT NULL,
  file_path     VARCHAR(512),
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── System Configuration ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_config (
  id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  polling_interval_min  INT NOT NULL DEFAULT 5,
  retry_limit           INT NOT NULL DEFAULT 3,
  notifications_enabled TINYINT(1) NOT NULL DEFAULT 1,
  last_sync_at          DATETIME,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed one default config row
INSERT IGNORE INTO system_config (id, polling_interval_min, retry_limit, notifications_enabled)
VALUES (1, 5, 3, 1);

-- ─── Access Requests ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS access_requests (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id   INT UNSIGNED NOT NULL,
  requested_by  VARCHAR(255) NOT NULL,
  group_id      INT UNSIGNED NOT NULL,
  status        ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id)    REFERENCES security_groups(id) ON DELETE CASCADE
);
