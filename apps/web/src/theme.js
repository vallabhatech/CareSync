import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#43e97b' },
    background: { default: '#f4f8fb' },
  },
  typography: {
    fontFamily: "'Open Sans', Arial, sans-serif",
    h3: { fontFamily: "'Montserrat', Arial, sans-serif" },
    h4: { fontFamily: "'Montserrat', Arial, sans-serif" },
    h6: { fontWeight: 700 },
  },
  shape: { borderRadius: 12 },
});

export default theme;