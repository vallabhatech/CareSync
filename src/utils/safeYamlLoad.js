/**
 * safeYamlLoad — safe wrapper around js-yaml that prevents Prototype
 * Pollution via the YAML merge-key (<<) operator.
 *
 * ─── Why the merge key is dangerous ────────────────────────────────────────
 * The YAML merge-key operator (<<) copies properties from an anchor into the
 * current mapping. In js-yaml < 4.x the merge handler iterated the anchor's
 * keys and performed direct bracket assignment:
 *
 *   for (const key of Object.keys(source)) {
 *     if (!hasOwn(target, key)) target[key] = source[key];   // ← vulnerable
 *   }
 *
 * When `key === '__proto__'`, the expression `target['__proto__'] = value`
 * invokes the __proto__ accessor setter on Object.prototype. That setter
 * modifies the receiver's prototype chain instead of creating an own
 * property, silently polluting Object.prototype for every object in the
 * process. A crafted YAML payload:
 *
 *   malicious: &base
 *     __proto__:
 *       isAdmin: true
 *   target:
 *     <<: *base           # merge copies __proto__ → Object.prototype polluted
 *
 * would cause `({}).isAdmin === true` for the entire lifetime of the process.
 *
 * ─── Mitigation ─────────────────────────────────────────────────────────────
 * 1. yaml.JSON_SCHEMA — The YAML 1.2 JSON schema recognises only JSON-
 *    compatible types (null, bool, int, float, string). It does not define
 *    the !!merge tag, so the << operator is treated as a literal string key
 *    and no merging occurs at all. This is the primary defence.
 *
 * 2. sanitizeConfig — A second-layer sanitize pass (see sanitize.js) strips
 *    any surviving __proto__ / constructor / prototype keys using
 *    Object.defineProperty, which bypasses the __proto__ setter entirely.
 *
 * ─── Usage ──────────────────────────────────────────────────────────────────
 *   import { safeYamlLoad } from './safeYamlLoad';
 *   const config = safeYamlLoad(rawYamlString);
 *
 * NOTE: js-yaml must be a *direct* dependency (not only a transitive one via
 * eslint) before importing this module in production code:
 *
 *   npm install js-yaml
 */

import yaml from 'js-yaml';
import { sanitizeConfig } from './sanitize';

/**
 * Safely parses a YAML string, neutralising the merge-key prototype
 * pollution vector.
 *
 * @param {string} str - Raw YAML string.
 * @returns {unknown} Parsed and sanitized JavaScript value.
 * @throws {yaml.YAMLException} If `str` is not valid YAML.
 */
export function safeYamlLoad(str) {
  // Primary defence: JSON_SCHEMA disables the !!merge tag, so the <<
  // operator is never processed as a merge instruction.
  const parsed = yaml.load(str, { schema: yaml.JSON_SCHEMA });

  // Second-layer defence: strip any __proto__ / constructor / prototype
  // keys that might surface if a schema extension or future library
  // change re-enables merge processing.
  return sanitizeConfig(parsed);
}
