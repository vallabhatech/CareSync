const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/health-apis
// @desc    Get connected health APIs (MVP for Issue 141)
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    // MVP: return mock data for connected devices/APIs.
    const connectedApis = [
      { id: 'API1', name: 'Google Fit', status: 'Connected', lastSync: new Date().toISOString() },
      { id: 'API2', name: 'Apple Health', status: 'Disconnected', lastSync: null },
      { id: 'API3', name: 'Fitbit', status: 'Connected', lastSync: new Date(Date.now() - 3600000).toISOString() },
    ];
    res.json(connectedApis);
  } catch (err) {
    console.error('Fetch health APIs error:', err.message);
    res.status(500).json({ message: 'Server error fetching health APIs' });
  }
});

module.exports = router;
