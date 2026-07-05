const express = require('express');
const router = express.Router();

/**
 * POST /api/predict
 * Accepts user health data and returns a dummy prediction.
 * In a real implementation this would invoke a trained ML model.
 */
router.post('/predict', (req, res) => {
  const { userId, metrics } = req.body;
  // Placeholder logic – simple risk level based on a dummy rule
  const riskLevel = metrics && metrics.bloodPressure && metrics.bloodPressure > 130 ? 'high' : 'low';
  const prediction = {
    userId: userId || null,
    riskLevel,
    confidence: 0.91,
    advice: riskLevel === 'high' ? 'Consult your doctor soon.' : 'Maintain your healthy habits.',
    receivedMetrics: metrics || {}
  };
  res.json({ prediction });
});

module.exports = router;
