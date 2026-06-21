const mongoose = require('mongoose');
const { EVENT_TYPE_VALUES, SEVERITY, SEVERITY_VALUES } = require('../utils/securityEvents');

const SecurityLogSchema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: EVENT_TYPE_VALUES,
    required: true,
  },
  severity: {
    type: String,
    enum: SEVERITY_VALUES,
    default: SEVERITY.INFO,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // null for pre-authentication events (e.g. a failed login)
  },
  email: {
    type: String,
    default: null, // attempted/affected email, captured even when no user matches
    trim: true,
    lowercase: true,
  },
  ip: {
    type: String,
    default: null,
  },
  userAgent: {
    type: String,
    default: '',
  },
  method: {
    type: String,
    default: '',
  },
  path: {
    type: String,
    default: '',
  },
  statusCode: {
    type: Number,
    default: null,
  },
  message: {
    type: String,
    default: '',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Newest-first listing
SecurityLogSchema.index({ createdAt: -1 });
// Filter by event type over time
SecurityLogSchema.index({ eventType: 1, createdAt: -1 });
// Severity dashboards and alert queries
SecurityLogSchema.index({ severity: 1, createdAt: -1 });
// Per-IP brute-force / suspicious-pattern detection
SecurityLogSchema.index({ ip: 1, eventType: 1, createdAt: -1 });
// Admin log filtering by email or ip with newest-first sorting
SecurityLogSchema.index({ email: 1, createdAt: -1 });
SecurityLogSchema.index({ ip: 1, createdAt: -1 });

module.exports = mongoose.model('SecurityLog', SecurityLogSchema);
