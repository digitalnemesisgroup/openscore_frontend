'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  apiRequest,
  getAuthToken,
  removeAuthToken,
  setAuthToken,
  getCachedUser,
  setCachedUser,
} from './api';

interface User {
  id: number;
  name: string;
  email: string;
  mobile?: string;
  role?: string;
  account_type?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User, refreshToken?: string) => void;
  logout: (reason?: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

// 15 Minutes Idle Inactivity Limit
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const logout = (reason?: string) => {
    if (token) {
      apiRequest('/logout', { method: 'POST' }).catch(() => {});
    }
    removeAuthToken();
    setTokenState(null);
    setUser(null);

    if (reason && typeof window !== 'undefined') {
      localStorage.setItem('inactivity_logout_reason', reason);
      window.location.href = '/login?reason=inactive';
    }
  };

  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (token || getAuthToken()) {
      inactivityTimerRef.current = setTimeout(() => {
        logout('inactivity');
      }, INACTIVITY_TIMEOUT_MS);
    }
  };

  // User Activity Listeners (Auto Logout on 15 mins Inactivity)
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleUserActivity = () => {
      resetInactivityTimer();
    };

    if (token) {
      resetInactivityTimer();
      events.forEach((event) => {
        window.addEventListener(event, handleUserActivity);
      });
    }

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [token]);

  useEffect(() => {
    const savedToken = getAuthToken();
    const cachedUser = getCachedUser();

    if (savedToken) {
      setTokenState(savedToken);
      if (cachedUser) {
        setUser(cachedUser);
      }

      // Background verification with backend
      apiRequest('/user')
        .then((res) => {
          if (res.user) {
            setUser(res.user);
            setCachedUser(res.user);
          }
        })
        .catch((err) => {
          // WIPE token if server responds with 401 Unauthorized
          if (err.status === 401) {
            logout('session_expired');
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = (newToken: string, newUser: User, newRefreshToken?: string) => {
    // Purge any residual local storage keys from previous user sessions on this device
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    removeAuthToken();
    setAuthToken(newToken, newRefreshToken);
    setCachedUser(newUser);
    setTokenState(newToken);
    setUser(newUser);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('inactivity_logout_reason');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
