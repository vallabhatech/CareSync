import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { fetchHealthData } from '../utils/healthData'; // will be created placeholder

// Placeholder AI fetch – in real implementation call /api/recommendations
const fetchRecommendations = async (payload) => {
  try {
    const res = await fetch('/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    return await res.json();
  } catch (e) {
    console.error(e);
    return { diet: [], exercise: [], lifestyle: [] };
  }
};

const SectionCard = ({ title, items }) => (
  <Card sx={{ mb: 3, backdropFilter: 'blur(12px)', bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
    <CardContent>
      <Typography variant='h6' gutterBottom>{title}</Typography>
      {items.length === 0 ? (
        <Typography variant='body2' color='text.secondary'>No recommendations.</Typography>
      ) : (
        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
          {items.map((it, i) => (
            <li key={i}><Typography variant='body2'>{it}</Typography></li>
          ))}
        </ul>
      )}
    </CardContent>
  </Card>
);

export default function PersonalizedRecommendations() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState({ diet: [], exercise: [], lifestyle: [] });

  useEffect(() => {
    const load = async () => {
      const health = await fetchHealthData(); // placeholder returns user health metrics
      const recs = await fetchRecommendations(health);
      setRecommendations(recs);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 6, px: 2 }}>
      <Box sx={{ maxWidth: 900, mx: 'auto', bgcolor: 'background.paper', borderRadius: 4, p: { xs: 3, md: 4 }, boxShadow: 4 }}>
        <Typography variant='h4' gutterBottom sx={{ color: 'text.primary', mb: 2 }}>
          {t('recommendations:title', 'Personalized Health Recommendations')}
        </Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress color='inherit' />
          </Box>
        ) : (
          <>
            <SectionCard title={t('recommendations:diet', 'Diet')} items={recommendations.diet} />
            <SectionCard title={t('recommendations:exercise', 'Exercise')} items={recommendations.exercise} />
            <SectionCard title={t('recommendations:lifestyle', 'Lifestyle')} items={recommendations.lifestyle} />
          </>
        )}
      </Box>
    </Box>
  );
}
