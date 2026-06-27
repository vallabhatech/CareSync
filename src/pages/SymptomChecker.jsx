import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Chip, Stack, LinearProgress, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Alert, Box } from '@mui/material';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useFamily } from '../context/FamilyContext';
import ProfileSelector from '../components/ProfileSelector';

const STORAGE_KEY = 'caresync_symptom_history';
const MAX_HISTORY_ENTRIES = 20;
/**
 * COMMON_SYMPTOMS
 * ---------------
 * Flat list of selectable symptom names (strings) that powers the input's
 * autocomplete suggestions and validates user entries. Only values present in
 * this array can be added — the "Add Symptom" button is disabled for anything
 * not in this list.
 *
 * To add a new symptom: append its display name as a string, keeping the
 * casing consistent with existing entries (e.g. "Sore throat"), because these
 * strings are compared against the `symptoms` arrays in RISK_RULES below. Note
 * that some RISK_RULES entries currently reference symptom names not present in
 * COMMON_SYMPTOMS (e.g. "Jaundice", "Severe headache"); those can only ever
 * partially match, since users can only select symptoms from this list. New
 * rules should prefer names that exist here so they can match on their own.
 *
 * @type {string[]}
 */
const COMMON_SYMPTOMS = [
  "Fever", "Cough", "Headache", "Fatigue", "Sore throat", "Runny nose", "Shortness of breath", "Chest pain", "Nausea", "Vomiting", "Diarrhea", "Loss of taste", "Loss of smell", "Muscle pain", "Rash",
  "Sneezing", "Chills", "Night sweats", "Weight loss", "Weight gain", "Dizziness", "Fainting", "Palpitations", "Swelling", "Joint pain", "Back pain", "Abdominal pain", "Constipation", "Heartburn",
  "Bloating", "Gas", "Indigestion", "Loss of appetite", "Increased thirst", "Frequent urination", "Burning urination", "Blood in urine", "Dark urine", "Yellow skin", "Yellow eyes", "Itchy skin",
  "Dry skin", "Red eyes", "Eye discharge", "Blurred vision", "Double vision", "Hearing loss", "Ear pain", "Ringing in ears", "Nosebleed", "Sinus pain", "Toothache", "Mouth ulcers", "Sore gums",
  "Hoarseness", "Difficulty swallowing", "Neck stiffness", "Swollen glands", "Coughing blood", "Wheezing", "Chest tightness", "Irregular heartbeat", "Leg cramps", "Cold hands", "Cold feet",
  "Numbness", "Tingling", "Weakness", "Tremor", "Seizures", "Memory loss", "Confusion", "Mood swings", "Anxiety", "Depression", "Insomnia", "Sleepiness", "Snoring", "Sweating", "Hot flashes",
  "Bruising", "Bleeding", "Slow healing", "Hair loss", "Brittle nails", "Frequent infections", "Enlarged lymph nodes", "Difficulty breathing", "Difficulty speaking", "Difficulty walking",
  "Loss of balance", "Loss of coordination", "Drooping face", "Difficulty seeing", "Chest discomfort", "Rapid heartbeat", "Slow heartbeat", "Painful periods", "Irregular periods", "Vaginal discharge",
  "Erectile dysfunction", "Decreased libido", "Painful urination", "Painful intercourse", "Swollen joints", "Stiff joints", "Muscle weakness", "Muscle twitching", "Muscle cramps", "Sun sensitivity",
  "Photosensitivity", "Dry mouth", "Dry eyes", "Frequent headaches", "Migraines", "Chronic pain", "General malaise"
];
/**
 * RISK_RULES
 * ----------
 * The rule set that drives the risk assessment. Each rule maps a set of
 * symptoms to a possible condition, with metadata used for scoring and display.
 *
 * @typedef {Object} RiskRule
 * @property {string[]} symptoms   - Symptom names that characterize this
 *                                   condition. Each must exactly match an entry
 *                                   in COMMON_SYMPTOMS so users can select it.
 *                                   (Some existing rules reference names not in
 *                                   COMMON_SYMPTOMS and therefore only ever
 *                                   partially match — avoid this in new rules.)
 * @property {string}   condition  - Human-readable name of the possible condition.
 * @property {number}   probability - Base confidence (0–100) that the full
 *                                   symptom set indicates this condition. This
 *                                   is the baseline; the actual displayed value
 *                                   is re-weighted at match time (see below).
 * @property {string}   causes     - Short explanation of typical causes.
 * @property {string[]} solutions  - Recommended actions, shown as a list.
 * @property {"low"|"medium"|"high"} risk - Severity tier; controls the color
 *                                   coding and the "… Risk" label in the UI.
 *
 * How matching works (in `handleCheckSymptoms`):
 *   1. A rule is a candidate if the user's selected symptoms include at least
 *      one of the rule's `symptoms` (`.some(...)`).
 *   2. For each candidate, two ratios are computed:
 *        overlap      = matchedSymptoms / rule.symptoms.length
 *        userCoverage = matchedSymptoms / userSymptoms.length
 *   3. The displayed probability = round(((overlap + userCoverage) / 2) *
 *      rule.probability), so partial matches score lower than exact ones.
 *   4. Results are sorted by that weighted probability, highest first. If no
 *      rule matches, a generic low-risk "monitor your symptoms" result is shown.
 *
 * To add a new rule: append a RiskRule object. Ensure every string in
 * `symptoms` already exists in COMMON_SYMPTOMS (otherwise that symptom can
 * never be selected by the user, so the rule can match only partially at best),
 * set a sensible base
 * `probability`, and choose a `risk` tier of "low", "medium", or "high".
 *
 * @type {RiskRule[]}
 */
