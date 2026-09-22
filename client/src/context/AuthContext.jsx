import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const heartbeatIntervalRef = useRef(null);

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

  // Setup periodic heartbeat to maintain online status while user has web open
  useEffect(() => {
    if (user && user.id) {
      // 1. Send initial heartbeat
      api.auth.heartbeat().catch(() => {});

      // 2. Periodic heartbeat every 25 seconds (well within the 60s server window)
      heartbeatIntervalRef.current = setInterval(() => {
        api.auth.heartbeat().catch(() => {});
      }, 25000);

      // 3. Heartbeat immediately when user refocuses or interacts with page
      const onFocus = () => {
        api.auth.heartbeat().catch(() => {});
      };
      window.addEventListener('focus', onFocus);

      // 4. Handle tab/browser unload (sendBeacon logout to immediately mark offline)
      const onUnload = () => {
        const token = localStorage.getItem('uav_token');
        if (token) {
          const url = (import.meta.env.BASE_URL ? import.meta.env.BASE_URL.replace(/\/$/, '') : '') + '/api/auth/logout';
          try {
            fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              keepalive: true
            }).catch(() => {});
          } catch (e) {}
        }
      };
      window.addEventListener('beforeunload', onUnload);

      return () => {
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
        window.removeEventListener('focus', onFocus);
        window.removeEventListener('beforeunload', onUnload);
      };
    }
  }, [user]);

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

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      localStorage.removeItem('uav_token');
      setUser(null);
    }
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
