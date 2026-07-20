const mongoose = require('mongoose');
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
// Ensure the encryption key is provided and exactly 32 bytes long.
if (!process.env.ENCRYPTION_KEY) {
  throw new Error('FATAL: ENCRYPTION_KEY environment variable is required');
}
const keyBuffer = Buffer.from(process.env.ENCRYPTION_KEY, 'utf-8');
if (keyBuffer.length !== 32) {
  throw new Error('FATAL: ENCRYPTION_KEY must be exactly 32 bytes long');
}
const ENCRYPTION_KEY = keyBuffer;

const IV_LENGTH = 16;

function encryptText(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return iv.toString('hex') + ':' + encrypted + ':' + authTag;
}

function decryptText(text) {
  if (!text) return text;
  try {
    const textParts = text.split(':');
    if (textParts.length !== 3) {
      // Backwards compatibility with aes-256-cbc if needed
      if (textParts.length === 2) return text; // Needs CBC logic or just return unencrypted
      return text;
    }
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = textParts[1];
    const authTag = Buffer.from(textParts[2], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Error decrypting message:', err);
    return 'Error: Could not decrypt message';
  }
}

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
    get: decryptText,
    set: encryptText
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
