const axios = require('axios');

const hrm = axios.create({
  baseURL: process.env.ORANGEHRM_BASE_URL,
  timeout: 10000,
});

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', process.env.ORANGEHRM_CLIENT_ID);
  params.append('client_secret', process.env.ORANGEHRM_CLIENT_SECRET);

  const response = await hrm.post('/oauth/issueToken', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  cachedToken = response.data.access_token;
  tokenExpiresAt = Date.now() + (response.data.expires_in - 60) * 1000;
  return cachedToken;
}

module.exports = { hrm, getAccessToken };
