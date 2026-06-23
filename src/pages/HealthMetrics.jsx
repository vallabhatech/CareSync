import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function HealthMetrics() {
  const { isAuthenticated } = useAuth();
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [weight, setWeight] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [temperature, setTemperature] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [oxygenSaturation, setOxygenSaturation] = useState('');
  const [notes, setNotes] = useState('');
  const [recordedAt, setRecordedAt] = useState(new Date().toISOString().slice(0, 16));

  const [editingId, setEditingId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchMetrics = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await API.get('/api/health-metrics');
      setMetrics(res.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load health metrics';
      setError(`Error loading metrics: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch metrics on mount
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const resetForm = () => {
    setWeight('');
    setSystolic('');
    setDiastolic('');
    setHeartRate('');
    setTemperature('');
    setBloodSugar('');
    setOxygenSaturation('');
    setNotes('');
    setRecordedAt(new Date().toISOString().slice(0, 16));
    setEditingId(null);
  };

  const handleAddMetric = async () => {
    try {
      const payload = {
        weight: weight ? parseFloat(weight) : null,
        systolic: systolic ? parseFloat(systolic) : null,
        diastolic: diastolic ? parseFloat(diastolic) : null,
        heartRate: heartRate ? parseFloat(heartRate) : null,
        temperature: temperature ? parseFloat(temperature) : null,
        bloodSugar: bloodSugar ? parseFloat(bloodSugar) : null,
        oxygenSaturation: oxygenSaturation ? parseFloat(oxygenSaturation) : null,
        notes,
        recordedAt,
      };

      if (editingId) {
        await API.put(`/api/health-metrics/${editingId}`, payload);
      } else {
        await API.post('/api/health-metrics', payload);
      }

      await fetchMetrics();
      resetForm();
      setError('');
    } catch (err) {
      console.error('Error saving metric:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to save metric';
      setError(`Failed to save metric: ${errorMsg}`);
    }
  };

  const handleEditMetric = (metric) => {
    setWeight(metric.weight || '');
    setSystolic(metric.systolic || '');
    setDiastolic(metric.diastolic || '');
    setHeartRate(metric.heartRate || '');
    setTemperature(metric.temperature || '');
    setBloodSugar(metric.bloodSugar || '');
    setOxygenSaturation(metric.oxygenSaturation || '');
    setNotes(metric.notes || '');
    setRecordedAt(new Date(metric.recordedAt).toISOString().slice(0, 16));
    setEditingId(metric._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await API.delete(`/api/health-metrics/${deleteId}`);
      await fetchMetrics();
      setDeleteDialogOpen(false);
      setDeleteId(null);
    } catch (err) {
      console.error('Error deleting metric:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to delete metric';
      setError(`Error deleting metric: ${errorMsg}`);
    }
  };

  const getMetricStatus = (metric) => {
    const statuses = [];
    if (metric.weight) {
      statuses.push(`Weight: ${metric.weight} kg`);
    }
    if (metric.systolic && metric.diastolic) {
      statuses.push(`BP: ${metric.systolic}/${metric.diastolic} mmHg`);
    }
    if (metric.heartRate) {
      statuses.push(`HR: ${metric.heartRate} bpm`);
    }
    if (metric.temperature) {
      statuses.push(`Temp: ${metric.temperature}°C`);
    }
    if (metric.bloodSugar) {
      statuses.push(`Sugar: ${metric.bloodSugar} mg/dL`);
    }
    if (metric.oxygenSaturation) {
      statuses.push(`O₂: ${metric.oxygenSaturation}%`);
    }
    return statuses.join(' | ');
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f8fb', py: 6, px: 2 }}>
      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
        <Button
          component={Link}
          to="/dashboard"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 3 }}
          variant="outlined"
        >
          Back to Dashboard
        </Button>

        <Card sx={{ p: 0, borderRadius: 4, boxShadow: 6, mb: 4 }}>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Health Metrics Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Track and analyze your vital signs and health metrics over time. Record weight, blood
              pressure, heart rate, temperature, blood sugar, and oxygen saturation.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box sx={{ bgcolor: '#f5f5f5', p: 3, borderRadius: 2, mb: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                {editingId ? 'Edit Metric' : 'Record New Metric'}
              </Typography>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Recorded At"
                    type="datetime-local"
                    value={recordedAt}
                    onChange={(e) => setRecordedAt(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Weight (kg)"
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    inputProps={{ step: '0.1' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Temperature (°C)"
                    type="number"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    inputProps={{ step: '0.1' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    label="Systolic (mmHg)"
                    type="number"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    label="Diastolic (mmHg)"
                    type="number"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    label="Heart Rate (bpm)"
                    type="number"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Blood Sugar (mg/dL)"
                    type="number"
                    value={bloodSugar}
                    onChange={(e) => setBloodSugar(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Oxygen Saturation (%)"
                    type="number"
                    value={oxygenSaturation}
                    onChange={(e) => setOxygenSaturation(e.target.value)}
                    inputProps={{ max: 100 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    multiline
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional observations..."
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" onClick={handleAddMetric}>
                  {editingId ? 'Update Metric' : 'Record Metric'}
                </Button>
                {editingId && (
                  <Button variant="outlined" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Metrics History */}
        <Card sx={{ borderRadius: 4, boxShadow: 6 }}>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Recent Metrics ({metrics.length})
            </Typography>

            {loading ? (
              <Typography>Loading metrics...</Typography>
            ) : metrics.length === 0 ? (
              <Typography color="text.secondary">No metrics recorded yet. Start by recording your first metric above.</Typography>
            ) : (
              <Box sx={{ display: 'grid', gap: 2 }}>
                {metrics.map((metric) => (
                  <Card key={metric._id} sx={{ p: 2, bgcolor: '#fafafa', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {formatDate(metric.recordedAt)}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          {getMetricStatus(metric)}
                        </Typography>
                        {metric.notes && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            Note: {metric.notes}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton size="small" onClick={() => handleEditMetric(metric)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteClick(metric._id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Card>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Metric</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this health metric?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
