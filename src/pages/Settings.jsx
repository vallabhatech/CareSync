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
  FormControlLabel
} from '@mui/material';

export default function Settings() {
  const [profile, setProfile] = useState({
    name: 'Jane Doe',
    email: 'jane.doe@email.com',
    avatar: '',
  });
  const [notifications, setNotifications] = useState(true);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfile({ ...profile, avatar: URL.createObjectURL(file) });
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

        <Box sx={{ mt: 4, textAlign: 'right' }}>
          <Button variant="contained" color="primary" sx={{ px: 4 }}>
            Save Changes
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}