const mongoose = require('mongoose');

const LabTestBookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Optional, if users want to book for a family member
  familyMember: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyMember',
    default: null,
  },

  labTest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabTest',
    required: true,
  },

  // Partner center identification
  center: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DiagnosticCenter',
    required: true,
  },

  status: {
    type: String,
    enum: [
      'REQUESTED',
      'SCHEDULED',
      'COLLECTED',
      'TESTING',
      'RESULT_READY',
      'COMPLETED',
      'CANCELLED',
    ],
    default: 'REQUESTED',
    index: true,
  },

  requestedAt: {
    type: Date,
    default: Date.now,
  },

  scheduledCollectionAt: {
    type: Date,
    default: null,
    index: true,
  },

  collectionWindow: {
    // e.g. "09:00-11:00" (free-text for now)
    type: String,
    default: '',
    trim: true,
  },

  collectedAt: {
    type: Date,
    default: null,
  },

  // Placeholder for results delivery lifecycle
  resultStatus: {
    type: String,
    enum: ['PENDING', 'READY', 'DELIVERED'],
    default: 'PENDING',
    index: true,
  },

  resultReadyAt: {
    type: Date,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('LabTestBooking', LabTestBookingSchema);

