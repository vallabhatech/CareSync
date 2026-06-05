import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on app start
  useEffect(() => {
    const storedUser = localStorage.getItem('caresync_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('caresync_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    const userWithTimestamp = {
      ...userData,
      loggedInAt: new Date().toISOString(),
    };
    setUser(userWithTimestamp);
    setIsAuthenticated(true);
    localStorage.setItem('caresync_user', JSON.stringify(userWithTimestamp));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('caresync_user');
  };

  const updateProfile = (updates) => {
    const updatedUser = { ...user, ...updates, updatedAt: new Date().toISOString() };
    setUser(updatedUser);
    localStorage.setItem('caresync_user', JSON.stringify(updatedUser));
  };

  const value = React.useMemo(() => ({
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    updateProfile,
  }), [user, isAuthenticated, loading, login, logout, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};}