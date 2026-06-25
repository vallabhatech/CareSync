const { createService } = require('./common');

createService(5004, (app) => {
  app.use('/api/symptom-checks', require('../routes/symptomChecks'));
});
