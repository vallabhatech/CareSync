const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const HealthMetric = require('../models/HealthMetric');
const HealthRiskAssessment = require('../models/HealthRiskAssessment');
const { computeRiskAssessment } = require('../utils/riskEngine');

// POST /api/risk-assessment
// Run a new assessment with provided lifestyle + family history inputs
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { lifestyle, familyHistory } = req.body;

    if (!lifestyle || !familyHistory) {
      return res.status(400).json({ message: 'lifestyle and familyHistory inputs are required.' });
    }

    const [user, latestMetric] = await Promise.all([
      User.findById(req.user.id).select('-password -twoFactorSecret'),
      HealthMetric.findOne({ user: req.user.id }).sort({ recordedAt: -1 }),
    ]);

    if (!user) return res.status(404).json({ message: 'User not found.' });

    const { riskFactors, score, overallRisk } = computeRiskAssessment(
      user, latestMetric, lifestyle, familyHistory
    );

    const assessment = new HealthRiskAssessment({
      user: req.user.id,
      overallRisk,
      score,
      riskFactors,
      lifestyle,
      familyHistory,
    });

    await assessment.save();
    res.status(201).json(assessment);
  } catch (err) {
    console.error('Error running risk assessment:', err);
    res.status(500).json({ message: 'Failed to run risk assessment.' });
  }
});

// GET /api/risk-assessment
// Get assessment history for the logged-in user (latest 10)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const assessments = await HealthRiskAssessment.find({ user: req.user.id })
      .sort({ assessedAt: -1 })
      .limit(10);
    res.json(assessments);
  } catch (err) {
    console.error('Error fetching assessments:', err);
    res.status(500).json({ message: 'Failed to fetch assessments.' });
  }
});

// GET /api/risk-assessment/latest
// Get only the most recent assessment
router.get('/latest', authMiddleware, async (req, res) => {
  try {
    const assessment = await HealthRiskAssessment.findOne({ user: req.user.id })
      .sort({ assessedAt: -1 });
    if (!assessment) return res.status(404).json({ message: 'No assessment found.' });
    res.json(assessment);
  } catch (err) {
    console.error('Error fetching latest assessment:', err);
    res.status(500).json({ message: 'Failed to fetch latest assessment.' });
  }
});

// DELETE /api/risk-assessment/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const assessment = await HealthRiskAssessment.findById(req.params.id);
    if (!assessment) return res.status(404).json({ message: 'Assessment not found.' });
    if (assessment.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }
    await HealthRiskAssessment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Assessment deleted.' });
  } catch (err) {
    console.error('Error deleting assessment:', err);
    res.status(500).json({ message: 'Failed to delete assessment.' });
  }
});

module.exports = router;
