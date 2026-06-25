const { createService } = require('./common');

createService(5001, (app) => {
  app.use('/api/auth/emergency-contacts', require('../routes/emergencyContacts'));
  app.use('/api/auth', require('../routes/auth'));
  app.use('/api/security', require('../routes/security'));
});
