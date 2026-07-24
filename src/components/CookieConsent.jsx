import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Slide } from '@mui/material';

export default function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('gdpr_consent');
    if (!consent) {
      setOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('gdpr_consent', 'true');
    setOpen(false);
  };

  return (
    <Slide direction="up" in={open} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: 'background.paper',
          p: 3,
          boxShadow: 4,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 1300,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="body1" sx={{ mb: { xs: 2, md: 0 }, mr: { md: 3 } }}>
          <strong>GDPR Notice:</strong> We use cookies and similar technologies to enhance your experience, monitor our performance, and improve our services. By clicking "Accept", you agree to our use of cookies and data processing per GDPR regulations.
        </Typography>
        <Button variant="contained" color="primary" onClick={handleAccept} sx={{ minWidth: 150 }}>
          Accept
        </Button>
      </Box>
    </Slide>
  );
}
