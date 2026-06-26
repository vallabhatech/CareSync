const mongoose = require('mongoose');

const LabTestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  testCode: {
    // External code used by partners (optional)
    type: String,
    default: '',
    trim: true,
    index: true,
  },
  price: {
    type: Number,
    default: 0,
  },
  turnaroundHours: {
    type: Number,
    default: 48,
  },
  sampleType: {
    type: String,
    default: '',
    trim: true,
  },
  availableForCenters: {
    // List of DiagnosticCenter.place_id values that can offer this test
    type: [{ type: String, trim: true }],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('LabTest', LabTestSchema);

