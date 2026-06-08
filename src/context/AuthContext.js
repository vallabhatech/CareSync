import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import API from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user from backend using JWT on app start
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('caresync_token');
      if (token) {
        try {
          const res = await API.get('/api/auth/me');
          setUser(res.data.user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Session restore failed:', error);
          localStorage.removeItem('caresync_token');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await API.post('/api/auth/login', { email, password });
    const { token, user: loggedUser } = res.data;
    localStorage.setItem('caresync_token', String(token).replace(/[^\w\.\-\_]/g, ''));
    setUser(loggedUser);
    setIsAuthenticated(true);
    return loggedUser;
  }, []);

  const signup = useCallback(async (name, email, password) => {
    const res = await API.post('/api/auth/register', { name, email, password });
    const { token, user: loggedUser } = res.data;
    localStorage.setItem('caresync_token', String(token).replace(/[^\w\.\-\_]/g, ''));
    setUser(loggedUser);
    setIsAuthenticated(true);
    return loggedUser;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('caresync_token');
  }, []);

  const updateProfile = useCallback(async (updates) => {
    const res = await API.put('/api/auth/profile', updates);
    const { user: updatedUser } = res.data;
    setUser(updatedUser);
    return updatedUser;
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

// PropTypes validation
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Hook MUST be exported and used
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

