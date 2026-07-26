import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import API from '../utils/api';

const AuthContext = createContext(null);

/** Allowed user roles for the application. */
const ALLOWED_ROLES = ['Patient', 'Doctor', 'Admin', 'Caregiver'];

/**
 * Sanitize a user object before storing in browser localStorage.
 * Ensures all fields are coerced to safe string primitives and the
 * role is validated against a known whitelist.
 * @param {Object|null} userObj - The raw user object to sanitize.
 * @returns {Object|null} A sanitized copy, or null if input is invalid.
 */
const sanitizeUserForStorage = (userObj) => {
  if (!userObj || typeof userObj !== 'object') return null;
  const rawRole = String(userObj.role || 'Patient');
  const safeRole = ALLOWED_ROLES.includes(rawRole) ? rawRole : 'Patient';

  const cleanAvatar = String(userObj.avatar || '');
  const safeAvatar = cleanAvatar.startsWith('data:image/')
    ? cleanAvatar
    : cleanAvatar.replace(/[^\w.:/_-]/g, '');

  return {
    id: String(userObj.id || userObj._id || '').replace(/[^\w-]/g, ''),
    name: String(userObj.name || '').replace(/[^\w\s.-]/g, ''),
    email: String(userObj.email || '').replace(/[^\w@.-]/g, ''),
    role: safeRole,
    avatar: safeAvatar,
    phone: String(userObj.phone || '').replace(/[^\d+()\s-]/g, ''),
    age: String(userObj.age || '').replace(/\D/g, ''),
    bloodGroup: String(userObj.bloodGroup || '').replace(/[^\w+-]/g, ''),
    allergies: String(userObj.allergies || '').replace(/[^\w\s,.-]/g, ''),
    createdAt: String(userObj.createdAt || '').replace(/[^\w.:-]/g, ''),
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
      let storedUser = null;
      try {
        storedUser = JSON.parse(localStorage.getItem('caresync_user') || 'null');
      } catch (e) {
        console.warn('Corrupt caresync_user in localStorage, clearing:', e.message);
        localStorage.removeItem('caresync_user');
      }

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
          const isNetworkError = error.code === 'ERR_NETWORK' || error.message?.includes('Network Error');
          if (isNetworkError && storedUser) {
            console.warn('Network unavailable, restoring cached session:', error.message);
            setUser(storedUser);
            setIsAuthenticated(true);
          } else {
            console.warn('Session restore failed (server rejected token):', error.message);
            localStorage.removeItem('caresync_token');
            localStorage.removeItem('caresync_user');
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
      if (typeof token !== 'string' || !/^[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+$/.test(token)) {
        throw new Error('Server returned an invalid or missing authentication token.');
      }
      localStorage.setItem('caresync_token', token);
      setUser(loggedUser);
      localStorage.setItem('caresync_user', JSON.stringify(sanitizeUserForStorage(loggedUser)));
      setIsAuthenticated(true);
      return loggedUser;
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        let cachedUser = null;
        try {
          cachedUser = JSON.parse(localStorage.getItem('caresync_user') || 'null');
        } catch (e) {
          cachedUser = null;
        }
        const localUser = (cachedUser && cachedUser.email === email) ? cachedUser : {
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
      if (typeof token !== 'string' || !/^[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+$/.test(token)) {
        throw new Error('Server returned an invalid or missing authentication token.');
      }
      localStorage.setItem('caresync_token', token);
      setUser(loggedUser);
      localStorage.setItem('caresync_user', JSON.stringify(sanitizeUserForStorage(loggedUser)));
      setIsAuthenticated(true);
      return loggedUser;
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
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
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        const mergedUser = user ? { ...user, ...updates } : { ...updates };
        localStorage.setItem('caresync_user', JSON.stringify(sanitizeUserForStorage(mergedUser)));
        setUser(mergedUser);
        return mergedUser;
      }
      throw err;
    }
  }, [user]);

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
