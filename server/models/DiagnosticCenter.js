const mongoose = require('mongoose');

const DiagnosticCenterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    default: '',
    trim: true,
  },
  lat: {
    type: String,
    required: true,
    trim: true,
  },
  lon: {
    type: String,
    required: true,
    trim: true,
  },
  place_id: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  partnerCode: {
    // Optional identifier coming from partner systems
    type: String,
    default: '',
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

DiagnosticCenterSchema.index({ place_id: 1 }, { unique: false });

module.exports = mongoose.model('DiagnosticCenter', DiagnosticCenterSchema);

