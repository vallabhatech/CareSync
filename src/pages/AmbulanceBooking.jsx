import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Button, TextField, Alert, CircularProgress } from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import API from '../utils/api';

export default function AmbulanceBooking() {
  const [address, setAddress] = useState('');
  const [emergencyType, setEmergencyType] = useState('');
  const [bookingStatus, setBookingStatus] = useState('idle');
  const [driverData, setDriverData] = useState(null);

  const handleBooking = async () => {
    if (!address) {
      alert('Please enter your pickup address.');
      return;
    }
    setBookingStatus('loading');
    
    try {
      const response = await API.post('/api/ambulance/book', {
        address,
        emergencyType
      });
      
      if (response.status === 200 || response.status === 201) {
        setDriverData(response.data);
        setBookingStatus('confirmed');
      } else {
        throw new Error('Failed to dispatch ambulance');
      }
    } catch (error) {
      alert('Error: Unable to dispatch ambulance. Please try again or call emergency services immediately.');
      setBookingStatus('idle');
    }
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

      {bookingStatus === 'confirmed' && driverData ? (
        <Card sx={{ p: 2, boxShadow: 3, mb: 2, textAlign: 'left' }}>
          <CardContent>
            <Alert severity="success" sx={{ mb: 3 }}>
              Ambulance Dispatched! The driver will arrive at <strong>{address}</strong> shortly.
            </Alert>
            <Typography variant="h6" gutterBottom>
              Live Tracking Details
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              <strong>Driver Name:</strong> {driverData.driverName}
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              <strong>Vehicle Number:</strong> {driverData.vehicleNumber}
            </Typography>
            <Typography variant="body1" color="error" sx={{ mt: 1 }}>
              <strong>Estimated Time of Arrival (ETA):</strong> {driverData.etaMinutes} minutes
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              <strong>Status:</strong> {driverData.status}
            </Typography>
          </CardContent>
        </Card>
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
