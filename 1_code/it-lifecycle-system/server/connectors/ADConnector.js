const ldap = require('ldapjs');
const { bind } = require('../config/ad');

const BASE_DN = () => process.env.AD_BASE_DN || 'DC=company,DC=local';
const USERS_OU = () => process.env.AD_USERS_OU || 'OU=Users,DC=company,DC=local';

const ADConnector = {
  /**
   * Create a new AD user account for an employee.
   * @param {Object} employeeData - { firstName, lastName, username, email, ... }
   */
  async createUser(employeeData) {
    const client = await bind();
    const { firstName, lastName, username, email, jobTitle, departmentName, company } = employeeData;
    const dn = `CN=${firstName} ${lastName},${USERS_OU()}`;
    const upnDomain = BASE_DN().replace(/DC=/g, '').replace(/,/g, '.');

    // Build entry — omit attributes with null/empty values (LDAP rejects empty strings)
    const entry = {
      cn:                `${firstName} ${lastName}`,
      sn:                lastName,
      givenName:         firstName,
      sAMAccountName:    username,
      userPrincipalName: `${username}@${upnDomain}`,
      objectClass:       ['top', 'person', 'organizationalPerson', 'user'],
      // 544 = NORMAL_ACCOUNT (512) + PASSWD_NOTREQD (32) — creates enabled without password over plain LDAP
      userAccountControl: '544',
    };
    if (email)          entry.mail       = email;
    if (jobTitle)       entry.title      = jobTitle;
    if (departmentName) entry.department = departmentName;
    if (company)        entry.company    = company;

    return new Promise((resolve, reject) => {
      client.add(dn, entry, (err) => {
        client.destroy();
        if (err) return reject(new Error(`createUser failed: ${err.message}`));
        resolve({ dn, username });
      });
    });
  },

  /**
   * Enable an AD user account by setting userAccountControl = 512.
   * @param {string} username - sAMAccountName
   */
  async enableUser(username) {
    const client = await bind();
    const dn = await ADConnector._getDNForUser(client, username);

    const change = new ldap.Change({
      operation: 'replace',
      modification: new ldap.Attribute({
        type: 'userAccountControl',
        values: ['544'], // NORMAL_ACCOUNT + PASSWD_NOTREQD (enabled without password over plain LDAP)
      }),
    });

    return new Promise((resolve, reject) => {
      client.modify(dn, change, (err) => {
        client.destroy();
        if (err) return reject(new Error(`enableUser failed: ${err.message}`));
        resolve(true);
      });
    });
  },

  /**
   * Update profile attributes on an existing AD user (title, department, company, mail).
   * Only sets attributes that are provided and non-empty.
   * @param {string} username - sAMAccountName
   * @param {Object} attrs    - { jobTitle, departmentName, company, email }
   */
  async updateUserAttributes(username, attrs) {
    const client = await bind();
    const dn = await ADConnector._getDNForUser(client, username);

    const attrMap = {
      title:      attrs.jobTitle,
      department: attrs.departmentName,
      company:    attrs.company,
      mail:       attrs.email,
    };

    const changes = Object.entries(attrMap)
      .filter(([, v]) => v)
      .map(([type, value]) => new ldap.Change({
        operation: 'replace',
        modification: new ldap.Attribute({ type, values: [value] }),
      }));

    if (changes.length === 0) return true;

    return new Promise((resolve, reject) => {
      client.modify(dn, changes, (err) => {
        client.destroy();
        if (err) return reject(new Error(`updateUserAttributes failed: ${err.message}`));
        resolve(true);
      });
    });
  },

  /**
   * Disable an AD user account by setting userAccountControl = 514 (disabled).
   * @param {string} username - sAMAccountName
   */
  async disableUser(username) {
    const client = await bind();
    const dn = await ADConnector._getDNForUser(client, username);

    const change = new ldap.Change({
      operation: 'replace',
      modification: new ldap.Attribute({
        type: 'userAccountControl',
        values: ['514'], // NORMAL_ACCOUNT + ACCOUNTDISABLE
      }),
    });

    return new Promise((resolve, reject) => {
      client.modify(dn, change, (err) => {
        client.destroy();
        if (err) return reject(new Error(`disableUser failed: ${err.message}`));
        resolve(true);
      });
    });
  },

  /**
   * Add a user to an AD security group.
   * @param {string} username - sAMAccountName
   * @param {string} groupDN  - Full DN of the group
   */
  async addToGroup(username, groupDN) {
    const client = await bind();
    const userDN = await ADConnector._getDNForUser(client, username);

    const change = new ldap.Change({
      operation: 'add',
      modification: new ldap.Attribute({
        type: 'member',
        values: [userDN],
      }),
    });

    return new Promise((resolve, reject) => {
      client.modify(groupDN, change, (err) => {
        client.destroy();
        if (err) return reject(new Error(`addToGroup failed: ${err.message}`));
        resolve(true);
      });
    });
  },

  /**
   * Remove a user from all their AD group memberships.
   * @param {string} username - sAMAccountName
   */
  async removeFromGroups(username) {
    const client = await bind();
    const userDN = await ADConnector._getDNForUser(client, username);
    const groups = await ADConnector._getGroupsForUser(client, userDN);

    const promises = groups.map((groupDN) => {
      const change = new ldap.Change({
        operation: 'delete',
        modification: new ldap.Attribute({
          type: 'member',
          values: [userDN],
        }),
      });
      return new Promise((resolve, reject) => {
        client.modify(groupDN, change, (err) => {
          if (err) return reject(new Error(`removeFromGroup ${groupDN} failed: ${err.message}`));
          resolve(groupDN);
        });
      });
    });

    return Promise.allSettled(promises);
  },

  /**
   * Check if a user exists in AD by sAMAccountName.
   * @param {string} username
   * @returns {boolean}
   */
  async userExists(username) {
    const client = await bind();
    return new Promise((resolve, reject) => {
      const opts = {
        filter: `(sAMAccountName=${username})`,
        scope: 'sub',
        attributes: ['dn'],
      };
      let found = false;
      client.search(BASE_DN(), opts, (err, res) => {
        if (err) return reject(err);
        res.on('searchEntry', () => { found = true; });
        res.on('error', reject);
        res.on('end', () => resolve(found));
      });
    });
  },

  // ─── Internal helpers ───────────────────────────────────────────────────────

  async _getDNForUser(client, username) {
    return new Promise((resolve, reject) => {
      const opts = {
        filter: `(sAMAccountName=${username})`,
        scope: 'sub',
        attributes: ['dn'],
      };
      let dn = null;
      client.search(BASE_DN(), opts, (err, res) => {
        if (err) return reject(err);
        res.on('searchEntry', (entry) => { dn = entry.dn.toString(); });
        res.on('error', reject);
        res.on('end', () => {
          if (!dn) return reject(new Error(`User ${username} not found in AD`));
          resolve(dn);
        });
      });
    });
  },

  async _getGroupsForUser(client, userDN) {
    return new Promise((resolve, reject) => {
      const opts = {
        filter: `(member=${userDN})`,
        scope: 'sub',
        attributes: ['dn'],
      };
      const groups = [];
      client.search(BASE_DN(), opts, (err, res) => {
        if (err) return reject(err);
        res.on('searchEntry', (entry) => groups.push(entry.dn.toString()));
        res.on('error', reject);
        res.on('end', () => resolve(groups));
      });
    });
  },
};

module.exports = ADConnector;
