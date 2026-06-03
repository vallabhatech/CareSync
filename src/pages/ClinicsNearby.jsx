import React, { useState, useRef } from 'react';
import { Box, Typography, List, ListItem, Button, CircularProgress, Alert, Paper, TextField, Card, CardContent, Divider } from '@mui/material';

export default function ClinicsNearby() {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [coords, setCoords] = useState(null);       // last resolved coordinates (from any source)
  const [showFallback, setShowFallback] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [searchError, setSearchError] = useState('');
  const lastRequestTime = useRef(0);

  // Nominatim policy: max 1 request per second
  const isThrottled = () => {
    const now = Date.now();
    if (now - lastRequestTime.current < 1000) {
      setSearchError('Please wait a moment before searching again.');
      return true;
    }
    lastRequestTime.current = now;
    return false;
  };

  /**
   * Fetches nearby clinics from the OpenStreetMap Nominatim search API.
   *
   * Builds a bounding box of ±`delta` (0.1°, roughly ~11 km) around the given
   * coordinates and queries Nominatim for places matching "clinic" within it.
   *
   * Accepts coordinates from browser geolocation, geocoded city/postal code,
   * or manually entered values — all routed through the same logic.
   *
   * Endpoint:
   *   GET https://nominatim.openstreetmap.org/search
   *
   * Query parameters used:
   *   - format=json        → JSON response
   *   - q=clinic           → free-text search term
   *   - limit=10           → cap results at 10
   *   - addressdetails=1   → include a structured address breakdown
   *   - extratags=1        → include extra OSM tags
   *   - bounded=1          → restrict results to the viewbox
   *   - viewbox=left,top,right,bottom → the bounding box
   *                          (left=lon-δ, top=lat+δ, right=lon+δ, bottom=lat-δ)
   * Request header: `Accept-Language: en` to prefer English place names.
   *
   * Rate limits / usage policy: the public Nominatim service allows at most
   * **1 request per second** per the OSM usage policy
   * (https://operations.osmfoundation.org/policies/nominatim/).
   *
   * @async
   * @param {number} latitude - Latitude of the resolved location.
   * @param {number} longitude - Longitude of the resolved location.
   * @returns {Promise<void>} Updates `clinics`, `loading`, and `locationError` state.
   */
  const fetchClinics = async (latitude, longitude) => {
    setLoading(true);
    setLocationError('');
    setSearchError('');
    setCoords({ latitude, longitude });
    try {
      const delta = 0.1;
      const left = longitude - delta;
      const right = longitude + delta;
      const top = latitude + delta;
      const bottom = latitude - delta;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=clinic&limit=10&addressdetails=1&extratags=1&bounded=1&viewbox=${left},${top},${right},${bottom}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const data = await res.json();
      if (data.length === 0) {
        setLocationError('No clinics found nearby. Try increasing your search area.');
      }
      setClinics(data);
      setShowFallback(false);
    } catch (err) {
      setLocationError('Failed to fetch clinics. Try again later.');
    }
    setLoading(false);
  };

  const geocodeLocation = async (query) => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const data = await res.json();
      if (data.length === 0) {
        throw new Error('Location not found. Please try another city or postal code.');
      }
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    } catch (err) {
      throw new Error(err.message || 'Failed to find location.');
    }
  };

  const handleFindClinics = () => {
    setLocationError('');
    setSearchError('');
    setClinics([]);
    setLoading(true);
    if (!navigator.geolocation) {
      setLocationError('Location access is unavailable. You can search using a city name, postal code, manually enter coordinates, or retry location access.');
      setShowFallback(true);
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
        setLocationError('Location access is unavailable. You can search using a city name, postal code, manually enter coordinates, or retry location access.');
        setShowFallback(true);
        setLoading(false);
      }
    );
  };

  const handleCitySearch = async () => {
    if (!cityQuery.trim()) {
      setSearchError('Please enter a city name or postal code.');
      return;
    }
    if (isThrottled()) return;
    try {
      const coords = await geocodeLocation(cityQuery);
      fetchClinics(coords.lat, coords.lon);
    } catch (err) {
      setSearchError(err.message);
    }
  };

  const handleCoordSearch = () => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (!lat.trim() || !lon.trim()) {
      setSearchError('Please enter both latitude and longitude.');
      return;
    }
    if (isNaN(latitude)) {
      setSearchError('Latitude must be a valid number.');
      return;
    }
    if (isNaN(longitude)) {
      setSearchError('Longitude must be a valid number.');
      return;
    }
    if (latitude < -90 || latitude > 90) {
      setSearchError('Latitude must be between -90 and 90.');
      return;
    }
    if (longitude < -180 || longitude > 180) {
      setSearchError('Longitude must be between -180 and 180.');
      return;
    }
    if (isThrottled()) return;

    setSearchError('');
    fetchClinics(latitude, longitude);
  };

  const handleRetryLocation = () => {
    setShowFallback(false);
    setClinics([]);
    handleFindClinics();
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
        {searchError && <Alert severity="error" sx={{ mb: 2 }}>{searchError}</Alert>}
        {showFallback && (
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={2} color="#1976d2">
                Alternative Search Methods
              </Typography>
              
              <Box mb={3}>
                <Typography variant="subtitle1" fontWeight={600} mb={1}>Search by City or Postal Code</Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <TextField
                    placeholder="Enter city or postal code"
                    value={cityQuery}
                    onChange={(e) => setCityQuery(e.target.value)}
                    size="small"
                    sx={{ flexGrow: 1, minWidth: 200 }}
                  />
                  <Button variant="contained" onClick={handleCitySearch} disabled={loading}>
                    Search
                  </Button>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box mb={3}>
                <Typography variant="subtitle1" fontWeight={600} mb={1}>Manual Coordinates</Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <TextField
                    placeholder="Latitude"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    size="small"
                    sx={{ width: 120 }}
                  />
                  <TextField
                    placeholder="Longitude"
                    value={lon}
                    onChange={(e) => setLon(e.target.value)}
                    size="small"
                    sx={{ width: 120 }}
                  />
                  <Button variant="contained" onClick={handleCoordSearch} disabled={loading}>
                    Search
                  </Button>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Location access provides more accurate results for nearby clinics.
                </Typography>
                <Button variant="outlined" onClick={handleRetryLocation} disabled={loading}>
                  Retry Location Access
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
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