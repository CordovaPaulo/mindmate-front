'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

type User = { id?: string; username?: string; email?: string; role?: string } | null;
type AuthContextType = {
  user: User;
  isLoading: boolean;
  login: (creds: { iniCred: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sessionUrl = (path = '') => `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth${path}`;

  const refresh = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(sessionUrl('/session'), { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const login = async (creds: { iniCred: string; password: string }) => {
    try {
      const res = await fetch(sessionUrl('/login'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setUser(data.user || null); // cookie set by backend
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch(sessionUrl('/logout'), { method: 'POST', credentials: 'include' });
    } catch {}
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};