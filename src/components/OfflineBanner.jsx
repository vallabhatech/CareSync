import React, { useState, useEffect } from 'react';
import { Box, Typography, Slide, Paper } from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SyncIcon from '@mui/icons-material/Sync';
import { getOfflineQueue } from '../utils/indexedDB';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [queueCount, setQueueCount] = useState(0);

  const checkQueue = async () => {
    const queue = await getOfflineQueue();
    setQueueCount(queue.length);
  };

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    const handleQueueUpdated = (e) => setQueueCount(e.detail.length);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offlineQueueUpdated', handleQueueUpdated);

    // Initial check
    checkQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offlineQueueUpdated', handleQueueUpdated);
    };
  }, []);

  return (
    <Slide direction="down" in={isOffline} mountOnEnter unmountOnExit>
      <Paper
        elevation={4}
        sx={{
          position: 'fixed',
          top: { xs: 56, sm: 64 }, // Just below the AppBar
          left: 0,
          right: 0,
          zIndex: 1100,
          bgcolor: 'warning.main',
          color: 'warning.contrastText',
          borderRadius: 0,
          py: 1,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <WifiOffIcon />
        <Typography variant="body2" fontWeight="bold">
          You are currently offline.
        </Typography>
        {queueCount > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 2, bgcolor: 'rgba(0,0,0,0.1)', px: 1, py: 0.5, borderRadius: 1 }}>
            <SyncIcon fontSize="small" />
            <Typography variant="caption">
              {queueCount} action{queueCount !== 1 ? 's' : ''} queued for sync.
            </Typography>
          </Box>
        )}
      </Paper>
    </Slide>
  );
}
