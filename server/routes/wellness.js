const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/wellness
// @desc    Get corporate wellness programs (MVP for Issue 162)
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    // MVP: return mock data.
    const mockPrograms = [
      { id: 'W1', company: 'TechCorp', programName: 'Step Challenge 2026', rewards: 'Gift Cards' },
      { id: 'W2', company: 'HealthInc', programName: 'Mindfulness Mondays', rewards: 'Extra PTO' },
    ];
    res.json(mockPrograms);
  } catch (err) {
    console.error('Fetch wellness programs error:', err.message);
    res.status(500).json({ message: 'Server error fetching wellness programs' });
  }
});

module.exports = router;
