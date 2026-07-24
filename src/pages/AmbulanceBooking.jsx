import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Button, TextField, Alert, CircularProgress } from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';

export default function AmbulanceBooking() {
  const [address, setAddress] = useState('');
  const [emergencyType, setEmergencyType] = useState('');
  const [bookingStatus, setBookingStatus] = useState('idle');

  const handleBooking = () => {
    if (!address) {
      alert('Please enter your pickup address.');
      return;
    }
    setBookingStatus('loading');
    setTimeout(() => {
      setBookingStatus('confirmed');
    }, 1500);
  };

  return (
    <Box sx={{ p: 4, maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
      <LocalHospitalIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
      <Typography variant="h4" fontWeight="bold" color="error" mb={2}>
        Emergency Ambulance Booking
      </Typography>
      <Typography variant="body1" mb={4}>
        Book an ambulance immediately. Our nearest driver will be dispatched.
      </Typography>

      {bookingStatus === 'confirmed' ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          Ambulance Dispatched! The driver will arrive at <strong>{address}</strong> shortly.
        </Alert>
      ) : (
        <Card sx={{ p: 2, boxShadow: 3 }}>
          <CardContent>
            <TextField
              label="Pickup Address"
              fullWidth
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              sx={{ mb: 3 }}
            />
            <TextField
              label="Emergency Type / Additional Details (Optional)"
              fullWidth
              value={emergencyType}
              onChange={(e) => setEmergencyType(e.target.value)}
              sx={{ mb: 3 }}
            />
            <Button
              variant="contained"
              color="error"
              size="large"
              fullWidth
              onClick={handleBooking}
              disabled={bookingStatus === 'loading'}
            >
              {bookingStatus === 'loading' ? <CircularProgress size={24} color="inherit" /> : 'BOOK AMBULANCE NOW'}
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
