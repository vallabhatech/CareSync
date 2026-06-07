import React from 'react';
import { Link } from 'react-router-dom';
import '../index.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <h3 className="footer-title">CareSync</h3>

        <p className="footer-description">
          Helping users manage medications, monitor symptoms, and locate
          nearby healthcare services through a simple and accessible platform.
        </p>

        <div className="footer-navigation">
          <Link to="/">Dashboard</Link>
          <Link to="/medicine-tracker">Medicines</Link>
          <Link to="/symptom-checker">Symptoms</Link>
          <Link to="/clinics-nearby">Clinics</Link>
          <Link to="/settings">Settings</Link>

          <span className="footer-divider">|</span>

          <a
            href="https://github.com/vallabhatech/CareSync"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Repository"
          >
            GitHub Repository
          </a>
        </div>
        
        <div className="footer-bottom">
          <p>
            &copy; {new Date().getFullYear()} <strong>CareSync</strong>. All rights reserved.
          </p>
          <p>
            Made with <span role="img" aria-label="heart">💚</span> for better healthcare management
          </p>
        </div>
      </div>
    </footer>
  );
}