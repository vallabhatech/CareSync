require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.disable('x-powered-by');

app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'https://care-sync-iota.vercel.app'];

app.use(cors({ origin: allowedOrigins, optionsSuccessStatus: 200 }));

// Microservices routing map
const services = {
  '/api/auth': 'http://127.0.0.1:5001',
  '/api/security': 'http://127.0.0.1:5001',
  '/api/family': 'http://127.0.0.1:5002',
  '/api/health-metrics': 'http://127.0.0.1:5002',
  '/api/medicines': 'http://127.0.0.1:5003',
  '/api/symptom-checks': 'http://127.0.0.1:5004',
  '/api/clinics': 'http://127.0.0.1:5005',
};

// Setup proxies
for (const [route, target] of Object.entries(services)) {
  app.use(route, createProxyMiddleware({ 
    target, 
    changeOrigin: true,
    pathRewrite: (path, req) => path // keep original path
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API Gateway is running on port ${PORT}`);
});
