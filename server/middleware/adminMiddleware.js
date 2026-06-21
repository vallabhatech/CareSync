const { logSecurityEvent } = require('../utils/securityLogger');
const { EVENT_TYPES, SEVERITY } = require('../utils/securityEvents');

// Must run AFTER authMiddleware (which sets req.user).
// An admin is any user whose `role` is 'admin'.
const adminMiddleware = async (req, res, next) => {
  if (req.user?.role === 'admin') {
    return next();
  }

  // Log unauthorized attempts to reach admin-only surfaces.
  await logSecurityEvent({
    eventType: EVENT_TYPES.ADMIN_ACCESS_DENIED,
    severity: SEVERITY.WARNING,
    req,
    user: req.user || null,
    email: req.user?.email || null,
    statusCode: 403,
    message: 'Non-admin attempted to access an admin-only endpoint',
    metadata: { role: req.user?.role || null },
  });

  return res.status(403).json({ message: 'Access denied: admin privileges required' });
};

module.exports = adminMiddleware;
