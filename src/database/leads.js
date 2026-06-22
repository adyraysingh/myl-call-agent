'use strict';
const { query } = require('./connection');
const logger = require('../utils/logger');

async function createOrUpdateLead(leadData) {
  try {
    const { zoho_id, first_name, last_name, phone, email, company, status } = leadData;
    const result = await query(
      `INSERT INTO leads (zoho_id, first_name, last_name, phone, email, company, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       ON CONFLICT (zoho_id) DO UPDATE SET
         first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name,
         phone = EXCLUDED.phone, email = EXCLUDED.email,
         company = EXCLUDED.company, status = EXCLUDED.status, updated_at = NOW()
       RETURNING *`,
      [zoho_id, first_name, last_name, phone, email, company, status || 'new']
    );
    return result.rows[0] || { id: null, ...leadData };
  } catch (error) {
    logger.error('Error creating/updating lead', { error: error.message });
    return { id: null, ...leadData };
  }
}

async function getLeadByPhone(phone) {
  try {
    const result = await query('SELECT * FROM leads WHERE phone = $1 LIMIT 1', [phone]);
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error getting lead by phone', { error: error.message });
    return null;
  }
}

async function updateLead(id, updateData) {
  try {
    const fields = Object.keys(updateData).map((k, i) => k + ' = $' + (i + 2)).join(', ');
    const values = Object.values(updateData);
    const result = await query('UPDATE leads SET ' + fields + ', updated_at = NOW() WHERE id = $1 RETURNING *', [id, ...values]);
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error updating lead', { id, error: error.message });
    return null;
  }
}

async function getLeadsByStatus(status) {
  try {
    const result = await query('SELECT * FROM leads WHERE status = $1 ORDER BY created_at DESC', [status]);
    return result.rows;
  } catch (error) {
    return [];
  }
}

module.exports = { createOrUpdateLead, getLeadByPhone, updateLead, getLeadsByStatus };
