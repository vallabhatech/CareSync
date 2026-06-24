require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');

// Shared DB Connection
let dbConnected = false;
const connectDB = async () => {
  if (dbConnected) return;
  const dbUri = process.env.MONGODB_URI;
  if (!dbUri) {
    console.error('Error: MONGODB_URI environment variable is not defined.');
    process.exit(1);
  }
  try {
    await mongoose.connect(dbUri);
    dbConnected = true;
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
  }
};

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

const createService = async (port, setupRoutes) => {
  await connectDB();
  const app = express();
  app.disable('x-powered-by');

  const trustProxySetting = process.env.TRUST_PROXY;
  if (trustProxySetting === undefined || trustProxySetting === '') {
    app.set('trust proxy', 1);
  } else if (trustProxySetting === 'true' || trustProxySetting === 'false') {
    app.set('trust proxy', trustProxySetting === 'true');
  } else {
    const hops = Number(trustProxySetting);
    app.set('trust proxy', Number.isInteger(hops) && hops >= 0 ? hops : 1);
  }

  app.use(sanitizeHeaders);
  app.use(helmet());
  
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ limit: '5mb', extended: true }));

  setupRoutes(app);

  app.use((err, req, res, next) => {
    console.error('API Error:', err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
  });

  app.listen(port, () => {
    console.log(`Service is running on port ${port}`);
  });
  return app;
};

module.exports = { createService };
