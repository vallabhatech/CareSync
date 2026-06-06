import React, { useState } from 'react';

/**
 * MedicineTracker — add, view, and delete scheduled medicines.
 *
 * Persists the medicine list in localStorage under `caresync_medicines`
 * (each entry: `{ id, name, time, date }`). Backfills a generated `id` for
 * any legacy entries missing one. Provides a form to add a medicine (name +
 * time + date) and surfaces today's entries as reminders.
 *
 * Rendered as a route; takes no props and manages its own state
 * (`medicines`, `name`, `time`, `date`) internally.
 *
 * @component
 * @returns {JSX.Element} The medicine tracker page.
 *
 * @example
 * <Route path="/medicine-tracker" element={<MedicineTracker />} />
 */
export default function MedicineTracker() {
  const [medicines, setMedicines] = useState(() => {
    const saved = localStorage.getItem('caresync_medicines');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      // Ensure all loaded medicines have an id
      return parsed.map(med => {
        if (!med.id) {
          return {
            ...med,
            id: Date.now().toString() + Math.random().toString(36).substring(2, 9)
          };
        }
        return med;
      });
    } catch (e) {
      return [];
    }
  });

  const [name, setName] = useState('');
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().slice(0, 10);

  const addMedicine = () => {
    if (name && time && date) {
      const newMed = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        name,
        time,
        date
      };
      const updated = [...medicines, newMed];
      setMedicines(updated);
      localStorage.setItem('caresync_medicines', JSON.stringify(updated));
      setName('');
      setTime('');
      setDate('');
    }
  };

  const deleteMedicine = (id) => {
    const updated = medicines.filter(med => med.id !== id);
    setMedicines(updated);
    localStorage.setItem('caresync_medicines', JSON.stringify(updated));
  };

  // Filter medicines for today's reminders
  const todaysReminders = medicines.filter(med => med.date === today);

  return (
    <div className="medtracker-bg">
      <div className="medtracker-container">
        <h2 className="medtracker-title">💊 Medicine Tracker</h2>
        <div className="medtracker-reminder-section">
          <h3>Today's Reminders</h3>
          {todaysReminders.length === 0 ? (
            <div className="medtracker-reminder-empty">No medicines scheduled for today.</div>
          ) : (
            <ul className="medtracker-reminder-list">
              {todaysReminders.map((med, idx) => (
                <li key={med.id || idx} className="medtracker-reminder-item">
                  <span className="medtracker-pill">{med.name}</span>
                  <span className="medtracker-time">{med.time}</span>
                  <button 
                    className="medtracker-delete-btn" 
                    onClick={() => deleteMedicine(med.id)}
                    title="Delete reminder"
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="medtracker-form-row">
          <input
            className="medtracker-input"
            placeholder="Medicine Name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            className="medtracker-input"
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
          />
          <input
            className="medtracker-input"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
          <button className="medtracker-btn" onClick={addMedicine}>Add</button>
        </div>
        <h3 className="medtracker-list-title">All Scheduled Medicines</h3>
        <ul className="medtracker-list">
          {medicines.length === 0 && (
            <li className="medtracker-list-empty">No medicines scheduled yet.</li>
          )}
          {medicines.map((med, idx) => (
            <li key={med.id || idx} className="medtracker-list-item">
              <span className="medtracker-pill">{med.name}</span>
              <span className="medtracker-date">{med.date}</span>
              <span className="medtracker-time">{med.time}</span>
              <button 
                className="medtracker-delete-btn" 
                onClick={() => deleteMedicine(med.id)}
                title="Delete medicine"
              >
                🗑️
              </button>
            </li>
          ))}
        </ul>
      </div>
      <style>{`
        .medtracker-bg {
          min-height: 100vh;
          background: linear-gradient(135deg, #f4f8fb 0%, #e3f2fd 100%);
          color: #222;
          padding: 40px 0;
        }
        .medtracker-container {
          max-width: 600px;
          margin: 0 auto;
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 4px 32px 0 rgba(25, 118, 210, 0.08);
          padding: 36px 22px 28px 22px;
        }
        .medtracker-title {
          color: #1976d2;
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 18px;
          text-align: center;
        }
        .medtracker-reminder-section {
          background: #e3fcec;
          border-radius: 12px;
          padding: 18px 16px 12px 16px;
          margin-bottom: 28px;
          box-shadow: 0 2px 12px #43e97b22;
        }
        .medtracker-reminder-section h3 {
          margin: 0 0 8px 0;
          color: #43a047;
          font-size: 1.15rem;
        }
        .medtracker-reminder-empty {
          color: #888;
          font-size: 1rem;
        }
        .medtracker-reminder-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .medtracker-reminder-item {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 7px 0;
          font-size: 1.08rem;
        }
        .medtracker-pill {
          background: #1976d2;
          color: #fff;
          padding: 4px 12px;
          border-radius: 8px;
          font-weight: 600;
          margin-right: 8px;
        }
        .medtracker-time {
          color: #43a047;
          font-weight: 700;
          font-size: 1.05rem;
        }
        .medtracker-form-row {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .medtracker-input {
          background: #f4f8fb;
          color: #222;
          border: 1px solid #b0bec5;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 1rem;
          min-width: 120px;
        }
        .medtracker-btn {
          background: linear-gradient(90deg, #1976d2 60%, #43e97b 100%);
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 8px 18px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .medtracker-btn:hover {
          background: linear-gradient(90deg, #43e97b 0%, #1976d2 100%);
          color: #18181a;
        }
        .medtracker-list-title {
          margin-top: 18px;
          margin-bottom: 10px;
          color: #1976d2;
          font-size: 1.1rem;
        }
        .medtracker-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .medtracker-list-empty {
          color: #888;
          font-size: 1rem;
          padding: 8px 0;
        }
        .medtracker-list-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f4f8fb;
          margin-bottom: 10px;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 1rem;
        }
        .medtracker-date {
          color: #1976d2;
          font-weight: 600;
        }
        .medtracker-delete-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 1.1rem;
          padding: 4px;
          margin-left: auto;
          transition: transform 0.2s, opacity 0.2s;
          opacity: 0.6;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .medtracker-delete-btn:hover {
          transform: scale(1.2);
          opacity: 1;
        }
        @media (max-width: 700px) {
          .medtracker-container { padding: 16px 4px; }
          .medtracker-form-row { gap: 6px; }
        }
      `}</style>
    </div>
  );
}
