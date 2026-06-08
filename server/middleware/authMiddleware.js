const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No authorization token, access denied' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not configured in the environment variables');
      return res.status(500).json({ message: 'Internal server configuration error' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, jwtSecret);
    
    const user = await User.findOne({ _id: { $eq: decoded.id } }).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found, authorization failed' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error.message);
    res.status(401).json({ message: 'Token is invalid or expired, authorization failed' });
  }
};

module.exports = authMiddleware;
