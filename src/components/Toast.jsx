import React from 'react';
import { Box, Paper, Typography, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useToast } from '../context/ToastContext';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  const typeStyles = {
    success: { bgcolor: '#2e7d32', color: '#fff' },
    error: { bgcolor: '#d32f2f', color: '#fff' },
    info: { bgcolor: '#0288d1', color: '#fff' },
  };

  return (
    <Box 
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        maxWidth: 360,
        width: 'calc(100% - 48px)',
        pointerEvents: 'none'
      }}
    >
      {toasts.map((toast) => (
        <Paper
          key={toast.id}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          elevation={6}
          sx={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderRadius: 1.5,
            transition: 'all 0.3s ease-in-out',
            ...(typeStyles[toast.type] || typeStyles.info)
          }}
        >
          <Typography variant="body2" fontWeight={600} sx={{ pr: 2 }}>
            {toast.message}
          </Typography>
          <IconButton
            size="small"
            color="inherit"
            onClick={() => removeToast(toast.id)}
            aria-label="Close notification"
            sx={{ p: 0.5 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Paper>
      ))}
    </Box>
  );
};