// Centralized server-side limits configuration
const DEFAULT_BODY_LIMIT = process.env.BODY_LIMIT || '5mb';
const DEFAULT_BODY_LIMIT_BYTES = Number.parseInt(process.env.BODY_LIMIT_BYTES, 10) || 5 * 1024 * 1024;

module.exports = {
  DEFAULT_BODY_LIMIT,
  DEFAULT_BODY_LIMIT_BYTES,
};
