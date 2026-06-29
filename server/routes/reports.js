const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const HealthMetric = require('../models/HealthMetric');
const Medicine = require('../models/Medicine');
const { generateHealthReportPDF } = require('../utils/pdfGenerator');

// GET /api/reports/health-summary/pdf
// Generate and download a comprehensive health report PDF
router.get('/health-summary/pdf', authMiddleware, async (req, res) => {
  try {
    const [user, metrics, medicines] = await Promise.all([
      User.findById(req.user.id).select('-password -twoFactorSecret'),
      HealthMetric.find({ user: req.user.id }).sort({ recordedAt: -1 }).limit(100),
      Medicine.find({ user: req.user.id }).sort({ date: -1, time: 1 }).limit(100),
    ]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const pdfBuffer = await generateHealthReportPDF(user, metrics, medicines);
    const filename = `caresync-health-report-${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generating health report PDF:', err);
    res.status(500).json({ message: 'Failed to generate health report' });
  }
});

module.exports = router;
