const mongoose = require('mongoose');

const LabResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  testDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  labName: {
    type: String,
    trim: true,
    default: '',
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  testName: {
    type: String,
    required: true,
    trim: true,
  },
  value: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    required: true,
    trim: true,
  },
  referenceMin: {
    type: Number,
    default: null,
  },
  referenceMax: {
    type: Number,
    default: null,
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalDocument',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries by user and testDate
LabResultSchema.index({ user: 1, testDate: -1 });

module.exports = mongoose.model('LabResult', LabResultSchema);
