import React from 'react';
import PropTypes from 'prop-types';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Fade,
  Slide,
  Card,
  CardContent,
  useScrollTrigger,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  LocalHospital as LocalHospitalIcon,
  ArrowUpward as ArrowUpwardIcon,
} from '@mui/icons-material';
import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import '@fontsource/roboto/900.css';
import '@fontsource/fira-mono';
import {
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FamilyProvider } from './context/FamilyContext';
import Dashboard from './pages/Dashboard';
import MedicineTracker from './pages/MedicineTracker';
import SymptomChecker from './pages/SymptomChecker';
import ClinicsNearby from './pages/ClinicsNearby';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Profile from './pages/Profile';
import DosageCalculator from './pages/DosageCalculator';
import HealthMetrics from './pages/HealthMetrics';
import MedicalDocuments from './pages/MedicalDocuments';
import HealthRiskAssessment from './pages/HealthRiskAssessment';
import Footer from './components/Footer';
import NotFound from './pages/NotFound';

// Navigation targets. Labels are resolved at render time via i18n keys
// (see the `nav` namespace) so the menu localises with the rest of the app.
const NAV_LINKS = [
  { key: 'dashboard', to: '/dashboard' },
  { key: 'medicineTracker', to: '/medicine-tracker' },
  { key: 'symptomChecker', to: '/symptom-checker' },
  { key: 'clinicsNearby', to: '/clinics-nearby' },
  { key: 'telehealth', to: '/telehealth' },
  { key: 'settings', to: '/settings' },
  { key: 'recommendations', to: '/recommendations' },
];

function HideOnScroll(props) {
  const trigger = useScrollTrigger();
  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {props.children}
    </Slide>
  );
}

HideOnScroll.propTypes = {
  children: PropTypes.node.isRequired,
};

function FeatureCard({ icon, title, desc, delay, onClick, href, highlight }) {
  return (
    <Fade in timeout={800} style={{ transitionDelay: `${delay}ms` }}>
      <Card
        component={href ? 'a' : 'div'}
        href={href}
        target={href ? '_blank' : undefined}
        rel={href ? 'noopener noreferrer' : undefined}
        onClick={onClick}
        sx={{
          cursor: 'pointer',
          textDecoration: 'none',
          color: 'inherit',
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

FeatureCard.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  desc: PropTypes.string.isRequired,
  delay: PropTypes.number.isRequired,
  onClick: PropTypes.func,
  href: PropTypes.string,
  highlight: PropTypes.bool,
};

FeatureCard.defaultProps = {
  highlight: false,
};

function ScrollToTopButton() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
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
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const trigger = useScrollTrigger({ threshold: 80 });
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

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
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            {t('common:appName')}
          </Link>
        </Typography>
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, alignItems: 'center' }}>
          {NAV_LINKS.map(link => (
            <Button
              key={link.key}
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
              {t(`nav:${link.key}`)}
            </Button>
          ))}
          {isAuthenticated && user ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title={t('nav:viewProfile')}>
                <IconButton
                  component={Link}
                  to="/profile"
                  sx={{ color: 'inherit' }}
                >
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: '0.9rem', fontWeight: 700 }}>
                    {getInitials(user.name)}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Tooltip title={t('nav:logOut')}>
                <IconButton onClick={handleLogout} sx={{ color: 'inherit' }}>
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            </Box>
          ) : (
            <Button
              component={Link}
              to="/login"
              variant="outlined"
              sx={{
                color: 'inherit',
                borderColor: 'inherit',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                },
              }}
            >
              {t('nav:logIn')}
            </Button>
          )}
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
                key={link.key}
                button
                component={Link}
                to={link.to}
                onClick={() => setDrawerOpen(false)}
              >
                <ListItemText primary={t(`nav:${link.key}`)} />
              </ListItem>
            ))}
            {isAuthenticated && user ? (
              <>
                <ListItem button component={Link} to="/profile" onClick={() => setDrawerOpen(false)}>
                  <ListItemText primary={t('nav:profile')} />
                </ListItem>
                <ListItem button onClick={() => { handleLogout(); setDrawerOpen(false); }}>
                  <ListItemText primary={t('nav:logOut')} />
                </ListItem>
              </>
            ) : (
              <ListItem button component={Link} to="/login" onClick={() => setDrawerOpen(false)}>
                <ListItemText primary={t('nav:logIn')} />
              </ListItem>
            )}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}

function App() {
  return (
    <AuthProvider>
      <FamilyProvider>
        <Navbar />
        <div style={{ paddingTop: 80, minHeight: '100vh' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/medicine-tracker" element={<MedicineTracker />} />
            <Route path="/symptom-checker" element={<SymptomChecker />} />
            <Route path="/clinics-nearby" element={<ClinicsNearby />} />
            <Route path="/dosage-calculator" element={<DosageCalculator />} />
            <Route path="/health-metrics" element={<HealthMetrics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/dosage-calculator" element={<DosageCalculator />} />
            <Route path="/health-metrics" element={<HealthMetrics />} />
            <Route path="/telehealth" element={<Telehealth />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        <ScrollToTopButton />
        <Footer />
      </FamilyProvider>
    </AuthProvider>
  );
}

export default App;
