const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/appointments/reminders
// @desc    Get upcoming appointment reminders (MVP for Issue 135)
// @access  Private
router.get('/reminders', authMiddleware, async (req, res) => {
  try {
    // MVP: return mock appointment reminders
    const mockReminders = [
      { id: 'A1', type: 'Consultation', doctor: 'Dr. Smith', date: new Date(Date.now() + 86400000).toISOString() },
      { id: 'A2', type: 'Lab Test', doctor: 'Dr. Jones', date: new Date(Date.now() + 172800000).toISOString() }
    ];
    res.json(mockReminders);
  } catch (err) {
    console.error('Fetch reminders error:', err.message);
    res.status(500).json({ message: 'Server error fetching reminders' });
  }
});

module.exports = router;
