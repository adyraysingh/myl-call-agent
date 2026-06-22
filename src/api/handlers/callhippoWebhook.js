'use strict';
const logger = require('../../utils/logger');
const { getLeadByPhone, updateLead } = require('../../database/leads');
const { createConversation, updateConversationStatus } = require('../../database/conversations');
const { processCallEvent } = require('../../agents/mayaCallAgent');
const { updateZohoLead } = require('../../services/zohoService');

async function handleCallHippoEvent(req, res) {
  try {
    const event = req.body;
    logger.info('CallHippo event received', { type: event.event_type || event.type });

    const phone = event.customer_number || event.to_number || event.from_number;
    const eventType = event.event_type || event.type || '';
    
    if (eventType === 'CALL_COMPLETED' || eventType === 'call_completed') {
      const lead = phone ? await getLeadByPhone(phone) : null;
      
      if (lead) {
        const outcome = await processCallEvent(lead, event);
        
        if (outcome.qualified) {
          await updateLead(lead.id, { status: 'qualified', score: outcome.score });
          await updateZohoLead(lead.zoho_id, { Lead_Status: 'Qualified' });
        } else if (outcome.notInterested) {
          await updateLead(lead.id, { status: 'cold' });
          await updateZohoLead(lead.zoho_id, { Lead_Status: 'Cold Lead' });
        }
        
        await createConversation({
          lead_id: lead.id,
          call_id: event.call_id,
          duration: event.duration || 0,
          outcome: outcome.summary,
          transcript: event.transcript || null
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Error handling CallHippo event', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { handleCallHippoEvent };
