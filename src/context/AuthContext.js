import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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

  const login = useCallback((userData) => {
    const userWithTimestamp = {
      ...userData,
      loggedInAt: new Date().toISOString(),
    };
    setUser(userWithTimestamp);
    setIsAuthenticated(true);
    localStorage.setItem('caresync_user', JSON.stringify(userWithTimestamp));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('caresync_user');
  }, []);

  const updateProfile = useCallback((updates) => {
    setUser((currentUser) => {
      const updatedUser = {
        ...currentUser,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem('caresync_user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    updateProfile,
  }), [user, isAuthenticated, loading, login, logout, updateProfile]);

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
