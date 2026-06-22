'use strict';
const { query } = require('./connection');
const logger = require('../utils/logger');

async function createConversation(convData) {
  try {
    const { lead_id, call_id, duration, outcome, transcript } = convData;
    const result = await query(
      'INSERT INTO conversations (lead_id, call_id, duration, outcome, transcript, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *',
      [lead_id, call_id, duration || 0, outcome || '', transcript || null, 'active']
    );
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error creating conversation', { error: error.message });
    return null;
  }
}

async function getConversationByLeadId(leadId) {
  try {
    const result = await query('SELECT * FROM conversations WHERE lead_id = $1 ORDER BY created_at DESC LIMIT 1', [leadId]);
    return result.rows[0] || null;
  } catch (error) {
    return null;
  }
}

async function updateConversationStatus(leadId, status) {
  try {
    const result = await query('UPDATE conversations SET status = $2, updated_at = NOW() WHERE lead_id = $1 RETURNING *', [leadId, status]);
    return result.rows[0] || null;
  } catch (error) {
    return null;
  }
}

module.exports = { createConversation, getConversationByLeadId, updateConversationStatus };
