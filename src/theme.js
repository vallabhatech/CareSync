import { createTheme } from '@mui/material/styles';

const baseTheme = {
  typography: {
    fontFamily: "'Open Sans', Arial, sans-serif",
    h3: { fontFamily: "'Montserrat', Arial, sans-serif" },
    h4: { fontFamily: "'Montserrat', Arial, sans-serif" },
    h6: { fontWeight: 700 },
  },
  shape: { borderRadius: 12 },
};

export function getTheme(mode = 'light') {
  return createTheme({
    ...baseTheme,
    palette: {
      mode,
      primary: { main: mode === 'dark' ? '#8ec5ff' : '#1976d2' },
      secondary: { main: mode === 'dark' ? '#7ef0b0' : '#43e97b' },
      background: {
        default: mode === 'dark' ? '#0f172a' : '#f4f8fb',
        paper: mode === 'dark' ? '#111827' : '#ffffff',
      },
      text: {
        primary: mode === 'dark' ? '#f3f4f6' : '#111827',
        secondary: mode === 'dark' ? '#cbd5e1' : '#475569',
      },
      divider: mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    },
  });
}

export default getTheme();