'use strict';
require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    service: 'myl-call-agent',
    database: process.env.DATABASE_URL ? 'configured' : 'not configured'
  });
});

// Load routes
try {
  const { setupRoutes } = require('./app');
  setupRoutes(app);
} catch (err) {
  console.error('Route setup error:', err.message);
}

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('MYL Call Agent running on port ' + PORT);
  console.log('Environment: ' + (process.env.NODE_ENV || 'development'));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down');
  server.close(() => process.exit(0));
});

module.exports = { app, server };
