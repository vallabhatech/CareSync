const { createService } = require('./common');

createService(5003, (app) => {
  app.use('/api/medicines', require('../routes/medicines'));
});
