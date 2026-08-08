
// * HIPAA Audit Logging Middleware
// * Captures user, action, resource, and timestamp for sensitive routes.
// */
const auditLogger = (req, res, next) => {
  // Capture the start time
  const startTime = new Date();

  // Wait for the request to finish before logging the outcome
  res.on('finish', () => {
    // 1. Identify the User (assuming you set req.user in your auth middleware)
    const userId = req.user ? req.user.id : 'Unauthenticated_User';
    const userRole = req.user ? req.user.role : 'None';

    // 2. Identify the Action & Resource
    const method = req.method; // e.g., GET, POST, DELETE
    const url = req.originalUrl; // The endpoint accessed
    const status = res.statusCode; // Success or failure

    // 3. Identify the IP Address (optional but recommended for HIPAA)
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Create the audit log entry
    const logEntry = {
      timestamp: startTime.toISOString(),
      userId,
      userRole,
      action: method,
      resource: url,
      status,
      ip
    };

    // TODO: In a production environment, save this to a secure, append-only database 
    // or a logging service (like AWS CloudWatch, Datadog, or a secure file).
    // For now, we will log it securely to the console.
    console.log('[HIPAA AUDIT LOG]', JSON.stringify(logEntry));
  });

  next();
};

module.exports = auditLogger;
