// Centralized HTTP limits for the frontend axios client
// Values are bytes. These defaults are conservative to reduce DoS risk from large responses.
const parseEnvLimit = (envVar, fallback) => {
  const val = process.env[envVar];
  const num = Number.parseInt(val, 10);
  return Number.isInteger(num) && num >= 0 ? num : fallback;
};

export const DEFAULT_MAX_CONTENT_LENGTH = parseEnvLimit('REACT_APP_MAX_CONTENT_LENGTH', 5 * 1024 * 1024); // 5 MB
export const DEFAULT_MAX_BODY_LENGTH = parseEnvLimit('REACT_APP_MAX_BODY_LENGTH', 5 * 1024 * 1024); // 5 MB

export default {
  DEFAULT_MAX_CONTENT_LENGTH,
  DEFAULT_MAX_BODY_LENGTH,
};