const RISK_RULES = [
  {
    symptoms: ["Fever", "Cough", "Shortness of breath"],
    condition: "COVID-19 or Respiratory Infection",
    probability: 90,
    causes: "Viral or bacterial infection affecting the respiratory tract.",
    solutions: [
      "Seek medical help immediately.",
      "Isolate yourself from others.",
      "Monitor oxygen levels if possible."
    ],
    risk: "high"
  },
  {
    symptoms: ["Chest pain", "Shortness of breath"],
    condition: "Possible Cardiac Issue",
    probability: 85,
    causes: "Heart-related problems such as angina or heart attack.",
    solutions: [
      "Seek emergency care immediately.",
      "Do not ignore chest pain."
    ],
    risk: "high"
  },
  {
    symptoms: ["Fever", "Headache", "Rash"],
    condition: "Possible Viral Infection (e.g., Dengue, Measles)",
    probability: 70,
    causes: "Viral infection, possibly transmitted by mosquitoes.",
    solutions: [
      "Consult a doctor soon.",
      "Stay hydrated.",
      "Monitor for worsening symptoms."
    ],
    risk: "medium"
  },
  {
    symptoms: ["Fever", "Cough"],
    condition: "Flu or Viral Infection",
    probability: 60,
    causes: "Influenza virus or other viral infections.",
    solutions: [
      "Rest and drink fluids.",
      "Monitor symptoms.",
      "Consult a doctor if symptoms worsen."
    ],
    risk: "low"
  },
  {
    symptoms: ["Headache", "Fatigue"],
    condition: "Migraine or Fatigue",
    probability: 50,
    causes: "Migraine: neurological condition; Fatigue: lack of sleep, stress, or medical conditions.",
    solutions: [
      "Rest in a quiet, dark room.",
      "Stay hydrated.",
      "Consult a doctor if persistent."
    ],
    risk: "low"
  },
  {
    symptoms: ["Nausea", "Vomiting", "Diarrhea"],
    condition: "Gastroenteritis (Stomach Infection)",
    probability: 75,
    causes: "Viral or bacterial infection, often from contaminated food or water.",
    solutions: [
      "Stay hydrated.",
      "Eat light, bland foods.",
      "Consult a doctor if symptoms persist or worsen."
    ],
    risk: "medium"
  },
  {
    symptoms: ["Loss of taste", "Loss of smell", "Fever"],
    condition: "Possible COVID-19",
    probability: 80,
    causes: "SARS-CoV-2 virus infection.",
    solutions: [
      "Isolate yourself.",
      "Get tested for COVID-19.",
      "Consult a healthcare provider."
    ],
    risk: "high"
  },
  {
    symptoms: ["Rash", "Fever", "Muscle pain"],
    condition: "Possible Dengue or Viral Infection",
    probability: 70,
    causes: "Dengue virus or other viral infections.",
    solutions: [
      "Avoid mosquito bites.",
      "Consult a doctor for blood tests.",
      "Monitor for bleeding or severe pain."
    ],
    risk: "medium"
  },
  {
    symptoms: ["Sore throat", "Runny nose", "Cough"],
    condition: "Common Cold",
    probability: 60,
    causes: "Viral infection (e.g., rhinovirus).",
    solutions: [
      "Rest and drink fluids.",
      "Use throat lozenges.",
      "Consult a doctor if symptoms persist."
    ],
    risk: "low"
  },
  {
    symptoms: ["Chest pain", "Shortness of breath", "Fatigue"],
    condition: "Possible Heart Issue (e.g., Angina, Heart Attack)",
    probability: 95,
    causes: "Reduced blood flow to the heart muscle, possibly due to coronary artery disease.",
    solutions: [
      "Seek emergency medical attention immediately.",
      "Do not attempt to drive yourself.",
      "Call emergency services."
    ],
    risk: "high"
  },
  {
    symptoms: ["Headache", "Nausea", "Vomiting"],
    condition: "Migraine",
    probability: 65,
    causes: "Migraine: neurological condition; Nausea and vomiting: possible side effects.",
    solutions: [
      "Rest in a quiet, dark room.",
      "Take prescribed migraine medication if available.",
      "Consult a doctor if headaches are frequent."
    ],
    risk: "medium"
  },
  {
    symptoms: ["Fatigue", "Muscle pain", "Fever"],
    condition: "Viral Fever",
    probability: 55,
    causes: "Viral infection causing systemic symptoms.",
    solutions: [
      "Rest and drink plenty of fluids.",
      "Monitor your temperature.",
      "Consult a doctor if symptoms worsen."
    ],
    risk: "low"
  },
  {
    symptoms: ["Shortness of breath", "Chest pain", "Cough"],
    condition: "Possible Pneumonia",
    probability: 85,
    causes: "Infection causing inflammation in the lungs, possibly pneumonia.",
    solutions: [
      "Seek medical attention.",
      "Monitor oxygen levels if possible.",
      "Do not ignore worsening symptoms."
    ],
    risk: "high"
  },
  {
    symptoms: ["Diarrhea", "Fatigue", "Fever"],
    condition: "Possible Food Poisoning",
    probability: 60,
    causes: "Contaminated food or water, leading to gastrointestinal infection.",
    solutions: [
      "Stay hydrated.",
      "Eat light foods.",
      "Consult a doctor if diarrhea persists more than 2 days."
    ],
    risk: "medium"
  },
  {
    symptoms: ["Sore throat", "Fever", "Headache"],
    condition: "Possible Strep Throat",
    probability: 65,
    causes: "Bacterial infection (Group A Streptococcus) of the throat.",
    solutions: [
      "Consult a doctor for a throat swab.",
      "Avoid sharing utensils.",
      "Rest and drink fluids."
    ],
    risk: "medium"
  },
  {
    symptoms: ["Fever", "Night sweats", "Weight loss", "Cough"],
    condition: "Possible Tuberculosis",
    probability: 70,
    causes: "Mycobacterium tuberculosis infection, affecting the lungs.",
    solutions: [
      "Consult a doctor for TB testing.",
      "Avoid close contact with others.",
      "Monitor for worsening symptoms."
    ],
    risk: "medium"
  },
  {
    symptoms: ["Joint pain", "Rash", "Fever"],
    condition: "Possible Chikungunya",
    probability: 65,
    causes: "Chikungunya virus, transmitted by mosquitoes.",
    solutions: [
      "Consult a doctor for blood tests.",
      "Rest and stay hydrated.",
      "Use mosquito repellents."
    ],
    risk: "medium"
  },
  {
    symptoms: ["Abdominal pain", "Nausea", "Vomiting", "Jaundice"],
    condition: "Possible Hepatitis",
    probability: 75,
    causes: "Inflammation of the liver, possibly viral (hepatitis A, B, C) or due to toxins.",
    solutions: [
      "Consult a doctor for liver function tests.",
      "Avoid alcohol.",
      "Rest and maintain hygiene."
    ],
    risk: "high"
  },
  {
    symptoms: ["Frequent urination", "Increased thirst", "Fatigue"],
    condition: "Possible Diabetes (Hyperglycemia)",
    probability: 60,
    causes: "High blood sugar levels, possibly due to diabetes mellitus.",
    solutions: [
      "Consult a doctor for blood sugar testing.",
      "Monitor your diet.",
      "Stay hydrated."
    ],
    risk: "medium"
  },
  {
    symptoms: ["Burning urination", "Lower abdominal pain", "Fever"],
    condition: "Possible Urinary Tract Infection (UTI)",
    probability: 70,
    causes: "Bacterial infection in the urinary tract.",
    solutions: [
      "Drink plenty of water.",
      "Consult a doctor for urine tests.",
      "Complete prescribed antibiotics if given."
    ],
    risk: "medium"
  },
  {
    symptoms: ["Severe headache", "Neck stiffness", "Fever", "Sensitivity to light"],
    condition: "Possible Meningitis",
    probability: 85,
    causes: "Inflammation of the protective membranes covering the brain and spinal cord, possibly viral or bacterial.",
    solutions: [
      "Seek emergency medical attention.",
      "Do not delay treatment.",
      "Avoid bright lights."
    ],
    risk: "high"
  },
  {
    symptoms: ["Sudden weakness", "Difficulty speaking", "Facial droop"],
    condition: "Possible Stroke",
    probability: 95,
    causes: "Interruption of blood supply to the brain, leading to brain cell death.",
    solutions: [
      "Call emergency services immediately.",
      "Note the time symptoms started.",
      "Do not give food or drink."
    ],
    risk: "high"
  },
  {
    symptoms: ["Itchy eyes", "Sneezing", "Runny nose"],
    condition: "Allergic Rhinitis",
    probability: 60,
    causes: "Allergic reaction to airborne allergens (e.g., pollen, dust).",
    solutions: [
      "Avoid allergens if known.",
      "Use antihistamines if prescribed.",
      "Consult a doctor if symptoms persist."
    ],
    risk: "low"
  },
  {
    symptoms: ["Red eye", "Eye discharge", "Itching"],
    condition: "Conjunctivitis (Pink Eye)",
    probability: 65,
    causes: "Infection or inflammation of the outer membrane of the eyeball and inner eyelid.",
    solutions: [
      "Avoid touching your eyes.",
      "Wash hands frequently.",
      "Consult a doctor for eye drops."
    ],
    risk: "low"
  },
  {
    symptoms: ["Back pain", "Numbness in legs", "Loss of bladder control"],
    condition: "Possible Spinal Cord Compression",
    probability: 90,
    causes: "Pressure on the spinal cord, possibly from a herniated disc or tumor.",
    solutions: [
      "Seek emergency medical attention.",
      "Do not delay treatment.",
      "Avoid heavy lifting."
    ],
    risk: "high"
  }
];

