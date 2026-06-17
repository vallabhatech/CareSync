const express = require('express');
const router = express.Router();
const HealthMetric = require('../models/HealthMetric');
const authMiddleware = require('../middleware/authMiddleware');

// Get all health metrics for a user (optional: filter by date range)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
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

    const metrics = await HealthMetric.find(filter).sort({ recordedAt: -1 }).limit(500);
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

module.exports = router;
