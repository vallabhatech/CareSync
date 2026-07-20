const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/forums
// @desc    Get community health forum posts (MVP for Issue 159)
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    // MVP: return mock forum threads
    const mockThreads = [
      { id: 'T1', title: 'Managing Type 2 Diabetes', author: 'HealthAdvocate', replies: 12 },
      { id: 'T2', title: 'Best practices for better sleep', author: 'SleepDoc', replies: 34 }
    ];
    res.json(mockThreads);
  } catch (err) {
    console.error('Fetch forums error:', err.message);
    res.status(500).json({ message: 'Server error fetching forums' });
  }
});

module.exports = router;
