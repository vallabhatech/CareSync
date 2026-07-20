const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const crypto = require('crypto');
// @route   POST /api/ambulances/book
// @desc    Book an ambulance (MVP for Issue 157)
// @access  Private
router.post('/book', authMiddleware, async (req, res) => {
  const { location } = req.body;
  try {
    // MVP: Simulate booking an ambulance
    if (!location) {
      return res.status(400).json({ message: 'Location is required to book an ambulance.' });
    }
    
    res.status(201).json({
      message: 'Ambulance booked successfully',
      bookingId: 'AMB' + crypto.randomBytes(3).toString('hex').toUpperCase(),
      estimatedArrival: '15 mins',
      status: 'Dispatched'
    });
  } catch (err) {
    console.error('Ambulance booking error:', err.message);
    res.status(500).json({ message: 'Server error booking ambulance' });
  }
});

module.exports = router;
