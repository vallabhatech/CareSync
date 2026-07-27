const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Mock data for hospitals
const mockHospitals = [
  { id: '1', name: 'City General Hospital', address: '123 Main St, Cityville', lat: 40.7128, lon: -74.0060, availableBeds: 42, specialty: 'Trauma Center' },
  { id: '2', name: 'St. Mary Medical Center', address: '456 Oak Ave, Townsburg', lat: 40.7150, lon: -74.0100, availableBeds: 15, specialty: 'Cardiology' },
  { id: '3', name: 'Valley Health Clinic', address: '789 Pine Rd, Villagetown', lat: 40.7100, lon: -74.0200, availableBeds: 0, specialty: 'Pediatrics' },
  { id: '4', name: 'Metro Medical Hub', address: '321 Elm St, Metropolis', lat: 40.7300, lon: -73.9900, availableBeds: 120, specialty: 'General' }
];

// GET /api/hospitals
// Search for nearby hospitals and their bed availability
router.get('/', auth, (req, res) => {
  const { query, lat, lon } = req.query;
  
  let results = [...mockHospitals];
  
  if (query) {
    const lowerQuery = query.toLowerCase();
    results = results.filter(h => h.name.toLowerCase().includes(lowerQuery) || h.specialty.toLowerCase().includes(lowerQuery));
  }
  
  // Return the results
  res.json(results);
});

module.exports = router;
