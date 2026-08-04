import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    // Replaced deprecated .substr() with non-deprecated .slice()
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);

    const timer = setTimeout(() => {
      removeToast(id);
    }, duration);

    timersRef.current[id] = timer;
  }, [removeToast]);

  useEffect(() => {
    return () => {
      // Clean up all pending timers if the provider unmounts
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toasts }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};