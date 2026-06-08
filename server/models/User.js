const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
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
    const salt = await bcrypt.genSalt(10);
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
