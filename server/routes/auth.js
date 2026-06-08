const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const generateToken = (userId) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured in the environment variables');
  }
  return jwt.sign(
    { id: userId },
    jwtSecret,
    { expiresIn: '30d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: { $eq: email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create user
    const newUser = new User({
      name,
      email,
      password,
    });

    await newUser.save();

    // Generate JWT token
    const token = generateToken(newUser._id);

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        age: newUser.age,
        bloodGroup: newUser.bloodGroup,
        allergies: newUser.allergies,
        avatar: newUser.avatar,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    // Check user
    const user = await User.findOne({ email: { $eq: email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        bloodGroup: user.bloodGroup,
        allergies: user.allergies,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      age: req.user.age,
      bloodGroup: req.user.bloodGroup,
      allergies: req.user.allergies,
      avatar: req.user.avatar,
      role: req.user.role,
    };
    res.json({ user });
  } catch (err) {
    console.error('Fetch profile error:', err.message);
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile details
// @access  Private
router.put('/profile', authMiddleware, async (req, res) => {
  const name = req.body.name === undefined ? undefined : String(req.body.name).trim();
  const email = req.body.email === undefined ? undefined : String(req.body.email).trim().toLowerCase();
  const phone = req.body.phone === undefined ? undefined : String(req.body.phone).trim();
  const age = req.body.age === undefined ? undefined : String(req.body.age).trim();
  const bloodGroup = req.body.bloodGroup === undefined ? undefined : String(req.body.bloodGroup).trim();
  const allergies = req.body.allergies === undefined ? undefined : String(req.body.allergies).trim();
  const avatar = req.body.avatar === undefined ? undefined : (req.body.avatar ? String(req.body.avatar) : null);

  try {
    const user = await User.findOne({ _id: { $eq: req.user._id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if updating email to one already in use
    if (email !== undefined && email !== user.email) {
      if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        return res.status(400).json({ message: 'Invalid email address' });
      }
      const emailExists = await User.findOne({ email: { $eq: email } });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (age !== undefined) user.age = age;
    if (bloodGroup !== undefined) user.bloodGroup = bloodGroup;
    if (allergies !== undefined) user.allergies = allergies;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        bloodGroup: user.bloodGroup,
        allergies: user.allergies,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ message: 'Server error updating user profile' });
  }
});

module.exports = router;
