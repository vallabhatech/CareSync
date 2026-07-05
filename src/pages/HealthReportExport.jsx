import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Button,
  Alert, CircularProgress, Divider, Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import MedicationIcon from '@mui/icons-material/Medication';
import PersonIcon from '@mui/icons-material/Person';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function HealthReportExport() {
  const { isAuthenticated, user } = useAuth();
  const [metrics, setMetrics] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSummary = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const [metricsRes, medRes] = await Promise.all([
        API.get('/api/health-metrics'),
        API.get('/api/medicines'),
      ]);
      setMetrics(metricsRes.data);
      setMedicines(medRes.data);
    } catch (err) {
      setError('Failed to load health summary data.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const handleExportPDF = async () => {
    setExporting(true);
    setError('');
    setSuccess('');
    try {
      const res = await API.get('/api/reports/health-summary/pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `caresync-health-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccess('Report downloaded successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const latestMetric = metrics[0] || null;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f8fb', py: 6, px: 2 }}>
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Button component={Link} to="/dashboard" startIcon={<ArrowBackIcon />} variant="outlined" sx={{ mb: 3 }}>
          Back to Dashboard
        </Button>

        <Typography variant="h4" fontWeight={700} mb={1}>📄 Export Health Report</Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          Generate a comprehensive PDF report of your health data to share with your healthcare provider.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        {/* Report Preview Card */}
        <Card sx={{ borderRadius: 3, boxShadow: 4, mb: 3 }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Report Contents</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Your PDF report will include the following sections:
            </Typography>

            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' } }}>
              {/* Patient Info */}
              <Box sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <PersonIcon color="primary" fontSize="large" />
                <Typography fontWeight={600} variant="body2">Patient Info</Typography>
                <Typography variant="caption" color="text.secondary" textAlign="center">
                  Name, email, age, blood group, allergies
                </Typography>
                {user && <Chip label={user.name} size="small" color="primary" variant="outlined" />}
              </Box>

              {/* Health Metrics */}
              <Box sx={{ p: 2, bgcolor: '#e8f5e9', borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <MonitorHeartIcon color="success" fontSize="large" />
                <Typography fontWeight={600} variant="body2">Health Metrics</Typography>
                <Typography variant="caption" color="text.secondary" textAlign="center">
                  Vitals history — BP, HR, weight, temperature, blood sugar, O₂
                </Typography>
                {loading ? <CircularProgress size={16} /> : (
                  <Chip label={`${metrics.length} records`} size="small" color="success" variant="outlined" />
                )}
              </Box>

              {/* Medicines */}
              <Box sx={{ p: 2, bgcolor: '#fff3e0', borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <MedicationIcon color="warning" fontSize="large" />
                <Typography fontWeight={600} variant="body2">Medicine Schedule</Typography>
                <Typography variant="caption" color="text.secondary" textAlign="center">
                  All tracked medications with time and date
                </Typography>
                {loading ? <CircularProgress size={16} /> : (
                  <Chip label={`${medicines.length} medicines`} size="small" color="warning" variant="outlined" />
                )}
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Latest Vitals Preview */}
            {latestMetric && (
              <>
                <Typography variant="subtitle1" fontWeight={700} mb={1}>Latest Recorded Vitals</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {latestMetric.weight && <Chip label={`Weight: ${latestMetric.weight} kg`} size="small" />}
                  {latestMetric.systolic && latestMetric.diastolic && (
                    <Chip label={`BP: ${latestMetric.systolic}/${latestMetric.diastolic} mmHg`} size="small" />
                  )}
                  {latestMetric.heartRate && <Chip label={`HR: ${latestMetric.heartRate} bpm`} size="small" />}
                  {latestMetric.temperature && <Chip label={`Temp: ${latestMetric.temperature}°C`} size="small" />}
                  {latestMetric.bloodSugar && <Chip label={`Sugar: ${latestMetric.bloodSugar} mg/dL`} size="small" />}
                  {latestMetric.oxygenSaturation && <Chip label={`O₂: ${latestMetric.oxygenSaturation}%`} size="small" />}
                </Box>
              </>
            )}

            {!isAuthenticated && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Please log in to generate your health report.
              </Alert>
            )}

            <Button
              variant="contained"
              size="large"
              startIcon={exporting ? <CircularProgress size={18} color="inherit" /> : <PictureAsPdfIcon />}
              onClick={handleExportPDF}
              disabled={exporting || !isAuthenticated || loading}
              sx={{
                mt: 1,
                background: 'linear-gradient(90deg, #1976d2 60%, #7b1fa2 100%)',
                fontWeight: 700,
                fontSize: '1rem',
                px: 4,
              }}
            >
              {exporting ? 'Generating Report...' : 'Download Health Report PDF'}
            </Button>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card sx={{ borderRadius: 3, boxShadow: 2, bgcolor: '#fffde7' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} mb={1}>ℹ️ About This Report</Typography>
            <Typography variant="body2" color="text.secondary">
              The exported PDF includes up to 100 recent health metric records and up to 100 medicine entries.
              This report is intended for informational purposes and to share with your healthcare provider.
              It is not a substitute for professional medical advice.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
