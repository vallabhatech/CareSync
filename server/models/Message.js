const mongoose = require('mongoose');
const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
// Ensure the encryption key is exactly 32 bytes long.
// If process.env.ENCRYPTION_KEY is not set or not 32 chars, we fallback for safety in this feature phase.
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY 
  ? crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32) 
  : crypto.scryptSync('caresync-default-secure-key-2024', 'salt', 32); 

const IV_LENGTH = 16;

function encryptText(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decryptText(text) {
  if (!text) return text;
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) return text; // Probably unencrypted
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = Buffer.from(textParts[1], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
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
