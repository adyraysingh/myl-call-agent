'use strict';
const axios = require('axios');
const logger = require('../utils/logger');

const CALLHIPPO_API_BASE = 'https://api.callhippo.com/v1';

async function initiateCall(toNumber, fromNumber, callData) {
  try {
    const apiKey = process.env.CALLHIPPO_API_KEY;
    if (!apiKey) throw new Error('CALLHIPPO_API_KEY not configured');

    const response = await axios.post(
      CALLHIPPO_API_BASE + '/calls',
      {
        to: toNumber,
        from: fromNumber || process.env.CALLHIPPO_VIRTUAL_NUMBER,
        custom_data: JSON.stringify(callData || {})
      },
      {
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    logger.info('CallHippo call initiated', { callId: response.data.call_id, to: toNumber });
    return { success: true, callId: response.data.call_id || response.data.id, status: response.data.status };
  } catch (error) {
    logger.error('CallHippo call failed', { error: error.message, response: error.response && error.response.data });
    throw error;
  }
}

async function getCallDetails(callId) {
  try {
    const response = await axios.get(
      CALLHIPPO_API_BASE + '/calls/' + callId,
      { headers: { 'Authorization': 'Bearer ' + process.env.CALLHIPPO_API_KEY } }
    );
    return response.data;
  } catch (error) {
    logger.error('Failed to get call details', { callId, error: error.message });
    throw error;
  }
}

module.exports = { initiateCall, getCallDetails };
