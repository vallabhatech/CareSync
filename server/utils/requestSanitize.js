// Middleware to deep-sanitize request bodies on the server side.
// Removes prototype pollution keys like __proto__, constructor, and prototype.
//
// Why Object.defineProperty instead of bracket assignment:
//   JavaScript's bracket notation `obj[key] = value` calls the [[Set]]
//   internal method, which invokes the __proto__ accessor setter on
//   Object.prototype when key === '__proto__'. That setter modifies the
//   receiver's prototype chain rather than creating an own property,
//   enabling Prototype Pollution (the same mechanism exploited by
//   js-yaml's YAML merge-key (<<) operator in versions < 4.x).
//
//   Object.defineProperty uses the [[DefineOwnProperty]] internal method
//   instead. It creates a genuine own enumerable property named '__proto__'
//   *without* invoking the setter, so Object.prototype is never mutated
//   even if the dangerous-key filter above were somehow bypassed.
//   This is defense-in-depth: the filter is the first line, defineProperty
//   is the second.

function sanitizeObject(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);

  const out = {};
  // Object.keys returns only own enumerable string-keyed properties,
  // which matches the set returned by Object.entries but avoids
  // destructuring that could behave unexpectedly on exotic objects.
  for (const k of Object.keys(obj)) {
    const key = String(k);
    const keyLower = key.trim().toLowerCase();
    if (keyLower === '__proto__' || keyLower === 'constructor' || keyLower === 'prototype') {
      // Drop dangerous keys — first line of defence.
      continue;
    }
    // Use Object.defineProperty (second line of defence) to assign the
    // sanitized value. Unlike `out[key] = v`, defineProperty bypasses the
    // __proto__ setter and cannot mutate Object.prototype under any
    // circumstance, including future changes to the key filter above.
    Object.defineProperty(out, key, {
      value: sanitizeObject(obj[k]),
      writable: true,
      enumerable: true,
      configurable: true,
    });
  }
  return out;
}

function sanitizeBody(req, res, next) {
  try {
    if (typeof req.body === 'object' && req.body !== null) {
      req.body = sanitizeObject(req.body); // req.body is an object, so we sanitize it.
    }
  } catch (e) {
    // If anything goes wrong, don't block legitimate requests — log and continue
    console.warn('Request sanitization failed:', e && e.message);
  }
  next();
}

module.exports = { sanitizeBody };
