import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import API from '../utils/api';

const AuthContext = createContext(null);

// Helper to sanitize user object fields before storing in browser localStorage
const sanitizeUserForStorage = (userObj) => {
  if (!userObj || typeof userObj !== 'object') return null;
  return {
    id: String(userObj.id || userObj._id || ''),
    name: String(userObj.name || ''),
    email: String(userObj.email || ''),
    role: String(userObj.role || 'Patient'),
    avatar: String(userObj.avatar || ''),
    phone: String(userObj.phone || ''),
    age: userObj.age ? String(userObj.age) : '',
    bloodGroup: String(userObj.bloodGroup || ''),
    allergies: String(userObj.allergies || ''),
    createdAt: String(userObj.createdAt || ''),
  };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user session on startup (verifies token or falls back to local user profile)
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('caresync_token');
      const storedUser = JSON.parse(localStorage.getItem('caresync_user') || 'null');

      if (token === 'local_demo_token' || (!token && storedUser)) {
        setUser(storedUser || { name: 'Demo User', email: 'user@caresync.local', role: 'Patient' });
        setIsAuthenticated(true);
        setLoading(false);
        return;
      }

      if (token) {
        try {
          const res = await API.get('/api/auth/me');
          setUser(res.data.user);
          setIsAuthenticated(true);
        } catch (error) {
          console.warn('Session restore via API failed, checking local backup:', error.message);
          if (storedUser) {
            setUser(storedUser);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('caresync_token');
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const res = await API.post('/api/auth/login', { email, password });
      const { token, user: loggedUser } = res.data;
      const cleanToken = typeof token === 'string' ? token.replace(/[^\w.-]/g, '') : '';
      if (cleanToken && /^[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+$/.test(cleanToken)) {
        localStorage.setItem('caresync_token', cleanToken);
      }
      setUser(loggedUser);
      localStorage.setItem('caresync_user', JSON.stringify(sanitizeUserForStorage(loggedUser)));
      setIsAuthenticated(true);
      return loggedUser;
    } catch (err) {
      if (!err.response || err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        const storedUser = JSON.parse(localStorage.getItem('caresync_user') || 'null');
        const localUser = storedUser || {
          name: email.split('@')[0] || 'User',
          email,
          role: 'Patient',
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem('caresync_token', 'local_demo_token');
        localStorage.setItem('caresync_user', JSON.stringify(sanitizeUserForStorage(localUser)));
        setUser(localUser);
        setIsAuthenticated(true);
        return localUser;
      }
      throw err;
    }
  }, []);

  const signup = useCallback(async (name, email, password) => {
    try {
      const res = await API.post('/api/auth/register', { name, email, password });
      const { token, user: loggedUser } = res.data;
      const cleanToken = typeof token === 'string' ? token.replace(/[^\w.-]/g, '') : '';
      if (cleanToken && /^[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+$/.test(cleanToken)) {
        localStorage.setItem('caresync_token', cleanToken);
      }
      setUser(loggedUser);
      localStorage.setItem('caresync_user', JSON.stringify(sanitizeUserForStorage(loggedUser)));
      setIsAuthenticated(true);
      return loggedUser;
    } catch (err) {
      if (!err.response || err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        const localUser = {
          name,
          email,
          role: 'Patient',
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem('caresync_token', 'local_demo_token');
        localStorage.setItem('caresync_user', JSON.stringify(sanitizeUserForStorage(localUser)));
        setUser(localUser);
        setIsAuthenticated(true);
        return localUser;
      }
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('caresync_token');
    localStorage.removeItem('caresync_user');
  }, []);

  const updateProfile = useCallback(async (updates) => {
    try {
      const res = await API.put('/api/auth/profile', updates);
      const { user: updatedUser } = res.data;
      setUser(updatedUser);
      localStorage.setItem('caresync_user', JSON.stringify(sanitizeUserForStorage(updatedUser)));
      return updatedUser;
    } catch (err) {
      if (!err.response || err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        setUser((prev) => {
          const updated = prev ? { ...prev, ...updates } : { ...updates };
          localStorage.setItem('caresync_user', JSON.stringify(sanitizeUserForStorage(updated)));
          return updated;
        });
        return updates;
      }
      throw err;
    }
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated,
    loading,
    login,
    signup,
    logout,
    updateProfile,
  }), [user, isAuthenticated, loading, login, signup, logout, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
