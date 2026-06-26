require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');

const app = express();
app.disable('x-powered-by');

// Configure trusted proxy hops so req.ip reflects the real client address for
// accurate security event logging. Defaults to 1 (one proxy hop), matching the
// documented Vercel/Render deployment where this is spoofing-resistant. Set
// TRUST_PROXY=0 when running without a proxy (local/direct exposure) to prevent
// X-Forwarded-For spoofing, or to a hop count / 'true' / 'false' for other setups.
const trustProxySetting = process.env.TRUST_PROXY;
let effectiveTrustProxy;
if (trustProxySetting === undefined || trustProxySetting === '') {
  effectiveTrustProxy = 1;
} else if (trustProxySetting === 'true' || trustProxySetting === 'false') {
  effectiveTrustProxy = (trustProxySetting === 'true');
} else {
  const hops = Number(trustProxySetting);
  effectiveTrustProxy = (Number.isInteger(hops) && hops >= 0 ? hops : 1);
}
app.set('trust proxy', effectiveTrustProxy);
console.log(`Express 'trust proxy' setting is: ${JSON.stringify(app.get('trust proxy'))}`);
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

// Apply rate limiting to all requests to prevent DoS and brute-force attacks
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per windowMs
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use(limiter);

let allowedOrigins;
if (process.env.NODE_ENV === 'production') {
  if (!process.env.ALLOWED_ORIGINS) {
    console.error('FATAL ERROR: ALLOWED_ORIGINS is not set in production environment.');
    process.exit(1);
  }
  allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
} else {
  // In development, use a more permissive default
  allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:3000', 'https://care-sync-iota.vercel.app'];
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Set body parser size limit using centralized limits configuration
app.use(express.json({ limit: limits.DEFAULT_BODY_LIMIT }));
app.use(express.urlencoded({ limit: limits.DEFAULT_BODY_LIMIT, extended: true }));

// Sanitize incoming JSON bodies to prevent prototype pollution attacks.
// This must run AFTER the body parsers.
const { sanitizeBody } = require('./utils/requestSanitize');
app.use(sanitizeBody);

// Middleware to catch oversized payload errors thrown by body parsers and log them
app.use((err, req, res, next) => {
  if (err && (err.type === 'entity.too.large' || err.status === 413)) {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    const sanitize = (str) => String(str).replace(/[\r\n]/g, '');

    console.warn('Rejected oversized request', {
      ip: sanitize(ip),
      url: sanitize(req.originalUrl),
      method: sanitize(req.method),
      contentLength: sanitize(req.headers['content-length'] || 'unknown'),
    });
    return res.status(413).json({ message: 'Payload Too Large' });
  }
  next(err);
});

// Apply stricter rate limiting to auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Limit each IP to 5 login/register requests per window
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Microservices routing map
const predictionRouter = require('./predictionService');
app.use('/api/predict', predictionRouter);

const services = {
  '/api/auth': 'http://127.0.0.1:5001',
  '/api/security': 'http://127.0.0.1:5001',
  '/api/family': 'http://127.0.0.1:5002',
  '/api/health-metrics': 'http://127.0.0.1:5002',
  '/api/medicines': 'http://127.0.0.1:5003',
  '/api/symptom-checks': 'http://127.0.0.1:5004',
  '/api/clinics': 'http://127.0.0.1:5005',
  '/api/lab-tests': 'http://127.0.0.1:5006',
};

// Setup proxies
for (const [route, target] of Object.entries(services)) {
  app.use(route, createProxyMiddleware({ 
    target, 
    changeOrigin: true,
    timeout: 10000,
    proxyTimeout: 10000,
    pathRewrite: (path, req) => path, // keep original path
    on: {
      proxyReq: fixRequestBody,
      error: (err, req, res) => {
        if (!res.headersSent) {
          if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
            res.status(504).json({ message: 'Upstream service timeout' });
          } else {
            res.status(502).json({ message: 'Upstream service unavailable' });
          }
        }
      }
    }
  }));
}

// Health Check / Default route
app.get('/', (req, res) => {
  if (req.query.injection) {
    res.setHeader('X-Injection-Response', req.query.injection);
  }
  res.send('CareSync API Gateway is running...');
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('API Gateway Error:', err.stack);
  res.status(500).json({ message: 'Internal Server Error in API Gateway' });
});

let server;
if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`API Gateway is running on port ${PORT}`);
  });
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

module.exports = app;

// Test-only endpoints used by the security test-suite. Only enabled in test env.
if (process.env.NODE_ENV === 'test') {
  app.post('/__test/sanitize', (req, res) => {
    res.json(req.body || {});
  });

  app.get('/__test/echo-header', (req, res) => {
    const v = req.headers['x-echo'] || '';
    // setHeader is sanitized by sanitizeHeaders middleware
    res.setHeader('X-Echo-Response', v);
    res.json({ ok: true });
  });
}
