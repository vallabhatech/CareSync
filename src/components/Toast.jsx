import React from 'react';
import { useToast } from '../context/ToastContext';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  const typeStyles = {
    success: 'bg-green-600 text-white border-green-700',
    error: 'bg-red-600 text-white border-red-700',
    info: 'bg-blue-600 text-white border-blue-700',
  };

  return (
    <div 
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className={`pointer-events-auto flex items-start justify-between p-4 rounded-lg shadow-xl border transition-all duration-300 ${
            typeStyles[toast.type] || typeStyles.info
          }`}
        >
          <p className="text-sm font-medium pr-4">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-white/80 hover:text-white transition-colors text-xs font-bold focus:outline-none"
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};