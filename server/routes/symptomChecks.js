const express = require('express');
const router = express.Router();
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

// @route   GET /api/symptom-checks
// @desc    Get all symptom check records for the logged-in user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const history = await SymptomCheck.find({ user: { $eq: req.user._id } }).sort({ checkedAt: -1 });
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
  const symptoms = Array.isArray(req.body.symptoms) ? req.body.symptoms.map(String) : [];
  const results = Array.isArray(req.body.results) ? req.body.results.map(r => ({
    condition: String(r.condition || ''),
    probability: Number(r.probability || 0),
    causes: String(r.causes || ''),
    solutions: Array.isArray(r.solutions) ? r.solutions.map(String) : [],
    risk: String(r.risk || 'low')
  })) : [];

  try {
    if (symptoms.length === 0) {
      return res.status(400).json({ message: 'Symptoms are required and must be a non-empty array' });
    }

    if (results.length === 0) {
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

// @route   GET /api/symptom-checks/trends
// @desc    Get trend analysis for symptoms over time (MVP)
// @access  Private
router.get('/trends', authMiddleware, async (req, res) => {
  try {
    const history = await SymptomCheck.find({ user: { $eq: req.user._id } }).sort({ checkedAt: 1 });
    
    // MVP: Group by symptom and count frequency, also tracking timeline
    const trends = {};
    
    history.forEach(check => {
      const date = new Date(check.checkedAt).toISOString().split('T')[0];
      
      check.symptoms.forEach(symptom => {
        const lowerSymptom = symptom.toLowerCase().trim();
        if (!trends[lowerSymptom]) {
          trends[lowerSymptom] = { count: 0, timeline: [] };
        }
        trends[lowerSymptom].count += 1;
        trends[lowerSymptom].timeline.push(date);
      });
    });

    res.json({ trends });
  } catch (err) {
    console.error('Fetch symptom trends error:', err.message);
    res.status(500).json({ message: 'Server error fetching symptom trends' });
  }
});

module.exports = router;
