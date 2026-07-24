import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Button, TextField,
  MenuItem, Alert, CircularProgress, Chip, Divider,
  FormControlLabel, Checkbox, LinearProgress, Accordion,
  AccordionSummary, AccordionDetails,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AssessmentIcon from '@mui/icons-material/Assessment';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

const RISK_COLOR = {
  low: '#2e7d32',
  moderate: '#f57c00',
  high: '#c62828',
  critical: '#6a1b9a',
};

const RISK_BG = {
  low: '#e8f5e9',
  moderate: '#fff3e0',
  high: '#ffebee',
  critical: '#f3e5f5',
};

const RISK_LABEL = {
  low: 'Low Risk',
  moderate: 'Moderate Risk',
  high: 'High Risk',
  critical: 'Critical Risk',
};

const DEFAULT_LIFESTYLE = {
  smokingStatus: 'never',
  alcoholUse: 'none',
  exerciseFrequency: '3-4',
  dietQuality: 'average',
  sleepHours: '7',
  stressLevel: 'moderate',
};

const DEFAULT_FAMILY = {
  heartDisease: false,
  diabetes: false,
  hypertension: false,
  cancer: false,
  stroke: false,
  mentalHealth: false,
};

export default function HealthRiskAssessment() {
  const { isAuthenticated } = useAuth();

  const [lifestyle, setLifestyle] = useState(DEFAULT_LIFESTYLE);
  const [familyHistory, setFamilyHistory] = useState(DEFAULT_FAMILY);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    setHistoryLoading(true);
    try {
      const res = await API.get('/api/risk-assessment');
      setHistory(res.data);
    } catch (err) {
      // silently ignore — history is supplementary
    } finally {
      setHistoryLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleLifestyleChange = (field) => (e) => {
    setLifestyle(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleFamilyChange = (field) => (e) => {
    setFamilyHistory(prev => ({ ...prev, [field]: e.target.checked }));
  };

  const handleRunAssessment = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await API.post('/api/risk-assessment', { lifestyle, familyHistory });
      setResult(res.data);
      setSuccess('Assessment complete! Review your results below.');
      await fetchHistory();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to run assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/api/risk-assessment/${id}`);
      if (result?._id === id) setResult(null);
      await fetchHistory();
    } catch (err) {
      setError('Failed to delete assessment.');
    }
  };

  const riskColor = result ? RISK_COLOR[result.overallRisk] : '#1976d2';
  const riskBg = result ? RISK_BG[result.overallRisk] : '#e3f2fd';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 6, px: 2 }}>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        <Button component={Link} to="/dashboard" startIcon={<ArrowBackIcon />} variant="outlined" sx={{ mb: 3 }}>
          Back to Dashboard
        </Button>

        <Typography variant="h4" fontWeight={700} mb={1}>🩺 Health Risk Assessment</Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          Answer a few questions about your lifestyle and family history to receive a personalized
          health risk assessment with actionable recommendations.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        {!isAuthenticated && (
          <Alert severity="warning" sx={{ mb: 3 }}>Please log in to run a health risk assessment.</Alert>
        )}

        {/* Input Form */}
        <Card sx={{ borderRadius: 3, boxShadow: 4, mb: 3 }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Typography variant="h6" fontWeight={700} mb={3}>Lifestyle Information</Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' } }}>
              <TextField select label="Smoking Status" value={lifestyle.smokingStatus} onChange={handleLifestyleChange('smokingStatus')} fullWidth>
                <MenuItem value="never">Never Smoked</MenuItem>
                <MenuItem value="former">Former Smoker</MenuItem>
                <MenuItem value="current">Current Smoker</MenuItem>
              </TextField>
              <TextField select label="Alcohol Use" value={lifestyle.alcoholUse} onChange={handleLifestyleChange('alcoholUse')} fullWidth>
                <MenuItem value="none">None</MenuItem>
                <MenuItem value="occasional">Occasional</MenuItem>
                <MenuItem value="regular">Regular</MenuItem>
                <MenuItem value="heavy">Heavy</MenuItem>
              </TextField>
              <TextField select label="Exercise Frequency" value={lifestyle.exerciseFrequency} onChange={handleLifestyleChange('exerciseFrequency')} fullWidth>
                <MenuItem value="none">None</MenuItem>
                <MenuItem value="1-2">1–2 days/week</MenuItem>
                <MenuItem value="3-4">3–4 days/week</MenuItem>
                <MenuItem value="5+">5+ days/week</MenuItem>
              </TextField>
              <TextField select label="Diet Quality" value={lifestyle.dietQuality} onChange={handleLifestyleChange('dietQuality')} fullWidth>
                <MenuItem value="poor">Poor</MenuItem>
                <MenuItem value="average">Average</MenuItem>
                <MenuItem value="good">Good</MenuItem>
                <MenuItem value="excellent">Excellent</MenuItem>
              </TextField>
              <TextField
                label="Average Sleep (hours/night)"
                type="number"
                value={lifestyle.sleepHours}
                onChange={handleLifestyleChange('sleepHours')}
                inputProps={{ min: 1, max: 24, step: 0.5 }}
                fullWidth
              />
              <TextField select label="Stress Level" value={lifestyle.stressLevel} onChange={handleLifestyleChange('stressLevel')} fullWidth>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="moderate">Moderate</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="very-high">Very High</MenuItem>
              </TextField>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" fontWeight={700} mb={2}>Family History</Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Select any conditions that run in your immediate family (parents, siblings).
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }, gap: 1 }}>
              {[
                ['heartDisease', 'Heart Disease'],
                ['diabetes', 'Diabetes'],
                ['hypertension', 'Hypertension'],
                ['cancer', 'Cancer'],
                ['stroke', 'Stroke'],
                ['mentalHealth', 'Mental Health Conditions'],
              ].map(([key, label]) => (
                <FormControlLabel
                  key={key}
                  control={<Checkbox checked={familyHistory[key]} onChange={handleFamilyChange(key)} color="primary" />}
                  label={label}
                />
              ))}
            </Box>

            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <AssessmentIcon />}
                onClick={handleRunAssessment}
                disabled={loading || !isAuthenticated}
                sx={{ background: 'linear-gradient(90deg, #1976d2 60%, #7b1fa2 100%)', fontWeight: 700, px: 4 }}
              >
                {loading ? 'Analysing...' : 'Run Health Risk Assessment'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card sx={{ borderRadius: 3, boxShadow: 4, mb: 3, border: `2px solid ${riskColor}` }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Typography variant="h6" fontWeight={700} mb={2}>Assessment Results</Typography>

              {/* Overall risk score */}
              <Box sx={{ p: 3, bgcolor: riskBg, borderRadius: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                {result.overallRisk === 'low'
                  ? <CheckCircleIcon sx={{ fontSize: 48, color: riskColor }} />
                  : <WarningAmberIcon sx={{ fontSize: 48, color: riskColor }} />
                }
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" fontWeight={800} sx={{ color: riskColor }}>
                    {RISK_LABEL[result.overallRisk]}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Risk Score: {result.score} / 100 &nbsp;·&nbsp;
                    Assessed {new Date(result.assessedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={result.score}
                    sx={{ mt: 1, height: 8, borderRadius: 4, bgcolor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': { bgcolor: riskColor } }}
                  />
                </Box>
              </Box>

              {/* Risk factors */}
              <Typography variant="subtitle1" fontWeight={700} mb={1}>
                Identified Risk Factors ({result.riskFactors.length})
              </Typography>
              <Box sx={{ display: 'grid', gap: 1.5 }}>
                {result.riskFactors.map((rf, i) => (
                  <Box key={i} sx={{ p: 2, bgcolor: RISK_BG[rf.level], borderRadius: 2, borderLeft: `4px solid ${RISK_COLOR[rf.level]}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography fontWeight={700} variant="body2">{rf.category}</Typography>
                      <Chip label={RISK_LABEL[rf.level]} size="small" sx={{ bgcolor: RISK_COLOR[rf.level], color: '#fff', fontWeight: 700, fontSize: '0.7rem' }} />
                    </Box>
                    <Typography variant="body2" color="text.secondary" mb={0.5}>{rf.detail}</Typography>
                    <Typography variant="body2" sx={{ color: RISK_COLOR[rf.level], fontWeight: 600 }}>
                      ✅ {rf.recommendation}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* History */}
        {history.length > 0 && (
          <Card sx={{ borderRadius: 3, boxShadow: 4 }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Typography variant="h6" fontWeight={700} mb={2}>Assessment History</Typography>
              {historyLoading ? (
                <CircularProgress size={24} />
              ) : (
                <Box sx={{ display: 'grid', gap: 1.5 }}>
                  {history.map(a => (
                    <Accordion key={a._id} sx={{ borderRadius: 2, boxShadow: 1 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                          <Chip
                            label={RISK_LABEL[a.overallRisk]}
                            size="small"
                            sx={{ bgcolor: RISK_COLOR[a.overallRisk], color: '#fff', fontWeight: 700 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            Score: {a.score}/100 &nbsp;·&nbsp;
                            {new Date(a.assessedAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                          </Typography>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={(e) => { e.stopPropagation(); handleDelete(a._id); }}
                            sx={{ ml: 'auto' }}
                          >
                            Delete
                          </Button>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ display: 'grid', gap: 1 }}>
                          {a.riskFactors.map((rf, i) => (
                            <Box key={i} sx={{ p: 1.5, bgcolor: RISK_BG[rf.level], borderRadius: 1, borderLeft: `3px solid ${RISK_COLOR[rf.level]}` }}>
                              <Typography variant="body2" fontWeight={700}>{rf.category} — {rf.detail}</Typography>
                              <Typography variant="caption" sx={{ color: RISK_COLOR[rf.level] }}>✅ {rf.recommendation}</Typography>
                            </Box>
                          ))}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}
