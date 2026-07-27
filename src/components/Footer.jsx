import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../index.css';
import { useTheme } from '@mui/material/styles';

export default function Footer() {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <footer className="footer" style={{ background: theme.palette.mode === 'dark' ? '#0f172a' : '#18181a', color: theme.palette.mode === 'dark' ? '#f3f4f6' : '#e0e0e0' }}>
      <div className="footer-content">
        <h3 className="footer-title">{t('common:appName')}</h3>

        <p className="footer-description">
          {t('footer:description')}
        </p>

        <div className="footer-navigation">
          <Link to="/">{t('footer:dashboard')}</Link>
          <Link to="/medicine-tracker">{t('footer:medicines')}</Link>
          <Link to="/symptom-checker">{t('footer:symptoms')}</Link>
          <Link to="/clinics-nearby">{t('footer:clinics')}</Link>
          <Link to="/settings">{t('footer:settings')}</Link>

          <span className="footer-divider">|</span>

          <a
            href="https://github.com/vallabhatech/CareSync"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('footer:githubRepo')}
          >
            {t('footer:githubRepo')}
          </a>
        </div>
        
        <div className="footer-bottom">
          <p>
            {t('footer:copyright', { year: new Date().getFullYear() })}
          </p>
          <p>
            {t('footer:madeWith')}
          </p>
        </div>
      </div>
    </footer>
  );
}