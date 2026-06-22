'use strict';
const webhooksRouter = require('./api/webhooks');
const { requestLogger } = require('./middleware/requestLogger');
const { errorHandler } = require('./middleware/errorHandler');
const { startCallScheduler } = require('./workflows/callScheduler');

function setupRoutes(app) {
  app.use(requestLogger);
  app.use('/webhooks', webhooksRouter);
  app.get('/', (req, res) => {
    res.json({ service: 'MYL Call Agent', version: '1.0.0', status: 'operational' });
  });
  app.use(errorHandler);
  
  // Start scheduler
  if (process.env.DATABASE_URL) {
    startCallScheduler();
  }
}

module.exports = { setupRoutes };
