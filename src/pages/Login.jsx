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
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
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

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      // For demo: accept any valid-looking email/password
      // In production, this would call your backend API
      const user = {
        id: 'user_' + Date.now(),
        name: loginEmail.split('@')[0], // temporary name from email
        email: loginEmail,
        avatar: null,
        role: 'patient',
      };

      login(user);
      setLoading(false);
      navigate('/dashboard');
    }, 800);
  };

  const handleSignup = (e) => {
    e.preventDefault();
    setError('');

    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (signupPassword !== signupConfirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const user = {
        id: 'user_' + Date.now(),
        name: signupName,
        email: signupEmail,
        avatar: null,
        role: 'patient',
      };

      login(user);
      setLoading(false);
      navigate('/dashboard');
    }, 800);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f4f8fb 0%, #e3eafc 100%)',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 420, width: '100%', borderRadius: 4, boxShadow: '0 8px 32px rgba(25,118,210,0.15)' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" fontWeight={800} align="center" color="primary" mb={1}>
            CareSync
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" mb={3}>
            {tab === 0 ? 'Welcome back! Please log in.' : 'Create your account to get started.'}
          </Typography>

          <Tabs
            value={tab}
            onChange={(e, newVal) => { setTab(newVal); setError(''); }}
            variant="fullWidth"
            sx={{ mb: 3 }}
          >
            <Tab label="Login" />
            <Tab label="Sign Up" />
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
                label="Email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Password"
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
                  background: 'linear-gradient(90deg, #1976d2 60%, #7b1fa2 100%)',
                }}
              >
                {loading ? 'Logging in...' : 'Log In'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignup}>
              <TextField
                fullWidth
                label="Full Name"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                margin="normal"
                required
                helperText="At least 6 characters"
              />
              <TextField
                fullWidth
                label="Confirm Password"
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
                  background: 'linear-gradient(90deg, #1976d2 60%, #7b1fa2 100%)',
                }}
              >
                {loading ? 'Creating account...' : 'Sign Up'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default Login;