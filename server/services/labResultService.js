const { createService } = require('./common');

createService(5009, (app) => {
  app.use('/api/lab-results', require('../routes/labResults'));
});
