const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/pharmacies
// @desc    Get a list of integrated pharmacies (MVP for Issue 155)
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    // MVP: return mock data. In a real system this would hit an external API or our database.
    const mockPharmacies = [
      { id: 'P1', name: 'HealthPlus Pharmacy', location: 'Downtown', phone: '555-0201', isOpen24Hours: true },
      { id: 'P2', name: 'Neighborhood Meds', location: 'Westside', phone: '555-0202', isOpen24Hours: false },
      { id: 'P3', name: 'QuickScript Rx', location: 'North Hills', phone: '555-0203', isOpen24Hours: false }
    ];
    res.json(mockPharmacies);
  } catch (err) {
    console.error('Fetch pharmacies error:', err.message);
    res.status(500).json({ message: 'Server error fetching pharmacies' });
  }
});

module.exports = router;
