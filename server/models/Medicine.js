const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
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

MedicineSchema.index({ user: 1, date: 1 });
MedicineSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Medicine', MedicineSchema);
