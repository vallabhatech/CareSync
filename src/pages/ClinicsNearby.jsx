import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  List,
  ListItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';


/**
 * ClinicsNearby — find nearby clinics using the browser's geolocation.
 *
 * Requests the user's location via the Geolocation API, then queries the
 * OpenStreetMap Nominatim search endpoint for clinics within a bounding box
 * around those coordinates, rendering the results with links to Google Maps.
 * Handles loading, geolocation-permission errors, and empty results.
 *
 * Rendered as a route; takes no props and manages its own state
 * (`clinics`, `loading`, `locationError`, `coords`) internally.
 * (The Nominatim API integration — endpoint, parameters, response shape, and
 * rate limits — is documented separately; see issue #12, Task 2's API task.)
 *
 * @component
 * @returns {JSX.Element} The nearby-clinics page.
 *
 * @example
 * <Route path="/clinics-nearby" element={<ClinicsNearby />} />
 */
export default function ClinicsNearby() {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [searchError, setSearchError] = useState('');
  const [showFallback, setShowFallback] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const lastSearchAtRef = useRef(0);

  const isThrottled = () => {
    const now = Date.now();
    if (now - lastSearchAtRef.current < 1500) {
      setSearchError('Please wait a moment before searching again.');
      return true;
    }
    lastSearchAtRef.current = now;
    return false;
  };

  const geocodeLocation = async (query) => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
      query
    )}`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    if (!res.ok) {
      throw new Error('Unable to search that location right now.');
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No matching location found. Try a different city or postal code.');
    }

    return {
      lat: Number.parseFloat(data[0].lat),
      lon: Number.parseFloat(data[0].lon),
    };
  };
  const [coords, setCoords] = useState(null);

  // Rate-limit helper: prevent rapid repeated API calls
  const lastCallRef = React.useRef(0);
  const isThrottled = () => {
    const now = Date.now();
    if (now - lastCallRef.current < 1000) {
      setSearchError('Please wait a moment before searching again.');
      return true;
    }
    lastCallRef.current = now;
    setSearchError('');
    return false;
  };

  // Geocode a city name or postal code via Nominatim
    const geocodeLocation = async (query) => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    
    if (!res.ok) {
      throw new Error(
        res.status === 429
          ? 'Location search is temporarily rate-limited. Please try again in a moment.'
          : 'Failed to resolve that location. Please try again later.'
      );
    }
    
    const data = await res.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Location not found. Please check your spelling or try a different query.');
    }
    
    const latitude = Number.parseFloat(data[0].lat);
    const longitude = Number.parseFloat(data[0].lon);
    
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      throw new Error('Failed to resolve that location. Please try again later.');
    }
    
    return { lat: latitude, lon: longitude };
  };

  const fetchClinics = async (lat, lon) => {
    setLoading(true);
    setLocationError('');
    setSearchError('');

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
      setShowFallback(false);
    } catch (err) {
      console.error('Failed to fetch clinics:', err);
      setLocationError('Failed to fetch clinics. Try again later.');
    }
    setLoading(false);
  };

  const handleFindClinics = () => {
    setLocationError('');
    setSearchError('');
    setClinics([]);
    setShowFallback(false);

    if (!navigator.geolocation) {
      setLocationError(
        'Location access is unavailable. You can search using a city name, postal code, manually enter coordinates, or retry location access.'
      );
      setShowFallback(true);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lon: longitude });
        fetchClinics(latitude, longitude);
      },
      () => {
        setLocationError(
          'Location access is unavailable. You can search using a city name, postal code, manually enter coordinates, or retry location access.'
        );
        setShowFallback(true);
        setLoading(false);
      }
    );
  };

  const handleCitySearch = async () => {
    setLocationError('');
    setSearchError('');

    if (!cityQuery.trim()) {
      setSearchError('Please enter a city name or postal code.');
      return;
    }

    if (isThrottled()) return;

    try {
      const result = await geocodeLocation(cityQuery);
      setCoords(result);
      fetchClinics(result.lat, result.lon);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Unable to search that location.');
    }
  };

  const handleCoordSearch = () => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (!lat.trim() || !lon.trim()) {
      setSearchError('Please enter both latitude and longitude.');
      return;
    }
    if (Number.isNaN(latitude)) {
      setSearchError('Latitude must be a valid number.');
      return;
    }
    if (Number.isNaN(longitude)) {
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
    setCoords({ lat: latitude, lon: longitude });
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
          Clinics Nearby
        </Typography>
        <Typography variant="body1" align="center" mb={3} className="clinics-desc">
          Find clinics and hospitals close to your current location.
        </Typography>

        <Box display="flex" justifyContent="center" mb={3}>
          <Button
            variant="contained"
            onClick={handleFindClinics}
            disabled={loading}
            sx={{
              fontWeight: 700,
              fontSize: '1.1rem',
              px: 4,
              py: 1.2,
              background: 'linear-gradient(90deg, #1976d2 60%, #7b1fa2 100%)',
              boxShadow: '0 2px 12px #1976d244',
            }}
          >
            {loading ? 'Locating...' : 'Find Clinics Near Me'}
          </Button>
        </Box>

        {locationError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {locationError}
          </Alert>
        )}
        {searchError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {searchError}
          </Alert>
        )}

        {showFallback && (
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={2} color="#1976d2">
                Alternative Search Methods
              </Typography>

              <Box mb={3}>
                <Typography variant="subtitle1" fontWeight={600} mb={1}>
                  Search by City or Postal Code
                </Typography>
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
                <Typography variant="subtitle1" fontWeight={600} mb={1}>
                  Manual Coordinates
                </Typography>
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
            {clinics.map((clinic) => (
              <Paper
                key={clinic.place_id}
                elevation={3}
                sx={{
                  mb: 3,
                  borderRadius: 3,
                  background: '#f5f6fa',
                  borderLeft: '6px solid #1976d2',
                  boxShadow: '0 2px 12px #1976d222',
                }}
              >
                <ListItem
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    p: 2,
                  }}
                >
                  <Typography variant="h6" fontWeight={700} color="#1976d2" mb={0.5}>
                    {clinic.display_name?.split(',')[0] || 'Unnamed clinic'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    {clinic.display_name || 'Address unavailable'}
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
                      '&:hover': { background: '#e3eafc' },
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
            Click &quot;Find Clinics Near Me&quot; to see nearby clinics and hospitals.
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
          .clinics-container {
            padding: 16px 4px;
          }
        }
      `}</style>
    </div>
  );
}