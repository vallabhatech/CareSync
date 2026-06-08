import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import HistoryIcon from '@mui/icons-material/History';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function ClinicsNearby() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [searchError, setSearchError] = useState('');
  const [showFallback, setShowFallback] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [lastSearchAt, setLastSearchAt] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    const fetchClinicData = async () => {
      if (!isAuthenticated) return;
      try {
        const [favRes, searchRes] = await Promise.all([
          API.get('/api/clinics/favorites'),
          API.get('/api/clinics/searches')
        ]);
        setFavorites(favRes.data);
        setRecentSearches(searchRes.data);
      } catch (err) {
        console.error('Failed to fetch favorites and searches:', err);
      }
    };
    fetchClinicData();
  }, [isAuthenticated]);

  const saveSearch = async (query, searchType, latitude, longitude) => {
    if (!isAuthenticated) return;
    try {
      const res = await API.post('/api/clinics/searches', {
        query,
        searchType,
        lat: String(latitude || ''),
        lon: String(longitude || ''),
      });
      setRecentSearches(prev => {
        const filtered = prev.filter(s => s.query !== query);
        return [res.data, ...filtered].slice(0, 10);
      });
    } catch (err) {
      console.error('Failed to save search history:', err);
    }
  };

  const handleToggleFavorite = async (clinic) => {
    if (!isAuthenticated) return;
    const isFav = favorites.some((fav) => fav.place_id === String(clinic.place_id));
    try {
      if (isFav) {
        await API.delete(`/api/clinics/favorites/${clinic.place_id}`);
        setFavorites(favorites.filter((fav) => fav.place_id !== String(clinic.place_id)));
      } else {
        const res = await API.post('/api/clinics/favorites', {
          name: clinic.display_name?.split(',')[0] || 'Clinic',
          address: clinic.display_name || '',
          lat: String(clinic.lat),
          lon: String(clinic.lon),
          place_id: String(clinic.place_id),
        });
        setFavorites([res.data, ...favorites]);
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleRecentSearchClick = async (search) => {
    setLocationError('');
    setSearchError('');
    setClinics([]);

    if (search.searchType === 'nearby') {
      handleFindClinics();
    } else if (search.searchType === 'city') {
      setCityQuery(search.query);
      setShowFallback(true);
      setLoading(true);
      try {
        const result = await geocodeLocation(search.query);
        fetchClinics(result.lat, result.lon);
      } catch (err) {
        setSearchError(err instanceof Error ? err.message : 'Unable to search that location.');
        setLoading(false);
      }
    } else if (search.searchType === 'coords') {
      setLat(search.lat);
      setLon(search.lon);
      setShowFallback(true);
      setLoading(true);
      fetchClinics(Number(search.lat), Number(search.lon));
    }
  };

  const isThrottled = () => {
    const now = Date.now();
    if (now - lastSearchAt < 1500) {
      setSearchError(t('clinics:errorThrottled'));
      return true;
    }

    setLastSearchAt(now);
    return false;
  };

  const geocodeLocation = async (query) => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
      query
    )}`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });

    if (!res.ok) {
      throw new Error(
        res.status === 429
          ? t('clinics:errorRateLimited')
          : t('clinics:errorResolveLocation')
      );
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(t('clinics:errorLocationNotFound'));
    }

    const latitude = Number.parseFloat(data[0].lat);
    const longitude = Number.parseFloat(data[0].lon);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      throw new Error(t('clinics:errorResolveLocation'));
    }

    return { lat: latitude, lon: longitude };
  };

  const fetchClinics = async (latitude, longitude) => {
    setLoading(true);
    setLocationError('');
    setSearchError('');

    try {
      const delta = 0.1;
      const left = longitude - delta;
      const right = longitude + delta;
      const top = latitude + delta;
      const bottom = latitude - delta;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=clinic&limit=10&addressdetails=1&extratags=1&bounded=1&viewbox=${left},${top},${right},${bottom}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });

      if (!res.ok) {
        throw new Error(t('clinics:errorFetchClinics'));
      }

      const data = await res.json();
      setClinics(Array.isArray(data) ? data : []);
      setShowFallback(false);

      if (!Array.isArray(data) || data.length === 0) {
        setLocationError(t('clinics:errorNoClinicsNearby'));
      }
    } catch (err) {
      console.error('Failed to fetch clinics:', err);
      setLocationError(t('clinics:errorFetchClinics'));
    } finally {
      setLoading(false);
    }
  };

  const handleFindClinics = () => {
    setLocationError('');
    setSearchError('');
    setClinics([]);
    setShowFallback(false);

    if (!navigator.geolocation) {
      setLocationError(
        t('clinics:errorLocationUnavailable')
      );
      setShowFallback(true);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetchClinics(latitude, longitude);
        saveSearch('Current Location', 'nearby', latitude, longitude);
      },
      (error) => {
        console.error('Geolocation failed:', error);
        setLocationError(
          t('clinics:errorLocationUnavailable')
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
      setSearchError(t('clinics:errorEnterCity'));
      return;
    }

    if (isThrottled()) return;

    try {
      const result = await geocodeLocation(cityQuery);
      fetchClinics(result.lat, result.lon);
      saveSearch(cityQuery, 'city', result.lat, result.lon);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Unable to search that location.');
    }
  };

  const handleCoordSearch = () => {
    const latitude = Number.parseFloat(lat);
    const longitude = Number.parseFloat(lon);

    if (!lat.trim() || !lon.trim()) {
      setSearchError(t('clinics:errorEnterCoords'));
      return;
    }

    if (Number.isNaN(latitude)) {
      setSearchError(t('clinics:errorLatNumber'));
      return;
    }

    if (Number.isNaN(longitude)) {
      setSearchError(t('clinics:errorLonNumber'));
      return;
    }

    if (latitude < -90 || latitude > 90) {
      setSearchError(t('clinics:errorLatRange'));
      return;
    }

    if (longitude < -180 || longitude > 180) {
      setSearchError(t('clinics:errorLonRange'));
      return;
    }

    if (isThrottled()) return;

    setSearchError('');
    fetchClinics(latitude, longitude);
    saveSearch(`${latitude}, ${longitude}`, 'coords', latitude, longitude);
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
          {t('clinics:title')}
        </Typography>
        <Typography variant="body1" align="center" mb={3} className="clinics-desc">
          {t('clinics:description')}
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={isAuthenticated ? 7 : 12}>
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
                {loading ? t('clinics:locating') : t('clinics:findNearMe')}
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
              <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} mb={2} color="#1976d2">
                    {t('clinics:alternativeSearch')}
                  </Typography>

                  <Box mb={3}>
                    <Typography variant="subtitle1" fontWeight={600} mb={1}>
                      {t('clinics:searchByCity')}
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      <TextField
                        placeholder={t('clinics:cityPlaceholder')}
                        value={cityQuery}
                        onChange={(e) => setCityQuery(e.target.value)}
                        size="small"
                        sx={{ flexGrow: 1, minWidth: 200 }}
                      />
                      <Button variant="contained" onClick={handleCitySearch} disabled={loading}>
                        {t('clinics:search')}
                      </Button>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box mb={3}>
                    <Typography variant="subtitle1" fontWeight={600} mb={1}>
                      {t('clinics:manualCoordinates')}
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      <TextField
                        placeholder={t('clinics:latitude')}
                        value={lat}
                        onChange={(e) => setLat(e.target.value)}
                        size="small"
                        sx={{ width: 120 }}
                      />
                      <TextField
                        placeholder={t('clinics:longitude')}
                        value={lon}
                        onChange={(e) => setLon(e.target.value)}
                        size="small"
                        sx={{ width: 120 }}
                      />
                      <Button variant="contained" onClick={handleCoordSearch} disabled={loading}>
                        {t('clinics:search')}
                      </Button>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {t('clinics:locationAccuracyNote')}
                    </Typography>
                    <Button variant="outlined" onClick={handleRetryLocation} disabled={loading}>
                      {t('clinics:retryLocation')}
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
                        position: 'relative',
                      }}
                    >
                      {isAuthenticated && (
                        <IconButton
                          onClick={() => handleToggleFavorite(clinic)}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            color: '#fbc02d',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'scale(1.15)' },
                          }}
                          size="small"
                        >
                          {favorites.some((fav) => fav.place_id === String(clinic.place_id)) ? (
                            <StarIcon />
                          ) : (
                            <StarBorderIcon />
                          )}
                        </IconButton>
                      )}
                      
                      <Typography variant="h6" fontWeight={700} color="#1976d2" mb={0.5} sx={{ pr: 4 }}>
                        {clinic.display_name?.split(',')[0] || t('clinics:unnamedClinic')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        {clinic.display_name || t('clinics:addressUnavailable')}
                      </Typography>
                      <Button
                        variant="outlined"
                        color="primary"
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.lat)},${encodeURIComponent(clinic.lon)}`}
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
                        {t('clinics:viewOnMap')}
                      </Button>
                    </ListItem>
                  </Paper>
                ))}
              </List>
            )}

            {!loading && clinics.length === 0 && !locationError && (
              <Typography variant="body2" color="text.secondary" mt={2} align="center">
                {t('clinics:emptyHint')}
              </Typography>
            )}
          </Grid>

          {isAuthenticated && (
            <Grid item xs={12} md={5}>
              <Box sx={{ borderLeft: { md: '1px solid #e0e0e0' }, pl: { md: 4 }, minHeight: '100%' }}>
                <Typography variant="h5" fontWeight={800} color="#1976d2" mb={2} display="flex" alignItems="center" gap={1}>
                  ⭐ Favorite Clinics
                </Typography>
                {favorites.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" mb={4}>
                    No favorite clinics saved yet. Click the star on clinics in search results to save.
                  </Typography>
                ) : (
                  <List sx={{ mb: 4 }}>
                    {favorites.map((fav) => (
                      <Paper
                        key={fav._id}
                        elevation={2}
                        sx={{
                          mb: 2,
                          borderRadius: 2,
                          p: 2,
                          borderLeft: '4px solid #fbc02d',
                          background: '#fcfdfe',
                        }}
                      >
                        <Typography variant="subtitle1" fontWeight={700} color="primary" sx={{ lineHeight: 1.2, mb: 0.5 }}>
                          {fav.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', mb: 1.5 }}>
                          {fav.address}
                        </Typography>
                        <Box display="flex" gap={1}>
                          <Button
                            size="small"
                            variant="outlined"
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fav.lat)},${encodeURIComponent(fav.lon)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ py: 0.25, fontSize: '0.75rem' }}
                          >
                            Map
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            variant="text"
                            onClick={() => handleToggleFavorite(fav)}
                            sx={{ py: 0.25, fontSize: '0.75rem' }}
                          >
                            Remove
                          </Button>
                        </Box>
                      </Paper>
                    ))}
                  </List>
                )}

                <Typography variant="h5" fontWeight={800} color="#1976d2" mb={2} display="flex" alignItems="center" gap={1}>
                  <HistoryIcon /> Recent Searches
                </Typography>
                {recentSearches.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No recent search history.
                  </Typography>
                ) : (
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {recentSearches.map((search) => (
                      <Button
                        key={search._id}
                        variant="outlined"
                        size="small"
                        onClick={() => handleRecentSearchClick(search)}
                        sx={{
                          borderRadius: 4,
                          textTransform: 'none',
                          color: '#555',
                          borderColor: '#b0bec5',
                          fontSize: '0.8rem',
                          py: 0.5,
                          px: 1.5,
                          '&:hover': { borderColor: '#1976d2', color: '#1976d2', background: '#f4f8fb' },
                        }}
                      >
                        {search.query}
                      </Button>
                    ))}
                  </Box>
                )}
              </Box>
            </Grid>
          )}
        </Grid>
      </div>

      <style>{`
        .clinics-bg {
          min-height: 100vh;
          background: linear-gradient(135deg, #f4f8fb 0%, #e3eafc 100%);
          color: #222;
          padding: 40px 0;
        }

        .clinics-container {
          max-width: 1000px;
          margin: 0 auto;
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 4px 32px 0 rgba(25, 118, 210, 0.08);
          padding: 36px 22px 28px 22px;
        }

        .clinics-title {
          color: #1976d2;
          font-size: 2.2rem;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .clinics-desc {
          color: #555;
          font-size: 1.08rem;
          margin-bottom: 32px;
        }

        @media (max-width: 700px) {
          .clinics-container {
            padding: 16px 8px;
          }
        }
      `}</style>
    </div>
  );
}
