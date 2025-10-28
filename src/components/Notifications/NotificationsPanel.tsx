'use client';
import React from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import styles from './notifications.module.css'; // create simple css or inline styles
import NotificationItem from './NotificationItem';

export default function NotificationsPanel() {
  const { notifications, unreadCount, markAllAsRead } = useNotifications();

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h4>Notifications</h4>
        <div>
          <span className={styles.unread}>Unread: {unreadCount}</span>
          <button onClick={() => markAllAsRead()} className={styles.markAll}>Mark all read</button>
        </div>
      </div>

      <div className={styles.list}>
        {notifications.length === 0 ? (
          <div className={styles.empty}>No notifications</div>
        ) : (
          notifications.map(n => <NotificationItem key={n._id || Math.random()} notification={n} />)
        )}
      </div>
    </div>
  );
}