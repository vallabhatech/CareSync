// Small, safe validators used by server routes. Avoids complex regexes that
// could be abused for ReDoS. Performs length checks and simple character
// whitelist checks instead.

function isAscii(str) {
  return /^[\x00-\x7F]*$/.test(str);
}

/**
 * Lightweight, ReDoS-resistant email validation.
 * Limits lengths per RFC recommendations and uses simple checks instead of
 * a single giant regex.
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 254) return false; // RFC max

  const at = email.indexOf('@');
  if (at <= 0 || at === email.length - 1) return false;

  const local = email.slice(0, at);
  const domain = email.slice(at + 1);

  if (local.length > 64 || local.length === 0) return false;
  if (domain.length > 255 || domain.length === 0) return false;

  // Basic allowed characters for local and domain parts (conservative)
  const localOk = /^[A-Za-z0-9._%+-]+$/.test(local);
  if (!localOk) return false;
  const domainOk = /^[A-Za-z0-9.-]+$/.test(domain);
  if (!domainOk) return false;

  // Domain must contain at least one dot and labels must be <=63
  if (!domain.includes('.')) return false;
  const labels = domain.split('.');
  for (const label of labels) {
    if (label.length === 0 || label.length > 63) return false;
    if (!/^[A-Za-z0-9-]+$/.test(label)) return false;
  }

  // Reject non-ASCII to avoid weird encodings
  if (!isAscii(email)) return false;

  return true;
}

module.exports = {
  isValidEmail,
};
