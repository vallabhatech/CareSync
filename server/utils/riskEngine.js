/**
 * riskEngine.js
 * Pure function risk scoring engine.
 * Takes user profile, latest health metrics, lifestyle inputs, and family history
 * and returns an array of risk factors + an overall risk score (0-100).
 */

/**
 * Evaluate blood pressure risk from latest metric.
 */
function assessBloodPressure(metric) {
  if (!metric || !metric.systolic || !metric.diastolic) return null;
  const { systolic: s, diastolic: d } = metric;

  if (s >= 180 || d >= 120) {
    return {
      category: 'Blood Pressure',
      level: 'critical',
      score: 30,
      detail: `Hypertensive crisis: ${s}/${d} mmHg. Immediate medical attention required.`,
      recommendation: 'Seek emergency care immediately. Avoid physical exertion and salt.',
    };
  }
  if (s >= 140 || d >= 90) {
    return {
      category: 'Blood Pressure',
      level: 'high',
      score: 20,
      detail: `Stage 2 hypertension: ${s}/${d} mmHg.`,
      recommendation: 'Consult your doctor. Reduce sodium intake, exercise regularly, and monitor daily.',
    };
  }
  if (s >= 130 || d >= 80) {
    return {
      category: 'Blood Pressure',
      level: 'moderate',
      score: 12,
      detail: `Stage 1 hypertension: ${s}/${d} mmHg.`,
      recommendation: 'Adopt a low-sodium DASH diet, increase physical activity, and track BP weekly.',
    };
  }
  if (s >= 120 && d < 80) {
    return {
      category: 'Blood Pressure',
      level: 'moderate',
      score: 6,
      detail: `Elevated blood pressure: ${s}/${d} mmHg.`,
      recommendation: 'Monitor regularly. Reduce caffeine and stress. Aim for 150 min/week exercise.',
    };
  }
  return {
    category: 'Blood Pressure',
    level: 'low',
    score: 0,
    detail: `Normal: ${s}/${d} mmHg.`,
    recommendation: 'Maintain current lifestyle with regular monitoring.',
  };
}

/**
 * Evaluate blood sugar risk.
 */
function assessBloodSugar(metric) {
  if (!metric || !metric.bloodSugar) return null;
  const bg = metric.bloodSugar;

  if (bg >= 200) {
    return {
      category: 'Blood Sugar',
      level: 'critical',
      score: 28,
      detail: `Critically high blood sugar: ${bg} mg/dL. Possible diabetes.`,
      recommendation: 'Consult your doctor immediately for diabetes diagnosis and management.',
    };
  }
  if (bg >= 126) {
    return {
      category: 'Blood Sugar',
      level: 'high',
      score: 18,
      detail: `Diabetic range fasting glucose: ${bg} mg/dL.`,
      recommendation: 'Seek medical evaluation. Limit refined carbs, increase fibre, and exercise daily.',
    };
  }
  if (bg >= 100) {
    return {
      category: 'Blood Sugar',
      level: 'moderate',
      score: 10,
      detail: `Pre-diabetic range: ${bg} mg/dL.`,
      recommendation: 'Reduce sugar intake, increase activity, and retest in 3 months.',
    };
  }
  return {
    category: 'Blood Sugar',
    level: 'low',
    score: 0,
    detail: `Normal blood sugar: ${bg} mg/dL.`,
    recommendation: 'Maintain a balanced diet and active lifestyle.',
  };
}

/**
 * Evaluate heart rate risk.
 */
function assessHeartRate(metric) {
  if (!metric || !metric.heartRate) return null;
  const hr = metric.heartRate;

  if (hr > 120 || hr < 40) {
    return {
      category: 'Heart Rate',
      level: 'critical',
      score: 25,
      detail: `Abnormal heart rate: ${hr} bpm.`,
      recommendation: 'Seek immediate medical evaluation for arrhythmia.',
    };
  }
  if (hr > 100 || hr < 50) {
    return {
      category: 'Heart Rate',
      level: 'high',
      score: 15,
      detail: `Irregular heart rate: ${hr} bpm.`,
      recommendation: 'Consult a cardiologist. Reduce caffeine and manage stress.',
    };
  }
  if (hr > 90) {
    return {
      category: 'Heart Rate',
      level: 'moderate',
      score: 7,
      detail: `Slightly elevated resting heart rate: ${hr} bpm.`,
      recommendation: 'Increase aerobic exercise and practice relaxation techniques.',
    };
  }
  return {
    category: 'Heart Rate',
    level: 'low',
    score: 0,
    detail: `Normal heart rate: ${hr} bpm.`,
    recommendation: 'Keep up your current activity level.',
  };
}

/**
 * Evaluate oxygen saturation risk.
 */
