const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST /api/doctor-reviews
// @desc    Submit a doctor review (MVP for Issue 134)
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  const { doctorId, rating, comment } = req.body;
  try {
    // MVP: simulate saving review
    if (!doctorId || !rating) {
      return res.status(400).json({ message: 'Doctor ID and Rating are required' });
    }
    res.status(201).json({ message: 'Review submitted successfully', review: { doctorId, rating, comment } });
  } catch (err) {
    console.error('Submit review error:', err.message);
    res.status(500).json({ message: 'Server error submitting review' });
  }
});

module.exports = router;
