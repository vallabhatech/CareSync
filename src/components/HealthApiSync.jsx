import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, CircularProgress, Alert } from '@mui/material';
import { MonitorHeart as HeartIcon, DirectionsWalk as WalkIcon, Sync as SyncIcon } from '@mui/icons-material';

const HealthApiSync = () => {
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    // Check if previously connected in local storage
    const storedStatus = localStorage.getItem('healthApiConnected');
    if (storedStatus === 'true') {
      setConnected(true);
      fetchMockData();
    }
  }, []);

  const handleConnect = () => {
    setSyncing(true);
    // Simulate OAuth flow / API connection delay
    setTimeout(() => {
      setConnected(true);
      localStorage.setItem('healthApiConnected', 'true');
      fetchMockData();
    }, 1500);
  };

  const fetchMockData = () => {
    setSyncing(true);
    // Simulate fetching from Google Fit / Apple Health
    setTimeout(() => {
      setMetrics({
        steps: Math.floor(Math.random() * 5000) + 3000,
        heartRate: Math.floor(Math.random() * 20) + 60,
        lastSynced: new Date().toLocaleTimeString()
      });
      setSyncing(false);
    }, 1000);
  };

  const handleDisconnect = () => {
    setConnected(false);
    setMetrics(null);
    localStorage.removeItem('healthApiConnected');
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, mb: 3, bgcolor: 'background.paper', boxShadow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          Device Health Sync (Apple Health / Google Fit)
        </Typography>
        {connected ? (
          <Button variant="outlined" color="error" size="small" onClick={handleDisconnect}>
            Disconnect
          </Button>
        ) : (
          <Button variant="contained" color="primary" onClick={handleConnect} disabled={syncing}>
            {syncing ? 'Connecting...' : 'Connect Device'}
          </Button>
        )}
      </Box>

      {syncing && !metrics && (
        <Box display="flex" justifyContent="center" p={2}>
          <CircularProgress size={24} />
          <Typography ml={2}>Syncing health data...</Typography>
        </Box>
      )}

      {connected && metrics && (
        <Box display="flex" justifyContent="space-around" alignItems="center" flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <WalkIcon color="primary" fontSize="large" />
            <Box>
              <Typography variant="h5" fontWeight="bold">{metrics.steps}</Typography>
              <Typography variant="body2" color="text.secondary">Steps Today</Typography>
            </Box>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <HeartIcon color="error" fontSize="large" />
            <Box>
              <Typography variant="h5" fontWeight="bold">{metrics.heartRate} bpm</Typography>
              <Typography variant="body2" color="text.secondary">Resting Heart Rate</Typography>
            </Box>
          </Box>
          
          <Box display="flex" flexDirection="column" alignItems="flex-end">
            <Typography variant="caption" color="text.secondary">Last synced: {metrics.lastSynced}</Typography>
            <Button size="small" startIcon={<SyncIcon />} onClick={fetchMockData} disabled={syncing} sx={{ mt: 0.5 }}>
              Sync Now
            </Button>
          </Box>
        </Box>
      )}

      {!connected && !syncing && (
        <Alert severity="info" sx={{ mt: 1 }}>
          Connect your fitness tracking devices to automatically sync steps and heart rate to CareSync.
        </Alert>
      )}
    </Box>
  );
};

export default HealthApiSync;
