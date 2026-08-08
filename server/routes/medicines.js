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
const redisClient = require('../utils/redisClient');

// @route   GET /api/medicines
// @desc    Get all medicines for the logged-in user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const cacheKey = `meds_${req.user._id}`;
    
    if (redisClient.isConnected()) {
      const cachedData = await redisClient.getClient().get(cacheKey);
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }
    }

    const medicines = await Medicine.find({ user: { $eq: req.user._id } }).sort({ createdAt: 1 });
    
    // Format medicines to match the frontend expectations: { id, name, time, date }
    const formatted = medicines.map(med => ({
      id: med._id,
      name: med.name,
      time: med.time,
      date: med.date,
    }));
    
    if (redisClient.isConnected()) {
      await redisClient.getClient().setEx(cacheKey, 300, JSON.stringify(formatted)); // Cache for 5 mins
    }

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
    });
    
    if (redisClient.isConnected()) {
      await redisClient.getClient().del(`meds_${req.user._id}`);
    }
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
    
    if (redisClient.isConnected()) {
      await redisClient.getClient().del(`meds_${req.user._id}`);
    }

    res.json({ message: 'Medicine reminder deleted successfully', id: req.params.id });
  } catch (err) {
    console.error('Delete medicine error:', err.message);
    res.status(500).json({ message: 'Server error deleting medicine reminder' });
  }
});

module.exports = router;
