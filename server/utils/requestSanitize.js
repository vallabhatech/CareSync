// Middleware to deep-sanitize request bodies on the server side.
// Removes prototype pollution keys like __proto__, constructor, and prototype.

function sanitizeObject(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);

  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = String(k);
    const keyLower = key.trim().toLowerCase();
    if (keyLower === '__proto__' || keyLower === 'constructor' || keyLower === 'prototype') {
      // drop it
      continue;
    }
    out[key] = sanitizeObject(v);
  }
  return out;
}

function sanitizeBody(req, res, next) {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
  } catch (e) {
    // If anything goes wrong, don't block legitimate requests — log and continue
    console.warn('Request sanitization failed:', e && e.message);
  }
  next();
}

module.exports = { sanitizeBody };
