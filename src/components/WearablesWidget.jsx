import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import WatchIcon from '@mui/icons-material/Watch';
import SyncIcon from '@mui/icons-material/Sync';
import API from '../utils/api';
import { format, subDays } from 'date-fns';

const WearablesWidget = () => {
  const [connections, setConnections] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchWearablesData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchWearablesData = async () => {
    setLoading(true);
    try {
      const statusRes = await API.get('/api/wearables/status');
      setConnections(statusRes.data);

      if (statusRes.data.length > 0) {
        // Fetch health metrics and filter for wearables
        const metricsRes = await API.get('/api/health-metrics');
        // We only care about wearables data for the chart
        const wearablesData = metricsRes.data
          .filter(m => m.source && m.source !== 'manual')
          .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));
        
        // Group by day for the chart
        const grouped = groupMetricsByDay(wearablesData);
        setMetrics(grouped);
      }
    } catch (err) {
      console.error('Failed to fetch wearables data:', err);
    } finally {
      setLoading(false);
    }
  };

  const groupMetricsByDay = (data) => {
    // Create an array for the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      return format(d, 'MMM dd');
    });

    const grouped = last7Days.map(dayStr => {
      return {
        date: dayStr,
        steps: 0,
        heartRate: null,
        sleepHours: 0,
      };
    });

    data.forEach(m => {
      const dayStr = format(new Date(m.recordedAt), 'MMM dd');
      const target = grouped.find(g => g.date === dayStr);
      if (target) {
        if (m.steps) target.steps += m.steps;
        if (m.heartRate) {
          target.heartRate = target.heartRate ? Math.round((target.heartRate + m.heartRate) / 2) : m.heartRate;
        }
        if (m.sleepHours) {
          target.sleepHours = target.sleepHours ? Math.max(target.sleepHours, parseFloat(m.sleepHours)) : parseFloat(m.sleepHours);
        }
      }
    });

    return grouped;
  };

  const handleConnect = async (provider) => {
    try {
      await API.post(`/api/wearables/connect/${provider}`);
      fetchWearablesData();
    } catch (err) {
      console.error(`Failed to connect to ${provider}:`, err);
      alert(`Failed to connect to ${provider}`);
    }
  };

  const handleDisconnect = async (provider) => {
    if (!window.confirm(`Are you sure you want to disconnect ${provider}?`)) return;
    
    const purgeData = window.confirm('Do you also want to delete all health data synced from this device?');
    
    try {
      await API.post(`/api/wearables/disconnect/${provider}`, { purgeData });
      fetchWearablesData();
    } catch (err) {
      console.error(`Failed to disconnect from ${provider}:`, err);
      alert(`Failed to disconnect from ${provider}`);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await API.post('/api/wearables/sync');
      alert(res.data.message);
      fetchWearablesData();
    } catch (err) {
      console.error('Failed to sync wearables data:', err);
      alert('Failed to sync data');
    } finally {
      setSyncing(false);
    }
  };

  const hasGoogleFit = connections.some(c => c.provider === 'google-fit');
  const hasAppleHealth = connections.some(c => c.provider === 'apple-health');

  if (loading) return <div className="wearables-loading">Loading wearables data...</div>;

  return (
    <div className="wearables-widget">
      <div className="wearables-header">
        <div className="wearables-title">
          <WatchIcon fontSize="large" color="primary" />
          <h2>Connected Devices</h2>
        </div>
        
        {connections.length > 0 && (
          <button 
            className={`sync-btn ${syncing ? 'syncing' : ''}`} 
            onClick={handleSync}
            disabled={syncing}
          >
            <SyncIcon className={syncing ? 'spin' : ''} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        )}
      </div>

      <div className="wearables-connections">
        <div className={`provider-card ${hasGoogleFit ? 'connected' : ''}`}>
          <div className="provider-info">
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c7/Google_Fit_icon_%282018%29.svg" alt="Google Fit" className="provider-logo" />
            <div>
              <h3>Google Fit</h3>
              <p>{hasGoogleFit ? 'Connected' : 'Not Connected'}</p>
            </div>
          </div>
          {hasGoogleFit ? (
            <button className="disconnect-btn" onClick={() => handleDisconnect('google-fit')}>Disconnect</button>
          ) : (
            <button className="connect-btn" onClick={() => handleConnect('google-fit')}>Connect</button>
          )}
        </div>

        <div className={`provider-card ${hasAppleHealth ? 'connected' : ''}`}>
          <div className="provider-info">
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/Apple_Health_icon.png" alt="Apple Health" className="provider-logo" />
            <div>
              <h3>Apple HealthKit</h3>
              <p>{hasAppleHealth ? 'Connected' : 'Not Connected'}</p>
            </div>
          </div>
          {hasAppleHealth ? (
            <button className="disconnect-btn" onClick={() => handleDisconnect('apple-health')}>Disconnect</button>
          ) : (
            <button className="connect-btn" onClick={() => handleConnect('apple-health')}>Connect</button>
          )}
        </div>
      </div>

      {connections.length > 0 && metrics.length > 0 && (
        <div className="wearables-chart-container">
          <h3>Synced Health Metrics (Last 7 Days)</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#333', marginBottom: '8px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Line yAxisId="left" type="monotone" dataKey="steps" name="Steps" stroke="#4285F4" strokeWidth={3} activeDot={{ r: 8 }} animationDuration={1500} />
                <Line yAxisId="right" type="monotone" dataKey="heartRate" name="Heart Rate (bpm)" stroke="#EA4335" strokeWidth={3} animationDuration={1500} />
                <Line yAxisId="left" type="monotone" dataKey="sleepHours" name="Sleep (hrs)" stroke="#9C27B0" strokeWidth={3} animationDuration={1500} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <style>{`
        .wearables-widget {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
          margin-top: 40px;
          border: 1px solid rgba(227, 242, 253, 0.8);
          font-family: 'Segoe UI', Arial, sans-serif;
          backdrop-filter: blur(10px);
        }
        .wearables-loading {
          text-align: center;
          padding: 40px;
          color: #64748b;
          font-size: 1.1rem;
          font-weight: 500;
        }
        .wearables-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .wearables-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .wearables-title h2 {
          margin: 0;
          font-size: 1.8rem;
          color: #1976d2;
          font-weight: 800;
        }
        .wearables-connections {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .provider-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-radius: 16px;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          transition: all 0.3s ease;
        }
        .provider-card.connected {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }
        .provider-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .provider-logo {
          width: 42px;
          height: 42px;
          object-fit: contain;
          background: white;
          border-radius: 10px;
          padding: 6px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .provider-info h3 {
          margin: 0 0 4px 0;
          font-size: 1.1rem;
          color: #1e293b;
        }
        .provider-info p {
          margin: 0;
          font-size: 0.9rem;
          color: #64748b;
          font-weight: 500;
        }
        .connect-btn, .disconnect-btn, .sync-btn {
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .connect-btn {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }
        .connect-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
        }
        .disconnect-btn {
          background: #fee2e2;
          color: #ef4444;
        }
        .disconnect-btn:hover {
          background: #fecaca;
        }
        .sync-btn {
          background: #f1f5f9;
          color: #334155;
          border: 1px solid #cbd5e1;
        }
        .sync-btn:hover {
          background: #e2e8f0;
        }
        .sync-btn.syncing {
          opacity: 0.7;
          cursor: not-allowed;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        .wearables-chart-container {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.04);
          border: 1px solid #f1f5f9;
        }
        .wearables-chart-container h3 {
          margin: 0 0 20px 0;
          color: #334155;
          font-size: 1.2rem;
        }
        .chart-wrapper {
          width: 100%;
          overflow: hidden;
        }
        @media (max-width: 768px) {
          .wearables-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .provider-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .connect-btn, .disconnect-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default WearablesWidget;
