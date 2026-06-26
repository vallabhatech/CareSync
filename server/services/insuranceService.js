const { createService } = require('./common');

createService(5006, (app) => {
  app.use('/api/insurance', require('../routes/insurance'));
});
