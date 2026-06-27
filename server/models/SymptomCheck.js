const mongoose = require('mongoose');

const SymptomCheckSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Optional link to a FamilyMember document. Null means the check belongs to
  // the primary user (i.e. "Myself").
  familyMemberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyMember',
    default: null,
  },
  symptoms: [{
    type: String,
    required: true,
  }],
  results: [{
    condition: {
      type: String,
      required: true,
    },
    probability: {
      type: Number,
      required: true,
    },
    causes: {
      type: String,
      default: '',
    },
    solutions: [{
      type: String,
    }],
    risk: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
    },
  }],
  checkedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('SymptomCheck', SymptomCheckSchema);
