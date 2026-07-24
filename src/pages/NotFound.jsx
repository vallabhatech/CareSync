import React from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Avatar,
  Fade,
} from '@mui/material';
import {
  ErrorOutlineOutlined as ErrorOutlineIcon,
  Dashboard as DashboardIcon,
  Medication as MedicationIcon,
  Psychology as PsychologyIcon,
  LocalHospital as LocalHospitalIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function NotFound() {
  const { t } = useTranslation(['notfound', 'common', 'nav']);

  const quickLinks = [
    {
      title: t('notfound:dashboardLabel', 'Dashboard'),
      desc: t('notfound:dashboardDesc', 'Overview of your daily health & reminders'),
      to: '/dashboard',
      icon: <DashboardIcon color="primary" fontSize="large" />,
    },
    {
      title: t('notfound:medicineLabel', 'Medicine Tracker'),
      desc: t('notfound:medicineDesc', 'Manage prescriptions and dosage schedules'),
      to: '/medicine-tracker',
      icon: <MedicationIcon color="primary" fontSize="large" />,
    },
    {
      title: t('notfound:symptomLabel', 'Symptom Checker'),
      desc: t('notfound:symptomDesc', 'AI assessment of symptoms and risk levels'),
      to: '/symptom-checker',
      icon: <PsychologyIcon color="primary" fontSize="large" />,
    },
    {
      title: t('notfound:clinicsLabel', 'Clinics Nearby'),
      desc: t('notfound:clinicsDesc', 'Find hospitals and doctors in your area'),
      to: '/clinics-nearby',
      icon: <LocalHospitalIcon color="primary" fontSize="large" />,
    },
  ];

  return (
    <Fade in timeout={600}>
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            mb: 6,
          }}
        >
          <Box sx={{ position: 'relative', mb: 3 }}>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                bgcolor: 'error.light',
                color: 'error.main',
                boxShadow: 4,
              }}
            >
              <ErrorOutlineIcon sx={{ fontSize: 64 }} />
            </Avatar>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'primary.main',
                color: 'white',
                position: 'absolute',
                bottom: -6,
                right: -6,
                boxShadow: 2,
              }}
            >
              <LocalHospitalIcon fontSize="small" />
            </Avatar>
          </Box>

          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '4rem', sm: '6rem' },
              fontWeight: 900,
              letterSpacing: '-2px',
              color: 'primary.main',
              lineHeight: 1,
              mb: 1,
            }}
          >
            404
          </Typography>

          <Typography
            variant="h4"
            component="h1"
            fontWeight={700}
            gutterBottom
            sx={{ color: 'text.primary', fontSize: { xs: '1.5rem', sm: '2rem' } }}
          >
            {t('notfound:title', '404 - Page Not Found')}
          </Typography>

          <Typography
            variant="subtitle1"
            color="text.secondary"
            sx={{ maxWidth: 600, mb: 4, px: 2, fontSize: '1.1rem' }}
          >
            {t(
              'notfound:description',
              "It seems you've followed an invalid link or typed an unrecognized web address. Let's get you back on track with managing your health."
            )}
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              component={Link}
              to="/dashboard"
              startIcon={<DashboardIcon />}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 700,
                fontSize: '1rem',
                boxShadow: 3,
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              {t('notfound:backToDashboard', 'Back to Dashboard')}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="large"
              component={Link}
              to="/"
              startIcon={<ArrowBackIcon />}
              sx={{
                px: 3,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 600,
              }}
            >
              {t('common:appName', 'CareSync')} {t('nav:dashboard', 'Home')}
            </Button>
          </Stack>
        </Box>

        <Box sx={{ mt: 6 }}>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}
          >
            {t('notfound:quickLinksTitle', 'Or jump directly to a feature:')}
          </Typography>

          <Grid container spacing={3}>
            {quickLinks.map((link) => (
              <Grid size={{ xs: 12, sm: 6 }} key={link.to}>
                <Card
                  component={Link}
                  to={link.to}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 2.5,
                    height: '100%',
                    textDecoration: 'none',
                    color: 'inherit',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: 1,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: 4,
                      borderColor: 'primary.main',
                      transform: 'translateY(-4px)',
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <Box sx={{ mr: 2 }}>{link.icon}</Box>
                  <CardContent sx={{ p: '0 !important' }}>
                    <Typography variant="h6" fontWeight={700} fontSize="1.05rem">
                      {link.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {link.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Fade>
  );
}

export default NotFound;