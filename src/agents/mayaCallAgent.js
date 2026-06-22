'use strict';
const OpenAI = require('openai');
const logger = require('../utils/logger');
const { MAYA_CALL_SYSTEM_PROMPT } = require('../prompts/mayaCallPrompt');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function processCallEvent(lead, callEvent) {
  try {
    const transcript = callEvent.transcript || callEvent.summary || 'No transcript available';
    const duration = callEvent.duration || 0;

    if (duration < 10) {
      return { qualified: false, callbackRequested: false, notInterested: false, summary: 'No answer or call too short', score: 0 };
    }

    return await analyzeCallTranscript(lead, transcript);
  } catch (error) {
    logger.error('Error processing call event', { leadId: lead.id, error: error.message });
    return { qualified: false, callbackRequested: false, notInterested: false, summary: 'Error processing call', score: 0 };
  }
}

async function generateCallScript(lead) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: MAYA_CALL_SYSTEM_PROMPT },
        { role: 'user', content: 'Generate a natural opening for calling ' + lead.first_name + ' about their interest in starting a clothing brand. Under 3 sentences.' }
      ],
      max_tokens: 200
    });
    return response.choices[0].message.content;
  } catch (error) {
    return 'Hi ' + lead.first_name + ', this is Maya from MakeYourLabel. I saw you were interested in launching a clothing brand - do you have a quick minute?';
  }
}

async function analyzeCallTranscript(lead, transcript) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You analyze sales call transcripts for MakeYourLabel. Return JSON with: qualified (bool), callbackRequested (bool), notInterested (bool), score (0-100), summary (string), nextAction (string: send_onboarding|schedule_followup|send_info|mark_cold).' },
        { role: 'user', content: 'Lead: ' + lead.first_name + ' ' + lead.last_name + '\nTranscript:\n' + transcript }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 400
    });
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    logger.error('Error analyzing transcript', { error: error.message });
    return { qualified: false, callbackRequested: false, notInterested: false, score: 0, summary: 'Analysis failed', nextAction: 'schedule_followup' };
  }
}

module.exports = { processCallEvent, generateCallScript };
