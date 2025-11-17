'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import styles from './logout.module.css';
import api from '@/lib/axios';

interface LogoutComponentProps {
  onCancel: () => void;
}

export default function LogoutComponent({ onCancel }: LogoutComponentProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Function to remove token
  const removeToken = () => {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'MindMateToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  };

  const logOut = async () => {
    setIsLoggingOut(true);
    
    try {
      const response = await api.post('/api/auth/logout', {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        withCredentials: true,
      });

      if (response.status === 200) {
        toast.success('Logout successful!');
        removeToken();
        router.replace('/auth/login');
      } else {
        // const data = await response.json().catch(() => null);
        toast.error('Logout failed!');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed!');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleClose = () => {
    onCancel();
  };

  return (
    <>
      {/* Background Overlay - This will dim the mentor page background */}
      <div className={styles.logoutOverlay} onClick={handleClose} />
      
      {/* Logout Modal - This appears centered over the mentor page */}
      <div className={styles.logoutModal}>
        <div className={styles.logoutWrapper}>
          <div className={styles.logoutUpperElement}>
            <svg 
              onClick={handleClose}
              className={styles.logoutCloseIcon}
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="white" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
          <div className={styles.logoutLowerElement}>
            <div>
              <h1>Are you sure you want to log out?</h1>
            </div>
            <div className={styles.logoutButtons}>
              <button 
                onClick={logOut} 
                className={`${styles.confirmButton} ${isLoggingOut ? styles.disabledButton : ''}`}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'Logging out...' : 'Yes'}
              </button>
              <button 
                className={`${styles.cancelButton} ${isLoggingOut ? styles.disabledButton : ''}`}
                onClick={handleClose}
                disabled={isLoggingOut}
              >
                No
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}