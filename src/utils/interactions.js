// Simple drug interaction dataset and checker for demo purposes.
// Matches medicine names case-insensitively and by substring.

const INTERACTIONS = [
  {
    drugs: ['warfarin', 'ibuprofen'],
    severity: 'high',
    description:
      'Concurrent use of NSAIDs like ibuprofen with warfarin increases bleeding risk. Consult a clinician or pharmacist before combining.',
  },
  {
    drugs: ['aspirin', 'warfarin'],
    severity: 'high',
    description:
      'Aspirin can potentiate anticoagulant effects of warfarin and increase bleeding risk.',
  },
  {
    drugs: ['lisinopril', 'spironolactone'],
    severity: 'moderate',
    description:
      'Combination can increase potassium levels; monitor electrolytes and kidney function.',
  },
  {
    drugs: ['acetaminophen', 'alcohol'],
    severity: 'moderate',
    description:
      'Chronic alcohol use with acetaminophen increases risk of liver toxicity.',
  },
  {
    drugs: ['metformin', 'contrast'],
    severity: 'low',
    description:
      'Iodinated contrast can affect kidney function; check guidance for metformin around imaging procedures.',
  },
];

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
