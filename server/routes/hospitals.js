const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/hospitals
// @desc    Get a list of integrated hospitals (MVP for Issue 161)
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    // MVP: return mock data. In a real system this would hit an external API or our database.
    const mockHospitals = [
      { id: 'H1', name: 'City General Hospital', location: 'Downtown', phone: '555-0101', hasER: true },
      { id: 'H2', name: 'St. Mary Medical Center', location: 'Westside', phone: '555-0102', hasER: true },
      { id: 'H3', name: 'Oakridge Community Clinic', location: 'North Hills', phone: '555-0103', hasER: false }
    ];
    res.json(mockHospitals);
  } catch (err) {
    console.error('Fetch hospitals error:', err.message);
    res.status(500).json({ message: 'Server error fetching hospitals' });
  }
});

module.exports = router;
