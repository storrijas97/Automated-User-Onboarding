const ldap = require('ldapjs');

/**
 * Create a fresh LDAP client, bind it with the service account credentials,
 * and return it. Each call gets its own connection so stale/failed clients
 * don't persist across retries or config changes.
 */
function bind() {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({
      url: process.env.AD_URL || 'ldap://localhost',
      reconnect: false,
      connectTimeout: 5000,
    });

    client.on('error', (err) => {
      console.error('[AD] LDAP client error:', err.message);
    });

    client.bind(process.env.AD_BIND_DN, process.env.AD_BIND_PASSWORD, (err) => {
      if (err) {
        client.destroy();
        return reject(new Error(`AD bind failed: ${err.message}`));
      }
      resolve(client);
    });
  });
}

module.exports = { bind };
