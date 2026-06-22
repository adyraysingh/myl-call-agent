'use strict';
const express = require('express');
const router = express.Router();
const { handleZohoNewLead } = require('./handlers/zohoWebhook');
const { handleCallHippoEvent } = require('./handlers/callhippoWebhook');
const { handleOnboardingCompleted } = require('./handlers/onboardingWebhook');

router.post('/zoho/new-lead', handleZohoNewLead);
router.post('/callhippo/event', handleCallHippoEvent);
router.post('/onboarding-completed', handleOnboardingCompleted);

module.exports = router;
