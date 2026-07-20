const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
// Ensure the encryption key is provided
let ENCRYPTION_KEY;
if (process.env.ENCRYPTION_KEY) {
  const keyBuffer = Buffer.from(process.env.ENCRYPTION_KEY, 'utf-8');
  if (keyBuffer.length === 32) {
    ENCRYPTION_KEY = keyBuffer;
  }
}

const IV_LENGTH = 16;

const encrypt = (text) => {
  if (!text || !ENCRYPTION_KEY) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return iv.toString('hex') + ':' + encrypted + ':' + authTag;
};

const decrypt = (text) => {
  if (!text || !ENCRYPTION_KEY) return text;
  try {
    const textParts = text.split(':');
    if (textParts.length !== 3) return text;
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = textParts[1];
    const authTag = Buffer.from(textParts[2], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Error decrypting secret:', err);
    return null;
  }
};

const EmergencyContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  relationship: {
    type: String,
    default: '',
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    default: '',
    trim: true,
    lowercase: true,
  },
  isPrimary: {
    type: Boolean,
    default: false,
  },
}, { _id: true });

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  publicKey: {
    type: String,
    default: null,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    default: '',
  },
  age: {
    type: String,
    default: '',
  },
  bloodGroup: {
    type: String,
    default: '',
  },
  allergies: {
    type: String,
    default: '',
  },
  avatar: {
    type: String,
    default: null, // Stores base64 data URL
  },
  role: {
    type: String,
    default: 'patient',
  },
  isTwoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: {
    type: String,
    default: null,
    get: decrypt,
    set: encrypt,
  },
  emergencyContacts: {
    type: [EmergencyContactSchema],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving to DB
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
