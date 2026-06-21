const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logSecurityEvent } = require('../utils/securityLogger');
const { EVENT_TYPES, SEVERITY } = require('../utils/securityEvents');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      await logSecurityEvent({
        eventType: EVENT_TYPES.AUTH_TOKEN_REJECTED,
        severity: SEVERITY.WARNING,
        req,
        statusCode: 401,
        message: 'Missing or malformed Authorization header',
        metadata: { reason: 'no_token' },
      });
      return res.status(401).json({ message: 'No authorization token, access denied' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not configured in the environment variables');
      return res.status(500).json({ message: 'Internal server configuration error' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, jwtSecret);
    
    if (decoded.isTemp) {
      await logSecurityEvent({
        eventType: EVENT_TYPES.AUTH_TOKEN_REJECTED,
        severity: SEVERITY.WARNING,
        req,
        statusCode: 401,
        message: 'Temporary tokens cannot be used to access protected routes',
        metadata: { reason: 'temp_token' },
      });
      return res.status(401).json({ message: 'Temporary tokens cannot be used to access protected routes' });
    }
    
    const user = await User.findOne({ _id: { $eq: decoded.id } }).select('-password');
    if (!user) {
      await logSecurityEvent({
        eventType: EVENT_TYPES.AUTH_TOKEN_REJECTED,
        severity: SEVERITY.WARNING,
        req,
        statusCode: 401,
        message: 'Valid token but user no longer exists',
        metadata: { reason: 'user_not_found', tokenUserId: decoded?.id },
      });
      return res.status(401).json({ message: 'User not found, authorization failed' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error.message);
    await logSecurityEvent({
      eventType: EVENT_TYPES.AUTH_TOKEN_REJECTED,
      severity: SEVERITY.WARNING,
      req,
      statusCode: 401,
      message: 'Token verification failed',
      metadata: { reason: 'invalid_or_expired', error: error.message },
    });
    res.status(401).json({ message: 'Token is invalid or expired, authorization failed' });
  }
};

module.exports = authMiddleware;
