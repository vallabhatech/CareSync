import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Avatar,
  Chip,
  Alert,
  TextField,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChatIcon from '@mui/icons-material/Chat';
import VideocamIcon from '@mui/icons-material/Videocam';
import WifiOffIcon from '@mui/icons-material/WifiOff';

// Mock data for remote providers
const MOCK_PROVIDERS = [
  {
    id: 1,
    name: 'Dr. Sarah Jenkins',
    specialty: 'General Physician',
    status: 'online',
    experience: '10 years'
  },
  {
    id: 2,
    name: 'Dr. Ramesh Patel',
    specialty: 'Pediatrician',
    status: 'offline',
    experience: '15 years'
  },
  {
    id: 3,
    name: 'Dr. Emily Chen',
    specialty: 'Dermatologist',
    status: 'online',
    experience: '8 years'
  }
];

export default function Telehealth() {
  const { t } = useTranslation(['telehealth', 'common']);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOffline] = useState(!navigator.onLine);

  const filteredProviders = MOCK_PROVIDERS.filter((provider) =>
    provider.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    provider.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 3, pt: 4 }}>
      <Typography variant="h4" fontWeight={800} mb={2} align="center" color="primary">
        {t('telehealth:title')}
      </Typography>
      
      <Typography variant="body1" align="center" mb={4} color="text.secondary">
        {t('telehealth:description')}
      </Typography>

      {isOffline && (
        <Alert severity="warning" icon={<WifiOffIcon />} sx={{ mb: 4 }}>
          {t('telehealth:offlineNotice')}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <TextField
          variant="outlined"
          placeholder={t('telehealth:specialtyPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ 
            width: '100%', 
            maxWidth: 600, 
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="primary" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {filteredProviders.length === 0 ? (
        <Typography align="center" color="text.secondary" mt={4}>
          {t('telehealth:noProviders')}
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          {filteredProviders.map((provider) => (
            <Card 
              key={provider.id}
              sx={{ 
                width: '100%',
                maxWidth: 600,
                borderRadius: 4, 
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                borderLeft: provider.status === 'online' ? '6px solid #4caf50' : '6px solid #9e9e9e',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
                }
              }}
            >
              <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ bgcolor: 'primary.light', width: 64, height: 64, fontSize: '1.5rem' }}>
                    {provider.name.split(' ')[1][0]}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" fontWeight={800}>
                      {provider.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      {provider.specialty} • {provider.experience}
                    </Typography>
                  </Box>
                  <Chip 
                    label={provider.status === 'online' ? 'Online' : 'Offline'} 
                    size="small"
                    color={provider.status === 'online' ? 'success' : 'default'}
                    sx={{ fontWeight: 600, px: 1 }}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    startIcon={<ChatIcon />}
                    disabled={provider.status === 'offline' && !isOffline}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, py: 1 }}
                  >
                    {t('telehealth:consultText')}
                  </Button>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    startIcon={<VideocamIcon />}
                    disabled={provider.status === 'offline' || isOffline}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, py: 1 }}
                  >
                    {t('telehealth:consultVideo')}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
