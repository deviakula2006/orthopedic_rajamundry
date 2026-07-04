import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('roh_admin_user');
    const storedToken = localStorage.getItem('roh_auth_token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // `role` is accepted for backward compatibility with the login form, but the
  // server is the source of truth for a user's actual role — it isn't sent.
  // eslint-disable-next-line no-unused-vars
  const login = async (username, password, role) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { username, password });
      const { token, user: loggedInUser } = res.data.data;
      localStorage.setItem('roh_auth_token', token);
      localStorage.setItem('roh_admin_user', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.error?.message || 'Invalid username or password' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('roh_admin_user');
    localStorage.removeItem('roh_auth_token');
    setUser(null);
  };

  const updateProfile = async (name, email) => {
    const res = await apiClient.patch('/auth/profile', { name, email });
    const updated = res.data.data;
    localStorage.setItem('roh_admin_user', JSON.stringify(updated));
    setUser(updated);
    return updated;
  };

  const changePassword = async (currentPassword, newPassword) => {
    await apiClient.patch('/auth/password', { currentPassword, newPassword });
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    updateProfile,
    changePassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
