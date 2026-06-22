'use strict';
const axios = require('axios');
const logger = require('../utils/logger');

let zohoAccessToken = null;
let tokenExpiry = null;

async function getZohoAccessToken() {
  if (zohoAccessToken && tokenExpiry && Date.now() < tokenExpiry) return zohoAccessToken;
  const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
    params: {
      grant_type: 'refresh_token',
      client_id: process.env.ZOHO_CLIENT_ID,
      client_secret: process.env.ZOHO_CLIENT_SECRET,
      refresh_token: process.env.ZOHO_REFRESH_TOKEN
    }
  });
  zohoAccessToken = response.data.access_token;
  tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000;
  return zohoAccessToken;
}

async function updateZohoLead(zohoId, updateData) {
  try {
    if (!process.env.ZOHO_CLIENT_ID) { logger.warn('Zoho not configured'); return null; }
    const token = await getZohoAccessToken();
    const response = await axios.put(
      'https://www.zohoapis.com/crm/v2/Leads/' + zohoId,
      { data: [updateData] },
      { headers: { Authorization: 'Zoho-oauthtoken ' + token } }
    );
    logger.info('Zoho lead updated', { zohoId });
    return response.data;
  } catch (error) {
    logger.error('Failed to update Zoho lead', { zohoId, error: error.message });
    return null;
  }
}

module.exports = { updateZohoLead, getZohoAccessToken };
