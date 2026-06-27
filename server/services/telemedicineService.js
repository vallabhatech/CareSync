const { createService } = require('./common');

createService(5005, (app) => {
  app.use('/api/clinics', require('../routes/clinics'));
});
