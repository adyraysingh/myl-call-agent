'use strict';
const logger = require('../../utils/logger');
const { updateLead } = require('../../database/leads');
const { updateConversationStatus } = require('../../database/conversations');
const { updateZohoLead } = require('../../services/zohoService');

async function handleOnboardingCompleted(req, res) {
  try {
    const { lead_id, zoho_id } = req.body;
    logger.info('Onboarding completed', { lead_id, zoho_id });

    if (lead_id) {
      await updateLead(lead_id, { status: 'onboarded', onboarded_at: new Date() });
      await updateConversationStatus(lead_id, 'completed');
    }

    if (zoho_id) {
      await updateZohoLead(zoho_id, {
        Lead_Status: 'Onboarded',
        Onboarding_Date: new Date().toISOString().split('T')[0]
      });
    }

    res.json({ success: true, message: 'Onboarding status updated' });
  } catch (error) {
    logger.error('Error handling onboarding', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { handleOnboardingCompleted };
