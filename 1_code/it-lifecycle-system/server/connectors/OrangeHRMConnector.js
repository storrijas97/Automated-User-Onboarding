const { hrm, getAccessToken } = require('../config/orangehrm');

async function authHeader() {
  const token = await getAccessToken();
  return { Authorization: `Bearer ${token}` };
}

const OrangeHRMConnector = {
  /**
   * Fetch access token from OrangeHRM OAuth endpoint.
   */
  async getAccessToken() {
    return getAccessToken();
  },

  /**
   * Fetch all employees from OrangeHRM.
   * @returns {Array} Array of employee objects
   */
  async fetchAllEmployees() {
    const headers = await authHeader();
    const response = await hrm.get('/api/v2/pim/employees', {
      headers,
      params: { limit: 0 },
    });
    return response.data.data || [];
  },

  /**
   * Fetch employees with TERMINATED status.
   * @returns {Array} Array of terminated employee objects
   */
  async fetchTerminatedEmployees() {
    const headers = await authHeader();
    const response = await hrm.get('/api/v2/pim/employees', {
      headers,
      params: { limit: 0, statusId: 'Terminated' },
    });
    return response.data.data || [];
  },

  /**
   * Fetch full detail for a single employee by empNumber.
   * @param {string|number} empNumber
   * @returns {Object} Employee detail object
   */
  async getEmployeeDetails(empNumber) {
    const headers = await authHeader();
    const response = await hrm.get(`/api/v2/pim/employees/${empNumber}`, { headers });
    return response.data.data || null;
  },

  /**
   * Fetch job details for an employee (title, department, etc.)
   * @param {string|number} empNumber
   */
  async getEmployeeJobDetails(empNumber) {
    const headers = await authHeader();
    const response = await hrm.get(`/api/v2/pim/employees/${empNumber}/job-details`, { headers });
    return response.data.data || null;
  },
};

module.exports = OrangeHRMConnector;
