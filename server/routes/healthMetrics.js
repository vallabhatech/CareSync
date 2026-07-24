const express = require('express');
const router = express.Router();
const HealthMetric = require('../models/HealthMetric');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const { generateHealthReportPDF } = require('../utils/pdfGenerator');

// Get all health metrics for a user (optional: filter by date range)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, page: reqPage, limit: reqLimit } = req.query;
    const filter = { user: req.user.id };

    if (startDate || endDate) {
      filter.recordedAt = {};
      if (startDate) {
        filter.recordedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.recordedAt.$lte = end;
      }
    }

    const page = Math.max(1, parseInt(reqPage, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(reqLimit, 10) || 50));
    const skip = (page - 1) * limit;

    const [metrics, total] = await Promise.all([
      HealthMetric.find(filter).sort({ recordedAt: -1 }).skip(skip).limit(limit),
      HealthMetric.countDocuments(filter)
    ]);

    res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count, X-Total-Pages, X-Current-Page');
    res.setHeader('X-Total-Count', total);
    res.setHeader('X-Total-Pages', Math.ceil(total / limit));
    res.setHeader('X-Current-Page', page);
    res.json(metrics);
  } catch (err) {
    console.error('Error fetching health metrics:', err);
    res.status(500).json({ message: 'Failed to fetch health metrics' });
  }
});

// Create a new health metric
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { weight, systolic, diastolic, heartRate, temperature, bloodSugar, oxygenSaturation, notes, recordedAt } = req.body;

    const metric = new HealthMetric({
      user: req.user.id,
      weight: weight || null,
      systolic: systolic || null,
      diastolic: diastolic || null,
      heartRate: heartRate || null,
      temperature: temperature || null,
      bloodSugar: bloodSugar || null,
      oxygenSaturation: oxygenSaturation || null,
      notes: notes || '',
      recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
    });

    await metric.save();
    res.status(201).json(metric);
  } catch (err) {
    console.error('Error creating health metric:', err);
    res.status(500).json({ message: 'Failed to create health metric' });
  }
});

// Update a health metric
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { weight, systolic, diastolic, heartRate, temperature, bloodSugar, oxygenSaturation, notes, recordedAt } = req.body;

    const metric = await HealthMetric.findById(req.params.id);
    if (!metric) {
      return res.status(404).json({ message: 'Health metric not found' });
    }

    if (metric.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    metric.weight = weight !== undefined ? weight : metric.weight;
    metric.systolic = systolic !== undefined ? systolic : metric.systolic;
    metric.diastolic = diastolic !== undefined ? diastolic : metric.diastolic;
    metric.heartRate = heartRate !== undefined ? heartRate : metric.heartRate;
    metric.temperature = temperature !== undefined ? temperature : metric.temperature;
    metric.bloodSugar = bloodSugar !== undefined ? bloodSugar : metric.bloodSugar;
    metric.oxygenSaturation = oxygenSaturation !== undefined ? oxygenSaturation : metric.oxygenSaturation;
    metric.notes = notes !== undefined ? notes : metric.notes;
    metric.recordedAt = recordedAt ? new Date(recordedAt) : metric.recordedAt;

    await metric.save();
    res.json(metric);
  } catch (err) {
    console.error('Error updating health metric:', err);
    res.status(500).json({ message: 'Failed to update health metric' });
  }
});

// Delete a health metric
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const metric = await HealthMetric.findById(req.params.id);
    if (!metric) {
      return res.status(404).json({ message: 'Health metric not found' });
    }

    if (metric.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await HealthMetric.findByIdAndDelete(req.params.id);
    res.json({ message: 'Health metric deleted' });
  } catch (err) {
    console.error('Error deleting health metric:', err);
    res.status(500).json({ message: 'Failed to delete health metric' });
  }
});

// Export health metrics as PDF
router.get('/export/pdf', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const metrics = await HealthMetric.find({ user: req.user.id }).sort({ recordedAt: -1 });

    const pdfBuffer = await generateHealthReportPDF(user, metrics);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="health-report-${new Date().toISOString().split('T')[0]}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generating PDF:', err);
    res.status(500).json({ message: 'Failed to generate PDF report' });
  }
});

module.exports = router;
