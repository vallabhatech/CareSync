const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const MessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    get: decrypt,
    set: encrypt
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { toJSON: { getters: true }, toObject: { getters: true } });

module.exports = mongoose.model('Message', MessageSchema);
