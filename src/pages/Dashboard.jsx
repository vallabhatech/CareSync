import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MedicationIcon from "@mui/icons-material/Medication";
import CalculateIcon from "@mui/icons-material/Calculate";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import SearchIcon from "@mui/icons-material/Search";
import PlaceIcon from "@mui/icons-material/Place";
import SettingsIcon from "@mui/icons-material/Settings";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import API from "../utils/api";
import { useAuth } from "../context/AuthContext";

const healthQuotes = [
  "Health is the greatest wealth.",
  "A healthy outside starts from the inside.",
  "Wellness is the natural state of my body.",
  "Eat to live, not live to eat.",
  "Every step is progress.",
  "Small changes make a big difference.",
  "Your body hears everything your mind says.",
  "Take care of your body, it's your home.",
  "Self-care is how you take your power back.",
  "Wellness is a journey, not a destination.",
];

/**
 * Dashboard — the app landing/overview page.
 *
 * Displays a time-based greeting (morning/afternoon/evening), a randomly
 * rotated health quote, and a grid of feature cards linking to the main
 * sections. On mount it reads `caresync_medicines` from localStorage to show
 * how many medicines are scheduled for today.
 *
 * Rendered as a route; takes no props and manages its own state
 * (`quote`, `todayCount`) internally.
 *
 * @component
 * @returns {JSX.Element} The dashboard overview page.
 *
 * @example
 * <Route path="/dashboard" element={<Dashboard />} />
 */
