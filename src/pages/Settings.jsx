import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Paper,
  Grid,
  Divider,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  MenuItem,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Card,
  Stack,
} from '@mui/material';
import {
  AccountCircle as AccountIcon,
  Dashboard as DashboardIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Download as DownloadIcon,
  RestartAlt as RestartIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  requestNotificationPermission,
  scheduleNotifications,
  clearScheduledNotifications,
  PUSH_ENABLED_KEY,
} from '../utils/notifications';
import {
  getEmailNotificationsEnabled,
  setEmailNotificationsEnabled,
  getSoundNotificationsEnabled,
  setSoundNotificationsEnabled,
  getDashboardSettings,
  setDashboardSettings,
} from '../utils/settingsPreferences';
import { SUPPORTED_LANGUAGES } from '../i18n';
import { useThemeMode } from '../context/ThemeContext';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, updateProfile } = useAuth();
  const { mode, toggleTheme } = useThemeMode();

  const [activeTab, setActiveTab] = useState(0);

  // Profile Form State
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.avatar || '',
    phone: user?.phone || '',
    age: user?.age || '',
    bloodGroup: user?.bloodGroup || '',
    allergies: user?.allergies || '',
  });

  // Notification & Preference States
  const [notifications, setNotifications] = useState(() =>
    getEmailNotificationsEnabled()
  );
  const [pushEnabled, setPushEnabled] = useState(
    () => localStorage.getItem(PUSH_ENABLED_KEY) === 'true'
  );
  const [soundEnabled, setSoundEnabledState] = useState(() =>
    getSoundNotificationsEnabled()
  );

  // Dashboard Settings State
  const [dashboardConfig, setDashboardConfig] = useState(() =>
    getDashboardSettings()
  );

  // UI Feedback Dialogs & Snackbars
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  if (!isAuthenticated || !user) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary">
          {t('settings:loginPrompt', 'Please log in to view your settings.')}
        </Typography>
      </Box>
    );
  }

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setProfile((prev) => ({ ...prev, avatar: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleEmailNotificationsToggle = () => {
    const newValue = !notifications;
    setNotifications(newValue);
    setEmailNotificationsEnabled(newValue);
  };

  const handleSoundToggle = () => {
    const newValue = !soundEnabled;
    setSoundEnabledState(newValue);
    setSoundNotificationsEnabled(newValue);
  };

  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  const handleDashboardToggle = (key) => {
    const updated = {
      ...dashboardConfig,
      [key]: !dashboardConfig[key],
    };
    setDashboardConfig(updated);
    setDashboardSettings(updated);
    window.dispatchEvent(new Event('caresync_settings_updated'));
  };

  const handleCardToggle = (cardId) => {
    const currentCards = dashboardConfig.visibleCards || {};
    const updated = {
      ...dashboardConfig,
      visibleCards: {
        ...currentCards,
        [cardId]: !currentCards[cardId],
      },
    };
    setDashboardConfig(updated);
    setDashboardSettings(updated);
    window.dispatchEvent(new Event('caresync_settings_updated'));
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar,
        phone: profile.phone,
        age: profile.age,
        bloodGroup: profile.bloodGroup,
        allergies: profile.allergies,
      });
      setSnackbar({
        open: true,
        message: t('settings:saveSuccess', 'Settings saved successfully.'),
        severity: 'success',
      });
    } catch (err) {
      console.error('Save settings error:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to save changes.',
        severity: 'error',
      });
    }
  };

  const handlePushToggle = async () => {
    const newValue = !pushEnabled;

    if (newValue) {
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
        setSnackbar({
          open: true,
          message: t('settings:pushPermissionDenied', 'Notification permission was denied.'),
          severity: 'warning',
        });
        return;
      }

      localStorage.setItem(PUSH_ENABLED_KEY, 'true');
      setPushEnabled(true);

      try {
        const saved = localStorage.getItem('caresync_medicines');
        if (saved) {
          scheduleNotifications(JSON.parse(saved));
        }
      } catch (err) {
        console.warn('Failed to parse saved medicines:', err);
      }

      setSnackbar({
        open: true,
        message: t('settings:pushEnabledMsg', 'Push notifications enabled!'),
        severity: 'success',
      });
    } else {
      localStorage.setItem(PUSH_ENABLED_KEY, 'false');
      setPushEnabled(false);
      clearScheduledNotifications();
      setSnackbar({
        open: true,
        message: t('settings:pushDisabledMsg', 'Push notifications disabled.'),
        severity: 'info',
      });
    }
  };

  const handleExportData = () => {
    const backupData = {
      user: JSON.parse(localStorage.getItem('caresync_user') || '{}'),
      medicines: JSON.parse(localStorage.getItem('caresync_medicines') || '[]'),
      emergencyContacts: JSON.parse(localStorage.getItem('caresync_emergency_contacts') || '[]'),
      dashboardSettings: getDashboardSettings(),
      emailNotifications: getEmailNotificationsEnabled(),
      pushEnabled: localStorage.getItem(PUSH_ENABLED_KEY) === 'true',
      exportDate: new Date().toISOString(),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `CareSync_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setSnackbar({
      open: true,
      message: 'Personal data backup downloaded successfully.',
      severity: 'success',
    });
  };

  const handleResetConfirm = () => {
    localStorage.clear();
    setResetDialogOpen(false);
    window.location.reload();
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, mb: 8, p: 2 }}>
      <Paper elevation={4} sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <Box sx={{ p: 3, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h4" fontWeight={800}>
            {t('settings:profileSettings', 'Application & Profile Settings')}
          </Typography>
          <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
            Customize your account, dashboard layout, notifications, and preferences.
          </Typography>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab icon={<AccountIcon />} iconPosition="start" label={t('settings:tabAccount', 'Account & Profile')} />
            <Tab icon={<DashboardIcon />} iconPosition="start" label={t('settings:tabDashboard', 'Dashboard Layout')} />
            <Tab icon={<NotificationsIcon />} iconPosition="start" label={t('settings:tabNotifications', 'Notifications & Preferences')} />
            <Tab icon={<SecurityIcon />} iconPosition="start" label={t('settings:tabData', 'Data & Privacy')} />
          </Tabs>
        </Box>

        <Box sx={{ p: 4 }}>
          {/* TAB 0: ACCOUNT & PROFILE */}
          {activeTab === 0 && (
            <Stack spacing={3}>
              <Grid container spacing={3} sx={{ alignItems: 'center' }}>
                <Grid size={{ xs: 12, sm: 4 }} sx={{ textAlign: 'center' }}>
                  <Avatar src={profile.avatar} sx={{ width: 100, height: 100, mx: 'auto', mb: 2, boxShadow: 3 }} />
                  <Button variant="outlined" component="label" size="small">
                    {t('settings:changeAvatar', 'Change Avatar')}
                    <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
                  </Button>
                </Grid>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <Stack spacing={2}>
                    <TextField label={t('settings:name', 'Name')} name="name" value={profile.name} onChange={handleProfileChange} fullWidth />
                    <TextField label={t('settings:email', 'Email')} name="email" value={profile.email} onChange={handleProfileChange} fullWidth />
                  </Stack>
                </Grid>
              </Grid>

              <Divider />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label={t('settings:phone', 'Phone Number')}
                    name="phone"
                    value={profile.phone}
                    onChange={handleProfileChange}
                    fullWidth
                    placeholder="+91 98765 43210"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label={t('settings:age', 'Age')}
                    name="age"
                    type="number"
                    value={profile.age}
                    onChange={handleProfileChange}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label={t('settings:bloodGroup', 'Blood Group')}
                    name="bloodGroup"
                    value={profile.bloodGroup}
                    onChange={handleProfileChange}
                    fullWidth
                    placeholder="e.g. O+"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label={t('settings:medicalNotes', 'Medical Notes / Allergies')}
                    name="allergies"
                    value={profile.allergies}
                    onChange={handleProfileChange}
                    fullWidth
                    placeholder="e.g. Penicillin allergy"
                  />
                </Grid>
              </Grid>

              <Box sx={{ textAlign: 'right', mt: 2 }}>
                <Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={handleSaveProfile} sx={{ px: 4, py: 1, borderRadius: 2 }}>
                  {t('settings:saveChanges', 'Save Changes')}
                </Button>
              </Box>
            </Stack>
          )}

          {/* TAB 1: DASHBOARD CUSTOMIZATION */}
          {activeTab === 1 && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {t('settings:dashboardTitle', 'Dashboard Customization')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('settings:dashboardHint', 'Configure which banners, quotes, stats, and cards appear on your Dashboard.')}
                </Typography>
              </Box>

              <Card variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} mb={1}>
                  Layout Banners & Sections
                </Typography>
                <Stack spacing={1}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={dashboardConfig.showGreeting !== false}
                        onChange={() => handleDashboardToggle('showGreeting')}
                        color="primary"
                      />
                    }
                    label={t('settings:showGreeting', 'Show Greeting Banner')}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={dashboardConfig.showStatsRow !== false}
                        onChange={() => handleDashboardToggle('showStatsRow')}
                        color="primary"
                      />
                    }
                    label={t('settings:showStatsRow', 'Show Statistics Summary Row')}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={dashboardConfig.showHealthQuote !== false}
                        onChange={() => handleDashboardToggle('showHealthQuote')}
                        color="primary"
                      />
                    }
                    label={t('settings:showHealthQuote', 'Show Daily Health Quote Section')}
                  />
                </Stack>
              </Card>

              <Card variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} mb={1}>
                  {t('settings:visibleCardsTitle', 'Visible Feature Cards')}
                </Typography>
                <Grid container spacing={1}>
                  {[
                    { id: 'todaysMedicines', label: t('settings:cardMedicines', "Today's Medicines Card") },
                    { id: 'recentSymptomChecks', label: t('settings:cardSymptoms', 'Symptom Checker Card') },
                    { id: 'dosageCalculator', label: t('settings:cardDosage', 'Dosage Calculator Card') },
                    { id: 'healthMetrics', label: t('settings:cardMetrics', 'Health Metrics Card') },
                    { id: 'nearbyClinics', label: t('settings:cardClinics', 'Clinics Nearby Card') },
                    { id: 'profileSettings', label: t('settings:cardSettings', 'Settings Card') },
                  ].map((card) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={card.id}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={dashboardConfig.visibleCards?.[card.id] !== false}
                            onChange={() => handleCardToggle(card.id)}
                            color="secondary"
                          />
                        }
                        label={card.label}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Card>
            </Stack>
          )}

          {/* TAB 2: NOTIFICATIONS & PREFERENCES */}
          {activeTab === 2 && (
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={700}>
                {t('settings:preferences', 'Preferences')}
              </Typography>

              <Card variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                <FormControlLabel
                  control={<Switch checked={notifications} onChange={handleEmailNotificationsToggle} color="primary" />}
                  label={t('settings:enableEmailNotifications', 'Enable Email Notifications')}
                />
                <Divider sx={{ my: 1.5 }} />
                <FormControlLabel
                  control={<Switch checked={pushEnabled} onChange={handlePushToggle} color="secondary" id="push-notification-toggle" />}
                  label={t('settings:enablePushNotifications', 'Enable Medicine Push Notifications')}
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 1.5 }}>
                  {t('settings:pushNotificationsHint', 'Receive browser notifications when a medicine reminder is due.')}
                </Typography>
                <Divider sx={{ my: 1.5 }} />
                <FormControlLabel
                  control={<Switch checked={soundEnabled} onChange={handleSoundToggle} color="primary" />}
                  label={t('settings:soundAlerts', 'Enable Audio Chime on Reminders')}
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                  {t('settings:soundAlertsHint', 'Play a gentle chime when a medication reminder triggers.')}
                </Typography>
              </Card>

              <Card variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                <FormControlLabel
                  control={<Switch checked={mode === 'dark'} onChange={toggleTheme} color="secondary" id="theme-mode-toggle" />}
                  label={t('settings:darkMode', 'Enable Dark Mode')}
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                  {t('settings:darkModeHint', 'Reduce eye strain in low light.')}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <TextField
                  select
                  fullWidth
                  label={t('settings:language', 'Language')}
                  value={i18n.language?.split('-')[0] || 'en'}
                  onChange={handleLanguageChange}
                  sx={{ maxWidth: 320 }}
                  id="language-selector"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <MenuItem key={lang.code} value={lang.code}>
                      {lang.label}
                    </MenuItem>
                  ))}
                </TextField>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {t('settings:languageHint', 'Choose the language CareSync is displayed in.')}
                </Typography>
              </Card>
            </Stack>
          )}

          {/* TAB 3: DATA & PRIVACY */}
          {activeTab === 3 && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {t('settings:tabData', 'Data & Privacy')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage your personal health data backups and cached storage preferences.
                </Typography>
              </Box>

              <Card variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  {t('settings:exportData', 'Export Personal Data (JSON)')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t('settings:exportDataHint', 'Download a backup of your profile, medicines, emergency contacts, and settings.')}
                </Typography>
                <Button variant="contained" color="primary" startIcon={<DownloadIcon />} onClick={handleExportData}>
                  Download Data Backup
                </Button>
              </Card>

              <Card variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: 'error.light' }}>
                <Typography variant="subtitle1" fontWeight={700} color="error" gutterBottom>
                  {t('settings:resetData', 'Reset Cached App Data')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t('settings:resetDataHint', 'Clear stored preferences and reset to default application state.')}
                </Typography>
                <Button variant="outlined" color="error" startIcon={<RestartIcon />} onClick={() => setResetDialogOpen(true)}>
                  Reset App Data
                </Button>
              </Card>
            </Stack>
          )}
        </Box>
      </Paper>

      {/* Reset Confirmation Dialog */}
      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
        <DialogTitle>{t('settings:confirmResetTitle', 'Reset Application Data?')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('settings:confirmResetMsg', 'This will clear stored local preferences and reset all settings to defaults. Are you sure?')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>{t('common:cancel', 'Cancel')}</Button>
          <Button onClick={handleResetConfirm} color="error" variant="contained">
            {t('common:delete', 'Reset Data')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for save + notification feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
