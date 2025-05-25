import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Grid,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Fade,
  Slide,
  Card,
  CardContent,
  useScrollTrigger
} from '@mui/material';
import {
  Menu as MenuIcon,
  LocalHospital as LocalHospitalIcon,
  ArrowUpward as ArrowUpwardIcon,
  Medication as MedicationIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Place as PlaceIcon,
  VolunteerActivism as VolunteerActivismIcon,
  Newspaper as NewspaperIcon
} from '@mui/icons-material';
import { useNavigate, Link, Routes, Route } from 'react-router-dom';
import '@fontsource/roboto/900.css'; // For bold title
import '@fontsource/fira-mono';      // For hackathon badge
import Dashboard from './pages/Dashboard';
import MedicineTracker from './pages/MedicineTracker';
import SymptomChecker from './pages/SymptomChecker';
import ClinicsNearby from './pages/ClinicsNearby';
import Settings from './pages/Settings';
import Footer from './components/Footer';

const NAV_LINKS = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Medicine Tracker', to: '/medicine-tracker' },
  { label: 'Symptom Checker', to: '/symptom-checker' },
  { label: 'Clinics Nearby', to: '/clinics-nearby' },
  { label: 'Settings', to: '/settings' },
];

function HideOnScroll(props) {
  const trigger = useScrollTrigger();
  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {props.children}
    </Slide>
  );
}

function FeatureCard({ icon, title, desc, delay, onClick, highlight }) {
  return (
    <Fade in timeout={800} style={{ transitionDelay: `${delay}ms` }}>
      <Card
        onClick={onClick}
        sx={{
          cursor: 'pointer',
          border: highlight ? '2px solid #43e97b' : '1px solid #e0e0e0',
          boxShadow: highlight ? 6 : 2,
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-6px) scale(1.03)',
            boxShadow: 8,
            borderColor: 'primary.main',
          },
          bgcolor: highlight ? 'rgba(67,233,123,0.08)' : 'background.paper',
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            {icon}
            <Typography variant="h6" ml={1} fontWeight={700}>
              {title}
            </Typography>
          </Box>
          <Typography variant="body2">{desc}</Typography>
        </CardContent>
      </Card>
    </Fade>
  );
}

function Home() {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        py: { xs: 4, md: 8 },
        display: 'flex',
        alignItems: 'center',
        background: `linear-gradient(135deg, rgba(67,233,123,0.12) 0%, rgba(248,255,174,0.18) 100%)`,
        '&:before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          background: `url("data:image/svg+xml,%3Csvg width='900' height='600' viewBox='0 0 900 600' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cellipse cx='700' cy='100' rx='220' ry='120' fill='%2343e97b' fill-opacity='0.13'/%3E%3Cellipse cx='200' cy='500' rx='260' ry='140' fill='%23009efd' fill-opacity='0.10'/%3E%3C/svg%3E") center/cover no-repeat`,
        },
      }}
    >
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Fade in timeout={1000}>
          <Box textAlign="center" mb={4}>
            <Typography
              variant="h3"
              fontWeight={900}
              sx={{
                color: 'primary.main',
                mb: 1,
                fontFamily: '"Roboto", "Arial", sans-serif',
                letterSpacing: 1,
                animation: 'popTitle 1.2s cubic-bezier(.68,-0.55,.27,1.55) 1',
                '@keyframes popTitle': {
                  '0%': { transform: 'scale(0.8)', opacity: 0 },
                  '60%': { transform: 'scale(1.08)', opacity: 1 },
                  '100%': { transform: 'scale(1)', opacity: 1 },
                },
              }}
            >
              Welcome to HealthBridge
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: 'text.secondary',
                fontFamily: '"Fira Mono", monospace',
                fontWeight: 500,
                letterSpacing: 0.5,
                mb: 1,
              }}
            >
              Empowering communities through accessible healthcare solutions.
            </Typography>
          </Box>
        </Fade>

        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} sm={6} md={4}>
            <FeatureCard
              icon={<MedicationIcon color="primary" fontSize="large" />}
              title="Medicine Tracker"
              desc="Stay on top of your medication schedule."
              delay={100}
              onClick={() => navigate('/medicine-tracker')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FeatureCard
              icon={<SearchIcon color="primary" fontSize="large" />}
              title="Symptom Checker"
              desc="Understand symptoms and seek help early."
              delay={200}
              onClick={() => navigate('/symptom-checker')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FeatureCard
              icon={<PlaceIcon color="primary" fontSize="large" />}
              title="Clinics Nearby"
              desc="Find the nearest healthcare centers quickly."
              delay={300}
              onClick={() => navigate('/clinics-nearby')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FeatureCard
              icon={<SettingsIcon color="primary" fontSize="large" />}
              title="Settings"
              desc="Manage preferences and profile."
              delay={400}
              onClick={() => navigate('/settings')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FeatureCard
              icon={<VolunteerActivismIcon fontSize="large" sx={{ color: '#43e97b' }} />}
              title="Donate"
              desc="Support public healthcare initiatives."
              delay={500}
              onClick={() => window.open('https://www.who.int/emergencies/donate', '_blank')}
              highlight
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <Fade in={visible}>
      <Box
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          bgcolor: 'primary.main',
          color: 'white',
          borderRadius: '50%',
          width: 48,
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 4,
          cursor: 'pointer',
          zIndex: 1200,
          '&:hover': {
            bgcolor: 'primary.dark',
          },
        }}
      >
        <ArrowUpwardIcon />
      </Box>
    </Fade>
  );
}

function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const trigger = useScrollTrigger({ threshold: 80 });

  return (
    <AppBar
      position="fixed"
      elevation={trigger ? 6 : 0}
      sx={{
        bgcolor: trigger ? 'primary.main' : 'transparent',
        color: trigger ? 'white' : 'primary.main',
        boxShadow: trigger ? 4 : 0,
        transition: 'background 0.3s, color 0.3s',
      }}
    >
      <Toolbar>
        <LocalHospitalIcon sx={{ mr: 1 }} />
        <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
          HealthBridge
        </Typography>
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
          {NAV_LINKS.map(link => (
            <Button
              key={link.label}
              component={Link}
              to={link.to}
              sx={{
                color: 'inherit',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                },
              }}
              className="nav-button"
            >
              {link.label}
            </Button>
          ))}
        </Box>
        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <IconButton color="inherit" onClick={() => setDrawerOpen(true)}>
            <MenuIcon />
          </IconButton>
        </Box>
      </Toolbar>
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 220 }}>
          <List>
            {NAV_LINKS.map(link => (
              <ListItem
                key={link.label}
                button
                component={Link}
                to={link.to}
                onClick={() => setDrawerOpen(false)}
              >
                <ListItemText primary={link.label} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}

function App() {
  return (
    <>
      <Navbar />
      <div style={{ paddingTop: 80, minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/medicine-tracker" element={<MedicineTracker />} />
          <Route path="/symptom-checker" element={<SymptomChecker />} />
          <Route path="/clinics-nearby" element={<ClinicsNearby />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
      <ScrollToTopButton />
      <Footer />
    </>
  );
}

export default App;
