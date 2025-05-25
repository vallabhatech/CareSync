import React from 'react';

export default function Footer() {
  return (
    <footer className="footer">
      <div>
        &copy; {new Date().getFullYear()} <b>HealthBridge</b> &mdash; All rights reserved.
      </div>
      <div className="footer-social">
        <a href="https://github.com/MayankT10/HealthBridge" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
          {/* GitHub SVG Logo */}
          <svg height="22" width="22" viewBox="0 0 16 16" fill="#b0b0b0" style={{ verticalAlign: 'middle' }}>
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
              0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52
              -.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2
              -3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64
              -.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08
              2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01
              1.93-.01 2.19 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
          </svg>
        </a>
        <span style={{ marginLeft: 12, color: '#43e97b' }}>Made with <span role="img" aria-label="heart">💚</span></span>
      </div>
      <style>{`
        .footer {
          width: 100%;
          background: linear-gradient(90deg, #18181a 70%, #232526 100%);
          color: #b0b0b0;
          text-align: center;
          padding: 24px 0 16px 0;
          font-size: 1rem;
          border-top: 1px solid #232526;
          margin-top: 48px;
        }
        .footer-social {
          margin-top: 8px;
        }
        .footer-social a {
          color: #b0b0b0;
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-social a:hover svg {
          fill: #1976d2;
        }
      `}</style>
    </footer>
  );
}
