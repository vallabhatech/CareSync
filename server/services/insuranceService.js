const { createService } = require('./common');

createService(5007, (app) => {
  app.use('/api/insurance', require('../routes/insurance'));
});
