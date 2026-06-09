import React, { useEffect, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import { useTranslation } from 'react-i18next';
import {
  scheduleNotifications,
  requestNotificationPermission,
  getLocalDateString,
  PUSH_ENABLED_KEY,
} from '../utils/notifications';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'caresync_medicines';
let fallbackIdCounter = 0;

function sanitizeText(value) {
  return Array.from(String(value ?? ''))
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 && code !== 127 && char !== '<' && char !== '>';
    })
    .join('')
    .trim();
}

function createMedicineId() {
  if (typeof window !== 'undefined' && window.crypto) {
    if (typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }

    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);

    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  fallbackIdCounter += 1;
  return `${Date.now()}-${fallbackIdCounter}`;
}

function createMedicine(med) {
  const name = sanitizeText(med?.name);
  const time = sanitizeText(med?.time);
  const date = sanitizeText(med?.date);

  return {
    id: med?.id && String(med.id).trim() ? String(med.id).trim() : createMedicineId(),
    name,
    time,
    date,
  };
}

export default function MedicineTracker() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [name, setName] = useState('');
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [editingMedicine, setEditingMedicine] = useState(null);
  const today = getLocalDateString();
  const isEditing = Boolean(editingMedicine);

  useEffect(() => {
    const fetchMedicines = async () => {
      if (!isAuthenticated) return;
      try {
        const res = await API.get('/api/medicines');
        setMedicines(res.data);
      } catch (err) {
        console.error('Failed to fetch medicines:', err);
      }
    };
    fetchMedicines();
  }, [isAuthenticated]);

  useEffect(() => {
    scheduleNotifications(medicines);
  }, [medicines]);

  const startEdit = (medicine) => {
    setEditingMedicine(medicine);
    setName(medicine.name);
    setTime(medicine.time);
    setDate(medicine.date);
  };

  const cancelEdit = () => {
    setEditingMedicine(null);
    setName('');
    setTime('');
    setDate('');
  };

  const saveMedicines = (nextMedicines) => {
    setMedicines(nextMedicines);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextMedicines));
  };


  const addMedicine = async () => {
    const sanitizedName = sanitizeText(name);
    const sanitizedTime = sanitizeText(time);
    const sanitizedDate = sanitizeText(date);

    if (!sanitizedName || !sanitizedTime || !sanitizedDate) {
      return;
    }

    const pushEnabled = localStorage.getItem(PUSH_ENABLED_KEY) === 'true';
    if (pushEnabled && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      await requestNotificationPermission();
    }


    const nextMedicine = createMedicine({
      id: editingMedicine?.id,
      name: sanitizedName,
      time: sanitizedTime,
      date: sanitizedDate,
    });

    if (editingMedicine) {
      const updated = medicines.map((med) =>
        med.id === editingMedicine.id ? nextMedicine : med
      );
      saveMedicines(updated);
      setEditingMedicine(null);
    } else {
      saveMedicines([...medicines, nextMedicine]);
    }

    setName('');
    setTime('');
    setDate('');
  };

  const deleteMedicine = (id) => {
    if (editingMedicine?.id === id) {
      cancelEdit();
    }

    const updated = medicines.filter((med) => med.id !== id);
    saveMedicines(updated);

    try {
      const res = await API.post('/api/medicines', {
        name: sanitizedName,
        time: sanitizedTime,
        date: sanitizedDate,
      });
      setMedicines([...medicines, res.data]);
      setName('');
      setTime('');
      setDate('');
    } catch (err) {
      console.error('Failed to add medicine alert:', err);
    }
  };

  const deleteMedicine = async (id) => {
    const cleanId = String(id).trim();
    if (!/^[a-zA-Z0-9]+$/.test(cleanId)) {
      console.error('Invalid medicine ID format');
      return;
    }
    try {
      await API.delete(`/api/medicines/${cleanId}`);
      setMedicines(medicines.filter((med) => med.id !== id));
    } catch (err) {
      console.error('Failed to delete medicine alert:', err);
    }

  };

  const todaysReminders = medicines.filter((med) => med.date === today);

  return (
    <div className="medtracker-bg">
      <div className="medtracker-container">
        <h2 className="medtracker-title">{t('medicine:title')}</h2>

        <div className="medtracker-reminder-section">
          <h3>{t('medicine:todaysReminders')}</h3>
          {todaysReminders.length === 0 ? (
            <div className="medtracker-reminder-empty">{t('medicine:noRemindersToday')}</div>
          ) : (
            <ul className="medtracker-reminder-list">
              {todaysReminders.map((med) => (
                <li key={med.id} className="medtracker-reminder-item">
                  <span className="medtracker-pill">{med.name}</span>
                  <span className="medtracker-time">{med.time}</span>
                  <IconButton
                    aria-label={`Edit ${med.name}`}
                    title="Edit medicine"
                    onClick={() => startEdit(med)}
                    size="small"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <button
                    className="medtracker-delete-btn"
                    onClick={() => deleteMedicine(med.id)}
                    title={t('medicine:deleteReminder')}
                    type="button"
                  >
                    {t('medicine:delete')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="medtracker-form-row">
          <input
            className="medtracker-input"
            placeholder={t('medicine:namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="medtracker-input"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          <input
            className="medtracker-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button className="medtracker-btn" onClick={addMedicine} type="button">
            {isEditing ? 'Update' : 'Add'}
            {t('medicine:add')}
          </button>
          {isEditing && (
            <button className="medtracker-cancel-btn" onClick={cancelEdit} type="button">
              Cancel
            </button>
          )}
        </div>

        <h3 className="medtracker-list-title">{t('medicine:allScheduledTitle')}</h3>
        <ul className="medtracker-list">
          {medicines.length === 0 && (
            <li className="medtracker-list-empty">{t('medicine:noMedicinesYet')}</li>
          )}
          {medicines.map((med) => (
            <li key={med.id} className="medtracker-list-item">
              <span className="medtracker-pill">{med.name}</span>
              <span className="medtracker-date">{med.date}</span>
              <span className="medtracker-time">{med.time}</span>
              <IconButton
                aria-label={`Edit ${med.name}`}
                title="Edit medicine"
                onClick={() => startEdit(med)}
                size="small"
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <button
                className="medtracker-delete-btn"
                onClick={() => deleteMedicine(med.id)}
                title={t('medicine:deleteMedicine')}
                type="button"
              >
                {t('medicine:delete')}
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
          padding: 36px 22px 28px;
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
          padding: 18px 16px 12px;
          margin-bottom: 28px;
          box-shadow: 0 2px 12px #43e97b22;
        }
        .medtracker-reminder-section h3 {
          margin: 0 0 8px;
          color: #43a047;
          font-size: 1.15rem;
        }
        .medtracker-reminder-empty {
          color: #888;
          font-size: 1rem;
        }
        .medtracker-reminder-list,
        .medtracker-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .medtracker-reminder-item,
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
        .medtracker-reminder-item {
          padding-left: 0;
          padding-right: 0;
          background: transparent;
          margin-bottom: 0;
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
        .medtracker-cancel-btn {
          background: transparent;
          color: #1976d2;
          border: 1px solid #1976d2;
          border-radius: 8px;
          padding: 8px 18px;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .medtracker-cancel-btn:hover {
          background: #e3f2fd;
        }
        .medtracker-list-title {
          margin-top: 18px;
          margin-bottom: 10px;
          color: #1976d2;
          font-size: 1.1rem;
        }
        .medtracker-list-empty {
          color: #888;
          font-size: 1rem;
          padding: 8px 0;
        }
        .medtracker-date {
          color: #1976d2;
          font-weight: 600;
        }
        .medtracker-delete-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 0.95rem;
          padding: 4px 8px;
          margin-left: auto;
          transition: transform 0.2s, opacity 0.2s;
          opacity: 0.7;
        }
        .medtracker-delete-btn:hover {
          transform: scale(1.05);
          opacity: 1;
        }
        @media (max-width: 700px) {
          .medtracker-container {
            padding: 16px 4px;
          }
          .medtracker-form-row {
            gap: 6px;
          }
        }
      `}</style>
    </div>
  );
}
