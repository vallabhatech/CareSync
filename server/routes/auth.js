const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
// Apply stricter limiter for auth endpoints (e.g., register, login)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 auth requests per window
  message: 'Too many authentication attempts, please try again later.',
});
router.use(authLimiter);
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const { logSecurityEvent, detectSuspiciousLogin } = require('../utils/securityLogger');
const { EVENT_TYPES, SEVERITY } = require('../utils/securityEvents');

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
      await logSecurityEvent({
        eventType: EVENT_TYPES.AUTH_REGISTER_FAILURE,
        severity: SEVERITY.WARNING,
        req,
        email: email || null,
        statusCode: 400,
        message: 'Registration rejected: missing fields',
        metadata: { reason: 'missing_fields' },
      });
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    const { isValidEmail } = require('../utils/validation');
    if (!isValidEmail(email)) {
      await logSecurityEvent({
        eventType: EVENT_TYPES.AUTH_REGISTER_FAILURE,
        severity: SEVERITY.WARNING,
        req,
        email,
        statusCode: 400,
        message: 'Registration rejected: invalid email format',
        metadata: { reason: 'invalid_email_format' },
      });
      return res.status(400).json({ message: 'Invalid email address' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: { $eq: email } });
    if (existingUser) {
      await logSecurityEvent({
        eventType: EVENT_TYPES.AUTH_REGISTER_FAILURE,
        severity: SEVERITY.WARNING,
        req,
        email,
        statusCode: 400,
        message: 'Registration rejected: email already in use',
        metadata: { reason: 'duplicate_email' },
      });
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

    logSecurityEvent({
      eventType: EVENT_TYPES.AUTH_REGISTER_SUCCESS,
      severity: SEVERITY.INFO,
      req,
      user: newUser,
      email: newUser.email,
      statusCode: 201,
      message: 'New user registered',
    });

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
    await logSecurityEvent({
      eventType: EVENT_TYPES.AUTH_REGISTER_FAILURE,
      severity: SEVERITY.WARNING,
      req,
      email: email || null,
      statusCode: 500,
      message: 'Registration failed: server error',
      metadata: { reason: 'server_error', error: err.message },
    });
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
      await logSecurityEvent({
        eventType: EVENT_TYPES.AUTH_LOGIN_FAILURE,
        severity: SEVERITY.WARNING,
        req,
        email: email || null,
        statusCode: 400,
        message: 'Login rejected: missing fields',
        metadata: { reason: 'missing_fields' },
      });
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    const { isValidEmail } = require('../utils/validation');
    if (!isValidEmail(email)) {
      await logSecurityEvent({
        eventType: EVENT_TYPES.AUTH_LOGIN_FAILURE,
        severity: SEVERITY.WARNING,
        req,
        email,
        statusCode: 400,
        message: 'Login rejected: invalid email format',
        metadata: { reason: 'invalid_email_format' },
      });
      return res.status(400).json({ message: 'Invalid email address' });
    }

    // Check user
    const user = await User.findOne({ email: { $eq: email } });
    if (!user) {
      await logSecurityEvent({
        eventType: EVENT_TYPES.AUTH_LOGIN_FAILURE,
        severity: SEVERITY.WARNING,
        req,
        email,
        statusCode: 400,
        message: 'Login failed: no account for email',
        metadata: { reason: 'user_not_found' },
      });
      await detectSuspiciousLogin({ req, email });
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await logSecurityEvent({
        eventType: EVENT_TYPES.AUTH_LOGIN_FAILURE,
        severity: SEVERITY.WARNING,
        req,
        user,
        email,
        statusCode: 400,
        message: 'Login failed: incorrect password',
        metadata: { reason: 'invalid_password' },
      });
      await detectSuspiciousLogin({ req, email });
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    if (user.isTwoFactorEnabled) {
      const jwtSecret = process.env.JWT_SECRET;
      const tempToken = jwt.sign(
        { id: user._id, isTemp: true },
        jwtSecret,
        { expiresIn: '5m' }
      );
      return res.json({
        requires2FA: true,
        tempToken,
        message: '2FA required to complete login'
      });
    }

    logSecurityEvent({
      eventType: EVENT_TYPES.AUTH_LOGIN_SUCCESS,
      severity: SEVERITY.INFO,
      req,
      user,
      email: user.email,
      statusCode: 200,
      message: 'User logged in',
    });

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
    await logSecurityEvent({
      eventType: EVENT_TYPES.AUTH_LOGIN_FAILURE,
      severity: SEVERITY.WARNING,
      req,
      email: email || null,
      statusCode: 500,
      message: 'Login failed: server error',
      metadata: { reason: 'server_error', error: err.message },
    });
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

const validateAndGetEmailUpdate = async (email, currentUser) => {
  const { isValidEmail } = require('../utils/validation');
  if (!isValidEmail(email)) {
    throw new Error('Invalid email address');
  }
  const emailExists = await User.findOne({ email: { $eq: email } });
  if (emailExists) {
    throw new Error('Email already in use');
  }
  return email;
};

// @route   PUT /api/auth/profile
// @desc    Update user profile details
// @access  Private
router.put('/profile', authMiddleware, async (req, res) => {
  const emailInput = req.body.email === undefined ? undefined : String(req.body.email).trim().toLowerCase();

  try {
    const user = await User.findOne({ _id: { $eq: req.user._id } });
    if (!user) {
      await logSecurityEvent({
        eventType: EVENT_TYPES.AUTH_PROFILE_UPDATE_FAILURE,
        severity: SEVERITY.WARNING,
        req,
        user: req.user,
        email: req.user?.email || null,
        statusCode: 404,
        message: 'Profile update failed: user not found',
        metadata: { reason: 'user_not_found' },
      });
      return res.status(404).json({ message: 'User not found' });
    }

    // Snapshot original values so we can record only fields that genuinely change.
    const trackedFields = ['name', 'email', 'phone', 'age', 'bloodGroup', 'allergies', 'avatar'];
    const originalValues = {};
    trackedFields.forEach((field) => { originalValues[field] = user[field]; });

    const emailChanged = emailInput !== undefined && emailInput !== user.email;

    // Check if updating email to one already in use
    if (emailChanged) {
      user.email = await validateAndGetEmailUpdate(emailInput, user);
    }

    // Update simple fields
    ['phone', 'age', 'bloodGroup', 'allergies'].forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = String(req.body[field]).trim();
      }
    });

    if (req.body.name !== undefined) {
      const cleanName = String(req.body.name).trim();
      if (cleanName) {
        user.name = cleanName;
      }
    }

    if (req.body.avatar !== undefined) {
      user.avatar = req.body.avatar ? String(req.body.avatar) : null;
    }

    await user.save();

    const updatedFields = trackedFields.filter((field) => user[field] !== originalValues[field]);

    logSecurityEvent({
      eventType: EVENT_TYPES.AUTH_PROFILE_UPDATED,
      severity: SEVERITY.INFO,
      req,
      user,
      email: user.email,
      statusCode: 200,
      message: 'User profile updated',
      metadata: { updatedFields, emailChanged },
    });

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
    const isValidationError = err.message === 'Invalid email address' || err.message === 'Email already in use';
    await logSecurityEvent({
      eventType: EVENT_TYPES.AUTH_PROFILE_UPDATE_FAILURE,
      severity: SEVERITY.WARNING,
      req,
      user: req.user,
      email: req.user?.email || null,
      statusCode: isValidationError ? 400 : 500,
      message: 'Profile update failed',
      metadata: { reason: isValidationError ? 'validation_error' : 'server_error', error: err.message },
    });
    res.status(isValidationError ? 400 : 500).json({ message: err.message || 'Server error updating user profile' });
  }
});

