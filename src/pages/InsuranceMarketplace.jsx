import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  Tabs,
  Tab,
  Slider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CardActions,
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShieldIcon from '@mui/icons-material/Shield';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CancelIcon from '@mui/icons-material/Cancel';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

// Default static plans in case backend is loading or unavailable
const FALLBACK_PLANS = [
  {
    id: 'coreshield-bronze',
    name: 'CareSync Bronze Saver',
    provider: 'CareShield',
    tier: 'Bronze',
    premium: 150,
    deductible: 5000,
    copay: 40,
    networkType: 'HMO',
    benefits: [
      'Free preventive care & checkups',
      'Low monthly premium payments',
      'Virtual doctor visits covered at 100%',
      'Prescription discount benefits included'
    ]
  }
];

export default function InsuranceMarketplace() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();

  // State Management
  const [activeTab, setActiveTab] = useState(0);
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [policies, setPolicies] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingPolicies, setLoadingPolicies] = useState(false);

  // Quote Calculator Inputs
  const [age, setAge] = useState(30);
  const [tobacco, setTobacco] = useState('no');
  const [familyMembers, setFamilyMembers] = useState(0);
  const [zipCode, setZipCode] = useState('');
  const [preExisting, setPreExisting] = useState([]);

  // Marketplace Filters
  const [selectedTier, setSelectedTier] = useState('All');
  const [selectedNetwork, setSelectedNetwork] = useState('All');
  const [sortOrder, setSortOrder] = useState('asc'); // asc or desc

  // Compare Plans State
  const [compareList, setCompareList] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);

  // Purchase Wizard State
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [wizardStep, setWizardStep] = useState(0);

  // Form Details
  const [applicantName, setApplicantName] = useState('');
  const [applicantDOB, setApplicantDOB] = useState('');
  const [applicantGender, setApplicantGender] = useState('male');
  const [applicantSSN, setApplicantSSN] = useState('');
  const [householdMembers, setHouseholdMembers] = useState([]);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');

  // Cancel Policy Dialog
  const [cancelPolicyItem, setCancelPolicyItem] = useState(null);

  // Feedback State
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [formError, setFormError] = useState('');

  // Initial Fetching
  useEffect(() => {
    const fetchPlans = async () => {
      setLoadingPlans(true);
      try {
        const res = await API.get('/api/insurance/plans');
        setPlans(res.data);
      } catch (err) {
        console.warn('Backend /plans endpoint failed, using static plans.', err);
        setPlans(FALLBACK_PLANS);
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserPolicies();
    }
    // eslint-disable-next-line
  }, [isAuthenticated]);

  const fetchUserPolicies = async () => {
    setLoadingPolicies(true);
    try {
      const res = await API.get('/api/insurance/policies');
      setPolicies(res.data);
    } catch (err) {
      console.error('Failed to fetch user policies:', err);
    } finally {
      setLoadingPolicies(false);
    }
  };

  // Helper: Quote Multiplier Logic
  const getQuoteMultiplier = () => {
    const ageFactor = age > 30 ? 1 + (age - 30) * 0.015 : 1;
    const tobaccoFactor = tobacco === 'yes' ? 1.25 : 1.0;
    const familyFactor = 1 + familyMembers * 0.45;
    const preExistingFactor = 1 + preExisting.length * 0.08;
    return ageFactor * tobaccoFactor * familyFactor * preExistingFactor;
  };

  const calculatePremium = (basePremium) => {
    return Math.round(basePremium * getQuoteMultiplier());
  };

  // Handle Condition Toggling
  const handleConditionChange = (condition) => {
    if (preExisting.includes(condition)) {
      setPreExisting(preExisting.filter((c) => c !== condition));
    } else {
      setPreExisting([...preExisting, condition]);
    }
  };

  // Compare Checkbox Handler
  const handleCompareCheck = (plan) => {
    if (compareList.some((p) => p.id === plan.id)) {
      setCompareList(compareList.filter((p) => p.id !== plan.id));
    } else {
      if (compareList.length >= 3) {
        setSnackbarMessage('You can compare a maximum of 3 plans at a time.');
        setSnackbarOpen(true);
        return;
      }
      setCompareList([...compareList, plan]);
    }
  };

  // Switch tabs
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Initiate purchase flow
  const handleStartPurchase = (plan) => {
    if (!isAuthenticated) {
      setSnackbarMessage('Please log in to purchase an insurance plan.');
      setSnackbarOpen(true);
      return;
    }
    setSelectedPlan(plan);
    setApplicantName(user?.name || '');
    setApplicantDOB('');
    setApplicantSSN('');
    setHouseholdMembers(
      Array.from({ length: familyMembers }, () => ({ name: '', relationship: '' }))
    );
    setCardName(user?.name || '');
    setCardNumber('');
    setCardExpiry('');
    setCardCVV('');
    setWizardStep(0);
    setFormError('');
    setPurchaseOpen(true);
  };

  // Household Member Input change
  const handleHouseholdChange = (index, field, value) => {
    const nextMembers = [...householdMembers];
    nextMembers[index][field] = value;
    setHouseholdMembers(nextMembers);
  };

  // SSN input formatting
  const handleSSNInput = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    setApplicantSSN(digits);
  };

  // Wizard Step verification
  const handleNextStep = () => {
    setFormError('');
    if (wizardStep === 0) {
      if (!applicantName.trim() || !applicantDOB.trim() || !applicantSSN) {
        setFormError('Please fill in your name, DOB, and SSN digits.');
        return;
      }
      if (applicantSSN.length !== 4) {
        setFormError('Please enter exactly the last 4 digits of your SSN.');
        return;
      }
    } else if (wizardStep === 1) {
      const incomplete = householdMembers.some(
        (m) => !m.name.trim() || !m.relationship.trim()
      );
      if (incomplete) {
        setFormError('Please fill in the name and relationship for all covered members.');
        return;
      }
    } else if (wizardStep === 2) {
      if (
        !cardName.trim() ||
        cardNumber.replace(/\s/g, '').length < 15 ||
        !cardExpiry.trim() ||
        cardCVV.length < 3
      ) {
        setFormError('Please enter a valid credit card details.');
        return;
      }
    }
    setWizardStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setWizardStep((prev) => prev - 1);
  };

  // Submit Policy Purchase
  const handleFinalizeEnrollment = async () => {
    try {
      const reqPayload = {
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        provider: selectedPlan.provider,
        premium: calculatePremium(selectedPlan.premium),
        deductible: selectedPlan.deductible,
        copay: selectedPlan.copay,
        coverageType: familyMembers > 0 ? 'family' : 'individual',
        networkType: selectedPlan.networkType,
        primaryInsured: {
          name: applicantName,
          dob: applicantDOB,
          ssnLastFour: applicantSSN
        },
        coveredMembers: householdMembers
      };

      await API.post('/api/insurance/policies', reqPayload);
      setSnackbarMessage(t('insurance:policyPurchasedSuccess'));
      setSnackbarOpen(true);
      setPurchaseOpen(false);
      // Fetch latest policies and direct user to "My Policies" tab
      fetchUserPolicies();
      setActiveTab(1);
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Error processing enrollment.');
    }
  };

  // Download PDF Certification
  const handleDownloadPDF = async (policyId, policyNumber) => {
    try {
      const response = await API.get(`/api/insurance/policies/${policyId}/download`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `CareSync_Policy_${policyNumber}.pdf`;
      link.click();
      setSnackbarMessage('PDF Download initiated.');
      setSnackbarOpen(true);
    } catch (err) {
      console.error(err);
      setSnackbarMessage('Failed to download policy certificate PDF.');
      setSnackbarOpen(true);
    }
  };

  // Cancel Policy Execution
  const handleCancelPolicy = async () => {
    if (!cancelPolicyItem) return;
    try {
      await API.delete(`/api/insurance/policies/${cancelPolicyItem._id}`);
      setSnackbarMessage(t('insurance:policyCancelledSuccess'));
      setSnackbarOpen(true);
      setCancelPolicyItem(null);
      fetchUserPolicies();
    } catch (err) {
      console.error(err);
      setSnackbarMessage('Failed to cancel policy.');
      setSnackbarOpen(true);
    }
  };

  // Filtering Logic
  const filteredPlans = plans
    .filter((plan) => selectedTier === 'All' || plan.tier === selectedTier)
    .filter((plan) => selectedNetwork === 'All' || plan.networkType === selectedNetwork)
    .sort((a, b) => {
      const costA = calculatePremium(a.premium);
      const costB = calculatePremium(b.premium);
      return sortOrder === 'asc' ? costA - costB : costB - costA;
    });

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f8fb', pb: 8 }}>
      {/* Hero Header Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          py: { xs: 4, md: 6 },
          px: 2,
          textAlign: 'center',
          mb: 4,
          boxShadow: 2
        }}
      >
        <Box sx={{ maxWidth: 960, mx: 'auto' }}>
          <Typography
            variant="h3"
            fontWeight={900}
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}
          >
            <ShieldIcon fontSize="large" sx={{ color: '#43e97b' }} />
            {t('insurance:title')}
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
            {t('insurance:subtitle')}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 2 }}>
        {/* Navigation Breadcrumb */}
        <Button
          component={Link}
          to="/dashboard"
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          sx={{ mb: 4, borderRadius: 2 }}
        >
          Back to Dashboard
        </Button>

        {/* Tab Selection */}
        <Paper sx={{ mb: 4, borderRadius: 3, boxShadow: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab
              label={t('insurance:tabMarketplace')}
              sx={{ py: 2, fontSize: '1rem', fontWeight: 700 }}
            />
            <Tab
              label={`${t('insurance:tabMyPolicies')} (${policies.length})`}
              sx={{ py: 2, fontSize: '1rem', fontWeight: 700 }}
              disabled={!isAuthenticated}
            />
          </Tabs>
        </Paper>

        {/* Tab 1: Marketplace and Calculator */}
        {activeTab === 0 && (
          <Grid container spacing={4}>
            {/* Quote Calculator Sidebar */}
            <Grid item xs={12} lg={4}>
              <Card sx={{ borderRadius: 4, boxShadow: 4, position: 'sticky', top: 96 }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" fontWeight={800} color="primary" gutterBottom>
                    ⚙️ {t('insurance:quoteCalculator')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {t('insurance:calculatorDesc')}
                  </Typography>

                  <Box sx={{ mt: 3, display: 'grid', gap: 3 }}>
                    {/* Age Input */}
                    <Box>
                      <Typography variant="body2" fontWeight={700} gutterBottom>
                        👤 {t('insurance:ageLabel')}: {age}
                      </Typography>
                      <Slider
                        value={age}
                        min={18}
                        max={100}
                        onChange={(e, val) => setAge(val)}
                        valueLabelDisplay="auto"
                        sx={{ mt: 1 }}
                      />
                    </Box>

                    {/* Tobacco User Check */}
                    <FormControl>
                      <FormLabel sx={{ fontSize: '0.875rem', fontWeight: 700, mb: 1 }}>
                        🚬 {t('insurance:tobaccoLabel')}
                      </FormLabel>
                      <RadioGroup
                        row
                        value={tobacco}
                        onChange={(e) => setTobacco(e.target.value)}
                      >
                        <FormControlLabel
                          value="no"
                          control={<Radio />}
                          label={t('insurance:tobaccoNo')}
                        />
                        <FormControlLabel
                          value="yes"
                          control={<Radio />}
                          label={t('insurance:tobaccoYes')}
                        />
                      </RadioGroup>
                    </FormControl>

                    {/* Family Members to Cover */}
                    <Box>
                      <Typography variant="body2" fontWeight={700} gutterBottom>
                        👨‍👩‍👧‍👦 {t('insurance:familyLabel')}: {familyMembers}
                      </Typography>
                      <Slider
                        value={familyMembers}
                        min={0}
                        max={5}
                        onChange={(e, val) => setFamilyMembers(val)}
                        valueLabelDisplay="auto"
                        marks
                        sx={{ mt: 1 }}
                      />
                    </Box>

                    {/* ZIP Code */}
                    <TextField
                      fullWidth
                      label={t('insurance:zipCodeLabel')}
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                      placeholder="e.g. 90210"
                      size="small"
                    />

                    {/* Pre-existing Conditions */}
                    <FormControl component="fieldset">
                      <FormLabel component="legend" sx={{ fontSize: '0.875rem', fontWeight: 700, mb: 1 }}>
                        🏥 {t('insurance:preExistingLabel')}
                      </FormLabel>
                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={preExisting.includes('Diabetes')}
                              onChange={() => handleConditionChange('Diabetes')}
                            />
                          }
                          label={t('insurance:conditionDiabetes')}
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={preExisting.includes('Hypertension')}
                              onChange={() => handleConditionChange('Hypertension')}
                            />
                          }
                          label={t('insurance:conditionHypertension')}
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={preExisting.includes('Asthma')}
                              onChange={() => handleConditionChange('Asthma')}
                            />
                          }
                          label={t('insurance:conditionAsthma')}
                        />
                      </FormGroup>
                    </FormControl>

                    <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 1 }}>
                      Multiplier applied: <strong>{getQuoteMultiplier().toFixed(2)}x</strong>
                    </Alert>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Plans List Grid */}
            <Grid item xs={12} lg={8}>
              {/* Marketplace Filter Strip */}
              <Paper sx={{ p: 3, mb: 4, borderRadius: 4, boxShadow: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <FormLabel sx={{ fontSize: '0.75rem', fontWeight: 700 }}>Tier</FormLabel>
                      <RadioGroup
                        row
                        value={selectedTier}
                        onChange={(e) => setSelectedTier(e.target.value)}
                      >
                        <FormControlLabel value="All" control={<Radio size="small" />} label="All" />
                        <FormControlLabel value="Bronze" control={<Radio size="small" />} label="Bronze" />
                        <FormControlLabel value="Silver" control={<Radio size="small" />} label="Silver" />
                        <FormControlLabel value="Gold" control={<Radio size="small" />} label="Gold" />
                      </RadioGroup>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <FormLabel sx={{ fontSize: '0.75rem', fontWeight: 700 }}>Network</FormLabel>
                      <RadioGroup
                        row
                        value={selectedNetwork}
                        onChange={(e) => setSelectedNetwork(e.target.value)}
                      >
                        <FormControlLabel value="All" control={<Radio size="small" />} label="All" />
                        <FormControlLabel value="HMO" control={<Radio size="small" />} label="HMO" />
                        <FormControlLabel value="PPO" control={<Radio size="small" />} label="PPO" />
                        <FormControlLabel value="EPO" control={<Radio size="small" />} label="EPO" />
                      </RadioGroup>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <FormLabel sx={{ fontSize: '0.75rem', fontWeight: 700 }}>Sort by Premium</FormLabel>
                      <RadioGroup
                        row
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                      >
                        <FormControlLabel value="asc" control={<Radio size="small" />} label="Lowest" />
                        <FormControlLabel value="desc" control={<Radio size="small" />} label="Highest" />
                      </RadioGroup>
                    </FormControl>
                  </Grid>
                </Grid>
              </Paper>

              {/* Plans Display */}
              {loadingPlans ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress size={50} />
                </Box>
              ) : (
                <Box sx={{ display: 'grid', gap: 3 }}>
                  {filteredPlans.map((plan) => {
                    const dynamicPrice = calculatePremium(plan.premium);
                    const isChecked = compareList.some((p) => p.id === plan.id);
                    return (
                      <Card
                        key={plan.id}
                        sx={{
                          borderRadius: 4,
                          boxShadow: 3,
                          border: isChecked ? '2px solid #1976d2' : '1px solid #e0e0e0',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 6
                          }
                        }}
                      >
                        <CardContent sx={{ p: 4 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={8}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                <Typography variant="h5" fontWeight={800} color="primary.dark">
                                  {plan.name}
                                </Typography>
                                <Chip
                                  label={plan.tier}
                                  size="small"
                                  color={
                                    plan.tier === 'Gold'
                                      ? 'warning'
                                      : plan.tier === 'Silver'
                                      ? 'default'
                                      : 'error'
                                  }
                                  sx={{ fontWeight: 700 }}
                                />
                                <Chip label={plan.networkType} size="small" sx={{ fontWeight: 700 }} />
                              </Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Provider: <strong>{plan.provider}</strong>
                              </Typography>

                              {/* Features checklist */}
                              <Box sx={{ mt: 2, pl: 1 }}>
                                {plan.benefits.map((b, i) => (
                                  <Typography
                                    key={i}
                                    variant="body2"
                                    sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}
                                  >
                                    <CheckCircleIcon sx={{ color: '#43e97b', fontSize: 16 }} />
                                    {b}
                                  </Typography>
                                ))}
                              </Box>
                            </Grid>

                            {/* Cost Summary block */}
                            <Grid
                              item
                              xs={12}
                              sm={4}
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: { xs: 'flex-start', sm: 'flex-end' },
                                borderLeft: { xs: 'none', sm: '1px solid #eeeeee' },
                                pl: { xs: 0, sm: 3 }
                              }}
                            >
                              <Typography variant="h4" fontWeight={900} color="primary">
                                ${dynamicPrice}
                                <Typography component="span" variant="caption" color="text.secondary">
                                  /mo
                                </Typography>
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                                Deductible: <strong>${plan.deductible}</strong>
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Co-pay: <strong>${plan.copay} /visit</strong>
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>

                        {/* Card Actions */}
                        <CardActions
                          sx={{
                            px: 4,
                            pb: 3,
                            pt: 0,
                            justifyContent: 'space-between',
                            borderTop: '1px solid #f5f5f5'
                          }}
                        >
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={isChecked}
                                onChange={() => handleCompareCheck(plan)}
                              />
                            }
                            label={
                              <Typography variant="body2" fontWeight={600}>
                                {t('insurance:comparePlans')}
                              </Typography>
                            }
                          />

                          <Button
                            variant="contained"
                            onClick={() => handleStartPurchase(plan)}
                            sx={{ fontWeight: 700, borderRadius: 2 }}
                          >
                            {t('insurance:purchase')}
                          </Button>
                        </CardActions>
                      </Card>
                    );
                  })}
                </Box>
              )}
            </Grid>
          </Grid>
        )}

        {/* Tab 2: User Policies list */}
        {activeTab === 1 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h5" fontWeight={800} color="primary" gutterBottom>
              📋 {t('insurance:activePolicies')}
            </Typography>

            {loadingPolicies ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={50} />
              </Box>
            ) : policies.length === 0 ? (
              <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, boxShadow: 1 }}>
                <ShieldIcon sx={{ fontSize: 72, color: 'divider', mb: 2 }} />
                <Typography variant="body1" color="text.secondary" paragraph>
                  {t('insurance:noPolicies')}
                </Typography>
                <Button variant="contained" onClick={() => setActiveTab(0)} sx={{ borderRadius: 2 }}>
                  Browse Marketplace
                </Button>
              </Paper>
            ) : (
              <Box sx={{ display: 'grid', gap: 3, mt: 3 }}>
                {policies.map((policy) => (
                  <Card
                    key={policy._id}
                    sx={{
                      borderRadius: 4,
                      boxShadow: 3,
                      borderLeft: `6px solid ${policy.status === 'active' ? '#43e97b' : '#d32f2f'}`
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={7}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                            <Typography variant="h5" fontWeight={800}>
                              {policy.planName}
                            </Typography>
                            <Chip
                              label={policy.status === 'active' ? 'Active' : 'Cancelled'}
                              color={policy.status === 'active' ? 'success' : 'error'}
                              size="small"
                              sx={{ fontWeight: 700 }}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            Policy Number: <strong>{policy.policyNumber}</strong> | Network:{' '}
                            <strong>{policy.networkType}</strong>
                          </Typography>

                          {/* Member List Details */}
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" fontWeight={700} gutterBottom>
                              👤 Covered Individuals:
                            </Typography>
                            <Typography variant="body2">
                              • {policy.primaryInsured?.name} (Self)
                            </Typography>
                            {policy.coveredMembers?.map((member, i) => (
                              <Typography key={i} variant="body2" sx={{ pl: 2 }}>
                                • {member.name} ({member.relationship})
                              </Typography>
                            ))}
                          </Box>
                        </Grid>

                        <Grid item xs={12} md={5} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: { md: 'flex-end' } }}>
                          <Box sx={{ textAlign: { md: 'right' } }}>
                            <Typography variant="h5" fontWeight={800} color="primary">
                              ${policy.premium}/mo
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Deductible: <strong>${policy.deductible}</strong> | Co-pay:{' '}
                              <strong>${policy.copay}</strong>
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                              Effective: {new Date(policy.startDate).toLocaleDateString()} -{' '}
                              {new Date(policy.endDate).toLocaleDateString()}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', gap: 1.5, mt: 3 }}>
                            <Button
                              variant="outlined"
                              color="primary"
                              startIcon={<FileDownloadIcon />}
                              onClick={() => handleDownloadPDF(policy._id, policy.policyNumber)}
                              size="small"
                              sx={{ fontWeight: 600, borderRadius: 2 }}
                            >
                              Download Proof
                            </Button>
                            {policy.status === 'active' && (
                              <Button
                                variant="outlined"
                                color="error"
                                startIcon={<CancelIcon />}
                                onClick={() => setCancelPolicyItem(policy)}
                                size="small"
                                sx={{ fontWeight: 600, borderRadius: 2 }}
                              >
                                {t('insurance:cancelPolicy')}
                              </Button>
                            )}
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Floating Compare Action Bar */}
      {compareList.length > 0 && activeTab === 0 && (
        <Paper
          elevation={10}
          sx={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            p: 2,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #1976d2'
          }}
        >
          <Typography variant="body2" fontWeight={700}>
            Selected {compareList.length} / 3 Plans
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {compareList.map((plan) => (
              <Chip
                key={plan.id}
                label={plan.name}
                onDelete={() => handleCompareCheck(plan)}
                color="primary"
                variant="outlined"
                size="small"
              />
            ))}
          </Box>
          <Button
            variant="contained"
            size="small"
            onClick={() => setCompareOpen(true)}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            Compare
          </Button>
          <IconButton size="small" onClick={() => setCompareList([])}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Paper>
      )}

      {/* dialog comparison view */}
      <Dialog
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'primary.dark' }}>
          Plan Comparison Side-by-Side
        </DialogTitle>
        <DialogContent dividers>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Parameters</TableCell>
                  {compareList.map((plan) => (
                    <TableCell key={plan.id} sx={{ fontWeight: 800, color: 'primary.main' }}>
                      {plan.name}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Provider</TableCell>
                  {compareList.map((plan) => (
                    <TableCell key={plan.id}>{plan.provider}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Metal Tier</TableCell>
                  {compareList.map((plan) => (
                    <TableCell key={plan.id}>{plan.tier}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Network Type</TableCell>
                  {compareList.map((plan) => (
                    <TableCell key={plan.id}>{plan.networkType}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Calculated Premium</TableCell>
                  {compareList.map((plan) => (
                    <TableCell key={plan.id} sx={{ fontWeight: 700, color: 'primary.dark' }}>
                      ${calculatePremium(plan.premium)}/mo
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Annual Deductible</TableCell>
                  {compareList.map((plan) => (
                    <TableCell key={plan.id}>${plan.deductible}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Primary Co-pay</TableCell>
                  {compareList.map((plan) => (
                    <TableCell key={plan.id}>${plan.copay} /visit</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Key Benefits</TableCell>
                  {compareList.map((plan) => (
                    <TableCell key={plan.id}>
                      <Box sx={{ display: 'grid', gap: 0.5 }}>
                        {plan.benefits.map((b, idx) => (
                          <Typography key={idx} variant="caption" display="block">
                            • {b}
                          </Typography>
                        ))}
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setCompareOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* dialog checkout purchase wizard */}
      <Dialog
        open={purchaseOpen}
        onClose={() => setPurchaseOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'primary.dark' }}>
          {t('insurance:purchaseTitle')}
        </DialogTitle>
        <DialogContent dividers>
          {/* Stepper Indicators */}
          <Stepper activeStep={wizardStep} sx={{ mb: 4 }}>
            <Step>
              <StepLabel>Applicant</StepLabel>
            </Step>
            <Step>
              <StepLabel>Household</StepLabel>
            </Step>
            <Step>
              <StepLabel>Payment</StepLabel>
            </Step>
            <Step>
              <StepLabel>Verify</StepLabel>
            </Step>
          </Stepper>

          {formError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {formError}
            </Alert>
          )}

          {/* Step 0: Primary Insured */}
          {wizardStep === 0 && (
            <Box sx={{ display: 'grid', gap: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Provide the details for the primary policyholder.
              </Typography>
              <TextField
                fullWidth
                label="Full Name"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                required
              />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date of Birth"
                    type="date"
                    value={applicantDOB}
                    onChange={(e) => setApplicantDOB(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <FormLabel sx={{ fontSize: '0.875rem' }}>Gender</FormLabel>
                    <RadioGroup
                      row
                      value={applicantGender}
                      onChange={(e) => setApplicantGender(e.target.value)}
                    >
                      <FormControlLabel value="male" control={<Radio />} label="Male" />
                      <FormControlLabel value="female" control={<Radio />} label="Female" />
                    </RadioGroup>
                  </FormControl>
                </Grid>
              </Grid>
              <TextField
                fullWidth
                label="SSN (Last 4 Digits)"
                value={applicantSSN}
                onChange={(e) => handleSSNInput(e.target.value)}
                placeholder="XXXX"
                helperText="Required for identity validation"
                required
              />
            </Box>
          )}

          {/* Step 1: Household Members */}
          {wizardStep === 1 && (
            <Box sx={{ display: 'grid', gap: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Confirm covered household members. Based on your settings, you are adding{' '}
                <strong>{familyMembers}</strong> dependent(s).
              </Typography>
              {householdMembers.length === 0 ? (
                <Alert severity="info" icon={<PersonIcon />}>
                  Individual coverage selected. No additional household members.
                </Alert>
              ) : (
                householdMembers.map((member, i) => (
                  <Paper key={i} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                      Dependent #{i + 1}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Full Name"
                          value={member.name}
                          onChange={(e) => handleHouseholdChange(i, 'name', e.target.value)}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Relationship"
                          placeholder="Spouse, Child, etc."
                          value={member.relationship}
                          onChange={(e) => handleHouseholdChange(i, 'relationship', e.target.value)}
                          required
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                ))
              )}
            </Box>
          )}

          {/* Step 2: Payment Details */}
          {wizardStep === 2 && (
            <Box sx={{ display: 'grid', gap: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Enter simulated payment information to activate coverage.
              </Typography>
              <TextField
                fullWidth
                label="Cardholder Name"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                required
              />
              <TextField
                fullWidth
                label="Credit Card Number"
                value={cardNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
                  setCardNumber(val.slice(0, 19));
                }}
                placeholder="4111 2222 3333 4444"
                InputProps={{
                  startAdornment: <CreditCardIcon sx={{ color: 'text.secondary', mr: 1 }} />
                }}
                required
              />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Expiration Date"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length > 2) {
                        val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
                      }
                      setCardExpiry(val.slice(0, 5));
                    }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="CVV"
                    value={cardCVV}
                    onChange={(e) => setCardCVV(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="123"
                    required
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Step 3: Final confirmation details */}
          {wizardStep === 3 && (
            <Box sx={{ display: 'grid', gap: 2 }}>
              <Alert severity="success" icon={<CheckCircleIcon />}>
                Verify all information before finalizing purchase.
              </Alert>

              <Paper sx={{ p: 3, bgcolor: '#fdfdfd', borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight={700} color="primary" gutterBottom>
                  Coverage Summary
                </Typography>
                <Typography variant="body2">
                  Plan: <strong>{selectedPlan.name}</strong>
                </Typography>
                <Typography variant="body2">
                  Monthly Premium:{' '}
                  <strong style={{ color: '#1976d2' }}>
                    ${calculatePremium(selectedPlan.premium)}.00
                  </strong>
                </Typography>
                <Typography variant="body2">
                  Deductible: <strong>${selectedPlan.deductible}</strong> | Co-pay:{' '}
                  <strong>${selectedPlan.copay}</strong>
                </Typography>

                <Typography variant="subtitle1" fontWeight={700} color="primary" sx={{ mt: 3, mb: 1 }}>
                  Primary Insured
                </Typography>
                <Typography variant="body2">
                  Name: <strong>{applicantName}</strong>
                </Typography>
                <Typography variant="body2">
                  Date of Birth: <strong>{applicantDOB}</strong>
                </Typography>
                <Typography variant="body2">
                  SSN Masked: <strong>***-**-{applicantSSN}</strong>
                </Typography>

                {householdMembers.length > 0 && (
                  <>
                    <Typography variant="subtitle1" fontWeight={700} color="primary" sx={{ mt: 3, mb: 1 }}>
                      Dependents Covered
                    </Typography>
                    {householdMembers.map((m, idx) => (
                      <Typography key={idx} variant="body2">
                        • {m.name} ({m.relationship})
                      </Typography>
                    ))}
                  </>
                )}
              </Paper>
            </Box>
          )}
        </DialogContent>

        {/* Action Controls */}
        <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
          <Button
            disabled={wizardStep === 0}
            onClick={handlePrevStep}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Back
          </Button>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              onClick={() => setPurchaseOpen(false)}
              color="inherit"
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>

            {wizardStep < 3 ? (
              <Button
                variant="contained"
                onClick={handleNextStep}
                sx={{ fontWeight: 700, borderRadius: 2 }}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                onClick={handleFinalizeEnrollment}
                sx={{ fontWeight: 700, borderRadius: 2 }}
              >
                Finalize Enrollment
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog for Cancellation */}
      <Dialog
        open={Boolean(cancelPolicyItem)}
        onClose={() => setCancelPolicyItem(null)}
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {t('insurance:cancelConfirmTitle')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {t('insurance:cancelConfirmText')}
          </Typography>
          {cancelPolicyItem && (
            <Typography variant="body2" sx={{ mt: 2, fontWeight: 700 }}>
              Policy Number: {cancelPolicyItem.policyNumber}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setCancelPolicyItem(null)} variant="outlined" sx={{ borderRadius: 2 }}>
            No, Keep Active
          </Button>
          <Button onClick={handleCancelPolicy} color="error" variant="contained" sx={{ borderRadius: 2 }}>
            {t('insurance:confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Info/Warning Banner Dialog */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        action={
          <IconButton size="small" color="inherit" onClick={() => setSnackbarOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </Box>
  );
}
