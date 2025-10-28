'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

type Notification = {
  _id?: string;
  title: string;
  message: string;
  type?: string;
  relatedId?: string;
  isRead?: boolean;
  createdAt?: string;
};

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => void;
  socketConnected: boolean;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || API_BASE; // change if socket host differs

let socket: Socket | null = null;

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socketConnected, setSocketConnected] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications`, { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
    } catch (err) {
      console.error('fetchNotifications error', err);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/notifications/${id}/read`, {
        method: 'PUT',
        credentials: 'include'
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('markAsRead error', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: 'PUT',
        credentials: 'include'
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('markAllAsRead error', err);
    }
  }, []);

  const clearNotifications = useCallback(() => setNotifications([]), []);

  useEffect(() => {
    fetchNotifications();
    // init socket
    try {
      socket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        withCredentials: true
      });
      socket.on('connect', () => setSocketConnected(true));
      socket.on('disconnect', () => setSocketConnected(false));
      socket.on('notification', (payload: Notification) => {
        setNotifications(prev => [payload, ...prev]);
      });
    } catch (err) {
      console.warn('Socket init failed', err);
    }

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      clearNotifications,
      socketConnected
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};