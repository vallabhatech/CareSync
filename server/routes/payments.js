const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const crypto = require('crypto');

// POST /api/payments/process
// Process a mocked payment transaction
router.post('/process', auth, (req, res) => {
  const { amount, cardNumber, paymentMethod } = req.body;
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid payment amount' });
  }

  // Simulate payment gateway latency (e.g. Stripe, PayPal API delay)
  setTimeout(() => {
    // 95% success rate for simulation
    const isSuccess = Math.random() < 0.95;
    
    if (isSuccess) {
      const transactionId = `txn_mock_${crypto.randomBytes(8).toString('hex')}`;
      console.log(`[Payment] Processed mock payment of $${amount} via ${paymentMethod} for user ${req.user?.id || 'anonymous'}`);
      
      res.json({
        success: true,
        transactionId,
        amount,
        status: 'completed',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment declined by processor',
        status: 'failed'
      });
    }
  }, 1200);
});

module.exports = router;
