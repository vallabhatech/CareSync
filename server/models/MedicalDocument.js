const mongoose = require('mongoose');

const MedicalDocumentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['report', 'prescription', 'scan', 'insurance', 'other'],
    default: 'other',
  },
  notes: {
    type: String,
    default: '',
    trim: true,
  },
  // Store file as base64 data URL (same pattern as avatar in User model)
  fileData: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    required: true, // e.g. 'application/pdf', 'image/jpeg'
  },
  fileSize: {
    type: Number,
    required: true, // bytes
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

MedicalDocumentSchema.index({ user: 1, uploadedAt: -1 });

module.exports = mongoose.model('MedicalDocument', MedicalDocumentSchema);
