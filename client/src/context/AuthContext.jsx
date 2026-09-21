import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check existing session on mount
  useEffect(() => {
    async function loadSession() {
      const token = localStorage.getItem('uav_token');
      if (token) {
        try {
          const res = await api.auth.getMe();
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            localStorage.removeItem('uav_token');
          }
        } catch (err) {
          console.warn('[Auth] Session invalid or expired:', err.message);
          localStorage.removeItem('uav_token');
        }
      }
      setLoading(false);
    }
    loadSession();
  }, []);

  const login = async (username, password) => {
    const res = await api.auth.login({ username, password });
    if (res.success) {
      localStorage.setItem('uav_token', res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'Đăng nhập thất bại');
  };

  const ssoLogin = async (ssoPayload) => {
    const res = await api.auth.ssoLogin(ssoPayload);
    if (res.success) {
      localStorage.setItem('uav_token', res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'Đăng nhập không thành công');
  };

  const logout = () => {
    localStorage.removeItem('uav_token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isTeacher: user?.role === 'teacher' || user?.role === 'admin',
    isStudent: user?.role === 'student',
    canEditExplanation: user?.role === 'teacher' || user?.role === 'admin',
    login,
    ssoLogin,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
