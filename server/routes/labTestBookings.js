const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

const DiagnosticCenter = require('../models/DiagnosticCenter');
const LabTest = require('../models/LabTest');
const LabTestBooking = require('../models/LabTestBooking');
const FamilyMember = require('../models/FamilyMember');

// GET /api/lab-tests/centers/nearby
// Minimal implementation: ignores geo search and returns nearest-ish by insertion order.
// Clients can still filter by lat/lon later.
router.get('/centers/nearby', authMiddleware, async (req, res) => {
  try {
    const { limit } = req.query;
    const n = limit ? Math.min(Number(limit) || 10, 50) : 10;
    const centers = await DiagnosticCenter.find({}).sort({ createdAt: -1 }).limit(n);
    res.json(centers);
  } catch (err) {
    console.error('Fetch diagnostic centers error:', err);
    res.status(500).json({ message: 'Server error fetching diagnostic centers' });
  }
});

// GET /api/lab-tests/tests?centerId=...
router.get('/tests', authMiddleware, async (req, res) => {
  try {
    const { centerId } = req.query;
    if (!centerId) {
      return res.status(400).json({ message: 'centerId is required' });
    }

    // centerId is DiagnosticCenter._id; match LabTest.availableForCenters by place_id.
    const center = await DiagnosticCenter.findById(centerId);
    if (!center) {
      return res.status(404).json({ message: 'Diagnostic center not found' });
    }

    const tests = await LabTest.find({
      availableForCenters: { $in: [String(center.place_id)] },
    }).sort({ createdAt: -1 });

    res.json(tests);
  } catch (err) {
    console.error('Fetch lab tests error:', err);
    res.status(500).json({ message: 'Server error fetching lab tests' });
  }
});

// POST /api/lab-tests/bookings
router.post('/bookings', authMiddleware, async (req, res) => {
  try {
    const { labTestId, centerId, familyMemberId, scheduledCollectionAt, collectionWindow } = req.body || {};

    if (!labTestId || !centerId) {
      return res.status(400).json({ message: 'labTestId and centerId are required' });
    }

    const labTest = await LabTest.findById(labTestId);
    if (!labTest) {
      return res.status(404).json({ message: 'Lab test not found' });
    }

    const center = await DiagnosticCenter.findById(centerId);
    if (!center) {
      return res.status(404).json({ message: 'Diagnostic center not found' });
    }

    // Ensure test is available for this center
    const isAvailable = Array.isArray(labTest.availableForCenters)
      ? labTest.availableForCenters.includes(String(center.place_id))
      : false;

    if (!isAvailable) {
      return res.status(400).json({ message: 'Selected test is not available for this center' });
    }

    let familyMember = null;
    if (familyMemberId) {
      familyMember = await FamilyMember.findOne({ _id: familyMemberId, user: req.user._id });
      if (!familyMember) {
        return res.status(404).json({ message: 'Family member not found' });
      }
    }

    const scheduledAt = scheduledCollectionAt ? new Date(scheduledCollectionAt) : null;
    if (scheduledAt && Number.isNaN(scheduledAt.getTime())) {
      return res.status(400).json({ message: 'scheduledCollectionAt must be a valid date' });
    }

    const booking = new LabTestBooking({
      user: req.user._id,
      familyMember: familyMember ? familyMember._id : null,
      labTest: labTest._id,
      center: center._id,
      status: scheduledAt ? 'SCHEDULED' : 'REQUESTED',
      requestedAt: new Date(),
      scheduledCollectionAt: scheduledAt,
      collectionWindow: collectionWindow ? String(collectionWindow).trim() : '',
    });

    await booking.save();

    res.status(201).json(booking);
  } catch (err) {
    console.error('Create lab test booking error:', err);
    res.status(500).json({ message: 'Server error creating booking' });
  }
});

// GET /api/lab-tests/bookings
router.get('/bookings', authMiddleware, async (req, res) => {
  try {
    const bookings = await LabTestBooking.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('labTest')
      .populate('center');

    res.json(bookings);
  } catch (err) {
    console.error('Fetch lab test bookings error:', err);
    res.status(500).json({ message: 'Server error fetching bookings' });
  }
});

// GET /api/lab-tests/bookings/:id
router.get('/bookings/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await LabTestBooking.findOne({ _id: req.params.id, user: req.user._id })
      .populate('labTest')
      .populate('center')
      .populate('familyMember');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(booking);
  } catch (err) {
    console.error('Fetch lab test booking detail error:', err);
    res.status(500).json({ message: 'Server error fetching booking detail' });
  }
});

module.exports = router;

