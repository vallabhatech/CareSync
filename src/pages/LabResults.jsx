import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  FilePresent as FilePresentIcon,
  ArrowBack as ArrowBackIcon,
  InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function LabResults() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  // State
  const [results, setResults] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog / Form State
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [testDate, setTestDate] = useState(new Date().toISOString().slice(0, 10));
  const [labName, setLabName] = useState('');
  const [category, setCategory] = useState('Diabetic Profile');
  const [testName, setTestName] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');
  const [referenceMin, setReferenceMin] = useState('');
  const [referenceMax, setReferenceMax] = useState('');
  const [notes, setNotes] = useState('');
  const [documentId, setDocumentId] = useState('');

  // Tab Filtering & Search
  const [currentTab, setCurrentTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Biomarker for Trend Chart
  const [selectedBiomarker, setSelectedBiomarker] = useState('');
  
  // SVG Chart Tooltip State
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Delete Confirmation Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // API Calls
  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const [resResults, resDocs] = await Promise.all([
        API.get('/api/lab-results'),
        API.get('/api/medical-documents'),
      ]);
      setResults(resResults.data);
      setDocuments(resDocs.data || []);
      setError('');
    } catch (err) {
      console.error('Failed to load lab results data:', err);
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set default biomarker when results load
  useEffect(() => {
    if (results.length > 0 && !selectedBiomarker) {
      // Find the most frequent testName to default to, or just the first one
      const counts = results.reduce((acc, curr) => {
        acc[curr.testName] = (acc[curr.testName] || 0) + 1;
        return acc;
      }, {});
      const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
      setSelectedBiomarker(sorted[0] || '');
    }
  }, [results, selectedBiomarker]);

  // Categories helper
  const categories = [
    { key: 'Diabetic Profile', label: t('labResults:categories.diabetic') },
    { key: 'Lipid Profile', label: t('labResults:categories.lipid') },
    { key: 'Thyroid Profile', label: t('labResults:categories.thyroid') },
    { key: 'Complete Blood Count (CBC)', label: t('labResults:categories.cbc') },
    { key: 'Vitamins & Minerals', label: t('labResults:categories.vitamins') },
    { key: 'Other Panels', label: t('labResults:categories.other') },
  ];

  // Helper to suggest units/ranges based on common biomarkers
  const handleTestNameChange = (val) => {
    setTestName(val);
    const lower = val.toLowerCase().trim();
    if (lower === 'hba1c') {
      setUnit('%');
      setReferenceMin('4.0');
      setReferenceMax('5.7');
      setCategory('Diabetic Profile');
    } else if (lower.includes('cholesterol') || lower === 'ldl' || lower === 'hdl' || lower === 'triglycerides') {
      setUnit('mg/dL');
      setCategory('Lipid Profile');
      if (lower === 'ldl') {
        setReferenceMin('0');
        setReferenceMax('100');
      } else if (lower === 'hdl') {
        setReferenceMin('40');
        setReferenceMax('60');
      } else if (lower.includes('total')) {
        setReferenceMin('125');
        setReferenceMax('200');
      }
    } else if (lower === 'tsh') {
      setUnit('uIU/mL');
      setReferenceMin('0.4');
      setReferenceMax('4.5');
      setCategory('Thyroid Profile');
    } else if (lower === 'hemoglobin' || lower === 'hb') {
      setUnit('g/dL');
      setReferenceMin('12.0');
      setReferenceMax('16.0');
      setCategory('Complete Blood Count (CBC)');
    } else if (lower.includes('vitamin d')) {
      setUnit('ng/mL');
      setReferenceMin('30');
      setReferenceMax('100');
      setCategory('Vitamins & Minerals');
    } else if (lower.includes('vitamin b12')) {
      setUnit('pg/mL');
      setReferenceMin('200');
      setReferenceMax('900');
      setCategory('Vitamins & Minerals');
    }
  };

  const resetForm = () => {
    setTestDate(new Date().toISOString().slice(0, 10));
    setLabName('');
    setCategory('Diabetic Profile');
    setTestName('');
    setValue('');
    setUnit('');
    setReferenceMin('');
    setReferenceMax('');
    setNotes('');
    setDocumentId('');
    setEditingId(null);
  };

  const handleOpenForm = (editItem = null) => {
    if (editItem) {
      setEditingId(editItem._id);
      setTestDate(new Date(editItem.testDate).toISOString().slice(0, 10));
      setLabName(editItem.labName || '');
      setCategory(editItem.category);
      setTestName(editItem.testName);
      setValue(String(editItem.value));
      setUnit(editItem.unit);
      setReferenceMin(editItem.referenceMin !== null ? String(editItem.referenceMin) : '');
      setReferenceMax(editItem.referenceMax !== null ? String(editItem.referenceMax) : '');
      setNotes(editItem.notes || '');
      setDocumentId(editItem.document?._id || editItem.document || '');
    } else {
      resetForm();
    }
    setFormOpen(true);
  };

  const handleSaveResult = async () => {
    if (!testName.trim()) {
      setError('Test name is required');
      return;
    }
    if (value === '' || Number.isNaN(Number(value))) {
      setError('A valid numeric value is required');
      return;
    }
    if (!unit.trim()) {
      setError('Unit is required');
      return;
    }

    try {
      const payload = {
        testDate,
        labName,
        category,
        testName,
        value: Number(value),
        unit,
        referenceMin: referenceMin !== '' ? Number(referenceMin) : null,
        referenceMax: referenceMax !== '' ? Number(referenceMax) : null,
        notes,
        documentId: documentId || null,
      };

      if (editingId) {
        await API.put(`/api/lab-results/${editingId}`, payload);
        setSuccess(t('labResults:updateSuccess'));
      } else {
        await API.post('/api/lab-results', payload);
        setSuccess(t('labResults:recordSuccess'));
      }

      setFormOpen(false);
      resetForm();
      await fetchData();
      
      // Auto-focus the trend on what was just edited/added
      setSelectedBiomarker(payload.testName);
    } catch (err) {
      console.error('Error saving result:', err);
      setError(err.response?.data?.message || 'Failed to save lab result');
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await API.delete(`/api/lab-results/${deleteId}`);
      setSuccess(t('labResults:deleteSuccess'));
      setDeleteDialogOpen(false);
      setDeleteId(null);
      await fetchData();
    } catch (err) {
      console.error('Error deleting lab result:', err);
      setError(err.response?.data?.message || 'Failed to delete lab result');
    }
  };

  // Helper to determine status based on value and reference range
  const getStatus = (val, min, max) => {
    if (min !== null && val < min) return 'LOW';
    if (max !== null && val > max) return 'HIGH';
    return 'NORMAL';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'LOW':
        return '#2196f3'; // blue
      case 'HIGH':
        return '#f44336'; // red
      case 'NORMAL':
      default:
        return '#4caf50'; // green
    }
  };

  // List of unique biomarkers logged
  const biomarkersList = useMemo(() => {
    const list = Array.from(new Set(results.map((r) => r.testName)));
    return list.sort();
  }, [results]);

  // Group latest result for each biomarker for the overview
  const latestBiomarkersOverview = useMemo(() => {
    const latestMap = {};
    results.forEach((r) => {
      if (!latestMap[r.testName] || new Date(r.testDate) > new Date(latestMap[r.testName].testDate)) {
        latestMap[r.testName] = r;
      }
    });
    return Object.values(latestMap).sort((a, b) => a.testName.localeCompare(b.testName));
  }, [results]);

  // Filtered results list for the history log table
  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      const matchesTab = currentTab === 'all' || r.category === currentTab;
      const matchesSearch =
        r.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.labName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [results, currentTab, searchTerm]);

  // Selected Biomarker data points sorted chronologically
  const chartData = useMemo(() => {
    if (!selectedBiomarker) return [];
    return results
      .filter((r) => r.testName === selectedBiomarker)
      .map((r) => ({
        ...r,
        parsedDate: new Date(r.testDate),
      }))
      .sort((a, b) => a.parsedDate - b.parsedDate);
  }, [results, selectedBiomarker]);

  // Stats calculation for the selected biomarker
  const biomarkerStats = useMemo(() => {
    if (chartData.length === 0) return null;
    const values = chartData.map((d) => d.value);
    const latest = chartData[chartData.length - 1];
    const average = values.reduce((sum, v) => sum + v, 0) / values.length;
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    
    let trend = 'stable';
    let pctChange = 0;
    if (chartData.length > 1) {
      const prev = chartData[chartData.length - 2].value;
      if (prev > 0) {
        pctChange = ((latest.value - prev) / prev) * 100;
        if (pctChange > 1) trend = 'up';
        else if (pctChange < -1) trend = 'down';
      }
    }

    return {
      latestValue: latest.value,
      unit: latest.unit,
      average: Number(average.toFixed(2)),
      min: minVal,
      max: maxVal,
      trend,
      pctChange: Number(pctChange.toFixed(1)),
      referenceMin: latest.referenceMin,
      referenceMax: latest.referenceMax,
    };
  }, [chartData]);

  // SVG Chart Dimensions & Computations
  const chartWidth = 700;
  const chartHeight = 350;
  const paddingLeft = 60;
  const paddingRight = 40;
  const paddingTop = 40;
  const paddingBottom = 50;

  const svgScales = useMemo(() => {
    if (chartData.length < 2) return null;

    const dates = chartData.map((d) => d.parsedDate.getTime());
    let minDate = Math.min(...dates);
    let maxDate = Math.max(...dates);

    // If only one day is represented in multiple points, pad the scale
    if (minDate === maxDate) {
      minDate -= 24 * 60 * 60 * 1000;
      maxDate += 24 * 60 * 60 * 1000;
    }

    const values = chartData.map((d) => d.value);
    let minVal = Math.min(...values);
    let maxVal = Math.max(...values);

    // Factor in reference ranges into scale so they don't clip
    const refMin = chartData[0].referenceMin;
    const refMax = chartData[0].referenceMax;
    if (refMin !== null) minVal = Math.min(minVal, refMin);
    if (refMax !== null) maxVal = Math.max(maxVal, refMax);

    // Add 10% padding to vertical limits
    const valRange = maxVal - minVal || 1;
    minVal = Math.max(0, minVal - valRange * 0.1);
    maxVal = maxVal + valRange * 0.1;

    return {
      getX: (date) => {
        const pct = (new Date(date).getTime() - minDate) / (maxDate - minDate);
        return paddingLeft + pct * (chartWidth - paddingLeft - paddingRight);
      },
      getY: (val) => {
        const pct = (val - minVal) / (maxVal - minVal);
        return chartHeight - paddingBottom - pct * (chartHeight - paddingTop - paddingBottom);
      },
      minDate,
      maxDate,
      minVal,
      maxVal,
    };
  }, [chartData]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f8fb', py: 6, px: 2 }}>
      <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
        
        {/* Navigation & Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Button
              component={Link}
              to="/dashboard"
              startIcon={<ArrowBackIcon />}
              variant="outlined"
              sx={{ mb: 2 }}
            >
              {t('common:cancel') === 'Cancel' ? 'Back to Dashboard' : 'डैशबोर्ड पर जाएँ'}
            </Button>
            <Typography variant="h4" fontWeight={800} sx={{ color: 'primary.main', mb: 0.5 }}>
              📊 {t('labResults:title')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('labResults:subtitle')}
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
            sx={{
              borderRadius: 3,
              px: 3,
              py: 1.2,
              fontWeight: 700,
              boxShadow: '0 6px 16px rgba(25, 118, 210, 0.25)',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 20px rgba(25, 118, 210, 0.35)',
              },
            }}
          >
            {t('labResults:addResult')}
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>{success}</Alert>}

        {/* 1. LATEST BIOMARKERS OVERVIEW */}
        {latestBiomarkersOverview.length > 0 && (
          <Box sx={{ mb: 5 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              {t('labResults:latestOverview')}
            </Typography>
            <Grid container spacing={2}>
              {latestBiomarkersOverview.map((item) => {
                const status = getStatus(item.value, item.referenceMin, item.referenceMax);
                const statusColor = getStatusColor(status);
                
                return (
                  <Grid item xs={12} sm={6} md={3} key={item._id}>
                    <Card
                      sx={{
                        borderRadius: 3,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                        borderLeft: `5px solid ${statusColor}`,
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                        },
                      }}
                      onClick={() => setSelectedBiomarker(item.testName)}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>
                          {item.category}
                        </Typography>
                        <Typography variant="h6" fontWeight={700} noWrap>
                          {item.testName}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 1, mb: 1, gap: 0.5 }}>
                          <Typography variant="h4" fontWeight={800} color="text.primary">
                            {item.value}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" fontWeight={700}>
                            {item.unit}
                          </Typography>
                          <Chip
                            label={t(`labResults:${status.toLowerCase()}`)}
                            size="small"
                            sx={{
                              ml: 'auto',
                              bgcolor: `${statusColor}15`,
                              color: statusColor,
                              fontWeight: 700,
                              fontSize: '0.75rem',
                            }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {t('labResults:date')}: {new Date(item.testDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Typography>
                        {(item.referenceMin !== null || item.referenceMax !== null) && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            {t('labResults:normalRange')}: {item.referenceMin !== null ? item.referenceMin : '0'} - {item.referenceMax !== null ? item.referenceMax : '∞'}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}

        {/* 2. DYNAMIC TREND VISUALIZATION */}
        <Grid container spacing={3} sx={{ mb: 5 }}>
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 4, boxShadow: '0 6px 20px rgba(0,0,0,0.06)', overflow: 'visible' }}>
              <CardContent sx={{ p: { xs: 2, md: 4 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                  <Typography variant="h6" fontWeight={700}>
                    📈 {t('labResults:trendAnalysis')}
                  </Typography>
                  {biomarkersList.length > 0 && (
                    <TextField
                      select
                      size="small"
                      value={selectedBiomarker}
                      onChange={(e) => setSelectedBiomarker(e.target.value)}
                      label={t('labResults:selectBiomarker')}
                      sx={{ minWidth: 200 }}
                    >
                      {biomarkersList.map((name) => (
                        <MenuItem key={name} value={name}>
                          {name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                </Box>

                {chartData.length < 2 ? (
                  <Box
                    sx={{
                      height: 350,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: '#fafafa',
                      borderRadius: 3,
                      border: '2px dashed #e0e0e0',
                      p: 3,
                      textAlign: 'center',
                    }}
                  >
                    <Typography color="text.secondary">
                      {t('labResults:noTrendData')}
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ position: 'relative', overflowX: 'auto' }}>
                    <svg
                      width="100%"
                      height={chartHeight}
                      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                      style={{ overflow: 'visible', minWidth: 600 }}
                    >
                      {/* Definitions for gradients and shadows */}
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1976d2" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#1976d2" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* 1. Shaded Reference Range (Normal Range Band) */}
                      {svgScales && chartData[0].referenceMin !== null && chartData[0].referenceMax !== null && (
                        <rect
                          x={paddingLeft}
                          y={svgScales.getY(chartData[0].referenceMax)}
                          width={chartWidth - paddingLeft - paddingRight}
                          height={Math.max(1, svgScales.getY(chartData[0].referenceMin) - svgScales.getY(chartData[0].referenceMax))}
                          fill="#4caf50"
                          opacity="0.07"
                        />
                      )}

                      {/* 2. Grid Lines & Axis Values */}
                      {svgScales && (
                        <>
                          {/* Y-axis Guideline Values (4 markers) */}
                          {[0, 0.33, 0.66, 1].map((ratio) => {
                            const val = svgScales.minVal + ratio * (svgScales.maxVal - svgScales.minVal);
                            const y = svgScales.getY(val);
                            return (
                              <g key={ratio}>
                                <line
                                  x1={paddingLeft}
                                  y1={y}
                                  x2={chartWidth - paddingRight}
                                  y2={y}
                                  stroke="#e8eff5"
                                  strokeDasharray="4 4"
                                />
                                <text
                                  x={paddingLeft - 10}
                                  y={y + 4}
                                  textAnchor="end"
                                  fontSize="10"
                                  fill="#8898a8"
                                  fontWeight="600"
                                >
                                  {val.toFixed(1)}
                                </text>
                              </g>
                            );
                          })}

                          {/* X-axis Date Markers */}
                          {chartData.map((d, index) => {
                            // Only plot up to 6 date markers to avoid overlap
                            if (chartData.length > 6 && index % Math.ceil(chartData.length / 5) !== 0) return null;
                            const x = svgScales.getX(d.parsedDate);
                            return (
                              <g key={d._id}>
                                <line
                                  x1={x}
                                  y1={paddingTop}
                                  x2={x}
                                  y2={chartHeight - paddingBottom}
                                  stroke="#e8eff5"
                                  strokeDasharray="4 4"
                                />
                                <text
                                  x={x}
                                  y={chartHeight - paddingBottom + 20}
                                  textAnchor="middle"
                                  fontSize="10"
                                  fill="#8898a8"
                                  fontWeight="600"
                                >
                                  {d.parsedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </text>
                              </g>
                            );
                          })}
                        </>
                      )}

                      {/* 3. Filled Gradient Area */}
                      {svgScales && (
                        <path
                          d={`
                            M ${svgScales.getX(chartData[0].parsedDate)} ${chartHeight - paddingBottom}
                            ${chartData.map((d) => `L ${svgScales.getX(d.parsedDate)} ${svgScales.getY(d.value)}`).join(' ')}
                            L ${svgScales.getX(chartData[chartData.length - 1].parsedDate)} ${chartHeight - paddingBottom}
                            Z
                          `}
                          fill="url(#chartGradient)"
                        />
                      )}

                      {/* 4. The Line Path */}
                      {svgScales && (
                        <path
                          d={chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${svgScales.getX(d.parsedDate)} ${svgScales.getY(d.value)}`).join(' ')}
                          fill="none"
                          stroke="#1976d2"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                        />
                      )}

                      {/* 5. Highlight Points */}
                      {svgScales &&
                        chartData.map((d) => {
                          const cx = svgScales.getX(d.parsedDate);
                          const cy = svgScales.getY(d.value);
                          const status = getStatus(d.value, d.referenceMin, d.referenceMax);
                          const statusColor = getStatusColor(status);
                          const isHovered = hoveredPoint && hoveredPoint._id === d._id;

                          return (
                            <circle
                              key={d._id}
                              cx={cx}
                              cy={cy}
                              r={isHovered ? 8 : 5.5}
                              fill="#ffffff"
                              stroke={isHovered ? '#1976d2' : statusColor}
                              strokeWidth={isHovered ? 4.5 : 3}
                              style={{ cursor: 'pointer', transition: 'all 0.15s ease-in-out' }}
                              onMouseEnter={() => setHoveredPoint(d)}
                              onMouseLeave={() => setHoveredPoint(null)}
                            />
                          );
                        })}
                    </svg>

                    {/* Chart Tooltip Overlay */}
                    {hoveredPoint && svgScales && (
                      <Box
                        sx={{
                          position: 'absolute',
                          left: `${Math.min(chartWidth - 200, Math.max(10, svgScales.getX(hoveredPoint.parsedDate) - 90))}px`,
                          top: `${Math.min(chartHeight - 120, Math.max(10, svgScales.getY(hoveredPoint.value) - 110))}px`,
                          bgcolor: 'rgba(33, 43, 54, 0.95)',
                          color: '#fff',
                          p: 1.5,
                          borderRadius: 2,
                          boxShadow: 4,
                          pointerEvents: 'none',
                          zIndex: 10,
                          minWidth: 160,
                        }}
                      >
                        <Typography variant="caption" display="block" color="rgba(255,255,255,0.7)" fontWeight={600}>
                          {new Date(hoveredPoint.testDate).toLocaleDateString(undefined, {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Typography>
                        <Typography variant="body2" fontWeight={800} sx={{ mt: 0.5 }}>
                          {hoveredPoint.testName}: {hoveredPoint.value} {hoveredPoint.unit}
                        </Typography>
                        {hoveredPoint.referenceMin !== null && (
                          <Typography variant="caption" display="block" color="rgba(255,255,255,0.7)">
                            Ref Range: {hoveredPoint.referenceMin} - {hoveredPoint.referenceMax}
                          </Typography>
                        )}
                        {hoveredPoint.labName && (
                          <Typography variant="caption" display="block" color="rgba(255,255,255,0.5)" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                            Lab: {hoveredPoint.labName}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* 3. CHART STATISTICS BLOCK */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 4, boxShadow: '0 6px 20px rgba(0,0,0,0.06)', height: '100%', bgcolor: '#ffffff' }}>
              <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    ✨ {selectedBiomarker} {t('labResults:stats.trend')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    Overall summary for logged results of this biomarker.
                  </Typography>

                  {biomarkerStats ? (
                    <Box sx={{ display: 'grid', gap: 3 }}>
                      
                      {/* Trend indicator */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor:
                              biomarkerStats.trend === 'up'
                                ? 'error.light'
                                : biomarkerStats.trend === 'down'
                                ? 'success.light'
                                : 'grey.100',
                            color:
                              biomarkerStats.trend === 'up'
                                ? 'error.main'
                                : biomarkerStats.trend === 'down'
                                ? 'success.main'
                                : 'grey.600',
                          }}
                        >
                          {biomarkerStats.trend === 'up' ? (
                            <TrendingUpIcon />
                          ) : biomarkerStats.trend === 'down' ? (
                            <TrendingDownIcon />
                          ) : (
                            <InfoIcon />
                          )}
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={700}>
                            {t('labResults:stats.trend')}
                          </Typography>
                          <Typography variant="body1" fontWeight={800}>
                            {biomarkerStats.trend === 'up'
                              ? `Increased by +${biomarkerStats.pctChange}%`
                              : biomarkerStats.trend === 'down'
                              ? `Decreased by ${biomarkerStats.pctChange}%`
                              : 'Stable'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Stat grid */}
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                          <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 3 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                              {t('labResults:stats.latest')}
                            </Typography>
                            <Typography variant="h5" fontWeight={800}>
                              {biomarkerStats.latestValue}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {biomarkerStats.unit}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 3 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                              {t('labResults:stats.average')}
                            </Typography>
                            <Typography variant="h5" fontWeight={800}>
                              {biomarkerStats.average}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {biomarkerStats.unit}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 3 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                              {t('labResults:stats.min')}
                            </Typography>
                            <Typography variant="h5" fontWeight={800}>
                              {biomarkerStats.min}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {biomarkerStats.unit}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 3 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                              {t('labResults:stats.max')}
                            </Typography>
                            <Typography variant="h5" fontWeight={800}>
                              {biomarkerStats.max}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {biomarkerStats.unit}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">No statistics available.</Typography>
                    </Box>
                  )}
                </Box>

                <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e2e8f0' }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    * Status ranges represent recommended values. Consult a medical professional for advice.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 4. HISTORY TABLE / LOG */}
        <Card sx={{ borderRadius: 4, boxShadow: '0 6px 20px rgba(0,0,0,0.06)' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={currentTab}
              onChange={(e, val) => setCurrentTab(val)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ px: 2, pt: 1 }}
            >
              <Tab label="All Results" value="all" sx={{ fontWeight: 700 }} />
              {categories.map((cat) => (
                <Tab key={cat.key} label={cat.label} value={cat.key} sx={{ fontWeight: 700 }} />
              ))}
            </Tabs>
          </Box>

          <CardContent sx={{ p: 4 }}>
            {/* Search filter */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                placeholder={t('common:search') || 'Search by biomarker, lab name, or notes...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{
                  bgcolor: '#f8fafc',
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                }}
              />
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredResults.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography color="text.secondary" variant="body1">
                  {t('labResults:noResults')}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'grid', gap: 2 }}>
                {filteredResults.map((item) => {
                  const status = getStatus(item.value, item.referenceMin, item.referenceMax);
                  const statusColor = getStatusColor(status);

                  return (
                    <Card
                      key={item._id}
                      sx={{
                        bgcolor: '#fafafa',
                        borderRadius: 3,
                        boxShadow: 'none',
                        border: '1px solid #f0f0f0',
                        position: 'relative',
                        overflow: 'visible',
                      }}
                    >
                      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: 8,
                                height: 48,
                                borderRadius: 1,
                                bgcolor: statusColor,
                              }}
                            />
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="h6" fontWeight={750} sx={{ color: 'text.primary' }}>
                                  {item.testName}
                                </Typography>
                                <Chip
                                  label={`${item.value} ${item.unit}`}
                                  size="small"
                                  sx={{
                                    bgcolor: '#1976d212',
                                    color: 'primary.main',
                                    fontWeight: 700,
                                  }}
                                />
                                <Chip
                                  label={status}
                                  size="small"
                                  sx={{
                                    bgcolor: `${statusColor}15`,
                                    color: statusColor,
                                    fontWeight: 700,
                                    fontSize: '0.7rem',
                                  }}
                                />
                              </Box>

                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                📅 {new Date(item.testDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                {item.labName && ` · 🏢 ${item.labName}`}
                              </Typography>

                              {item.notes && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic', bgcolor: '#f1f5f9', p: 1, borderRadius: 2, display: 'inline-block' }}>
                                  Note: {item.notes}
                                </Typography>
                              )}
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
                            {item.document && (
                              <Tooltip title={item.document.name || 'Linked Document'}>
                                <Chip
                                  icon={<FilePresentIcon />}
                                  label={item.document.name ? (item.document.name.length > 15 ? `${item.document.name.slice(0, 12)}...` : item.document.name) : 'Report'}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                  sx={{ cursor: 'pointer' }}
                                  onClick={async () => {
                                    try {
                                      const res = await API.get(`/api/medical-documents/${item.document._id || item.document}/download`);
                                      const link = document.createElement('a');
                                      link.href = res.data.fileData;
                                      const ext = res.data.fileType.split('/')[1] || 'file';
                                      link.download = `${res.data.name}.${ext}`;
                                      document.body.appendChild(link);
                                      link.click();
                                      link.remove();
                                    } catch (err) {
                                      console.error('Failed to download document:', err);
                                    }
                                  }}
                                />
                              </Tooltip>
                            )}
                            
                            <IconButton size="small" onClick={() => handleOpenForm(item)} color="primary">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDeleteClick(item._id)} color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            )}
          </CardContent>
        </Card>

      </Box>

      {/* RECORD RESULT FORM DIALOG */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingId ? t('labResults:editResult') : t('labResults:addResult')}
        </DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('labResults:date')}
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('labResults:category')}
                select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.key} value={cat.key}>
                    {cat.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label={t('labResults:testName')}
                value={testName}
                onChange={(e) => handleTestNameChange(e.target.value)}
                placeholder="e.g. HbA1c, LDL Cholesterol, TSH"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label={t('labResults:value')}
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                inputProps={{ step: '0.01' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label={t('labResults:unit')}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. %, mg/dL, uIU/mL"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('labResults:refMin')}
                type="number"
                value={referenceMin}
                onChange={(e) => setReferenceMin(e.target.value)}
                inputProps={{ step: '0.01' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('labResults:refMax')}
                type="number"
                value={referenceMax}
                onChange={(e) => setReferenceMax(e.target.value)}
                inputProps={{ step: '0.01' }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('labResults:labName')}
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
                placeholder="e.g. Quest Diagnostics, Labcorp"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('labResults:linkedDoc')}
                select
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
              >
                <MenuItem value="">{t('labResults:none')}</MenuItem>
                {documents
                  .filter((d) => d.category === 'report' || d.category === 'other')
                  .map((doc) => (
                    <MenuItem key={doc._id} value={doc._id}>
                      📁 {doc.name} ({new Date(doc.uploadedAt).toLocaleDateString()})
                    </MenuItem>
                  ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label={t('labResults:notes')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any comments, recommendations, or symptoms..."
              />
            </Grid>
          </Grid>

        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>{t('common:cancel')}</Button>
          <Button variant="contained" onClick={handleSaveResult}>{t('common:save')}</Button>
        </DialogActions>
      </Dialog>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t('common:delete') || 'Delete Result'}</DialogTitle>
        <DialogContent>
          <Typography>{t('labResults:deleteConfirm')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>{t('common:cancel')}</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error">
            {t('common:delete') || 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
