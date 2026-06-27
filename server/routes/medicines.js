const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
// General limiter for medicines endpoints
const medicinesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 80,
  message: 'Too many requests to medicines endpoints, please try again later.',
});
router.use(medicinesLimiter);
const Medicine = require('../models/Medicine');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/medicines
// @desc    Get all medicines for the logged-in user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const medicines = await Medicine.find({ user: { $eq: req.user._id } }).sort({ createdAt: 1 });
    
    // Format medicines to match the frontend expectations: { id, name, time, date }
    const formatted = medicines.map(med => ({
      id: med._id,
      name: med.name,
      time: med.time,
      date: med.date,
      isTaken: med.isTaken,
    }));
    
    res.json(formatted);
  } catch (err) {
    console.error('Fetch medicines error:', err.message);
    res.status(500).json({ message: 'Server error fetching medicines list' });
  }
});

// @route   POST /api/medicines
// @desc    Add a new medicine reminder
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  const name = req.body.name === undefined ? '' : String(req.body.name).trim();
  const time = req.body.time === undefined ? '' : String(req.body.time).trim();
  const date = req.body.date === undefined ? '' : String(req.body.date).trim();

  try {
    if (!name || !time || !date) {
      return res.status(400).json({ message: 'Name, time, and date are required' });
    }

    const newMedicine = new Medicine({
      user: req.user._id,
      name,
      time,
      date,
    });

    await newMedicine.save();

    res.status(201).json({
      id: newMedicine._id,
      name: newMedicine.name,
      time: newMedicine.time,
      date: newMedicine.date,
      isTaken: newMedicine.isTaken,
    });
  } catch (err) {
    console.error('Add medicine error:', err.message);
    res.status(500).json({ message: 'Server error adding medicine reminder' });
  }
});

// @route   DELETE /api/medicines/:id
// @desc    Delete a medicine reminder
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  const cleanId = String(req.params.id);
  try {
    const medicine = await Medicine.findOne({ _id: { $eq: cleanId }, user: { $eq: req.user._id } });
    
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine reminder not found or unauthorized' });
    }

    await medicine.deleteOne();
    res.json({ message: 'Medicine reminder deleted successfully', id: req.params.id });
  } catch (err) {
    console.error('Delete medicine error:', err.message);
    res.status(500).json({ message: 'Server error deleting medicine reminder' });
  }
});

// @route   PUT /api/medicines/:id
// @desc    Update a medicine reminder
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  const cleanId = String(req.params.id);
  const { name, time, date } = req.body;
  try {
    const medicine = await Medicine.findOne({ _id: { $eq: cleanId }, user: { $eq: req.user._id } });
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine reminder not found' });
    }
    
    if (name) medicine.name = String(name).trim();
    if (time) medicine.time = String(time).trim();
    if (date) medicine.date = String(date).trim();
    
    await medicine.save();
    res.json({
      id: medicine._id,
      name: medicine.name,
      time: medicine.time,
      date: medicine.date,
      isTaken: medicine.isTaken,
    });
  } catch (err) {
    console.error('Update medicine error:', err.message);
    res.status(500).json({ message: 'Server error updating medicine reminder' });
  }
});

// @route   PATCH /api/medicines/:id/status
// @desc    Toggle medicine taken status
// @access  Private
router.patch('/:id/status', authMiddleware, async (req, res) => {
  const cleanId = String(req.params.id);
  const { isTaken } = req.body;
  
  if (typeof isTaken !== 'boolean') {
    return res.status(400).json({ message: 'isTaken must be a boolean' });
  }

  try {
    const medicine = await Medicine.findOne({ _id: { $eq: cleanId }, user: { $eq: req.user._id } });
    
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine reminder not found or unauthorized' });
    }

    medicine.isTaken = isTaken;
    await medicine.save();

    res.json({
      id: medicine._id,
      name: medicine.name,
      time: medicine.time,
      date: medicine.date,
      isTaken: medicine.isTaken,
    });
  } catch (err) {
    console.error('Update medicine status error:', err.message);
    res.status(500).json({ message: 'Server error updating medicine status' });
  }
});

// @route   GET /api/medicines/analytics
// @desc    Get adherence analytics
// @access  Private
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    // Format to YYYY-MM-DD for comparison, although we can just fetch all or filter in JS if format is tricky
    // The dates are stored as "YYYY-MM-DD" string
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const medicines = await Medicine.find({
      user: { $eq: req.user._id },
      date: { $gte: thirtyDaysAgoStr }
    });

    if (medicines.length === 0) {
      return res.json({ adherenceRate: 0, insights: "No medications scheduled in the last 30 days.", suggestions: "Add your medications to start tracking." });
    }

    const total = medicines.length;
    const taken = medicines.filter(m => m.isTaken).length;
    const adherenceRate = Math.round((taken / total) * 100);

    // Simple analysis for morning (before 12 PM) vs evening
    const morningMeds = medicines.filter(m => {
      const hour = parseInt(m.time.split(':')[0], 10);
      return hour < 12;
    });
    const eveningMeds = medicines.filter(m => {
      const hour = parseInt(m.time.split(':')[0], 10);
      return hour >= 12;
    });

    const morningTaken = morningMeds.filter(m => m.isTaken).length;
    const eveningTaken = eveningMeds.filter(m => m.isTaken).length;

    const morningRate = morningMeds.length > 0 ? (morningTaken / morningMeds.length) : 1;
    const eveningRate = eveningMeds.length > 0 ? (eveningTaken / eveningMeds.length) : 1;

    let insights = `You have taken ${taken} out of ${total} medications in the last 30 days.`;
    let suggestions = "Keep up the good work!";

    if (adherenceRate < 80) {
      if (morningRate < eveningRate) {
        insights += " You seem to miss your morning medications more often.";
        suggestions = "Try setting an alarm or keeping your pills next to your bed or coffee maker.";
      } else if (eveningRate < morningRate) {
        insights += " You seem to miss your evening medications more often.";
        suggestions = "Try taking your pills with dinner or setting a bedtime reminder.";
      } else {
        suggestions = "Consider setting louder alarms or using a pill organizer.";
      }
    } else if (adherenceRate === 100) {
      suggestions = "Perfect adherence! Great job staying on track.";
    }

    res.json({
      adherenceRate,
      total,
      taken,
      insights,
      suggestions,
    });
  } catch (err) {
    console.error('Analytics error:', err.message);
    res.status(500).json({ message: 'Server error generating analytics' });
  }
});

module.exports = router;
