'use client';

import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './reschedule.module.css';
import api from '@/lib/axios';
import notify from '@/lib/toast';

interface RescheduleDialogProps {
  sessionId: number;
  currentDate: string;
  currentTime: string;
  onClose: () => void;
  onReschedule: (date: string, time: string) => void;
}

export default function RescheduleDialog({ sessionId, currentDate, currentTime, onClose, onReschedule }: RescheduleDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rescheduleSession = async () => {
    try {
      if (!selectedDate) {
        notify.warn('Please select a date and time');
        return;
      }

      // Format date and time for backend
      const formattedDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const formattedTime = selectedDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }); // HH:mm

      setIsSubmitting(true);

      // Get the MindMateToken from cookies
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };

      const token = getCookie('MindMateToken');

      // API call to the correct learner route
      const response = await api.post(`/api/learner/resched-sched/${sessionId}`, {
        date: formattedDate,
        time: formattedTime,
      }, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (response.status === 200) {
        notify.success('Session rescheduled successfully!');
        onReschedule(formattedDate, formattedTime);
        onClose();
      }
    } catch (error: any) {
      console.error("Failed to reschedule session:", error);
      const errorMessage = error.response?.data?.message || 'Failed to reschedule session';
      notify.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles['modal-overlay']} onClick={handleOverlayClick}>
      <div className={styles.wrapper}>
        <div className={styles['upper-element']}>
          <h1>Reschedule Session</h1>
        </div>

        <div className={styles['lower-element']}>
          <p>Are you sure you want to reschedule this session?</p>
          <p className={styles['current-schedule']}>
            Current: {currentDate} at {currentTime}
          </p>

          <div className={styles['datepicker-wrapper']}>
            <label htmlFor="reschedule-datetime">Pick new date & time:</label>
            <DatePicker
              id="reschedule-datetime"
              selected={selectedDate}
              onChange={(date: Date | null) => setSelectedDate(date)} // accept null per react-datepicker types
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="yyyy-MM-dd HH:mm"
              minDate={new Date()}
              className={styles.dp__input}
              placeholderText="Select date and time"
            />
          </div>

          <div className={styles['button-container']}>
            <button onClick={onClose} className={styles['cancel-button']}>
              Cancel
            </button>
            <button 
              onClick={rescheduleSession} 
              className={styles['confirm-button']}
              disabled={isSubmitting || !selectedDate}
            >
              {isSubmitting ? (
                <span className={styles.loader}></span>
              ) : (
                <span>Reschedule</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}