/**
 * Load symptom check history from localStorage
 * @returns {Array} Array of history entries
 */
function loadHistoryFromLocalStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error('Failed to load symptom history from localStorage:', err);
    return [];
  }
}

/**
 * Save symptom check history to localStorage
 * Automatically caps history at MAX_HISTORY_ENTRIES, keeping the most recent
 * @param {Array} historyArray - Array of history entries to save
 */
function saveHistoryToLocalStorage(historyArray) {
  try {
    const capped = historyArray.slice(0, MAX_HISTORY_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
  } catch (err) {
    console.error('Failed to save symptom history to localStorage:', err);
  }
}

/**
 * Create a history entry from symptom check results
 * @param {Array} symptoms - Selected symptoms
 * @param {Array} results - Check results
 * @returns {Object} History entry with timestamp, symptoms, and top result info
 */
function createHistoryEntry(symptoms, results) {
  const topResult = results[0] || {};
  return {
    _id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    checkedAt: new Date().toISOString(),
    symptoms,
    results: [{
      condition: topResult.condition || 'Unknown',
      probability: topResult.probability || 0,
      risk: topResult.risk || 'low',
    }],
  };
}

/**
 * SymptomChecker — select symptoms and get a rule-based risk assessment.
 *
 * Lets the user pick symptoms from a predefined list (only names present in
 * COMMON_SYMPTOMS can be added; arbitrary entries are rejected),
 * then matches the selection against a set of risk rules to surface possible
 * conditions, probabilities, causes, and suggested actions.
 *
 * Rendered as a route; takes no props and manages its own state internally.
 * (The `COMMON_SYMPTOMS` and `RISK_RULES` data structures that drive the
 * matching are documented separately — see issue #12, Task 5.)
 *
 * @component
 * @returns {JSX.Element} The symptom checker page.
 *
 * @example
 * <Route path="/symptom-checker" element={<SymptomChecker />} />
 */
export default function SymptomChecker() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { selectedMember } = useFamily();
  const [input, setInput] = useState('');
  const [symptoms, setSymptoms] = useState([]);
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory] = useState([]);
  const [showClearDialog, setShowClearDialog] = useState(false);

  useEffect(() => {
    const initializeHistory = () => {
      // Load from localStorage
      const localHistory = loadHistoryFromLocalStorage();
      setHistory(localHistory);
    };

    initializeHistory();
  }, []);

  useEffect(() => {
    const fetchBackendHistory = async () => {
      if (!isAuthenticated) return;
      try {
        const res = await API.get('/api/symptom-checks');
        // Merge backend history with localStorage history, avoiding duplicates
        const localHistory = loadHistoryFromLocalStorage();
        const backendIds = new Set(res.data.map(item => item._id));
        const mergedHistory = [
          ...res.data,
          ...localHistory.filter(item => !backendIds.has(item._id))
        ];
        // Sort by date descending (most recent first)
        mergedHistory.sort((a, b) => new Date(b.checkedAt) - new Date(a.checkedAt));
        setHistory(mergedHistory);
        // Keep localStorage in sync with merged history
        saveHistoryToLocalStorage(mergedHistory);
      } catch (err) {
        console.error('Failed to fetch symptom checker history:', err);
        // Fall back to localStorage only
        const localHistory = loadHistoryFromLocalStorage();
        setHistory(localHistory);
      }
    };
    fetchBackendHistory();
  }, [isAuthenticated]);

  const getRiskColor = (risk) => {
    if (risk === 'high') {
      return '#d32f2f';
    }

    if (risk === 'medium') {
      return '#fbc02d';
    }

    return '#43a047';
  };

  const handleClearHistoryConfirm = () => {
    setHistory([]);
    saveHistoryToLocalStorage([]);
    setShowClearDialog(false);
    // Optionally clear from backend as well, but for now just localStorage
  };

  const handleOpenClearDialog = () => {
    setShowClearDialog(true);
  };

  const handleCloseClearDialog = () => {
    setShowClearDialog(false);
  };

  // Suggest symptoms as user types
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    if (val.length > 0) {
      const filtered = COMMON_SYMPTOMS.filter(
        sym => sym.toLowerCase().startsWith(val.toLowerCase()) && !symptoms.includes(sym)
      );
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  // Add symptom from input or suggestion
  const handleAddSymptom = (symptom) => {
    const sym = symptom || input.trim();
    if (
      sym &&
      COMMON_SYMPTOMS.includes(sym) &&
      !symptoms.includes(sym)
    ) {
      setSymptoms([...symptoms, sym]);
    }
    setInput('');
    setSuggestions([]);
  };

  // Remove a symptom
  const handleRemoveSymptom = (symptom) => {
    setSymptoms(symptoms.filter(s => s !== symptom));
    setResults([]);
  };

  // Improved: Calculate a more accurate probability based on symptom overlap
  const handleCheckSymptoms = async () => {
    if (symptoms.length === 0) {
      setResults([]);
      return;
    }
    // Find all matching rules, sorted by best match
    const matches = RISK_RULES
      .filter(rule => rule.symptoms.some(s => symptoms.includes(s)))
      .map(rule => {
        // Calculate overlap: number of matched symptoms / total symptoms in rule
        const matchCount = rule.symptoms.filter(s => symptoms.includes(s)).length;
        const overlap = matchCount / rule.symptoms.length;
        // Calculate user coverage: number of matched symptoms / total user symptoms
        const userCoverage = matchCount / symptoms.length;
        // Weighted probability: average of overlap and userCoverage, times rule probability
        const weightedProb = Math.round(((overlap + userCoverage) / 2) * rule.probability);
        return { ...rule, probability: weightedProb, matchPercent: overlap };
      })
      .sort((a, b) => b.probability - a.probability);

    let finalResults = [];
    if (matches.length > 0) {
      finalResults = matches;
    } else {
      finalResults = [{
        condition: "No specific conditions matched. Monitor your symptoms.",
        probability: 20,
        causes: "Symptoms are non-specific or mild.",
        solutions: [
          "Monitor your symptoms",
          "Rest and stay hydrated",
          "Consult a doctor if symptoms worsen or persist"
        ],
        risk: "low"
      }];
    }

    setResults(finalResults);

    // Create and save history entry to localStorage using functional update
    const historyEntry = createHistoryEntry(symptoms, finalResults);
    setHistory((prev) => {
      const updated = [historyEntry, ...prev];
      saveHistoryToLocalStorage(updated);
      return updated;
    });

    // Save to backend if authenticated
    if (isAuthenticated) {
      try {
        const res = await API.post('/api/symptom-checks', {
          symptoms,
          results: finalResults.map(r => ({
            condition: r.condition,
            probability: r.probability,
            causes: r.causes,
            solutions: r.solutions,
            risk: r.risk,
          })),
          ...(selectedMember ? { familyMemberId: selectedMember._id } : {}),
        });
        // Replace the temporary local entry with backend response using latest state
        const backendEntry = res.data;
        setHistory((prev) => {
          const withoutLocal = prev.filter(item => item._id !== historyEntry._id);
          const newHist = [backendEntry, ...withoutLocal];
          saveHistoryToLocalStorage(newHist);
          return newHist;
        });
      } catch (err) {
        console.error('Failed to save symptom check to backend:', err);
        // History is already saved to localStorage, so continue gracefully
      }
    }
  };

  const profileLabel = selectedMember ? selectedMember.name : 'Myself';

  return (
    <div className="symptom-bg">
      <div className="symptom-container">
        <h2 className="symptom-title">{t('symptom:title')}</h2>
        {isAuthenticated && (
          <div className="symptom-profile-row">
            <ProfileSelector size="small" label="Checking for" />
            <span className="symptom-profile-label">
              Checking symptoms for: <strong>{profileLabel}</strong>
            </span>
          </div>
        )}
        <p className="symptom-desc">{t('symptom:description')}</p>
        <div className="symptom-form-row">
          <input
            className="symptom-input"
            placeholder={t('symptom:inputPlaceholder')}
            value={input}
            onChange={handleInputChange}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAddSymptom();
            }}
            autoComplete="off"
          />
          <Button
            variant="contained"
            onClick={() => handleAddSymptom()}
            disabled={!input.trim() || !COMMON_SYMPTOMS.includes(input.trim()) || symptoms.includes(input.trim())}
            sx={{ minWidth: 110, fontWeight: 700, color: '#fff !important', background: 'linear-gradient(90deg,#1976d2 60%,#43e97b 100%)' }}          >
            {t('symptom:addSymptom')}
          </Button>
        </div>
        {suggestions.length > 0 && (
          <div className="symptom-suggestions">
            {suggestions.map((sym) => (
              <Chip
                key={sym}
                label={sym}
                onClick={() => handleAddSymptom(sym)}
                color="primary"
                variant="outlined"
                sx={{ cursor: 'pointer', mr: 1, mb: 1 }}
              />
            ))}
          </div>
        )}
        <div className="symptom-your-list">
          <span className="symptom-your-label">{t('symptom:yourSymptoms')}</span>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 2 }}>
            {symptoms.map((sym) => (
              <Chip
                key={sym}
                label={sym}
                onDelete={() => handleRemoveSymptom(sym)}
                color="secondary"
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
        </div>
        <Button
          variant="outlined"
          onClick={handleCheckSymptoms}
          disabled={symptoms.length === 0}
          sx={{marginLeft: '250px',minWidth: 110, fontWeight: 700, color: '#fff !important', background: 'linear-gradient(90deg,#1976d2 60%,#43e97b 100%)' }}          >
          {t('symptom:check')}
        </Button>
        {results.length > 0 && (
          <div className="symptom-results">

           <h3 className="symptom-results-title">{t('symptom:assessmentResults')}</h3>

           <Box sx={{ width: '100%', mb: 3 }}>
             <Alert 
                severity="warning" 
                sx={{ 
                   borderRadius: '12px',
                   fontWeight: 500,
                   boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                   '& .MuiAlert-message': { width: '100%' }
                }}
             >
               This tool is for informational purposes only and does not constitute medical advice. 
               Please consult a qualified healthcare provider for diagnosis and treatment.
             </Alert>
           </Box>
            {results.map((res) => (
              <div
                key={`${res.condition}-${res.risk}`}
                className={`symptom-result-card symptom-result-${res.risk}`}
              >
                <div className="symptom-result-header">
                  <span className="symptom-result-condition">{res.condition}</span>
                  <span className="symptom-result-prob">
                    <LinearProgress
                      variant="determinate"
                      value={res.probability}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        width: 140,
                        mr: 1,
                        background: "#eee",
                        '& .MuiLinearProgress-bar': {
                          background: getRiskColor(res.risk)
                        }
                      }}
                    />
                    <span className="symptom-result-prob-text">{res.probability}%</span>
                  </span>
                </div>
                <div className="symptom-result-risk-label" style={{
                  color: getRiskColor(res.risk),
                  fontWeight: 700,
                  marginBottom: 6
                }}>
                  {t('symptom:riskLabel', { level: res.risk.charAt(0).toUpperCase() + res.risk.slice(1) })}
                </div>
                {res.causes && (
                  <div className="symptom-result-causes">
                    <b>{t('symptom:possibleCauses')}</b> {res.causes}
                  </div>
                )}
                {res.solutions && res.solutions.length > 0 && (
                  <div className="symptom-result-solutions">
                    <b>{t('symptom:possibleSolutions')}</b>
                    <ul>
                      {res.solutions.map((act) => (
                        <li key={`${res.condition}-${act}`}>{act}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {history.length > 0 && (
          <div className="symptom-history-section">
            <h3 className="symptom-history-title">Assessment History</h3>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleOpenClearDialog}
              sx={{ mb: 2, fontWeight: 600 }}
            >
              Clear History
            </Button>
            <div className="symptom-history-list">
              {history.map((record) => (
                <div key={record._id} className="symptom-history-item">
                  <div className="symptom-history-item-header">
                    <span className="symptom-history-date">
                      {new Date(record.checkedAt).toLocaleDateString()} at {new Date(record.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`symptom-history-badge risk-${record.results?.[0]?.risk}`}>
                      {record.results?.[0]?.condition || 'Unknown'} ({record.results?.[0]?.probability}%)
                    </span>
                  </div>
                  <div className="symptom-history-symptoms">
                    <strong>Symptoms:</strong> {record.symptoms.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Dialog
          open={showClearDialog}
          onClose={handleCloseClearDialog}
        >
          <DialogTitle>Clear Assessment History</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to clear all assessment history? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseClearDialog} color="primary">
              Cancel
            </Button>
            <Button onClick={handleClearHistoryConfirm} color="error" variant="contained">
              Clear History
            </Button>
          </DialogActions>
        </Dialog>
      </div>
      <style>{`
        .symptom-bg {
          min-height: 100vh;
          background: linear-gradient(135deg, #f4f8fb 0%, #e3f2fd 100%);
          color: #222;
          padding: 40px 0;
        }
        .symptom-container {
          max-width: 650px;
          margin: 0 auto;
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 4px 32px 0 rgba(25, 118, 210, 0.08);
          padding: 36px 22px 28px 22px;
        }
        .symptom-title {
          color: #1976d2;
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 10px;
          text-align: center;
        }
        .symptom-desc {
          color: #555;
          font-size: 1.08rem;
          margin-bottom: 18px;
          text-align: center;
        }
        .symptom-form-row {
          display: flex;
          gap: 12px;
          margin-bottom: 18px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .symptom-input {
          background: #f4f8fb;
          color: #222;
          border: 1px solid #b0bec5;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 1rem;
          min-width: 180px;
        }
        .symptom-suggestions {
          margin-bottom: 12px;
          display: flex;
          flex-wrap: wrap;
        }
        .symptom-your-list {
          margin-bottom: 8px;
        }
        .symptom-your-label {
          font-weight: 600;
          color: #1976d2;
          margin-right: 8px;
        }
        .symptom-results {
          margin-top: 32px;
        }
        .symptom-results-title {
          color: #1976d2;
          font-size: 1.15rem;
          margin-bottom: 10px;
        }
        .symptom-result-card {
          background: #f4f8fb;
          border-radius: 14px;
          box-shadow: 0 2px 12px #1976d222;
          padding: 18px 16px 12px 16px;
          margin-bottom: 18px;
          border-left: 6px solid #43e97b;
        }
        .symptom-result-high {
          border-left: 6px solid #d32f2f;
          background: #ffebee;
        }
        .symptom-result-medium {
          border-left: 6px solid #fbc02d;
          background: #fffde7;
        }
        .symptom-result-low {
          border-left: 6px solid #43e97b;
          background: #e3fcec;
        }
        .symptom-result-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .symptom-result-condition {
          font-weight: 700;
          font-size: 1.1rem;
          color: #1976d2;
        }
        .symptom-result-prob {
          display: flex;
          align-items: center;
        }
        .symptom-result-prob-text {
          font-weight: 700;
          margin-left: 8px;
          color: #222;
        }
        .symptom-result-risk-label {
          font-size: 1.05rem;
        }
        .symptom-result-causes {
          color: #444;
          margin-bottom: 6px;
        }
        .symptom-result-solutions ul {
          margin: 0;
          padding-left: 18px;
        }
        .symptom-result-solutions li {
          font-size: 1rem;
          color: #333;
        }
        .symptom-history-section {
          margin-top: 40px;
          border-top: 1.5px dashed #b0bec5;
          padding-top: 24px;
        }
        .symptom-history-title {
          color: #1976d2;
          font-size: 1.25rem;
          margin-bottom: 14px;
          font-weight: 700;
        }
        .symptom-history-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 300px;
          overflow-y: auto;
          padding-right: 4px;
        }
        .symptom-history-item {
          background: #f8fafd;
          border: 1px solid #e1e8ed;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 0.95rem;
          transition: background 0.2s;
        }
        .symptom-history-item:hover {
          background: #f0f4f8;
        }
        .symptom-history-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          flex-wrap: wrap;
          gap: 8px;
        }
        .symptom-history-date {
          color: #666;
          font-weight: 600;
          font-size: 0.85rem;
        }
        .symptom-history-badge {
          padding: 3px 10px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 0.85rem;
          color: #fff;
        }
        .symptom-history-badge.risk-high {
          background-color: #d32f2f;
        }
        .symptom-history-badge.risk-medium {
          background-color: #fbc02d;
          color: #222;
        }
        .symptom-history-badge.risk-low {
          background-color: #43a047;
        }
        .symptom-history-symptoms {
          color: #555;
          font-size: 0.9rem;
        }
        @media (max-width: 700px) {
          .symptom-container { padding: 16px 4px; }
          .symptom-form-row { gap: 6px; }
          .symptom-input { min-width: 100px; }
          .symptom-profile-row { flex-direction: column; align-items: flex-start; }
        }
        .symptom-profile-row {
          display: flex;
          align-items: center;
          gap: 14px;
          background: linear-gradient(90deg, #e3f2fd 0%, #f0fff4 100%);
          border-radius: 12px;
          padding: 10px 16px;
          margin-bottom: 18px;
          border: 1px solid #b3d9f7;
          flex-wrap: wrap;
        }
        .symptom-profile-label {
          font-size: 0.92rem;
          color: #555;
        }
        .symptom-profile-label strong {
          color: #1976d2;
        }
      `}</style>
    </div>
  );
}
