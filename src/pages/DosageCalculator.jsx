import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function DosageCalculator() {
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [dosePerKg, setDosePerKg] = useState('');
  const [maxDose, setMaxDose] = useState('');
  const [frequency, setFrequency] = useState('1');

  const weightNum = parseFloat(weight);
  const ageNum = parseFloat(age);
  const dosePerKgNum = parseFloat(dosePerKg);
  const maxDoseNum = parseFloat(maxDose);
  const frequencyNum = parseInt(frequency, 10) || 1;

  const isValid = weightNum > 0 && ageNum >= 0 && dosePerKgNum > 0 && frequencyNum > 0;
  const recommendedDose = isValid ? weightNum * dosePerKgNum : 0;
  const actualDose = isValid
    ? maxDoseNum > 0
      ? Math.min(recommendedDose, maxDoseNum)
      : recommendedDose
    : 0;
  const dailyDose = isValid ? actualDose * frequencyNum : 0;

  const ageGroup = ageNum >= 0
    ? ageNum < 12
      ? 'Pediatric'
      : ageNum < 18
      ? 'Adolescent'
      : 'Adult'
    : '';

  const noteText = isValid
    ? maxDoseNum > 0 && maxDoseNum < recommendedDose
      ? `Based on weight, the ideal dose is ${recommendedDose.toFixed(1)} mg, but the single-dose limit is ${maxDoseNum.toFixed(1)} mg.`
      : `Based on weight and dose-per-kg, the recommended dose is ${recommendedDose.toFixed(1)} mg.`
    : 'Enter your personal factors to see an individualized dose estimate.';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f8fb', py: 6, px: 2 }}>
      <Box sx={{ maxWidth: 980, mx: 'auto' }}>
        <Button
          component={Link}
          to="/dashboard"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 3 }}
          variant="outlined"
        >
          Back to Dashboard
        </Button>
        <Card sx={{ p: 0, borderRadius: 4, boxShadow: 6 }}>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Dosage Calculator
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Estimate an appropriate medicine dose using your weight, age, and
              dosing guidance. This tool provides a helpful estimate but is not a
              substitute for medical advice.
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Weight (kg)"
                  type="number"
                  value={weight}
                  onChange={(event) => setWeight(event.target.value)}
                  inputProps={{ min: 0, step: '0.1' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Age (years)"
                  type="number"
                  value={age}
                  onChange={(event) => setAge(event.target.value)}
                  inputProps={{ min: 0, step: '1' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Dose per kg (mg/kg)"
                  type="number"
                  value={dosePerKg}
                  onChange={(event) => setDosePerKg(event.target.value)}
                  inputProps={{ min: 0, step: '0.1' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Maximum single dose (mg)"
                  type="number"
                  value={maxDose}
                  onChange={(event) => setMaxDose(event.target.value)}
                  inputProps={{ min: 0, step: '0.1' }}
                  helperText="Optional: enter a hard upper limit if known"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Doses per day"
                  type="number"
                  value={frequency}
                  onChange={(event) => setFrequency(event.target.value)}
                  inputProps={{ min: 1, step: '1' }}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 4, display: 'grid', gap: 2 }}>
              <Alert severity="info">
                {noteText}
              </Alert>

              <Card sx={{ bgcolor: '#fff', borderRadius: 3, p: 3, boxShadow: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Estimated dose summary
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Age group: <strong>{ageGroup || 'Not specified'}</strong>
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Recommended single dose:{' '}
                  <strong>{isValid ? `${actualDose.toFixed(1)} mg` : '—'}</strong>
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Total daily dose:{' '}
                  <strong>{isValid ? `${dailyDose.toFixed(1)} mg` : '—'}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Use this calculation as a guide only. Confirm the exact dosage
                  with a clinician or pharmacist before taking any medicine.
                </Typography>
              </Card>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
