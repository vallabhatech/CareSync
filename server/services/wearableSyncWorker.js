const cron = require('node-cron');
const WearableConnection = require('../models/WearableConnection');
const HealthMetric = require('../models/HealthMetric');

// Run every night at midnight to sync data for all connected users
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily wearable background sync...');
  try {
    const connections = await WearableConnection.find({});
    
    let syncedCount = 0;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    for (const connection of connections) {
      try {
        const existingMetric = await HealthMetric.findOne({
          user: connection.user,
          source: connection.provider,
          recordedAt: { $gte: today }
        });

        if (!existingMetric) {
          // Generate realistic mock data
          const steps = Math.floor(Math.random() * (12000 - 3000 + 1) + 3000);
          const sleepHours = (Math.random() * (9 - 5) + 5).toFixed(1);
          const heartRate = Math.floor(Math.random() * (90 - 60 + 1) + 60);

          await HealthMetric.create({
            user: connection.user,
            source: connection.provider,
            steps,
            sleepHours,
            heartRate,
            recordedAt: new Date()
          });
          
          syncedCount++;
          connection.lastSyncAt = new Date();
          await connection.save();
        }
      } catch (innerError) {
        console.error(`Error syncing data for user ${connection.user} on ${connection.provider}:`, innerError);
      }
    }
    console.log(`Daily wearable sync complete. Added ${syncedCount} records.`);
  } catch (error) {
    console.error('Error running daily wearable sync:', error);
  }
});

console.log('Wearable sync worker initialized.');
