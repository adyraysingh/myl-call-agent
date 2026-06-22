'use strict';
const logger = require('../../utils/logger');
const { createOrUpdateLead } = require('../../database/leads');
const { scheduleOutboundCall } = require('../../workflows/callScheduler');

async function handleZohoNewLead(req, res) {
  try {
    const secret = req.headers['x-webhook-signature'];
    if (secret !== process.env.ZOHO_WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const leadData = req.body;
    logger.info('New lead received from Zoho', { leadId: leadData.id });

    const lead = await createOrUpdateLead({
      zoho_id: leadData.id,
      first_name: leadData.First_Name || leadData.first_name || '',
      last_name: leadData.Last_Name || leadData.last_name || '',
      phone: leadData.Phone || leadData.phone || '',
      email: leadData.Email || leadData.email || '',
      company: leadData.Company || leadData.company || '',
      status: 'new'
    });

    if (!lead.phone) {
      return res.json({ success: true, message: 'Lead stored, no phone for call' });
    }

    await scheduleOutboundCall(lead);
    res.json({ success: true, message: 'Lead received, call scheduled', leadId: lead.id });
  } catch (error) {
    logger.error('Error handling Zoho new lead', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { handleZohoNewLead };
