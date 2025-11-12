'use client';

import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './RescheduleDialog.module.css';
import notify from '@/lib/toast';
import api from '@/lib/axios';

interface RescheduleDialogProps {
  id: string | number; // accept string OR number
  onClose: () => void;
  onReschedule: (date: Date) => void;
}

export default function RescheduleDialog({ id, onClose, onReschedule }: RescheduleDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rescheduleSession = async () => {
    try {
      if (!selectedDate) {
        return;
      }

      // Extract date and time (same format as Vue version)
      const formattedDate = selectedDate.toLocaleDateString("en-US"); // MM/DD/YYYY
      const formattedTime = selectedDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }); // HH:mm

      setIsSubmitting(true);

      // API call (same endpoint as Vue version)
      const response = await api.post(`/api/mentor/resched-sched/${id}`, {
        date: formattedDate,
        time: formattedTime,
      });

      if (response.status === 200) {
        notify.success('Session rescheduled successfully!');
        onReschedule(selectedDate);
        onClose();
      } else {
        throw new Error('Failed to reschedule session');
      }
    } catch (error) {
      notify.error('Failed to reschedule session');
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
    <div className={styles.rescheduleModalOverlay} onClick={handleOverlayClick}>
      <div className={styles.rescheduleWrapper}>
        <div className={styles.rescheduleUpperElement}>
          <h1>Reschedule Session</h1>
        </div>

        <div className={styles.rescheduleContentElement}>
          <p>Are you sure you want to reschedule this session?</p>

          <div className={styles.rescheduleDatepickerWrapper}>
            <label htmlFor="reschedule-datetime">Pick new date & time:</label>
            <DatePicker
              id="reschedule-datetime"
              selected={selectedDate}
              onChange={(date: Date | null) => setSelectedDate(date)} // accept null per types
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="yyyy-MM-dd HH:mm"
              minDate={new Date()}
              className={styles.rescheduleDpInput}
              placeholderText="Select date and time"
            />
          </div>
        </div>

        <div className={styles.rescheduleFooterElement}>
          <div className={styles.rescheduleButtonContainer}>
            <button onClick={onClose} className={styles.rescheduleCancelButton}>
              Cancel
            </button>
            <button 
              onClick={rescheduleSession} 
              className={styles.rescheduleConfirmButton}
              disabled={isSubmitting || !selectedDate}
            >
              {isSubmitting ? (
                <span className={styles.rescheduleLoader}></span>
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