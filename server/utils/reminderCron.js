// Mock cron service for appointment reminders

const checkAppointments = () => {
  console.log('[Cron] Checking for upcoming appointments...');
  // In a real app, this would query the DB for appointments in the next 24 hours
  // and send an email/SMS or push notification.
  
  const mockAppointments = [
    { patient: 'Jane Doe', time: '14:00', doctor: 'Dr. Smith' }
  ];
  
  if (mockAppointments.length > 0) {
    mockAppointments.forEach(appt => {
      console.log(`[Cron] Sending reminder to ${appt.patient} for appointment with ${appt.doctor} at ${appt.time}`);
    });
  }
};

const startCron = () => {
  console.log('[Cron] Appointment reminder service started.');
  // Run every 10 minutes (mocking 24hr check)
  setInterval(checkAppointments, 10 * 60 * 1000);
};

module.exports = { startCron };
