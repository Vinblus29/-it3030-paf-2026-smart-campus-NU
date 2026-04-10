import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { message } from 'antd';
import { requestFCMToken } from '../firebase';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Reset inactivity timer on user activity
  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Set new timer for auto-logout
    if (user) {
      inactivityTimerRef.current = setTimeout(() => {
        message.warning('Session expired due to inactivity. Please login again.');
        logout();
      }, INACTIVITY_TIMEOUT);
    }
  }, [user]);

  // Set up activity listeners
  useEffect(() => {
    if (!user) return;

    // Reset timer on various user activities
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });

    // Initial timer
    resetInactivityTimer();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [user, resetInactivityTimer]);

  useEffect(() => {
    // Check for token or OAuth user in localStorage
    const token = localStorage.getItem('token');
    const oauthUser = localStorage.getItem('user');

    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    } else if (oauthUser) {
      // Handle OAuth user login from localStorage
      const user = JSON.parse(oauthUser);
      setUser(user);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      const userData = response.data;
      setUser(userData);

      // Always attempt to register push notification token on refresh
      try {
        const fcmToken = await requestFCMToken();
        if (fcmToken) {
          await axios.post('/api/notifications/push/register', { fcmToken });
          localStorage.setItem('smartuni_fcm_token', fcmToken);
        }
      } catch (err) {
        console.warn('FCM register failed on refresh:', err);
      }
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, rememberMe = false) => {
    const response = await axios.post('/api/auth/login', { email, password, rememberMe });
    const { token, user: userData } = response.data;

    // Store token (extended expiration if rememberMe is true)
    const expirationTime = rememberMe ? (7 * 24 * 60 * 60 * 1000) : INACTIVITY_TIMEOUT;
    localStorage.setItem('token', token);
    localStorage.setItem('tokenExpiry', Date.now() + expirationTime);

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);

    // Register push notification token
    try {
      const fcmToken = await requestFCMToken();
      if (fcmToken) {
        await axios.post('/api/notifications/push/register', { fcmToken });
        localStorage.setItem('smartuni_fcm_token', fcmToken);
      }
    } catch (err) {
      console.warn('FCM registration failed:', err);
    }

    return userData;
  };

  const register = async (userData) => {
    // Registration no longer returns token - user needs admin approval
    await axios.post('/api/auth/register', userData);
    // Don't set token or user - just return success
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('rememberedEmail');
    localStorage.removeItem('user');
    localStorage.removeItem('smartuni_fcm_token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isTechnician: user?.role === 'TECHNICIAN',
    isEnabled: user?.enabled !== false,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

