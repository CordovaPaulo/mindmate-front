'use client';
import React from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useRouter } from 'next/navigation';
import styles from './notifications.module.css';

export default function NotificationItem({ notification }: { notification: any }) {
  const { markAsRead } = useNotifications();
  const router = useRouter();

  const open = async () => {
    if (!notification.isRead && notification._id) await markAsRead(notification._id);
    if (notification.relatedId) {
      // example routing: customize based on type
      router.push(`/details/${notification.relatedId}`);
    }
  };

  return (
    <div onClick={open} className={`${styles.item} ${notification.isRead ? styles.read : styles.unread}`}>
      <div className={styles.title}>{notification.title}</div>
      <div className={styles.message}>{notification.message}</div>
      <div className={styles.ts}>{new Date(notification.createdAt || Date.now()).toLocaleString()}</div>
    </div>
  );
}