export default function Dashboard() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [quote, setQuote] = useState(healthQuotes[0]);
  const [todayCount, setTodayCount] = useState(0);
  const [favCount, setFavCount] = useState(0);

  useEffect(() => {
    setQuote(healthQuotes[Math.floor(Math.random() * healthQuotes.length)]);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!isAuthenticated) {
        setTodayCount(0);
        setFavCount(0);
        return;
      }
      try {
        const [medRes, favRes] = await Promise.all([
          API.get("/api/medicines"),
          API.get("/api/clinics/favorites"),
        ]);

        // Count today's reminders (using local date string comparison)
        const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
        const todays = medRes.data.filter((med) => med.date === todayStr);
        setTodayCount(todays.length);
        setFavCount(favRes.data.length);
      } catch (err) {
        console.error("Failed to load dashboard statistics:", err);
      }
    };

    fetchDashboardStats();
  }, [isAuthenticated]);

  const generateQuote = () => {
    let idx = Math.floor(Math.random() * healthQuotes.length);
    setQuote(healthQuotes[idx]);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return t("dashboard:greetingMorning");
    if (hour < 17) return t("dashboard:greetingAfternoon");
    return t("dashboard:greetingEvening");
  };

  const dynamicFeatures = [
    {
      id: "today's-medicines",
      title: t("dashboard:todaysMedicinesTitle"),
      desc: t("dashboard:todaysMedicines", { count: todayCount }),
      link: "/medicine-tracker",
      icon: <MedicationIcon fontSize="large" color="primary" />,
      btn: t("dashboard:medicineTracker"),
    },
    {
      id: "recent-symptom-checks",
      title: t("dashboard:recentSymptomChecksTitle"),
      desc: t("dashboard:recentSymptomChecksDesc"),
      link: "/symptom-checker",
      icon: <SearchIcon fontSize="large" color="primary" />,
      btn: t("dashboard:checkSymptoms"),
    },
    {
      id: "dosage-calculator",
      title: "Dosage Calculator",
      desc: "Estimate appropriate medicine doses based on your weight, age, and frequency.",
      link: "/dosage-calculator",
      icon: <CalculateIcon fontSize="large" color="primary" />,
      btn: "Open Calculator",
    },
    {
      id: "health-metrics",
      title: "Health Metrics",
      desc: "Track and analyze vital signs including weight, BP, heart rate, and more.",
      link: "/health-metrics",
      icon: <FavoriteBorderIcon fontSize="large" color="primary" />,
      btn: "View Metrics",
    },
    {
      id: "nearby-clinics",
      title: t("dashboard:nearbyClinicsTitle"),
      desc: t("dashboard:nearbyClinicsDesc"),
      link: "/clinics-nearby",
      icon: <PlaceIcon fontSize="large" color="primary" />,
      btn: t("dashboard:findClinics"),
    },
    {
      id: "profile-settings",
      title: t("dashboard:profileSettingsTitle"),
      desc: t("dashboard:profileSettingsDesc"),
      link: "/settings",
      icon: <SettingsIcon fontSize="large" color="primary" />,
      btn: t("dashboard:goToSettings"),
    },
    {
      id: "export-health-report",
      title: "Export Health Report",
      desc: "Download a PDF summary of your health data to share with a provider.",
      link: "/export-report",
      icon: <PictureAsPdfIcon fontSize="large" color="primary" />,
      btn: "Export PDF",
    },
  ];

  return (
    <div className="dashboard-bg">
      <div className="dashboard-overlay"></div>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">{getGreeting()} 👋</h1>
          <p className="dashboard-subtitle"> {t("dashboard:subtitle")} </p>
        </div>
        <div className="dashboard-stats">
          <div className="stat-card">
            <h2>{todayCount}</h2>
            <p>{t("dashboard:statMedicinesToday")}</p>
          </div>

          <div className="stat-card">
            <h2>{favCount}</h2>
            <p>{t("dashboard:statClinicsNearby")}</p>
          </div>

          <div className="stat-card">
            <h2>✓</h2>
            <p>{t("dashboard:statHealthStatus")}</p>
          </div>
        </div>
        <div className="dashboard-quote-section">
          <div className="dashboard-quote">{quote}</div>
          <button className="dashboard-quote-btn" onClick={generateQuote}>
            {t("dashboard:newQuote")}
          </button>
        </div>
        <div className="dashboard-features" role="navigation"
  aria-label="Dashboard features">
          {dynamicFeatures.map((feature) => (
            <div className="dashboard-card" key={feature.id}>
              <div className="dashboard-icon">{feature.icon}</div>
              <div className="dashboard-card-title">{feature.title}</div>
              <div className="dashboard-card-desc">{feature.desc}</div>
              <Link to={feature.link} className="dashboard-card-btn" aria-label={`Go to ${feature.title}`}>
                {feature.btn}
              </Link>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .dashboard-bg {
          min-height: 100vh;
          background: linear-gradient(135deg, #f4f8fb 0%, #e3f2fd 100%);
          position: relative;
          font-family: 'Segoe UI', Arial, sans-serif;
        }
        .dashboard-overlay {
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(2px);
          z-index: 0;
        }
        .dashboard-container {
          position: relative;
          z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          padding: 48px 16px 32px 16px;
        }
        .dashboard-title {
          font-size: 2.7rem;
          font-weight: 900;
          margin-bottom: 22px;
          color: #222;
          letter-spacing: 1.5px;
          text-shadow: 0 2px 16px #fff6;
        }
        .dashboard-header {
          margin-bottom: 24px;
        }
        .dashboard-subtitle {
          font-size: 1.1rem;
            color: #666;
            margin-top: -10px;
            margin-bottom: 0;
        }
        .dashboard-stats {
          display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 20px;
            margin-bottom: 32px;
        }
        .stat-card {
          background: rgba(255,255,255,0.95);
            border-radius: 16px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        }
        .stat-card h2 {
          margin: 0;
          font-size: 2rem;
          color: #1976d2;
        }
        .stat-card p {
          margin-top: 8px;
          color: #666;
          font-weight: 600;
        }
        .dashboard-quote-section {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 40px;
          flex-wrap: wrap;
        }
        .dashboard-quote {
          background: rgba(255,255,255,0.92);
          border-radius: 14px;
          padding: 20px 32px;
          font-style: italic;
          font-size: 1.22rem;
          box-shadow: 0 2px 16px 0 rgba(0,0,0,0.06);
          min-width: 220px;
          color: #333;
          border-left: 4px solid #1976d2;
          transition: box-shadow 0.2s;
        }
        .dashboard-quote-btn {
          background: linear-gradient(90deg, #1976d2 60%, #43e97b 100%);
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 10px 22px;
          font-weight: 700;
          cursor: pointer;
          font-size: 1rem;
          box-shadow: 0 2px 8px 0 #1976d255;
          transition: background 0.2s, box-shadow 0.2s;
        }
        .dashboard-quote-btn:hover {
          background: linear-gradient(90deg, #43e97b 0%, #1976d2 100%);
          box-shadow: 0 4px 16px 0 #1976d288;
        }
        .dashboard-features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 32px;
        }
        .dashboard-card {
          background: rgba(255,255,255,0.97);
          border-radius: 20px;
          box-shadow: 0 4px 32px 0 rgba(0,0,0,0.07);
          padding: 36px 22px 28px 22px;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: transform 0.2s, box-shadow 0.2s, border 0.2s;
          border: 1.5px solid #e3f2fd;
        }
        .dashboard-card:hover {
          transform: translateY(-10px) scale(1.04);
          box-shadow: 0 8px 40px 0 #1976d255;
          border-color: #1976d2;
        }
        .dashboard-icon {
          font-size: 2.7rem;
          margin-bottom: 12px;
          filter: drop-shadow(0 2px 8px #1976d244);
        }
        .dashboard-card-title {
          font-size: 1.18rem;
          font-weight: 800;
          margin-bottom: 7px;
          color: #1976d2;
          letter-spacing: 0.5px;
          min-height: 3rem;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .dashboard-card-desc {
          font-size: 1rem;
          color: #555;
          margin-bottom: 24px;
          text-align: center;
        }
        .dashboard-card-btn {
          background: linear-gradient(90deg, #1976d2 60%, #43e97b 100%);
          color: #fff;
          text-decoration: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 1rem;
          transition: background 0.2s, box-shadow 0.2s;
          box-shadow: 0 2px 8px 0 #1976d255;
          margin-top: auto;
          display: block;
          width: 100%;
          text-align: center;
          box-sizing: border-box;
        }
        .dashboard-card-btn:hover {
          background: linear-gradient(90deg, #43e97b 0%, #1976d2 100%);
          color: #fff;
        }
        .dashboard-card-btn:focus-visible {
  outline: 3px solid #43e97b;
  outline-offset: 3px;
  box-shadow: 0 0 0 4px rgba(67, 233, 123, 0.3);
}
        @media (max-width: 700px) {
          .dashboard-container { padding: 24px 4px; }
          .dashboard-title { font-size: 2rem; }
          .dashboard-quote { font-size: 1rem; padding: 12px 12px; }
          .dashboard-card { padding: 20px 8px 16px 8px; }
        }
      `}</style>
    </div>
  );
}
