import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('roh_admin_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password, role) => {
    setLoading(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (username.toLowerCase() === 'admin' && password === 'admin123') {
      const userData = {
        username,
        role: role || 'Super Admin',
        name: 'Super Admin',
        email: 'admin@roh.com',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
      };
      localStorage.setItem('roh_admin_user', JSON.stringify(userData));
      setUser(userData);
      setLoading(false);
      return { success: true };
    }

    setLoading(false);
    return { success: false, message: 'Invalid username or password' };
  };

  const logout = () => {
    localStorage.removeItem('roh_admin_user');
    setUser(null);
  };

  const updateProfile = (name, email) => {
    if (user) {
      const updated = { ...user, name, email };
      localStorage.setItem('roh_admin_user', JSON.stringify(updated));
      setUser(updated);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    updateProfile
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
