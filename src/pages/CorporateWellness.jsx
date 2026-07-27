import React from 'react';
import { Box, Typography, Container, Grid, Card, CardContent, LinearProgress } from '@mui/material';
import { Business as BusinessIcon, People as PeopleIcon, DirectionsRun as RunIcon, Spa as SpaIcon } from '@mui/icons-material';

function CorporateWellness() {
  const metrics = [
    { title: 'Total Employees Enrolled', value: '1,245', icon: <PeopleIcon color="primary" fontSize="large" />, progress: 85 },
    { title: 'Avg. Daily Steps', value: '8,432', icon: <RunIcon color="secondary" fontSize="large" />, progress: 70 },
    { title: 'Active Wellness Plans', value: '342', icon: <SpaIcon color="success" fontSize="large" />, progress: 45 },
    { title: 'Company Health Score', value: 'A-', icon: <BusinessIcon color="info" fontSize="large" />, progress: 92 },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <BusinessIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" fontWeight={700}>
          Corporate Wellness Dashboard
        </Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" paragraph>
        Welcome to the HR Admin portal for Corporate Wellness. Here you can track anonymized, aggregate health metrics for your organization to ensure a healthy and productive workforce.
      </Typography>

      <Grid container spacing={4} sx={{ mt: 2 }}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 3, '&:hover': { boxShadow: 6 } }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  {metric.icon}
                  <Typography variant="h5" fontWeight={700}>
                    {metric.value}
                  </Typography>
                </Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {metric.title}
                </Typography>
                <LinearProgress variant="determinate" value={metric.progress} sx={{ mt: 2, height: 8, borderRadius: 4 }} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Box sx={{ mt: 6, p: 4, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Recent Activity & Insights
        </Typography>
        <Typography variant="body2" color="text.secondary">
          - 120 employees completed the "Step Up" challenge this week. <br/>
          - Mental Health seminars saw a 15% increase in attendance. <br/>
          - 45 new health risk assessments were submitted today.
        </Typography>
      </Box>
    </Container>
  );
}

export default CorporateWellness;
