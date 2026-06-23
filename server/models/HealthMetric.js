const mongoose = require('mongoose');

const HealthMetricSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  weight: {
    type: Number, // in kg
    default: null,
  },
  systolic: {
    type: Number, // Systolic blood pressure
    default: null,
  },
  diastolic: {
    type: Number, // Diastolic blood pressure
    default: null,
  },
  heartRate: {
    type: Number, // beats per minute
    default: null,
  },
  temperature: {
    type: Number, // in Celsius
    default: null,
  },
  bloodSugar: {
    type: Number, // mg/dL
    default: null,
  },
  oxygenSaturation: {
    type: Number, // SpO2 percentage
    default: null,
  },
  notes: {
    type: String,
    default: '',
  },
  recordedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries by user and date
HealthMetricSchema.index({ user: 1, recordedAt: -1 });

module.exports = mongoose.model('HealthMetric', HealthMetricSchema);
