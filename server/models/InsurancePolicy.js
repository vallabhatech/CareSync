const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');
const CoveredMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  relationship: {
    type: String,
    required: true,
    trim: true,
  },
}, { _id: false });

const InsurancePolicySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  policyNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  planId: {
    type: String,
    required: true,
    trim: true,
  },
  planName: {
    type: String,
    required: true,
    trim: true,
  },
  provider: {
    type: String,
    required: true,
    trim: true,
  },
  premium: {
    type: Number,
    required: true,
  },
  deductible: {
    type: Number,
    required: true,
  },
  copay: {
    type: Number,
    required: true,
  },
  coverageType: {
    type: String,
    required: true,
    trim: true,
  },
  networkType: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'cancelled'],
    default: 'active',
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  endDate: {
    type: Date,
    required: true,
  },
  primaryInsured: {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    dob: {
      type: String,
      required: true,
      trim: true,
    },
    ssnLastFour: {
      type: String,
      required: true,
      trim: true,
    },
    zipCode: {
      type: String,
      trim: true,
    },
  },
  coveredMembers: {
    type: [CoveredMemberSchema],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('InsurancePolicy', InsurancePolicySchema);
