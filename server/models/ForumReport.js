const mongoose = require('mongoose');

const ForumReportSchema = new mongoose.Schema({
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    // Could refer to either ForumTopic or ForumPost
  },
  targetType: {
    type: String,
    enum: ['Topic', 'Post'],
    required: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'resolved'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

ForumReportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('ForumReport', ForumReportSchema);
