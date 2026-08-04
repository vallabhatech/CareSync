import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { ThemeModeProvider, useThemeMode } from './context/ThemeContext';
import './i18n';

function ThemedApp() {
  const { theme } = useThemeMode();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Suspense fallback={null}>
    <BrowserRouter>
      <ThemeModeProvider>
        <ThemedApp />
      </ThemeModeProvider>
    </BrowserRouter>
  </Suspense>
);

// Register the service worker for push notification support.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('CareSync SW registered:', registration.scope);
      })
      .catch((err) => {
        console.warn('CareSync SW registration failed:', err);
      });
  });
}