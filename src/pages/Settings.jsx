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
} from '@mui/material';
import {
  requestNotificationPermission,
  scheduleNotifications,
  clearScheduledNotifications,
  PUSH_ENABLED_KEY,
} from '../utils/notifications';

/**
 * Settings — user profile and preferences page.
 *
 * Provides a form to edit profile fields (name, email) and upload an avatar
 * image (previewed via `URL.createObjectURL`), toggles for email and push
 * notifications. Push notification preference is persisted in localStorage
 * under `caresync_push_enabled` and triggers a browser permission prompt
 * when enabled.
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
          message: 'Notification permission was denied. Please enable it in your browser settings.',
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
        message: 'Push notifications enabled! You will be reminded when your medicines are due.',
        severity: 'success',
      });
    } else {
      localStorage.setItem(PUSH_ENABLED_KEY, 'false');
      setPushEnabled(false);
      clearScheduledNotifications();
      setSnackbar({
        open: true,
        message: 'Push notifications disabled.',
        severity: 'info',
      });
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 6, p: 2 }}>
      <Paper elevation={4} sx={{ p: 4, borderRadius: 4 }}>
        <Typography variant="h4" fontWeight={700} mb={2} color="primary">
          Profile Settings
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
              Change Avatar
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
              label="Name"
              name="name"
              value={profile.name}
              onChange={handleChange}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Email"
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
          Preferences
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={notifications}
              onChange={() => setNotifications(!notifications)}
              color="primary"
            />
          }
          label="Enable Email Notifications"
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
          label="Enable Medicine Push Notifications"
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: -0.5, mb: 1 }}>
          Receive browser notifications when a medicine reminder is due.
        </Typography>

        <Box sx={{ mt: 4, textAlign: 'right' }}>
          <Button variant="contained" color="primary" sx={{ px: 4 }}>
            Save Changes
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