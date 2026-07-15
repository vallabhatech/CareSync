const express = require('express');
const router = express.Router();
const MedicalDocument = require('../models/MedicalDocument');
const authMiddleware = require('../middleware/authMiddleware');

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB limit
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

// GET /api/medical-documents — list all documents for the logged-in user (no fileData)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 50);
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      MedicalDocument.find({ user: req.user.id })
        .select('-fileData')
        .sort({ uploadedAt: -1 })
        .skip(skip)
        .limit(limit),
      MedicalDocument.countDocuments({ user: req.user.id })
    ]);

    res.setHeader('X-Total-Count', total);
    res.setHeader('X-Total-Pages', Math.ceil(total / limit));
    res.setHeader('X-Current-Page', page);
    res.json(docs);
  } catch (err) {
    console.error('Error fetching documents:', err);
    res.status(500).json({ message: 'Failed to fetch documents' });
  }
});

// POST /api/medical-documents — upload a new document
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, category, notes, fileData, fileType, fileSize } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: 'Document name is required' });
    }
    if (!fileData || !fileType || !fileSize) {
      return res.status(400).json({ message: 'File data is required' });
    }
    if (!ALLOWED_TYPES.includes(fileType)) {
      return res.status(400).json({ message: 'Only PDF and image files (JPEG, PNG, WebP) are allowed' });
    }
    if (fileSize > MAX_FILE_SIZE) {
      return res.status(400).json({ message: 'File size must not exceed 10 MB' });
    }

    const doc = new MedicalDocument({
      user: req.user.id,
      name: name.trim(),
      category: category || 'other',
      notes: notes || '',
      fileData,
      fileType,
      fileSize,
    });

    await doc.save();
    // Return document without fileData
    const saved = doc.toObject();
    delete saved.fileData;
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error uploading document:', err);
    res.status(500).json({ message: 'Failed to upload document' });
  }
});

// GET /api/medical-documents/:id/download — download a single document with its fileData
router.get('/:id/download', authMiddleware, async (req, res) => {
  try {
    const doc = await MedicalDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }
    if (doc.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    res.json({ fileData: doc.fileData, fileType: doc.fileType, name: doc.name });
  } catch (err) {
    console.error('Error downloading document:', err);
    res.status(500).json({ message: 'Failed to download document' });
  }
});

// PUT /api/medical-documents/:id — update name, category, notes only
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const doc = await MedicalDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }
    if (doc.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { name, category, notes } = req.body;
    if (name !== undefined) doc.name = name.trim();
    if (category !== undefined) doc.category = category;
    if (notes !== undefined) doc.notes = notes;

    await doc.save();
    const updated = doc.toObject();
    delete updated.fileData;
    res.json(updated);
  } catch (err) {
    console.error('Error updating document:', err);
    res.status(500).json({ message: 'Failed to update document' });
  }
});

// DELETE /api/medical-documents/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const doc = await MedicalDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }
    if (doc.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    await MedicalDocument.findByIdAndDelete(req.params.id);
    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    console.error('Error deleting document:', err);
    res.status(500).json({ message: 'Failed to delete document' });
  }
});

module.exports = router;
