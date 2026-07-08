const express = require('express');
const router = express.Router();
const LabResult = require('../models/LabResult');
const MedicalDocument = require('../models/MedicalDocument');
const authMiddleware = require('../middleware/authMiddleware');

// Get all lab results for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const results = await LabResult.find({ user: req.user.id })
      .populate({
        path: 'document',
        select: '-fileData', // Exclude file data for listing efficiency
      })
      .sort({ testDate: -1 });
    res.json(results);
  } catch (err) {
    console.error('Error fetching lab results:', err);
    res.status(500).json({ message: 'Failed to fetch lab results' });
  }
});

// Create a new lab result
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      testDate,
      labName,
      category,
      testName,
      value,
      unit,
      referenceMin,
      referenceMax,
      notes,
      documentId,
    } = req.body;

    // Validate inputs
    if (!testName?.trim()) {
      return res.status(400).json({ message: 'Test/biomarker name is required' });
    }
    if (!category?.trim()) {
      return res.status(400).json({ message: 'Category is required' });
    }
    if (value === undefined || value === null || Number.isNaN(Number(value))) {
      return res.status(400).json({ message: 'Valid test value is required' });
    }
    if (!unit?.trim()) {
      return res.status(400).json({ message: 'Unit of measurement is required' });
    }
    if (!testDate) {
      return res.status(400).json({ message: 'Test date is required' });
    }

    // Optional: Validate document ownership
    let linkedDoc = null;
    if (documentId) {
      const doc = await MedicalDocument.findById(documentId);
      if (!doc) {
        return res.status(404).json({ message: 'Linked document not found' });
      }
      if (doc.user.toString() !== req.user.id.toString()) {
        return res.status(403).json({ message: 'Unauthorized access to the specified document' });
      }
      linkedDoc = doc._id;
    }

    const labResult = new LabResult({
      user: req.user.id,
      testDate: new Date(testDate),
      labName: labName || '',
      category: category.trim(),
      testName: testName.trim(),
      value: Number(value),
      unit: unit.trim(),
      referenceMin: referenceMin !== undefined && referenceMin !== null && referenceMin !== '' ? Number(referenceMin) : null,
      referenceMax: referenceMax !== undefined && referenceMax !== null && referenceMax !== '' ? Number(referenceMax) : null,
      notes: notes || '',
      document: linkedDoc,
    });

    await labResult.save();
    
    // Populate document details before returning
    const populated = await LabResult.findById(labResult._id).populate({
      path: 'document',
      select: '-fileData',
    });

    res.status(201).json(populated);
  } catch (err) {
    console.error('Error creating lab result:', err);
    res.status(500).json({ message: 'Failed to create lab result' });
  }
});

// Update a lab result
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const labResult = await LabResult.findById(req.params.id);
    if (!labResult) {
      return res.status(404).json({ message: 'Lab result not found' });
    }
    if (labResult.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const {
      testDate,
      labName,
      category,
      testName,
      value,
      unit,
      referenceMin,
      referenceMax,
      notes,
      documentId,
    } = req.body;

    // Validate inputs
    if (testName !== undefined && !testName?.trim()) {
      return res.status(400).json({ message: 'Test/biomarker name cannot be empty' });
    }
    if (category !== undefined && !category?.trim()) {
      return res.status(400).json({ message: 'Category cannot be empty' });
    }
    if (value !== undefined && (value === null || Number.isNaN(Number(value)))) {
      return res.status(400).json({ message: 'Valid test value is required' });
    }
    if (unit !== undefined && !unit?.trim()) {
      return res.status(400).json({ message: 'Unit of measurement cannot be empty' });
    }

    if (testDate !== undefined) labResult.testDate = new Date(testDate);
    if (labName !== undefined) labResult.labName = labName;
    if (category !== undefined) labResult.category = category.trim();
    if (testName !== undefined) labResult.testName = testName.trim();
    if (value !== undefined) labResult.value = Number(value);
    if (unit !== undefined) labResult.unit = unit.trim();
    
    if (referenceMin !== undefined) {
      labResult.referenceMin = referenceMin !== null && referenceMin !== '' ? Number(referenceMin) : null;
    }
    if (referenceMax !== undefined) {
      labResult.referenceMax = referenceMax !== null && referenceMax !== '' ? Number(referenceMax) : null;
    }
    if (notes !== undefined) labResult.notes = notes;

    // Optional: Validate document ownership
    if (documentId !== undefined) {
      if (documentId === null || documentId === '') {
        labResult.document = null;
      } else {
        const doc = await MedicalDocument.findById(documentId);
        if (!doc) {
          return res.status(404).json({ message: 'Linked document not found' });
        }
        if (doc.user.toString() !== req.user.id.toString()) {
          return res.status(403).json({ message: 'Unauthorized access to the specified document' });
        }
        labResult.document = doc._id;
      }
    }

    await labResult.save();

    const populated = await LabResult.findById(labResult._id).populate({
      path: 'document',
      select: '-fileData',
    });

    res.json(populated);
  } catch (err) {
    console.error('Error updating lab result:', err);
    res.status(500).json({ message: 'Failed to update lab result' });
  }
});

// Delete a lab result
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const labResult = await LabResult.findById(req.params.id);
    if (!labResult) {
      return res.status(404).json({ message: 'Lab result not found' });
    }
    if (labResult.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await LabResult.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lab result deleted successfully' });
  } catch (err) {
    console.error('Error deleting lab result:', err);
    res.status(500).json({ message: 'Failed to delete lab result' });
  }
});

module.exports = router;
