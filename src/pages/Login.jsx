import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { getRedirectFromParams } from '../utils/routeRedirects';

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { login, signup } = useAuth();
  const theme = useTheme();
  const [tab, setTab] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError(t('login:errorEnterBoth'));
      return;
    }

    setLoading(true);

    try {
      await login(loginEmail, loginPassword);
      setLoading(false);
      navigate(getRedirectFromParams(searchParams));
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setError(t('login:errorFillAll'));
      return;
    }
    if (signupPassword.length < 6) {
      setError(t('login:errorPasswordLength'));
      return;
    }
    if (signupPassword !== signupConfirm) {
      setError(t('login:errorPasswordMatch'));
      return;
    }

    setLoading(true);

    try {
      await signup(signupName, signupEmail, signupPassword);
      setLoading(false);
      navigate(getRedirectFromParams(searchParams));
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.mode === 'dark' ? '#1e293b' : '#e3eafc'} 100%)`,
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 420, width: '100%', borderRadius: 4, boxShadow: '0 8px 32px rgba(25,118,210,0.15)' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" fontWeight={800} align="center" color="primary" mb={1}>
            {t('common:appName')}
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" mb={3}>
            {tab === 0 ? t('login:welcomeBack') : t('login:createAccount')}
          </Typography>

          <Tabs
            value={tab}
            onChange={(e, newVal) => { setTab(newVal); setError(''); }}
            variant="fullWidth"
            sx={{ mb: 3 }}
          >
            <Tab label={t('login:loginTab')} />
            <Tab label={t('login:signupTab')} />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {tab === 0 ? (
            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                label={t('login:email')}
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label={t('login:password')}
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                margin="normal"
                required
              />
              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={loading}
                sx={{
                  mt: 2,
                  py: 1.2,
                  fontWeight: 700,
                  background: 'linear-gradient(90deg,#1976d2 60%,#43e97b 100%)',
                }}
              >
                {loading ? t('login:loggingIn') : t('login:logIn')}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignup}>
              <TextField
                fullWidth
                label={t('login:fullName')}
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label={t('login:email')}
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label={t('login:password')}
                type="password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                margin="normal"
                required
                helperText={t('login:passwordHelper')}
              />
              <TextField
                fullWidth
                label={t('login:confirmPassword')}
                type="password"
                value={signupConfirm}
                onChange={(e) => setSignupConfirm(e.target.value)}
                margin="normal"
                required
              />
              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={loading}
                sx={{
                  mt: 2,
                  py: 1.2,
                  fontWeight: 700,
                  background: 'linear-gradient(90deg,#1976d2 60%,#43e97b 100%)',
                }}
              >
                {loading ? t('login:creatingAccount') : t('login:signUp')}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default Login;