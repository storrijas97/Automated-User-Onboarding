const mysql = require('mysql2/promise');

let pool; // lazy-init so startup doesn't fail if DB is briefly unavailable

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host:     process.env.ORANGEHRM_DB_HOST || 'localhost',
      port:     process.env.ORANGEHRM_DB_PORT || 3306,
      user:     process.env.ORANGEHRM_DB_USER || 'root',
      password: process.env.ORANGEHRM_DB_PASS || '',
      database: process.env.ORANGEHRM_DB_NAME || 'orangehrm',
      waitForConnections: true,
      connectionLimit: 5,
    });
  }
  return pool;
}

const EMPLOYEE_QUERY = `
  SELECT
    e.employee_id      AS orangehrm_id,
    e.emp_number,
    e.emp_firstname    AS first_name,
    e.emp_lastname     AS last_name,
    COALESCE(e.emp_work_email, e.emp_oth_email) AS email,
    jt.job_title,
    e.custom1          AS department_name,
    e.joined_date      AS hire_date,
    t.termination_date
  FROM hs_hr_employee e
  LEFT JOIN ohrm_job_title jt ON jt.id = e.job_title_code
  LEFT JOIN ohrm_emp_termination t ON t.emp_number = e.emp_number
  WHERE e.purged_at IS NULL
`;

const OrangeHRMDbConnector = {
  // Returns ALL employees (active + terminated), same shape expected by poller
  async fetchAllEmployees() {
    const [rows] = await getPool().query(EMPLOYEE_QUERY);
    return rows.map(normalise);
  },

  // Returns only terminated employees
  async fetchTerminatedEmployees() {
    const [rows] = await getPool().query(
      EMPLOYEE_QUERY + ' HAVING termination_date IS NOT NULL'
    );
    return rows.map(normalise);
  },

  // Returns all unique non-null values from the custom "Department" field (custom1)
  async fetchDepartments() {
    const [rows] = await getPool().query(
      `SELECT DISTINCT custom1 AS name
       FROM hs_hr_employee
       WHERE custom1 IS NOT NULL AND custom1 != '' AND purged_at IS NULL
       ORDER BY custom1`
    );
    return rows; // [{ name: 'Accounting' }, ...]
  },
};

// Normalise a raw DB row into the shape provisioningService expects
function normalise(row) {
  return {
    empNumber:       String(row.emp_number),
    orangehrm_id:    row.orangehrm_id || String(row.emp_number),
    firstName:       row.first_name || '',
    lastName:        row.last_name  || '',
    email:           row.email      || null,
    jobTitle:        row.job_title  || '',
    departmentName:  row.department_name || null,  // from custom "Department" field (custom1)
    departmentId:    null,                          // resolved by poller after department sync
    hireDate:        row.hire_date  || null,
    terminationDate: row.termination_date || null,
    status:          row.termination_date ? 'TERMINATED' : 'ACTIVE',
  };
}

module.exports = OrangeHRMDbConnector;
