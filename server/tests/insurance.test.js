process.env.NODE_ENV = 'test';

const express = require('express');
const request = require('supertest');
const InsurancePolicy = require('../models/InsurancePolicy');

// Mock Auth Middleware
jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
  req.user = { _id: 'mockuser123', name: 'John Doe', email: 'john@example.com' };
  next();
});

// Mock Mongoose Model
jest.mock('../models/InsurancePolicy');

const router = require('../routes/insurance');
const app = express();
app.use(express.json());
app.use('/api/insurance', router);

describe('Insurance Router Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('GET /plans returns list of plans', async () => {
    const res = await request(app).get('/api/insurance/plans');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('premium');
    expect(res.body[0]).toHaveProperty('deductible');
  });

  test('GET /policies returns user policies', async () => {
    const mockPolicies = [
      { _id: 'policy123', policyNumber: 'CS-2026-11111', planName: 'Bronze Saver', status: 'active' }
    ];
    
    // Mock Mongoose chain: find().sort()
    const sortMock = jest.fn().mockResolvedValue(mockPolicies);
    InsurancePolicy.find.mockReturnValue({ sort: sortMock });

    const res = await request(app).get('/api/insurance/policies');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockPolicies);
    expect(InsurancePolicy.find).toHaveBeenCalledWith({ user: { $eq: 'mockuser123' } });
  });

  test('POST /policies creates a new policy with valid input', async () => {
    const input = {
      planId: 'coreshield-bronze',
      planName: 'CareShield Bronze Saver',
      provider: 'CareShield',
      premium: 150,
      deductible: 5000,
      copay: 40,
      coverageType: 'individual',
      networkType: 'HMO',
      primaryInsured: {
        name: 'John Doe',
        dob: '1990-01-01',
        ssnLastFour: '1234'
      },
      coveredMembers: []
    };

    InsurancePolicy.prototype.save = jest.fn().mockResolvedValue({
      ...input,
      _id: 'newpolicy123',
      policyNumber: 'CS-2026-98765'
    });

    const res = await request(app).post('/api/insurance/policies').send(input);
    expect(res.status).toBe(201);
    expect(InsurancePolicy.prototype.save).toHaveBeenCalled();
  });

  test('POST /policies fails on validation error', async () => {
    const input = {
      planId: 'coreshield-bronze'
      // missing fields
    };

    const res = await request(app).post('/api/insurance/policies').send(input);
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Missing required checkout information');
  });

  test('DELETE /policies/:id cancels an active policy', async () => {
    const mockPolicy = {
      _id: 'policy123',
      status: 'active',
      save: jest.fn().mockResolvedValue(true)
    };

    InsurancePolicy.findOne.mockResolvedValue(mockPolicy);

    const res = await request(app).delete('/api/insurance/policies/policy123');
    expect(res.status).toBe(200);
    expect(mockPolicy.status).toBe('cancelled');
    expect(mockPolicy.save).toHaveBeenCalled();
  });

  test('GET /policies/:id/download streams pdf buffer', async () => {
    const mockPolicy = {
      _id: 'policy123',
      policyNumber: 'CS-2026-11111',
      planName: 'Bronze Saver',
      provider: 'CareShield',
      premium: 150,
      deductible: 5000,
      copay: 40,
      networkType: 'HMO',
      startDate: new Date(),
      endDate: new Date(),
      status: 'active',
      primaryInsured: { name: 'John Doe' },
      coveredMembers: []
    };

    InsurancePolicy.findOne.mockResolvedValue(mockPolicy);

    const res = await request(app).get('/api/insurance/policies/policy123/download');
    expect(res.status).toBe(200);
    expect(res.header['content-type']).toBe('application/pdf');
    expect(res.header['content-disposition']).toContain('CareSync_Policy_CS-2026-11111.pdf');
  });
});
