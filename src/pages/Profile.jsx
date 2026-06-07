import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
  Grid,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

function Profile() {
  const { t } = useTranslation();
  const { user, isAuthenticated, updateProfile, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    age: user?.age || '',
    bloodGroup: user?.bloodGroup || '',
    allergies: user?.allergies || '',
  });

  if (!isAuthenticated || !user) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary">
          {t('profile:loginPrompt')}
        </Typography>
      </Box>
    );
  }

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSave = () => {
    updateProfile(formData);
    setEditing(false);
    setMessage(t('profile:updateSuccess'));
    setTimeout(() => setMessage(''), 3000);
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      age: user.age || '',
      bloodGroup: user.bloodGroup || '',
      allergies: user.allergies || '',
    });
    setEditing(false);
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" fontWeight={800} color="primary" mb={3}>
        {t('profile:myProfile')}
      </Typography>

      {message && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {message}
        </Alert>
      )}

      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 24px rgba(25,118,210,0.1)' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'primary.main',
                fontSize: '2rem',
                fontWeight: 700,
                mr: 3,
              }}
            >
              {getInitials(user.name)}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
              <Typography variant="caption" color="primary" sx={{ textTransform: 'capitalize' }}>
                {t('profile:rolePrefix', { role: user.role || t('profile:defaultRole') })}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('profile:fullName')}
                value={formData.name}
                onChange={handleChange('name')}
                disabled={!editing}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('profile:email')}
                value={formData.email}
                onChange={handleChange('email')}
                disabled={!editing}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('profile:phoneNumber')}
                value={formData.phone}
                onChange={handleChange('phone')}
                disabled={!editing}
                placeholder={t('profile:phonePlaceholder')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('profile:age')}
                type="number"
                value={formData.age}
                onChange={handleChange('age')}
                disabled={!editing}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('profile:bloodGroup')}
                value={formData.bloodGroup}
                onChange={handleChange('bloodGroup')}
                disabled={!editing}
                placeholder={t('profile:bloodGroupPlaceholder')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('profile:allergies')}
                value={formData.allergies}
                onChange={handleChange('allergies')}
                disabled={!editing}
                placeholder={t('profile:allergiesPlaceholder')}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            {editing ? (
              <>
                <Button variant="contained" onClick={handleSave}>
                  {t('profile:saveChanges')}
                </Button>
                <Button variant="outlined" onClick={handleCancel}>
                  {t('profile:cancel')}
                </Button>
              </>
            ) : (
              <Button variant="contained" onClick={() => setEditing(true)}>
                {t('profile:editProfile')}
              </Button>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {t('profile:memberSince', { date: user.loggedInAt ? new Date(user.loggedInAt).toLocaleDateString() : t('profile:notAvailable') })}
            </Typography>
            <Button variant="outlined" color="error" onClick={logout}>
              {t('profile:logOut')}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Profile;