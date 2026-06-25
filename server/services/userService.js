const { createService } = require('./common');

createService(5002, (app) => {
  app.use('/api/family', require('../routes/family'));
  app.use('/api/health-metrics', require('../routes/healthMetrics'));
});
