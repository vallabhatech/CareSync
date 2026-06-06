import React from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Navbar — sticky top navigation bar with links to all main routes.
 *
 * Renders the CareSync logo and navigation links (Dashboard, Medicines,
 * Symptoms, Clinics, Settings). Uses React Router's `useLocation` to
 * highlight the link matching the current `pathname` with an `active` class.
 * Styling is scoped via an inline `<style>` block, including a mobile
 * breakpoint at 700px.
 *
 * Takes no props; reads the current route internally via `useLocation`.
 *
 * @component
 * @returns {JSX.Element} The top navigation bar.
 *
 * @example
 * <Navbar />
 */
export default function Navbar() {
  const location = useLocation();
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <span role="img" aria-label="logo" style={{ fontSize: 28, marginRight: 8 }}>🌙</span>
        <span className="navbar-title">CareSync</span>
      </div>
      <div className="navbar-links">
        <Link to="/" className={location.pathname === "/" ? "active" : ""}>Dashboard</Link>
        <Link to="/medicine-tracker" className={location.pathname === "/medicine-tracker" ? "active" : ""}>Medicines</Link>
        <Link to="/symptom-checker" className={location.pathname === "/symptom-checker" ? "active" : ""}>Symptoms</Link>
        <Link to="/clinics-nearby" className={location.pathname === "/clinics-nearby" ? "active" : ""}>Clinics</Link>
        <Link to="/settings" className={location.pathname === "/settings" ? "active" : ""}>Settings</Link>
      </div>
      <style>{`
        .navbar {
          width: 100%;
          background: linear-gradient(90deg, #18181a 70%, #232526 100%);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          height: 64px;
          position: sticky;
          top: 0;
          z-index: 100;
          border-bottom: 1px solid #232526;
        }
        .navbar-logo {
          display: flex;
          align-items: center;
          font-weight: 900;
          font-size: 1.3rem;
          letter-spacing: 1px;
        }
        .navbar-title {
          color: #fff;
        }
        .navbar-links {
          display: flex;
          gap: 28px;
        }
        .navbar-links a {
          color: #b0b0b0;
          text-decoration: none;
          font-weight: 600;
          font-size: 1rem;
          padding: 6px 12px;
          border-radius: 6px;
          transition: background 0.18s, color 0.18s;
        }
        .navbar-links a.active,
        .navbar-links a:hover {
          background: #232526;
          color: #fff;
        }
        @media (max-width: 700px) {
          .navbar { padding: 0 8px; }
          .navbar-links { gap: 10px; }
          .navbar-logo { font-size: 1rem; }
        }
      `}</style>
    </nav>
  );
}
