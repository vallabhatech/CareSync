import React, { useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Button, CircularProgress, Alert, Paper } from '@mui/material';

export default function ClinicsNearby() {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [coords, setCoords] = useState(null);

  const fetchClinics = async (lat, lon) => {
    setLoading(true);
    setLocationError('');
    try {
      const delta = 0.1;
      const left = lon - delta;
      const right = lon + delta;
      const top = lat + delta;
      const bottom = lat - delta;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=clinic&limit=10&addressdetails=1&extratags=1&bounded=1&viewbox=${left},${top},${right},${bottom}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const data = await res.json();
      if (data.length === 0) {
        setLocationError('No clinics found nearby. Try increasing your search area.');
      }
      setClinics(data);
    } catch (err) {
      setLocationError('Failed to fetch clinics. Try again later.');
    }
    setLoading(false);
  };

  const handleFindClinics = () => {
    setLocationError('');
    setLoading(true);
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ latitude, longitude });
        fetchClinics(latitude, longitude);
      },
      () => {
        setLocationError('Unable to retrieve your location. Please allow location access.');
        setLoading(false);
      }
    );
  };

  return (
    <div className="clinics-bg">
      <div className="clinics-container">
        <Typography variant="h4" fontWeight={800} mb={2} align="center" className="clinics-title">
          🏥 Clinics Nearby
        </Typography>
        <Typography variant="body1" align="center" mb={3} className="clinics-desc">
          Find clinics and hospitals close to your current location.
        </Typography>
        <Box display="flex" justifyContent="center" mb={3}>
          <Button
            variant="contained"
            onClick={handleFindClinics}
            sx={{
              fontWeight: 700,
              fontSize: '1.1rem',
              px: 4,
              py: 1.2,
              background: 'linear-gradient(90deg, #1976d2 60%, #7b1fa2 100%)',
              boxShadow: '0 2px 12px #1976d244'
            }}
          >
            {loading ? 'Locating...' : 'Find Clinics Near Me'}
          </Button>
        </Box>
        {locationError && <Alert severity="error" sx={{ mb: 2 }}>{locationError}</Alert>}
        {loading && (
          <Box display="flex" justifyContent="center" mt={2}>
            <CircularProgress color="primary" />
          </Box>
        )}
        {!loading && clinics.length > 0 && (
          <List>
            {clinics.map((clinic, idx) => (
              <Paper
                key={clinic.place_id}
                elevation={3}
                sx={{
                  mb: 3,
                  borderRadius: 3,
                  background: '#f5f6fa',
                  borderLeft: '6px solid #1976d2',
                  boxShadow: '0 2px 12px #1976d222'
                }}
              >
                <ListItem
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    p: 2
                  }}
                >
                  <Typography variant="h6" fontWeight={700} color="#1976d2" mb={0.5}>
                    {clinic.display_name.split(',')[0]}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    {clinic.display_name}
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    href={`https://www.google.com/maps/search/?api=1&query=${clinic.lat},${clinic.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      mt: 1,
                      fontWeight: 600,
                      borderColor: '#1976d2',
                      color: '#1976d2',
                      '&:hover': {
                        background: '#e3eafc'
                      }
                    }}
                  >
                    View on Map
                  </Button>
                </ListItem>
              </Paper>
            ))}
          </List>
        )}
        {!loading && clinics.length === 0 && !locationError && (
          <Typography variant="body2" color="text.secondary" mt={2} align="center">
            Click "Find Clinics Near Me" to see nearby clinics and hospitals.
          </Typography>
        )}
      </div>
      <style>{`
        .clinics-bg {
          min-height: 100vh;
          background: linear-gradient(135deg, #f4f8fb 0%, #e3eafc 100%);
          color: #222;
          padding: 40px 0;
        }
        .clinics-container {
          max-width: 650px;
          margin: 0 auto;
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 4px 32px 0 rgba(25, 118, 210, 0.08);
          padding: 36px 22px 28px 22px;
        }
        .clinics-title {
          color: #1976d2;
          font-size: 2rem;
          font-weight: 800;
        }
        .clinics-desc {
          color: #555;
          font-size: 1.08rem;
        }
        @media (max-width: 700px) {
          .clinics-container { padding: 16px 4px; }
        }
      `}</style>
    </div>
  );
}