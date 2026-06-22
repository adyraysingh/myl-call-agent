'use strict';
const cron = require('node-cron');
const logger = require('../utils/logger');
const { initiateCall } = require('../services/callhippoService');
const { updateLead, getLeadsByStatus } = require('../database/leads');
const { query } = require('../database/connection');

const FOLLOW_UP_DELAYS_HOURS = [2, 24, 72, 168];
const MAX_CALL_ATTEMPTS = 4;

async function scheduleOutboundCall(lead, attemptNumber) {
  attemptNumber = attemptNumber || 1;
  try {
    if (!lead.phone) return;
    if (attemptNumber > MAX_CALL_ATTEMPTS) {
      await updateLead(lead.id, { status: 'cold' });
      return;
    }

    const delayHours = FOLLOW_UP_DELAYS_HOURS[attemptNumber - 1] || 24;
    const scheduledAt = new Date(Date.now() + delayHours * 3600000);

    if (lead.id) {
      await query('INSERT INTO call_schedule (lead_id, scheduled_at, attempt_number, status) VALUES ($1, $2, $3, $4)', [lead.id, scheduledAt, attemptNumber, 'pending']);
    }

    if (attemptNumber === 1) {
      await initiateCall(lead.phone, process.env.CALLHIPPO_VIRTUAL_NUMBER, {
        lead_id: lead.id,
        lead_name: lead.first_name + ' ' + lead.last_name,
        attempt: 1
      });
      await updateLead(lead.id, { last_called_at: new Date(), call_count: 1, status: 'contacted' });
    } else {
      logger.info('Scheduled follow-up call attempt ' + attemptNumber, { leadId: lead.id, scheduledAt: scheduledAt.toISOString() });
    }
  } catch (error) {
    logger.error('Error scheduling call', { leadId: lead.id, error: error.message });
  }
}

async function processPendingCalls() {
  try {
    const result = await query(
      `SELECT cs.*, l.phone, l.first_name, l.last_name, l.status as lead_status
       FROM call_schedule cs
       JOIN leads l ON cs.lead_id = l.id
       WHERE cs.status = 'pending' AND cs.scheduled_at <= NOW()
       AND l.status NOT IN ('onboarded', 'cold', 'qualified')
       LIMIT 10`
    );

    for (const schedule of result.rows) {
      try {
        await initiateCall(schedule.phone, process.env.CALLHIPPO_VIRTUAL_NUMBER, {
          lead_id: schedule.lead_id,
          lead_name: schedule.first_name + ' ' + schedule.last_name,
          attempt: schedule.attempt_number
        });
        await query('UPDATE call_schedule SET status = $2 WHERE id = $1', [schedule.id, 'completed']);
        await updateLead(schedule.lead_id, { last_called_at: new Date(), call_count: schedule.attempt_number });
      } catch (callError) {
        await query('UPDATE call_schedule SET status = $2 WHERE id = $1', [schedule.id, 'failed']);
      }
    }
  } catch (error) {
    logger.error('Error processing pending calls', { error: error.message });
  }
}

function startCallScheduler() {
  cron.schedule('*/15 * * * *', async () => {
    logger.info('Running scheduled call check...');
    await processPendingCalls();
  });
  logger.info('Call scheduler started - every 15 minutes');
}

module.exports = { scheduleOutboundCall, processPendingCalls, startCallScheduler };
