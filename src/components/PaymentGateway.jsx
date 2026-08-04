import React, { useState } from 'react';
import { Box, Button, Typography, TextField, CircularProgress, Alert, Paper } from '@mui/material';
import { Payment as PaymentIcon, Lock as LockIcon } from '@mui/icons-material';
import API from '../utils/api';

const PaymentGateway = ({ amount = 100, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Send mock payment details to backend
      const res = await API.post('/api/payments/process', {
        amount,
        cardNumber: cardNumber.slice(-4), // only send last 4 in mock
        paymentMethod: 'credit_card'
      });

      if (res.data.success) {
        setSuccess(true);
        if (onSuccess) {
          setTimeout(() => onSuccess(res.data.transactionId), 2000);
        }
      }
    } catch (err) {
      setError('Payment processing failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#e8f5e9' }}>
        <Typography variant="h5" color="success.main" gutterBottom>
          Payment Successful!
        </Typography>
        <Typography variant="body1">
          Your transaction has been processed securely.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 4, maxWidth: 500, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <PaymentIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
        <Typography variant="h5" fontWeight="bold">
          Secure Checkout
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        This is a simulated payment gateway. Do not enter real credit card details.
      </Alert>

      <Typography variant="h6" mb={3}>
        Total Amount: ${amount.toFixed(2)}
      </Typography>

      <Box component="form" onSubmit={handlePayment}>
        <TextField
          fullWidth
          label="Card Number (Mock)"
          variant="outlined"
          margin="normal"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          required
        />
        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
          <TextField
            fullWidth
            label="MM/YY"
            variant="outlined"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            required
          />
          <TextField
            fullWidth
            label="CVV"
            type="password"
            variant="outlined"
            value={cvv}
            onChange={(e) => setCvv(e.target.value)}
            required
          />
        </Box>

        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          {onCancel && (
            <Button variant="outlined" fullWidth onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            fullWidth 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <LockIcon />}
          >
            {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default PaymentGateway;
