import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Chip, Stack, Paper, LinearProgress } from '@mui/material';

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

export default function SymptomChecker() {
  const [input, setInput] = useState('');
  const [symptoms, setSymptoms] = useState([]);
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

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
  const handleCheckSymptoms = () => {
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

    if (matches.length > 0) {
      setResults(matches);
    } else {
      setResults([{
        condition: "No specific conditions matched. Monitor your symptoms.",
        probability: 20,
        causes: "Symptoms are non-specific or mild.",
        solutions: [
          "Monitor your symptoms",
          "Rest and stay hydrated",
          "Consult a doctor if symptoms worsen or persist"
        ],
        risk: "low"
      }]);
    }
  };

  return (
    <div className="symptom-bg">
      <div className="symptom-container">
        <h2 className="symptom-title">🤖 Symptom Checker</h2>
        <p className="symptom-desc">Start typing a symptom and select from suggestions:</p>
        <div className="symptom-form-row">
          <input
            className="symptom-input"
            placeholder="Enter symptom (e.g. Fever)"
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
            sx={{ minWidth: 110, fontWeight: 700, background: 'linear-gradient(90deg,#1976d2 60%,#43e97b 100%)' }}
          >
            Add Symptom
          </Button>
        </div>
        {suggestions.length > 0 && (
          <div className="symptom-suggestions">
            {suggestions.map((sym, idx) => (
              <Chip
                key={idx}
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
          <span className="symptom-your-label">Your Symptoms:</span>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 2 }}>
            {symptoms.map((sym, idx) => (
              <Chip
                key={idx}
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
          sx={{ mt: 1, fontWeight: 700, borderColor: '#1976d2', color: '#1976d2' }}
        >
          Check
        </Button>
        {results.length > 0 && (
          <div className="symptom-results">
            <h3 className="symptom-results-title">Assessment Results:</h3>
            {results.map((res, idx) => (
              <div
                key={idx}
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
                          background: res.risk === "high" ? "#d32f2f" : res.risk === "medium" ? "#fbc02d" : "#43a047"
                        }
                      }}
                    />
                    <span className="symptom-result-prob-text">{res.probability}%</span>
                  </span>
                </div>
                <div className="symptom-result-risk-label" style={{
                  color: res.risk === "high" ? "#d32f2f" : res.risk === "medium" ? "#fbc02d" : "#43a047",
                  fontWeight: 700,
                  marginBottom: 6
                }}>
                  {res.risk.charAt(0).toUpperCase() + res.risk.slice(1)} Risk
                </div>
                {res.causes && (
                  <div className="symptom-result-causes">
                    <b>Possible Causes:</b> {res.causes}
                  </div>
                )}
                {res.solutions && res.solutions.length > 0 && (
                  <div className="symptom-result-solutions">
                    <b>Possible Solutions:</b>
                    <ul>
                      {res.solutions.map((act, i) => (
                        <li key={i}>{act}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
        @media (max-width: 700px) {
          .symptom-container { padding: 16px 4px; }
          .symptom-form-row { gap: 6px; }
          .symptom-input { min-width: 100px; }
        }
      `}</style>
    </div>
  );
}