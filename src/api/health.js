'use strict';
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    service: 'myl-call-agent',
    database: process.env.DATABASE_URL ? 'configured' : 'not configured'
  });
});

module.exports = router;
