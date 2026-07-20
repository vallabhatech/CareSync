/**
 * API Gateway for CareSync microservices.
 *
 * Provides centralized routing, authentication verification, rate limiting,
 * request logging, and circuit breaker patterns for all backend services.
 *
 * @module server/gateway
 */

require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
app.disable('x-powered-by');

const GATEWAY_PORT = process.env.GATEWAY_PORT || 4000;

const SERVICE_REGISTRY = {
  auth: {
    target: process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:5001',
    pathPrefix: '/api/auth',
    rateLimit: { windowMs: 15 * 60 * 1000, max: 20 },
  },
  user: {
    target: process.env.USER_SERVICE_URL || 'http://127.0.0.1:5002',
    pathPrefix: '/api/users',
    rateLimit: { windowMs: 15 * 60 * 1000, max: 100 },
  },
  medicine: {
    target: process.env.MEDICINE_SERVICE_URL || 'http://127.0.0.1:5003',
    pathPrefix: '/api/medicines',
    rateLimit: { windowMs: 15 * 60 * 1000, max: 100 },
  },
  symptom: {
    target: process.env.SYMPTOM_SERVICE_URL || 'http://127.0.0.1:5004',
    pathPrefix: '/api/symptom-checks',
    rateLimit: { windowMs: 15 * 60 * 1000, max: 50 },
  },
  telemedicine: {
    target: process.env.TELEMEDICINE_SERVICE_URL || 'http://127.0.0.1:5005',
    pathPrefix: '/api/telemedicine',
    rateLimit: { windowMs: 15 * 60 * 1000, max: 50 },
  },
  labTest: {
    target: process.env.LAB_SERVICE_URL || 'http://127.0.0.1:5006',
    pathPrefix: '/api/lab-tests',
    rateLimit: { windowMs: 15 * 60 * 1000, max: 100 },
  },
  core: {
    target: process.env.CORE_SERVICE_URL || 'http://127.0.0.1:5000',
    pathPrefix: '/api',
    rateLimit: { windowMs: 15 * 60 * 1000, max: 200 },
  },
};

// Security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'https://care-sync-iota.vercel.app'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200,
}));

// Global rate limiter (fallback for unmatched routes)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later' },
});
app.use(globalLimiter);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    console[logLevel](
      `[Gateway] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`
    );
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    gateway: 'CareSync API Gateway',
    timestamp: new Date().toISOString(),
    services: Object.keys(SERVICE_REGISTRY),
  });
});

// Service health aggregation
app.get('/health/services', async (req, res) => {
  const results = {};
  for (const [name, config] of Object.entries(SERVICE_REGISTRY)) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(`${config.target}/`, { signal: controller.signal });
      clearTimeout(timeout);
      results[name] = { status: response.ok ? 'healthy' : 'degraded', code: response.status };
    } catch {
      results[name] = { status: 'unreachable' };
    }
  }
  res.json({ services: results });
});

// Circuit breaker state per service
const circuitState = {};
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_RESET_MS = 30000;

function getCircuitBreaker(serviceName) {
  if (!circuitState[serviceName]) {
    circuitState[serviceName] = { failures: 0, lastFailure: 0, open: false };
  }
  const circuit = circuitState[serviceName];

  if (circuit.open && Date.now() - circuit.lastFailure > CIRCUIT_RESET_MS) {
    circuit.open = false;
    circuit.failures = 0;
  }
  return circuit;
}

function recordFailure(serviceName) {
  const circuit = getCircuitBreaker(serviceName);
  circuit.failures += 1;
  circuit.lastFailure = Date.now();
  if (circuit.failures >= CIRCUIT_THRESHOLD) {
    circuit.open = true;
    console.error(`[Gateway] Circuit OPEN for service: ${serviceName}`);
  }
}

function recordSuccess(serviceName) {
  const circuit = getCircuitBreaker(serviceName);
  circuit.failures = 0;
  circuit.open = false;
}

// Register proxy routes for each service
for (const [serviceName, config] of Object.entries(SERVICE_REGISTRY)) {
  const serviceLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: `Rate limit exceeded for ${serviceName} service` },
  });

  const proxyMiddleware = createProxyMiddleware({
    target: config.target,
    changeOrigin: true,
    on: {
      proxyRes: () => recordSuccess(serviceName),
      error: (err, req, res) => {
        recordFailure(serviceName);
        if (!res.headersSent) {
          res.status(502).json({
            message: 'Service temporarily unavailable',
            service: serviceName,
          });
        }
      },
    },
  });

  // Circuit breaker check middleware
  const circuitCheck = (req, res, next) => {
    const circuit = getCircuitBreaker(serviceName);
    if (circuit.open) {
      return res.status(503).json({
        message: 'Service temporarily unavailable (circuit open)',
        service: serviceName,
        retryAfter: Math.ceil((CIRCUIT_RESET_MS - (Date.now() - circuit.lastFailure)) / 1000),
      });
    }
    next();
  };

  // Skip the catch-all 'core' service prefix match for more specific routes
  if (serviceName === 'core') continue;

  app.use(config.pathPrefix, serviceLimiter, circuitCheck, proxyMiddleware);
}

// Core API as fallback for unmatched /api/* routes
const coreConfig = SERVICE_REGISTRY.core;
const coreLimiter = rateLimit({
  windowMs: coreConfig.rateLimit.windowMs,
  max: coreConfig.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', coreLimiter, (req, res, next) => {
  const circuit = getCircuitBreaker('core');
  if (circuit.open) {
    return res.status(503).json({
      message: 'Core service temporarily unavailable',
      retryAfter: Math.ceil((CIRCUIT_RESET_MS - (Date.now() - circuit.lastFailure)) / 1000),
    });
  }
  next();
}, createProxyMiddleware({
  target: coreConfig.target,
  changeOrigin: true,
  on: {
    proxyRes: () => recordSuccess('core'),
    error: (err, req, res) => {
      recordFailure('core');
      if (!res.headersSent) {
        res.status(502).json({ message: 'Core API unavailable' });
      }
    },
  },
}));

// 404 for non-API routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found', path: req.originalUrl });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Gateway] Error:', err.message);
  res.status(500).json({ message: 'Internal gateway error' });
});

if (require.main === module) {
  app.listen(GATEWAY_PORT, () => {
    console.log(`CareSync API Gateway running on port ${GATEWAY_PORT}`);
    console.log(`Proxying to ${Object.keys(SERVICE_REGISTRY).length} services`);
  });
}

module.exports = app;
