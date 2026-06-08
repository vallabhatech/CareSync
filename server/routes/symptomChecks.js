const express = require('express');
const router = express.Router();
const SymptomCheck = require('../models/SymptomCheck');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/symptom-checks
// @desc    Get all symptom check records for the logged-in user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const history = await SymptomCheck.find({ user: req.user._id }).sort({ checkedAt: -1 });
    res.json(history);
  } catch (err) {
    console.error('Fetch symptom checks error:', err.message);
    res.status(500).json({ message: 'Server error fetching symptom checks history' });
  }
});

// @route   POST /api/symptom-checks
// @desc    Save a new symptom check record
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  const { symptoms, results } = req.body;

  try {
    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({ message: 'Symptoms are required and must be a non-empty array' });
    }

    if (!results || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ message: 'Results are required and must be a non-empty array' });
    }

    const newCheck = new SymptomCheck({
      user: req.user._id,
      symptoms,
      results,
    });

    await newCheck.save();
    res.status(201).json(newCheck);
  } catch (err) {
    console.error('Save symptom check error:', err.message);
    res.status(500).json({ message: 'Server error saving symptom check assessment' });
  }
});

module.exports = router;
