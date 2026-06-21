require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
app.disable('x-powered-by');
const PORT = process.env.PORT || 5000;

const limits = require('./config/limits');

/**
 * Middleware to sanitize response headers by stripping CR (\r) and LF (\n) characters.
 * This helps prevent HTTP response splitting attacks by ensuring no unvalidated
 * line breaks are injected into the headers.
 * 
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 */
const sanitizeHeaders = (req, res, next) => {
  const originalSetHeader = res.setHeader;
  res.setHeader = function (name, value) {
    let sanitizedValue = value;
    if (typeof value === 'string') {
      sanitizedValue = value.replace(/[\r\n]/g, '');
    } else if (Array.isArray(value)) {
      sanitizedValue = value.map(v => (typeof v === 'string' ? v.replace(/[\r\n]/g, '') : v));
    }
    return originalSetHeader.call(this, name, sanitizedValue);
  };
  next();
};

// Middleware
app.use(sanitizeHeaders);

// helmet sets secure HTTP response headers (X-Frame-Options, X-Content-Type-Options, etc.) to reduce attack surface.
app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'https://care-sync-iota.vercel.app'];

const corsOptions = {
  origin: allowedOrigins,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Set body parser size limit using centralized limits configuration
app.use(express.json({ limit: limits.DEFAULT_BODY_LIMIT }));
app.use(express.urlencoded({ limit: limits.DEFAULT_BODY_LIMIT, extended: true }));

// Middleware to catch oversized payload errors thrown by body parsers and log them
app.use((err, req, res, next) => {
  if (err && (err.type === 'entity.too.large' || err.status === 413)) {
    const ip = req.ip || req.headers['x-forwarded-for'] || (req.connection && req.connection.remoteAddress) || 'unknown';
    console.warn('Rejected oversized request', {
      ip,
      url: req.originalUrl,
      method: req.method,
      contentLength: req.headers['content-length'] || 'unknown',
    });
    return res.status(413).json({ message: 'Payload Too Large' });
  }
  next(err);
});

// DB Connection
const dbUri = process.env.MONGODB_URI;
if (!dbUri) {
  console.error('Error: MONGODB_URI environment variable is not defined.');
  process.exit(1);
}
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
app.use('/api/health-metrics', require('./routes/healthMetrics'));

// Health Check / Default route
app.get('/', (req, res) => {
  // Support header injection testing by echoing a query param into a response header
  if (req.query.injection) {
    res.setHeader('X-Injection-Response', req.query.injection);
  }
  res.send('CareSync API is running...');
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('API Error:', err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