// @route   POST /api/auth/login/verify-2fa
// @desc    Verify 2FA token to complete login
// @access  Public
router.post('/login/verify-2fa', async (req, res) => {
  const { tempToken, code } = req.body;

  if (!tempToken || !code) {
    return res.status(400).json({ message: 'Missing token or 2FA code' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    const decoded = jwt.verify(tempToken, jwtSecret);

    if (!decoded.isTemp) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isTwoFactorEnabled) {
      return res.status(400).json({ message: '2FA is not enabled for this user' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid 2FA code' });
    }

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
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid or expired temporary token' });
    }
    console.error('2FA Verification error:', err.message);
    res.status(500).json({ message: 'Server error during 2FA verification' });
  }
});

// @route   POST /api/auth/2fa/setup
// @desc    Generate a 2FA secret and QR code for the user
// @access  Private
router.post('/2fa/setup', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.isTwoFactorEnabled) {
      return res.status(400).json({ message: '2FA is already enabled' });
    }

    const secret = speakeasy.generateSecret({
      name: `CareSync (${user.email})`
    });

    user.twoFactorSecret = secret.base32;
    await user.save();

    qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
      if (err) {
        console.error('QR code generation error:', err);
        return res.status(500).json({ message: 'Failed to generate QR code' });
      }
      res.json({
        secret: secret.base32,
        qrCode: data_url
      });
    });
  } catch (err) {
    console.error('2FA setup error:', err.message);
    res.status(500).json({ message: 'Server error during 2FA setup' });
  }
});

// @route   POST /api/auth/2fa/verify-setup
// @desc    Verify the first code to enable 2FA
// @access  Private
router.post('/2fa/verify-setup', authMiddleware, async (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ message: 'Code is required' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.isTwoFactorEnabled) {
      return res.status(400).json({ message: '2FA is already enabled' });
    }

    if (!user.twoFactorSecret) {
      return res.status(400).json({ message: '2FA setup was not initiated' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1
    });

    if (verified) {
      user.isTwoFactorEnabled = true;
      await user.save();
      res.json({ message: '2FA enabled successfully' });
    } else {
      res.status(400).json({ message: 'Invalid code' });
    }
  } catch (err) {
    console.error('2FA verify-setup error:', err.message);
    res.status(500).json({ message: 'Server error during 2FA verification' });
  }
});

// @route   POST /api/auth/2fa/disable
// @desc    Disable 2FA
// @access  Private
router.post('/2fa/disable', authMiddleware, async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ message: 'Password is required to disable 2FA' });
  }
  
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    user.isTwoFactorEnabled = false;
    user.twoFactorSecret = null;
    await user.save();

    res.json({ message: '2FA disabled successfully' });
  } catch (err) {
    console.error('2FA disable error:', err.message);
    res.status(500).json({ message: 'Server error during 2FA disable' });
  }
});

module.exports = router;
