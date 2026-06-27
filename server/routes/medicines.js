const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
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

// Helper: resolve the familyMemberId from a request body or query string.
// Returns a valid ObjectId string, or null (meaning "primary user").
function resolveFamilyMemberId(value) {
  if (!value) return null;
  const str = String(value).trim();
  return mongoose.Types.ObjectId.isValid(str) ? str : null;
}

// @route   GET /api/medicines
// @desc    Get all medicines for the logged-in user (or a family member)
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const familyMemberId = resolveFamilyMemberId(req.query.familyMemberId);

    // Build a query filter scoped to this user. When familyMemberId is
    // provided we match it explicitly; otherwise we return only documents
    // where familyMemberId is null (primary-user medicines).
    const filter = {
      user: { $eq: req.user._id },
      familyMemberId: familyMemberId ? { $eq: familyMemberId } : { $in: [null, undefined] },
    };

    const medicines = await Medicine.find(filter).sort({ createdAt: 1 });

    // Format medicines to match the frontend expectations: { id, name, time, date }
    const formatted = medicines.map(med => ({
      id: med._id,
      name: med.name,
      time: med.time,
      date: med.date,
      familyMemberId: med.familyMemberId || null,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Fetch medicines error:', err.message);
    res.status(500).json({ message: 'Server error fetching medicines list' });
  }
});

// @route   POST /api/medicines
// @desc    Add a new medicine reminder (optionally for a family member)
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  const name = req.body.name === undefined ? '' : String(req.body.name).trim();
  const time = req.body.time === undefined ? '' : String(req.body.time).trim();
  const date = req.body.date === undefined ? '' : String(req.body.date).trim();
  const familyMemberId = resolveFamilyMemberId(req.body.familyMemberId);

  try {
    if (!name || !time || !date) {
      return res.status(400).json({ message: 'Name, time, and date are required' });
    }

    const newMedicine = new Medicine({
      user: req.user._id,
      familyMemberId,
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
      familyMemberId: newMedicine.familyMemberId || null,
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

module.exports = router;
