// Centralized HTTP limits for the frontend axios client
// Values are bytes. These defaults are conservative to reduce DoS risk from large responses.
export const DEFAULT_MAX_CONTENT_LENGTH = Number.parseInt(process.env.REACT_APP_MAX_CONTENT_LENGTH, 10) || 5 * 1024 * 1024; // 5 MB
export const DEFAULT_MAX_BODY_LENGTH = Number.parseInt(process.env.REACT_APP_MAX_BODY_LENGTH, 10) || 5 * 1024 * 1024; // 5 MB

export default {
  DEFAULT_MAX_CONTENT_LENGTH,
  DEFAULT_MAX_BODY_LENGTH,
};
