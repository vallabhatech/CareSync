const winston = require('winston');
const path = require('path');
const fs = require('fs');
const SecurityLog = require('../models/SecurityLog');
const { EVENT_TYPES, SEVERITY } = require('../utils/securityEvents');

// ---------------------------------------------------------------------------
// winston logger (real-time visibility)
//
// The Console transport is always enabled (it surfaces in the hosting
// platform's logs). The File transport is OPT-IN via SECURITY_LOG_TO_FILE=true
// so it never breaks read-only / serverless filesystems (e.g. Vercel). When
// enabled it writes to SECURITY_LOG_DIR (default: server/logs).
// ---------------------------------------------------------------------------

const severityToWinstonLevel = {
  [SEVERITY.INFO]: 'info',
  [SEVERITY.WARNING]: 'warn',
  [SEVERITY.CRITICAL]: 'error',
};

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ level, message, timestamp, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} [SECURITY_AUDIT:${level}] ${message}${metaStr}`;
      })
    ),
  }),
];

if (process.env.SECURITY_LOG_TO_FILE === 'true') {
  try {
    const logDir = process.env.SECURITY_LOG_DIR || path.join(__dirname, '..', 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'security.log'),
        format: winston.format.json(),
      })
    );
  } catch (err) {
    // Never let file-logging setup crash the server (e.g. a read-only FS).
    console.error('Security file logging disabled (could not create log dir):', err.message);
  }
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.timestamp(),
  transports,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getClientIp = (req) => {
  if (!req) return null;
  return req.ip || req.socket?.remoteAddress || null;
};

// Accept an env value only if it is a positive integer (>= 1); else fall back.
const positiveIntFromEnv = (raw, fallback) => {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : fallback;
};

// Race a DB operation against a timeout so a slow/hung MongoDB can never block
// the request path. On timeout the operation keeps running in the background
// (its own .catch swallows late errors) and we proceed with `onTimeoutValue`.
const withTimeout = (promise, ms, onTimeoutValue) => {
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(onTimeoutValue), ms);
  });
  return Promise.race([
    Promise.resolve(promise).then((v) => { clearTimeout(timer); return v; }),
    timeout,
  ]);
};

const FAILED_LOGIN_THRESHOLD = positiveIntFromEnv(process.env.SECURITY_FAILED_LOGIN_THRESHOLD, 5);
const FAILED_LOGIN_WINDOW_MIN = positiveIntFromEnv(process.env.SECURITY_FAILED_LOGIN_WINDOW_MIN, 15);
const DB_OP_TIMEOUT_MS = positiveIntFromEnv(process.env.SECURITY_DB_TIMEOUT_MS, 3000);

/**
 * Persist + emit a single security event.
 *
 * This function never throws: a logging failure must never break the request
 * it is observing. It always resolves, so callers may `await` it or not.
 *
 * @param {Object}  opts
 * @param {string}  opts.eventType  one of EVENT_TYPES
 * @param {string} [opts.severity]  one of SEVERITY (default: info)
 * @param {Object} [opts.req]       Express request (for ip/userAgent/method/path)
 * @param {Object} [opts.user]      Mongoose user doc or id (optional)
 * @param {string} [opts.email]     attempted/affected email (optional)
 * @param {number} [opts.statusCode] HTTP status associated with the event
 * @param {string} [opts.message]   human-readable summary
 * @param {Object} [opts.metadata]  extra structured context
 */
const logSecurityEvent = async ({
  eventType,
  severity = SEVERITY.INFO,
  req = null,
  user = null,
  email = null,
  statusCode = null,
  message = '',
  metadata = {},
} = {}) => {
  const ip = getClientIp(req);
  const userAgent = req?.get?.('user-agent') || '';
  const method = req?.method || '';
  const reqPath = req?.originalUrl || req?.path || '';
  const userId = user?._id || user || null;

  // Real-time console (and optional file) line
  try {
    const level = severityToWinstonLevel[severity] || 'info';
    logger.log(level, `${eventType} ${message}`.trim(), {
      eventType,
      severity,
      ip,
      userAgent,
      method,
      path: reqPath,
      email: email || undefined,
      userId: userId ? String(userId) : undefined,
      statusCode: statusCode || undefined,
      ...metadata,
    });
  } catch (err) {
    console.error('Security console logging failed:', err.message);
  }

  // Durable persistence (bounded so a slow DB can't stall the request path)
  try {
    const createPromise = SecurityLog.create({
      eventType,
      severity,
      user: userId,
      email: email || null,
      ip,
      userAgent,
      method,
      path: reqPath,
      statusCode,
      message,
      metadata,
    }).catch((err) => {
      console.error('Security event persistence failed:', err.message);
    });
    await withTimeout(createPromise, DB_OP_TIMEOUT_MS, undefined);
  } catch (err) {
    console.error('Security event persistence error:', err.message);
  }
};

/**
 * After a failed login, check whether this IP has crossed the failed-login
 * threshold within the rolling window. If so (and the IP has not already been
 * flagged in this window), emit a CRITICAL SUSPICIOUS_LOGIN_PATTERN event.
 *
 * Must be called AFTER the AUTH_LOGIN_FAILURE event has been persisted so the
 * current attempt is included in the count. Never throws.
 *
 * @returns {Promise<boolean>} true if the IP is currently over the threshold
 */
const detectSuspiciousLogin = async ({ req = null, email = null } = {}) => {
  const ip = getClientIp(req);
  if (!ip) return false;

  try {
    const windowStart = new Date(Date.now() - FAILED_LOGIN_WINDOW_MIN * 60 * 1000);

    const failedCount = await withTimeout(
      SecurityLog.countDocuments({
        eventType: EVENT_TYPES.AUTH_LOGIN_FAILURE,
        ip,
        createdAt: { $gte: windowStart },
      }).catch(() => null),
      DB_OP_TIMEOUT_MS,
      null
    );

    // DB slow/unavailable — skip detection rather than block the response.
    if (failedCount === null) return false;
    if (failedCount < FAILED_LOGIN_THRESHOLD) return false;

    // De-dupe: only alert once per window per IP.
    const alreadyFlagged = await withTimeout(
      SecurityLog.exists({
        eventType: EVENT_TYPES.SUSPICIOUS_LOGIN_PATTERN,
        ip,
        createdAt: { $gte: windowStart },
      }).catch(() => null),
      DB_OP_TIMEOUT_MS,
      null
    );
    if (alreadyFlagged) return true;

    await logSecurityEvent({
      eventType: EVENT_TYPES.SUSPICIOUS_LOGIN_PATTERN,
      severity: SEVERITY.CRITICAL,
      req,
      email,
      message: `Possible brute-force: ${failedCount} failed logins from ${ip} in ${FAILED_LOGIN_WINDOW_MIN} min`,
      metadata: {
        failedCount,
        windowMinutes: FAILED_LOGIN_WINDOW_MIN,
        threshold: FAILED_LOGIN_THRESHOLD,
      },
    });
    return true;
  } catch (err) {
    console.error('Suspicious-login detection failed:', err.message);
    return false;
  }
};

module.exports = {
  logSecurityEvent,
  detectSuspiciousLogin,
  getClientIp,
  FAILED_LOGIN_THRESHOLD,
  FAILED_LOGIN_WINDOW_MIN,
};
