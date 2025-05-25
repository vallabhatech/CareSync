import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

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

const features = [
  {
    title: "Today's Medicines",
    desc: "2 medicines scheduled for today.",
    link: "/medicine-tracker",
    icon: "💊",
    btn: "View Medicine Tracker",
  },
  {
    title: "Recent Symptom Checks",
    desc: "Last check: No major symptoms detected.",
    link: "/symptom-checker",
    icon: "🔍",
    btn: "Check Symptoms",
  },
  {
    title: "Nearby Clinics",
    desc: "3 clinics within 5km.",
    link: "/clinics-nearby",
    icon: "📍",
    btn: "Find Clinics",
  },
  {
    title: "Profile & Settings",
    desc: "Update your preferences and profile.",
    link: "/settings",
    icon: "⚙️",
    btn: "Go to Settings",
  }
];

export default function Dashboard() {
  const [quote, setQuote] = useState(healthQuotes[0]);

  useEffect(() => {
    setQuote(healthQuotes[Math.floor(Math.random() * healthQuotes.length)]);
    // eslint-disable-next-line
  }, []);

  const generateQuote = () => {
    let idx = Math.floor(Math.random() * healthQuotes.length);
    setQuote(healthQuotes[idx]);
  };

  return (
    <div className="dashboard-bg">
      <div className="dashboard-overlay"></div>
      <div className="dashboard-container">
        <h1 className="dashboard-title">Dashboard</h1>
        <div className="dashboard-quote-section">
          <div className="dashboard-quote">{quote}</div>
          <button className="dashboard-quote-btn" onClick={generateQuote}>New Quote</button>
        </div>
        <div className="dashboard-features">
          {features.map((feature, idx) => (
            <div className="dashboard-card" key={idx}>
              <div className="dashboard-icon">{feature.icon}</div>
              <div className="dashboard-card-title">{feature.title}</div>
              <div className="dashboard-card-desc">{feature.desc}</div>
              <Link to={feature.link} className="dashboard-card-btn">{feature.btn}</Link>
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
        }
        .dashboard-card-desc {
          font-size: 1rem;
          color: #555;
          margin-bottom: 20px;
          text-align: center;
        }
        .dashboard-card-btn {
          background: #1976d2;
          color: #fff;
          text-decoration: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 1rem;
          transition: background 0.2s, box-shadow 0.2s;
          box-shadow: 0 2px 8px 0 #1976d255;
        }
        .dashboard-card-btn:hover {
          background: #43e97b;
          color: #18181a;
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