function assessOxygenSaturation(metric) {
  if (!metric || !metric.oxygenSaturation) return null;
  const o2 = metric.oxygenSaturation;

  if (o2 < 90) {
    return {
      category: 'Oxygen Saturation',
      level: 'critical',
      score: 30,
      detail: `Critically low SpO₂: ${o2}%. Severe hypoxemia.`,
      recommendation: 'Seek emergency medical care immediately.',
    };
  }
  if (o2 < 94) {
    return {
      category: 'Oxygen Saturation',
      level: 'high',
      score: 18,
      detail: `Low SpO₂: ${o2}%.`,
      recommendation: 'Consult a doctor. Avoid high altitude and monitor breathing.',
    };
  }
  if (o2 < 96) {
    return {
      category: 'Oxygen Saturation',
      level: 'moderate',
      score: 8,
      detail: `Slightly below optimal SpO₂: ${o2}%.`,
      recommendation: 'Practice deep breathing exercises and follow up with your doctor.',
    };
  }
  return {
    category: 'Oxygen Saturation',
    level: 'low',
    score: 0,
    detail: `Normal SpO₂: ${o2}%.`,
    recommendation: 'Maintain good respiratory health.',
  };
}

/**
 * Evaluate BMI/weight risk.
 */
function assessWeight(metric, age) {
  if (!metric || !metric.weight) return null;
  // Without height we use weight as a proxy indicator only
  const w = metric.weight;
  const ageNum = parseInt(age);

  let level = 'low', score = 0, detail = '', recommendation = '';

  if (w > 120) {
    level = 'high'; score = 14;
    detail = `Weight ${w} kg — significant obesity risk.`;
    recommendation = 'Consult a nutritionist. Aim for gradual weight loss through diet and exercise.';
  } else if (w > 100) {
    level = 'moderate'; score = 8;
    detail = `Weight ${w} kg — elevated weight risk.`;
    recommendation = 'Adopt a calorie-controlled diet and 150+ min/week of moderate exercise.';
  } else {
    level = 'low'; score = 0;
    detail = `Weight ${w} kg — within typical range.`;
    recommendation = 'Maintain balanced nutrition and regular exercise.';
  }

  if (!isNaN(ageNum) && ageNum > 60 && level === 'low') {
    score += 4;
    detail += ' Age over 60 increases general health vigilance.';
  }

  return { category: 'Weight / BMI', level, score, detail, recommendation };
}

/**
 * Evaluate lifestyle risk factors.
 */
function assessLifestyle(lifestyle) {
  const factors = [];
  let score = 0;

  // Smoking
  if (lifestyle.smokingStatus === 'current') {
    score += 20;
    factors.push({
      category: 'Smoking',
      level: 'high',
      score: 20,
      detail: 'Current smoker. Significantly increases risk of cancer, COPD, and heart disease.',
      recommendation: 'Seek smoking cessation support. Consider NRT or counselling.',
    });
  } else if (lifestyle.smokingStatus === 'former') {
    score += 8;
    factors.push({
      category: 'Smoking',
      level: 'moderate',
      score: 8,
      detail: 'Former smoker. Residual risk remains.',
      recommendation: 'Continue smoke-free. Monitor lung health annually.',
    });
  }

  // Alcohol
  if (lifestyle.alcoholUse === 'heavy') {
    score += 16;
    factors.push({
      category: 'Alcohol Use',
      level: 'high',
      score: 16,
      detail: 'Heavy alcohol use significantly increases liver, cardiovascular, and cancer risk.',
      recommendation: 'Seek professional support to reduce alcohol consumption.',
    });
  } else if (lifestyle.alcoholUse === 'regular') {
    score += 8;
    factors.push({
      category: 'Alcohol Use',
      level: 'moderate',
      score: 8,
      detail: 'Regular alcohol use raises long-term health risks.',
      recommendation: 'Limit to no more than 1 drink/day (women) or 2 drinks/day (men).',
    });
  }

  // Exercise
  if (lifestyle.exerciseFrequency === 'none') {
    score += 14;
    factors.push({
      category: 'Physical Activity',
      level: 'high',
      score: 14,
      detail: 'Sedentary lifestyle increases risk of obesity, diabetes, and heart disease.',
      recommendation: 'Start with 30 min brisk walking 5 days/week. Gradually increase intensity.',
    });
  } else if (lifestyle.exerciseFrequency === '1-2') {
    score += 6;
    factors.push({
      category: 'Physical Activity',
      level: 'moderate',
      score: 6,
      detail: 'Below recommended activity level.',
      recommendation: 'Aim for 150 min/week of moderate-intensity aerobic exercise.',
    });
  }

  // Diet
  if (lifestyle.dietQuality === 'poor') {
    score += 12;
    factors.push({
      category: 'Diet',
      level: 'high',
      score: 12,
      detail: 'Poor diet quality linked to obesity, diabetes, and cardiovascular disease.',
      recommendation: 'Increase fruits, vegetables, and whole grains. Reduce processed foods and sugar.',
    });
  } else if (lifestyle.dietQuality === 'average') {
    score += 5;
    factors.push({
      category: 'Diet',
      level: 'moderate',
      score: 5,
      detail: 'Average diet — room for improvement.',
      recommendation: 'Add more vegetables and fibre. Reduce saturated fat and sodium.',
    });
  }

  // Sleep
  const sleep = parseFloat(lifestyle.sleepHours);
  if (!isNaN(sleep) && (sleep < 6 || sleep > 10)) {
    score += 8;
    factors.push({
      category: 'Sleep',
      level: 'moderate',
      score: 8,
      detail: `Sleep duration ${sleep}h — outside healthy range (7-9h).`,
      recommendation: 'Establish a consistent sleep schedule. Avoid screens 1h before bed.',
    });
  }

  // Stress
  if (lifestyle.stressLevel === 'very-high') {
    score += 12;
    factors.push({
      category: 'Stress',
      level: 'high',
      score: 12,
      detail: 'Very high stress significantly increases cardiovascular and mental health risk.',
      recommendation: 'Practice mindfulness, yoga, or therapy. Set work-life boundaries.',
    });
  } else if (lifestyle.stressLevel === 'high') {
    score += 6;
    factors.push({
      category: 'Stress',
      level: 'moderate',
      score: 6,
      detail: 'High stress level elevates health risks.',
      recommendation: 'Incorporate regular relaxation — meditation, exercise, or hobbies.',
    });
  }

  return { factors, score };
}

