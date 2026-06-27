const mongoose = require('mongoose');

const RiskFactorSchema = new mongoose.Schema({
  category: { type: String, required: true },   // e.g. 'Blood Pressure'
  level: {
    type: String,
    enum: ['low', 'moderate', 'high', 'critical'],
    required: true,
  },
  detail: { type: String, default: '' },         // human-readable explanation
  recommendation: { type: String, default: '' }, // actionable advice
}, { _id: false });

const HealthRiskAssessmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  overallRisk: {
    type: String,
    enum: ['low', 'moderate', 'high', 'critical'],
    required: true,
  },
  score: { type: Number, required: true }, // 0-100
  riskFactors: [RiskFactorSchema],
  // Lifestyle inputs captured at assessment time
  lifestyle: {
    smokingStatus: { type: String, default: 'never' },   // never/former/current
    alcoholUse: { type: String, default: 'none' },       // none/occasional/regular/heavy
    exerciseFrequency: { type: String, default: 'none' },// none/1-2/3-4/5+
    dietQuality: { type: String, default: 'average' },   // poor/average/good/excellent
    sleepHours: { type: Number, default: null },
    stressLevel: { type: String, default: 'moderate' },  // low/moderate/high/very-high
  },
  // Family history flags captured at assessment time
  familyHistory: {
    heartDisease: { type: Boolean, default: false },
    diabetes: { type: Boolean, default: false },
    hypertension: { type: Boolean, default: false },
    cancer: { type: Boolean, default: false },
    stroke: { type: Boolean, default: false },
    mentalHealth: { type: Boolean, default: false },
  },
  assessedAt: { type: Date, default: Date.now },
});

HealthRiskAssessmentSchema.index({ user: 1, assessedAt: -1 });

module.exports = mongoose.model('HealthRiskAssessment', HealthRiskAssessmentSchema);
