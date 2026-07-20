const express = require('express');
const router = express.Router();
// Does not necessarily require auth for basic config fetching

// @route   GET /api/mobile/config
// @desc    Get dynamic config for Mobile Apps (iOS/Android) (MVP for Issue 165)
// @access  Public
router.get('/', (req, res) => {
  try {
    // MVP: Serve configuration for the mobile app (e.g. feature flags, minimum versions)
    res.json({
      minIosVersion: '14.0',
      minAndroidVersion: '9.0',
      featuresEnabled: {
        telemedicine: true,
        ambulanceBooking: true
      },
      apiBaseUrl: 'https://api.caresync.example.com'
    });
  } catch (err) {
    console.error('Fetch mobile config error:', err.message);
    res.status(500).json({ message: 'Server error fetching mobile config' });
  }
});

module.exports = router;
