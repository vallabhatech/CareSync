const mongoose = require('mongoose');

// A family member whose health profile is tracked by an owning user.
// Mirrors the per-user resource pattern used by HealthMetric: every document
// is scoped to the owning `user`, and queries always filter by that field so
// one user can never read or mutate another user's family data.
const FamilyMemberSchema = new mongoose.Schema({
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
  relationship: {
    type: String, // e.g. Spouse, Child, Parent, Sibling
    default: '',
    trim: true,
  },
  dateOfBirth: {
    type: Date,
    default: null,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', ''],
    default: '',
  },
  bloodGroup: {
    type: String, // e.g. A+, O-, AB+
    default: '',
    trim: true,
  },
  allergies: {
    type: String, // free-text list of known allergies
    default: '',
    trim: true,
  },
  conditions: {
    type: String, // free-text list of chronic conditions
    default: '',
    trim: true,
  },
  notes: {
    type: String,
    default: '',
    trim: true,
  },
  // Optional link to a registered CareSync user account (e.g. an adult
  // family member who also has their own login). Null for dependents.
  linkedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Efficient lookup of all members belonging to a user, newest first.
FamilyMemberSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('FamilyMember', FamilyMemberSchema);
