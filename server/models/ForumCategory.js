const mongoose = require('mongoose');

const ForumCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true,
  },
  icon: {
    type: String, // could be an icon name or URL
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('ForumCategory', ForumCategorySchema);
