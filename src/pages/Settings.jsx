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
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  requestNotificationPermission,
  scheduleNotifications,
  clearScheduledNotifications,
  PUSH_ENABLED_KEY,
} from '../utils/notifications';
import { SUPPORTED_LANGUAGES } from '../i18n';

/**
 * Settings — user profile and preferences page.
 *
 * Provides a form to edit profile fields (name, email) and upload an avatar
 * image (previewed via `URL.createObjectURL`), toggles for email and push
 * notifications, and a language selector that switches the app locale and
 * persists the choice to localStorage (via i18next's language detector).
 * Push notification preference is persisted in localStorage under
 * `caresync_push_enabled` and triggers a browser permission prompt when
 * enabled.
 *
 * Rendered as a route; takes no props and manages its own state
 * (`profile`, `notifications`, `pushEnabled`, `snackbar`) internally.
 *
 * @component
 * @returns {JSX.Element} The settings page.
 *
 * @example
 * <Route path="/settings" element={<Settings />} />
 */
export default function Settings() {
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState({
    name: 'Jane Doe',
    email: 'jane.doe@email.com',
    avatar: '',
  });
  const [notifications, setNotifications] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(
    () => localStorage.getItem(PUSH_ENABLED_KEY) === 'true'
  );
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfile({ ...profile, avatar: URL.createObjectURL(file) });
    }
  };

  /**
   * Change the active UI language. i18next's language detector persists the
   * choice to localStorage, so the app reloads in this language next time.
   */
  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  /**
   * Toggle push notifications on/off.
   * When enabling, request browser permission and reschedule timers.
   * When disabling, clear all pending timers.
   */
  const handlePushToggle = async () => {
    const newValue = !pushEnabled;

    if (newValue) {
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
        setSnackbar({
          open: true,
          message: t('settings:pushPermissionDenied'),
          severity: 'warning',
        });
        return; // Don't flip the toggle if permission denied.
      }

      // Permission granted — persist and schedule.
      localStorage.setItem(PUSH_ENABLED_KEY, 'true');
      setPushEnabled(true);

      // Reschedule notifications for any existing medicines.
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
        message: t('settings:pushEnabledMsg'),
        severity: 'success',
      });
    } else {
      localStorage.setItem(PUSH_ENABLED_KEY, 'false');
      setPushEnabled(false);
      clearScheduledNotifications();
      setSnackbar({
        open: true,
        message: t('settings:pushDisabledMsg'),
        severity: 'info',
      });
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 6, p: 2 }}>
      <Paper elevation={4} sx={{ p: 4, borderRadius: 4 }}>
        <Typography variant="h4" fontWeight={700} mb={2} color="primary">
          {t('settings:profileSettings')}
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
            <Avatar
              src={profile.avatar}
              sx={{ width: 80, height: 80, mx: 'auto', mb: 1 }}
            />
            <Button
              variant="outlined"
              component="label"
              size="small"
              sx={{ mt: 1 }}
            >
              {t('settings:changeAvatar')}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleAvatarChange}
              />
            </Button>
          </Grid>
          <Grid item xs={12} sm={8}>
            <TextField
              label={t('settings:name')}
              name="name"
              value={profile.name}
              onChange={handleChange}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label={t('settings:email')}
              name="email"
              value={profile.email}
              onChange={handleChange}
              fullWidth
              sx={{ mb: 2 }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" fontWeight={600} mb={1}>
          {t('settings:preferences')}
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={notifications}
              onChange={() => setNotifications(!notifications)}
              color="primary"
            />
          }
          label={t('settings:enableEmailNotifications')}
        />
        <FormControlLabel
          control={
            <Switch
              checked={pushEnabled}
              onChange={handlePushToggle}
              color="secondary"
              id="push-notification-toggle"
            />
          }
          label={t('settings:enablePushNotifications')}
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: -0.5, mb: 1 }}>
          {t('settings:pushNotificationsHint')}
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" fontWeight={600} mb={1}>
          {t('settings:language')}
        </Typography>
        <TextField
          select
          fullWidth
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
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
          {t('settings:languageHint')}
        </Typography>

        <Box sx={{ mt: 4, textAlign: 'right' }}>
          <Button variant="contained" color="primary" sx={{ px: 4 }}>
            {t('settings:saveChanges')}
          </Button>
        </Box>
      </Paper>

      {/* Snackbar for push notification feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
