process.env.NODE_ENV = 'test';

const request = require('supertest');
const express = require('express');

// Mock models
jest.mock('../models/LabResult');
jest.mock('../models/MedicalDocument');
jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
  req.user = { id: 'mockuser123' };
  next();
});

const LabResult = require('../models/LabResult');
const MedicalDocument = require('../models/MedicalDocument');

const app = express();
app.use(express.json());
app.use('/api/lab-results', require('../routes/labResults'));

describe('Lab Results Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/lab-results', () => {
    it('should return all lab results for the logged-in user', async () => {
      const mockResults = [
        { _id: '1', user: 'mockuser123', testName: 'HbA1c', value: 5.6 },
        { _id: '2', user: 'mockuser123', testName: 'LDL', value: 100 }
      ];

      LabResult.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockResults)
        })
      });

      const res = await request(app).get('/api/lab-results');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockResults);
      expect(LabResult.find).toHaveBeenCalledWith({ user: 'mockuser123' });
    });
  });

  describe('POST /api/lab-results', () => {
    it('should create a new lab result and return it', async () => {
      const newResult = {
        testDate: '2026-07-08T00:00:00.000Z',
        category: 'Diabetic Profile',
        testName: 'HbA1c',
        value: 5.6,
        unit: '%',
        referenceMin: 4.0,
        referenceMax: 5.7,
        notes: 'Normal'
      };

      const mockSaved = { ...newResult, _id: 'new123', user: 'mockuser123' };

      LabResult.prototype.save = jest.fn().mockResolvedValue(mockSaved);
      LabResult.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockSaved)
      });

      const res = await request(app)
        .post('/api/lab-results')
        .send(newResult);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(mockSaved);
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/lab-results')
        .send({ testName: 'HbA1c' });

      expect(res.status).toBe(400);
    });

    it('should return 403 if linking a document that does not belong to the user', async () => {
      const newResult = {
        testDate: '2026-07-08T00:00:00.000Z',
        category: 'Diabetic Profile',
        testName: 'HbA1c',
        value: 5.6,
        unit: '%',
        documentId: 'otherdoc456'
      };

      MedicalDocument.findById = jest.fn().mockResolvedValue({
        _id: 'otherdoc456',
        user: 'differentuser'
      });

      const res = await request(app)
        .post('/api/lab-results')
        .send(newResult);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Unauthorized/i);
    });
  });

  describe('PUT /api/lab-results/:id', () => {
    it('should update and return the lab result', async () => {
      const existingResult = {
        _id: 'result123',
        user: 'mockuser123',
        testName: 'HbA1c',
        value: 5.6,
        unit: '%',
        save: jest.fn().mockResolvedValue(true)
      };

      LabResult.findById = jest.fn()
        .mockResolvedValueOnce(existingResult)
        .mockReturnValue({
          populate: jest.fn().mockResolvedValue({
            _id: 'result123',
            user: 'mockuser123',
            testName: 'HbA1c',
            value: 6.0,
            unit: '%'
          })
        });

      const res = await request(app)
        .put('/api/lab-results/result123')
        .send({ value: 6.0 });

      expect(res.status).toBe(200);
      expect(res.body.value).toBe(6.0);
      expect(existingResult.save).toHaveBeenCalled();
    });

    it('should return 403 if user tries to update another users lab result', async () => {
      const existingResult = {
        _id: 'result123',
        user: 'otheruser',
        testName: 'HbA1c',
        value: 5.6
      };

      LabResult.findById = jest.fn().mockResolvedValue(existingResult);

      const res = await request(app)
        .put('/api/lab-results/result123')
        .send({ value: 6.0 });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/lab-results/:id', () => {
    it('should delete the lab result if authorized', async () => {
      const existingResult = {
        _id: 'result123',
        user: 'mockuser123'
      };

      LabResult.findById = jest.fn().mockResolvedValue(existingResult);
      LabResult.findByIdAndDelete = jest.fn().mockResolvedValue(true);

      const res = await request(app).delete('/api/lab-results/result123');

      expect(res.status).toBe(200);
      expect(LabResult.findByIdAndDelete).toHaveBeenCalledWith('result123');
    });

    it('should return 403 if trying to delete another users result', async () => {
      const existingResult = {
        _id: 'result123',
        user: 'otheruser'
      };

      LabResult.findById = jest.fn().mockResolvedValue(existingResult);

      const res = await request(app).delete('/api/lab-results/result123');

      expect(res.status).toBe(403);
    });
  });
});
