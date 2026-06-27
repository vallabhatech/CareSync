const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
// General limiter for symptom check endpoints
const symptomLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many requests to symptom check endpoints, please try again later.',
});
router.use(symptomLimiter);
const SymptomCheck = require('../models/SymptomCheck');
const authMiddleware = require('../middleware/authMiddleware');

// Helper: resolve the familyMemberId from a request body or query string.
// Returns a valid ObjectId string, or null (meaning "primary user").
function resolveFamilyMemberId(value) {
  if (!value) return null;
  const str = String(value).trim();
  return mongoose.Types.ObjectId.isValid(str) ? str : null;
}

// @route   GET /api/symptom-checks
// @desc    Get all symptom check records for the logged-in user (or a family member)
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const familyMemberId = resolveFamilyMemberId(req.query.familyMemberId);

    const filter = {
      user: { $eq: req.user._id },
      familyMemberId: familyMemberId ? { $eq: familyMemberId } : { $in: [null, undefined] },
    };

    const history = await SymptomCheck.find(filter).sort({ checkedAt: -1 });
    res.json(history);
  } catch (err) {
    console.error('Fetch symptom checks error:', err.message);
    res.status(500).json({ message: 'Server error fetching symptom checks history' });
  }
});

// @route   POST /api/symptom-checks
// @desc    Save a new symptom check record (optionally for a family member)
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  const symptoms = Array.isArray(req.body.symptoms) ? req.body.symptoms.map(String) : [];
  const results = Array.isArray(req.body.results) ? req.body.results.map(r => ({
    condition: String(r.condition || ''),
    probability: Number(r.probability || 0),
    causes: String(r.causes || ''),
    solutions: Array.isArray(r.solutions) ? r.solutions.map(String) : [],
    risk: String(r.risk || 'low')
  })) : [];
  const familyMemberId = resolveFamilyMemberId(req.body.familyMemberId);

  try {
    if (symptoms.length === 0) {
      return res.status(400).json({ message: 'Symptoms are required and must be a non-empty array' });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: 'Results are required and must be a non-empty array' });
    }

    const newCheck = new SymptomCheck({
      user: req.user._id,
      familyMemberId,
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
