// Shared, dependency-free constants for the security event logging subsystem.
// Imported by the SecurityLog model, the security logger, the admin middleware,
// the auth routes, and the security routes so event names never drift apart.

const EVENT_TYPES = Object.freeze({
  AUTH_REGISTER_SUCCESS: 'AUTH_REGISTER_SUCCESS',
  AUTH_REGISTER_FAILURE: 'AUTH_REGISTER_FAILURE',
  AUTH_LOGIN_SUCCESS: 'AUTH_LOGIN_SUCCESS',
  AUTH_LOGIN_FAILURE: 'AUTH_LOGIN_FAILURE',
  AUTH_TOKEN_REJECTED: 'AUTH_TOKEN_REJECTED',
  AUTH_PROFILE_UPDATED: 'AUTH_PROFILE_UPDATED',
  AUTH_PROFILE_UPDATE_FAILURE: 'AUTH_PROFILE_UPDATE_FAILURE',
  ADMIN_ACCESS_DENIED: 'ADMIN_ACCESS_DENIED',
  SUSPICIOUS_LOGIN_PATTERN: 'SUSPICIOUS_LOGIN_PATTERN',
});

const SEVERITY = Object.freeze({
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
});

const EVENT_TYPE_VALUES = Object.values(EVENT_TYPES);
const SEVERITY_VALUES = Object.values(SEVERITY);

module.exports = { EVENT_TYPES, SEVERITY, EVENT_TYPE_VALUES, SEVERITY_VALUES };
