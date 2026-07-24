const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const WearableConnectionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  provider: {
    type: String,
    enum: ['google-fit', 'apple-health', 'fitbit'],
    required: true,
  },
  accessToken: {
    type: String,
    required: true,
    get: decrypt,
    set: encrypt,
  },
  refreshToken: {
    type: String,
    get: decrypt,
    set: encrypt,
  },
  expiresAt: {
    type: Date,
  },
  lastSyncAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure a user can only have one connection per provider
WearableConnectionSchema.index({ user: 1, provider: 1 }, { unique: true });

// Ensure getters run when transforming to JSON
WearableConnectionSchema.set('toJSON', { getters: true });
WearableConnectionSchema.set('toObject', { getters: true });

module.exports = mongoose.model('WearableConnection', WearableConnectionSchema);
