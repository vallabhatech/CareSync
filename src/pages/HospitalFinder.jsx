import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress
} from '@mui/material';
import { LocalHospital as HospitalIcon, Search as SearchIcon } from '@mui/icons-material';
import API from '../utils/api';

function HospitalFinder() {
  const [query, setQuery] = useState('');
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHospitals = async (searchQuery = '') => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get('/api/hospitals', { params: { query: searchQuery } });
      setHospitals(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch hospital data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchHospitals(query);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <HospitalIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" fontWeight={700}>
          Hospital & Bed Availability
        </Typography>
      </Box>

      <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <TextField
          fullWidth
          label="Search by name or specialty..."
          variant="outlined"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button variant="contained" color="primary" type="submit" startIcon={<SearchIcon />} sx={{ px: 4 }}>
          Search
        </Button>
      </Box>

      {error && <Typography color="error">{error}</Typography>}
      
      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={4}>
          {hospitals.map((hospital) => (
            <Grid item xs={12} md={6} key={hospital.id}>
              <Card sx={{ boxShadow: 3, '&:hover': { boxShadow: 6 } }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" fontWeight={700} color="primary.main" gutterBottom>
                      {hospital.name}
                    </Typography>
                    <Chip 
                      label={`${hospital.availableBeds} Beds Available`} 
                      color={hospital.availableBeds > 10 ? 'success' : hospital.availableBeds > 0 ? 'warning' : 'error'}
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {hospital.address}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Specialty:</strong> {hospital.specialty}
                  </Typography>
                  <Button variant="outlined" color="primary" sx={{ mt: 2 }} fullWidth>
                    Contact Hospital
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {hospitals.length === 0 && (
            <Grid item xs={12}>
              <Typography variant="body1" align="center" color="text.secondary">
                No hospitals found matching your criteria.
              </Typography>
            </Grid>
          )}
        </Grid>
      )}
    </Container>
  );
}

export default HospitalFinder;
