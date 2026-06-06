const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'Please use a valid email'],
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    // optional health-related fields
    age: {
      type: Number,
    },

    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);