/**
 * Evaluate family history risk.
 */
function assessFamilyHistory(familyHistory) {
  const factors = [];
  let score = 0;

  const conditions = [
    { key: 'heartDisease', label: 'Heart Disease', points: 10 },
    { key: 'diabetes', label: 'Diabetes', points: 8 },
    { key: 'hypertension', label: 'Hypertension', points: 8 },
    { key: 'cancer', label: 'Cancer', points: 8 },
    { key: 'stroke', label: 'Stroke', points: 8 },
    { key: 'mentalHealth', label: 'Mental Health Conditions', points: 5 },
  ];

  const present = conditions.filter(c => familyHistory[c.key]);
  if (present.length === 0) return { factors, score };

  const total = present.reduce((sum, c) => sum + c.points, 0);
  score += Math.min(total, 25); // cap family history contribution

  const labels = present.map(c => c.label).join(', ');
  factors.push({
    category: 'Family History',
    level: present.length >= 3 ? 'high' : present.length >= 2 ? 'moderate' : 'moderate',
    score: Math.min(total, 25),
    detail: `Family history of: ${labels}.`,
    recommendation: 'Inform your doctor of family history. Schedule regular preventive screenings.',
  });

  return { factors, score };
}

/**
 * Main risk assessment function.
 * @param {Object} user         - User document
 * @param {Object|null} metric  - Latest HealthMetric document
 * @param {Object} lifestyle    - Lifestyle input object
 * @param {Object} familyHistory- Family history flags
 * @returns {{ riskFactors, score, overallRisk }}
 */
function computeRiskAssessment(user, metric, lifestyle, familyHistory) {
  const riskFactors = [];
  let totalScore = 0;

  const vitalChecks = [
    assessBloodPressure(metric),
    assessBloodSugar(metric),
    assessHeartRate(metric),
    assessOxygenSaturation(metric),
    assessWeight(metric, user.age),
  ];

  vitalChecks.forEach(f => {
    if (f) {
      totalScore += f.score;
      const { score: _s, ...rest } = f;
      riskFactors.push(rest);
    }
  });

  const { factors: lsFactors, score: lsScore } = assessLifestyle(lifestyle);
  lsFactors.forEach(f => {
    const { score: _s, ...rest } = f;
    riskFactors.push(rest);
  });
  totalScore += lsScore;

  const { factors: fhFactors, score: fhScore } = assessFamilyHistory(familyHistory);
  fhFactors.forEach(f => {
    const { score: _s, ...rest } = f;
    riskFactors.push(rest);
  });
  totalScore += fhScore;

  // Age adjustment
  const age = parseInt(user.age);
  if (!isNaN(age)) {
    if (age >= 65) totalScore += 10;
    else if (age >= 50) totalScore += 6;
    else if (age >= 40) totalScore += 3;
  }

  const score = Math.min(totalScore, 100);

  let overallRisk;
  if (score >= 70) overallRisk = 'critical';
  else if (score >= 45) overallRisk = 'high';
  else if (score >= 20) overallRisk = 'moderate';
  else overallRisk = 'low';

  return { riskFactors, score, overallRisk };
}

module.exports = { computeRiskAssessment };
