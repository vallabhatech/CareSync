import React, { useEffect, useState } from "react";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import {
  scheduleNotifications,
  requestNotificationPermission,
  getLocalDateString,
  PUSH_ENABLED_KEY,
} from "../utils/notifications";
import API from "../utils/api";
import { checkInteractions } from "../utils/interactions";
import { useAuth } from "../context/AuthContext";
import MedicineCardSkeleton from "../components/MedicineCardSkeleton";

const STORAGE_KEY = "caresync_medicines";
let fallbackIdCounter = 0;

function sanitizeText(value) {
  return Array.from(String(value ?? ""))
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 && code !== 127 && char !== "<" && char !== ">";
    })
    .join("")
    .trim();
}

function createMedicineId() {
  if (typeof window !== "undefined" && window.crypto) {
    if (typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);

    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    );
  }

  fallbackIdCounter += 1;
  return `${Date.now()}-${fallbackIdCounter}`;
}

function createMedicine(med) {
  const name = sanitizeText(med?.name);
  const time = sanitizeText(med?.time);
  const date = sanitizeText(med?.date);

  return {
    id:
      med?.id && String(med.id).trim()
        ? String(med.id).trim()
        : createMedicineId(),
    name,
    time,
    date,
  };
}

export default function MedicineTracker() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const theme = useTheme();
  const [medicines, setMedicines] = useState([]);
  const [name, setName] = useState("");
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [editingMedicine, setEditingMedicine] = useState(null);
  const today = getLocalDateString();
  const isEditing = Boolean(editingMedicine);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const res = await API.get("/api/medicines");
        setMedicines(res.data);
      } catch (err) {
        console.error("Failed to fetch medicines:", err);
      } finally {
        setIsLoading(false);
      }
    })();
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
    setName("");
    setTime("");
    setDate("");
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

    const pushEnabled = localStorage.getItem(PUSH_ENABLED_KEY) === "true";
    if (
      pushEnabled &&
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
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
        med.id === editingMedicine.id ? nextMedicine : med,
      );
      saveMedicines(updated);
      setEditingMedicine(null);
    } else {
      const withNew = [...medicines, nextMedicine];
      saveMedicines(withNew);
    }

    setName("");
    setTime("");
    setDate("");
  };
  const deleteMedicine = async (id) => {
    if (editingMedicine?.id === id) {
      cancelEdit();
    }

    const cleanId = String(id ?? "").trim();
    if (!/^[a-zA-Z0-9-]+$/.test(cleanId)) {
      window.alert(t("medicine:invalidId") || "Invalid medicine ID");
      return;
    }

    // Optimistically update local state/localStorage, but keep previous for rollback
    const previous = medicines;
    const updated = medicines.filter((med) => med.id !== id);
    saveMedicines(updated);

    try {
      await API.delete(`/api/medicines/${encodeURIComponent(cleanId)}`);
    } catch (err) {
      console.error("Failed to delete medicine alert:", err);
      // Rollback to previous state on error
      saveMedicines(previous);
      window.alert(
        t("medicine:deleteFailed") ||
          "Failed to delete medicine. Changes reverted.",
      );
    }
  };

  const todaysReminders = medicines.filter((med) => med.date === today);

  const interactionWarnings = checkInteractions(medicines);

  return (
    <div className="medtracker-bg">
      <div className="medtracker-container">
        <h2 className="medtracker-title">{t("medicine:title")}</h2>

        <div className="medtracker-reminder-section">
          <h3>{isLoading ? (
  <div className="medtracker-reminder-empty">
    Loading reminders...
  </div>
) :t("medicine:todaysReminders")}</h3>
          {todaysReminders.length === 0 ? (
            <div className="medtracker-reminder-empty">
              {t("medicine:noRemindersToday")}
            </div>
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
                    title={t("medicine:deleteReminder")}
                    type="button"
                  >
                    {t("medicine:delete")}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {interactionWarnings.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {interactionWarnings.map((w, i) => (
                <div
                  key={i}
                  className={`interaction-warning interaction-${w.severity}`}
                >
                  <strong>{w.severity.toUpperCase()}:</strong> {w.description}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="medtracker-form-row">
          <input
            className="medtracker-input"
            placeholder={t("medicine:namePlaceholder")}
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
          <button
            className="medtracker-btn"
            onClick={addMedicine}
            type="button"
          >
            {isEditing ? t("medicine:update") : t("medicine:add")}
          </button>
          {isEditing && (
            <button
              className="medtracker-cancel-btn"
              onClick={cancelEdit}
              type="button"
            >
              Cancel
            </button>
          )}
        </div>

        <h3 className="medtracker-list-title">
          {t("medicine:allScheduledTitle")}
        </h3>
        <ul className="medtracker-list">
          {!isLoading && medicines.length === 0 && (
            <li className="medtracker-list-empty">
              {t("medicine:noMedicinesYet")}
            </li>
          )}
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <MedicineCardSkeleton key={index} />
              ))
            : medicines.map((med) => (
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
                    title={t("medicine:deleteMedicine")}
                    type="button"
                  >
                    {t("medicine:delete")}
                  </button>
                </li>
              ))}
        </ul>
      </div>

      <style>{`
        .medtracker-bg {
          min-height: 100vh;
          background: linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.mode === 'dark' ? '#1e293b' : '#e3f2fd'} 100%);
          color: ${theme.palette.text.primary};
          padding: 40px 0;
        }
        .medtracker-container {
          max-width: 600px;
          margin: 0 auto;
          background: ${theme.palette.background.paper};
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
          background: ${theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.18)' : '#e3fcec'};
          border: 1px solid ${theme.palette.mode === 'dark' ? 'rgba(129, 199, 132, 0.28)' : 'rgba(67, 160, 71, 0.16)'};
          border-radius: 12px;
          padding: 18px 16px 12px;
          margin-bottom: 28px;
          box-shadow: 0 2px 12px ${theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.22)' : '#43e97b22'};
        }
        .medtracker-reminder-section h3 {
          margin: 0 0 8px;
          color: ${theme.palette.mode === 'dark' ? '#81c784' : '#43a047'};
          font-size: 1.15rem;
        }
        .medtracker-reminder-empty {
          color: ${theme.palette.text.secondary};
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
          background: ${theme.palette.mode === 'dark' ? '#1f2937' : '#f4f8fb'};
          margin-bottom: 10px;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 1rem;
        }
        .medtracker-list-item {
          min-height: 54px;
          box-sizing: border-box;
          animation: medtracker-fade-in 0.18s ease-out;
        }
        .medtracker-reminder-item {
          padding-left: 0;
          padding-right: 0;
          background: transparent;
          margin-bottom: 0;
        }
        .medtracker-pill {
          background: linear-gradient(90deg, #1976d2 60%, #43e97b 100%);
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
  gap: 10px;
  margin-bottom: 24px;
  align-items: stretch;
  flex-wrap: nowrap;
}
        .medtracker-input {
  flex: 1;
  min-width: 0;
  height: 40px;
  box-sizing: border-box;
  background: ${theme.palette.background.default};
  color: ${theme.palette.text.primary};
  border: 1px solid ${theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#b0bec5'};
  border-radius: 8px;
  padding: 0 12px;
  font-size: 1rem;
}
       .medtracker-btn {
  flex: 0 0 80px;
  height: 40px;
  box-sizing: border-box;
  background: linear-gradient(90deg, #1976d2 60%, #43e97b 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
}
        .medtracker-btn:hover {
  background: linear-gradient(90deg, #43e97b 0%, #1976d2 100%);
}
.medtracker-cancel-btn {
  flex: 0 0 80px;
  height: 40px;
  box-sizing: border-box;
  background: transparent;
  color: #1976d2;
  border: 1px solid #1976d2;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
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
          color: var(--mui-palette-text-secondary, #888);
          font-size: 1rem;
          padding: 8px 0;
        }
        .medtracker-date {
          color: #1976d2;
          font-weight: 600;
        }
        .skeleton-card {
          pointer-events: none;
        }
        .skeleton {
          display: block;
          flex: 0 0 auto;
          position: relative;
          overflow: hidden;
          background: ${theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#dbe7f0'};
          border-radius: 8px;
        }
        .skeleton::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.65),
            transparent
          );
          animation: medtracker-shimmer 1.2s ease-in-out infinite;
        }
        .skeleton-pill {
          width: 120px;
          height: 28px;
          margin-right: 8px;
        }
        .skeleton-date {
          width: 94px;
          height: 22px;
        }
        .skeleton-time {
          width: 56px;
          height: 22px;
        }
        .skeleton-icon {
          width: 34px;
          height: 34px;
          border-radius: 50%;
        }
        .skeleton-btn {
          width: 64px;
          height: 32px;
          margin-left: auto;
        }
        @keyframes medtracker-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes medtracker-shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        .medtracker-delete-btn {
          background: linear-gradient(90deg, #1976d2 60%, #43e97b 100%);
          color: #fff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
          padding: 4px 8px;
          margin-left: auto;
          height: 2rem;    
        }
        .medtracker-delete-btn:hover {
          background: linear-gradient(90deg, #43e97b 0%, #1976d2 100%);
          transform: scale(1.05);
          opacity: 1;
        }
        .interaction-warning {
          background: ${theme.palette.mode === 'dark' ? '#4a3a15' : '#fff3cd'};
          color: #856404;
          border-radius: 8px;
          padding: 10px;
          margin-top: 8px;
          font-weight: 600;
        }
        .interaction-high { background: #ffd6d6; color: #8b0000; }
        .interaction-moderate { background: #fff4cc; color: #b36b00; }
        .interaction-low { background: #e6f0ff; color: #0b4da0; }
        @media (max-width: 600px) {
  .medtracker-form-row {
    flex-wrap: wrap;
  }
  .medtracker-input {
    flex: 1 1 calc(50% - 5px);
  }
}
      `}</style>
    </div>
  );
}
