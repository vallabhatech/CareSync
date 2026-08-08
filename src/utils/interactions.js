// Simple drug interaction dataset and checker for demo purposes.
// Matches medicine names case-insensitively and by substring.

import INTERACTIONS from './interactionsData.json';

function normalize(name) {
  return String(name || '').toLowerCase().trim();
}

export function checkInteractions(medicines) {
  const names = (medicines || []).map((m) => normalize(m.name));
  const found = [];

  for (const rule of INTERACTIONS) {
    const ruleLower = rule.drugs.map((d) => d.toLowerCase());
    const matches = ruleLower.filter((d) => names.some((n) => n.includes(d)));
    if (matches.length >= 2) {
      // determine which meds matched for clearer message
      const matchedNames = names.filter((n) => ruleLower.some((r) => n.includes(r)));
      found.push({
        drugs: rule.drugs,
        matchedNames: Array.from(new Set(matchedNames)),
        severity: rule.severity,
        description: rule.description,
      });
    }
  }

  return found;
}

const interactions = { checkInteractions };

export default interactions;
