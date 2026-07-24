const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const WearableConnection = require('../models/WearableConnection');
const HealthMetric = require('../models/HealthMetric');

// GET /api/wearables/status
// Fetch current wearable connections for the user
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const connections = await WearableConnection.find({ user: req.user.id }).select('provider lastSyncAt createdAt');
    res.json(connections);
  } catch (error) {
    console.error('Error fetching wearable connections:', error);
    res.status(500).json({ message: 'Server error fetching wearable status' });
  }
});

// POST /api/wearables/connect/:provider
// Simulate OAuth connection
router.post('/connect/:provider', authMiddleware, async (req, res) => {
  const { provider } = req.params;
  
  if (!['google-fit', 'apple-health', 'fitbit'].includes(provider)) {
    return res.status(400).json({ message: 'Invalid provider' });
  }

  try {
    // Mock tokens
    const crypto = require('crypto');
    const mockAccessToken = `mock_access_token_${provider}_${crypto.randomBytes(16).toString('hex')}`;
    const mockRefreshToken = `mock_refresh_token_${provider}_${crypto.randomBytes(16).toString('hex')}`;
    
    // Create or update connection
    const connection = await WearableConnection.findOneAndUpdate(
      { user: req.user.id, provider },
      {
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Connected successfully', connection });
  } catch (error) {
    console.error(`Error connecting to ${provider}:`, error);
    res.status(500).json({ message: `Error connecting to ${provider}` });
  }
});

// POST /api/wearables/disconnect/:provider
// Remove connection and optionally purge data
router.post('/disconnect/:provider', authMiddleware, async (req, res) => {
  const { provider } = req.params;
  const { purgeData } = req.body;

  try {
    await WearableConnection.findOneAndDelete({ user: req.user.id, provider });

    if (purgeData) {
      await HealthMetric.deleteMany({ user: req.user.id, source: provider });
    }

    res.json({ message: `Disconnected from ${provider} successfully` });
  } catch (error) {
    console.error(`Error disconnecting from ${provider}:`, error);
    res.status(500).json({ message: `Error disconnecting from ${provider}` });
  }
});

// POST /api/wearables/sync
// Manually trigger a mock sync for all connected devices for this user
router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const connections = await WearableConnection.find({ user: req.user.id });
    if (connections.length === 0) {
      return res.status(400).json({ message: 'No wearable devices connected' });
    }

    let syncedCount = 0;
    
    // Simulate data generation for each connection
    for (const connection of connections) {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const existingMetric = await HealthMetric.findOne({
        user: req.user.id,
        source: connection.provider,
        recordedAt: { $gte: today }
      });

      if (!existingMetric) {
        // Generate mock data
        const crypto = require('crypto');
        const steps = crypto.randomInt(3000, 12001);
        const sleepHours = (crypto.randomInt(50, 91) / 10).toFixed(1);
        const heartRate = crypto.randomInt(60, 91);

        await HealthMetric.create({
          user: req.user.id,
          source: connection.provider,
          steps,
          sleepHours,
          heartRate,
          recordedAt: new Date()
        });
        
        syncedCount++;
      }
      
      // Update last sync time
      connection.lastSyncAt = new Date();
      await connection.save();
    }

    res.json({ message: `Sync completed. ${syncedCount} new records added.` });
  } catch (error) {
    console.error('Error syncing wearable data:', error);
    res.status(500).json({ message: 'Error syncing wearable data' });
  }
});

module.exports = router;
