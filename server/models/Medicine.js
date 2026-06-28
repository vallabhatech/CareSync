const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Optional link to a FamilyMember document. Null means the entry belongs to
  // the primary user (i.e. "Myself").
  familyMemberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyMember',
    default: null,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  time: {
    type: String,
    required: true, // "HH:MM" e.g., "08:00"
  },
  date: {
    type: String,
    required: true, // "YYYY-MM-DD" e.g., "2026-06-08"
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Medicine', MedicineSchema);
