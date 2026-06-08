require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://care-sync-iota.vercel.app'
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Set body parser size limit to 10MB to accommodate base64 profile avatar images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// DB Connection
const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/caresync';
mongoose.connect(dbUri)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    console.log('Ensure MongoDB service is running locally or check MONGODB_URI in server/.env');
  });

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/symptom-checks', require('./routes/symptomChecks'));
app.use('/api/clinics', require('./routes/clinics'));

// Health Check / Default route
app.get('/', (req, res) => {
  res.send('CareSync API is running...');
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('API Error:', err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
