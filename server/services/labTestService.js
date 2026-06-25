const { createService } = require('./common');

createService(5006, (app) => {
  app.use('/api/lab-tests', require('../routes/labTestBookings'));
});

