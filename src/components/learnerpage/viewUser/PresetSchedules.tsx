'use client';

import { useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'react-toastify';
import styles from './PresetSchedules.module.css';

interface PresetSchedule {
  _id: string;
  mentor: string;
  mentorName: string;
  days: string[];
  time: string;
  subject: string;
  specialization: string;
  course: string;
  participants: string[];
}

interface PresetSchedulesProps {
  schedules: PresetSchedule[];
  onScheduleUpdated: () => void;
}

export default function PresetSchedules({ schedules, onScheduleUpdated }: PresetSchedulesProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleJoin = async (scheduleId: string) => {
    try {
      setLoading(scheduleId);
      await api.post(`/api/learner/preset/join/${scheduleId}`);
      toast.success('Successfully joined the group session!');
      onScheduleUpdated();
    } catch (error: any) {
      console.error('Error joining schedule:', error);
      toast.error(error.response?.data?.message || 'Failed to join group session');
    } finally {
      setLoading(null);
    }
  };

  const handleLeave = async (scheduleId: string) => {
    try {
      setLoading(scheduleId);
      await api.post(`/api/learner/preset/leave/${scheduleId}`);
      toast.success('Successfully left the group session');
      onScheduleUpdated();
    } catch (error: any) {
      console.error('Error leaving schedule:', error);
      toast.error(error.response?.data?.message || 'Failed to leave group session');
    } finally {
      setLoading(null);
    }
  };

  const formatDays = (days: string[]) => {
    return days.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ');
  };

  if (schedules.length === 0) {
    return null;
  }

  return (
    <div className={styles.presetSchedulesContainer}>
      <div className={styles.header}>
        <h4 className={styles.title}>
          <i className="fas fa-users"></i> Available Open Sessions
        </h4>
        <p className={styles.subtitle}>Join open sessions hosted by this mentor</p>
      </div>

      <div className={styles.schedulesList}>
        {schedules.map((schedule) => {
          const isProcessing = loading === schedule._id;

          return (
            <div key={schedule._id} className={styles.scheduleCard}>
              <div className={styles.scheduleHeader}>
                <div className={styles.scheduleInfo}>
                  <h5 className={styles.subject}>
                    <i className="fas fa-book"></i> {schedule.subject}
                  </h5>
                  <div className={styles.badges}>
                    <span className={styles.specializationBadge}>
                      {schedule.specialization}
                    </span>
                    <span className={styles.courseBadge}>
                      {schedule.course}
                    </span>
                  </div>
                </div>
                <div className={styles.participantCount}>
                  <i className="fas fa-user-friends"></i>
                  <span>{schedule.participants.length} enrolled</span>
                </div>
              </div>

              <div className={styles.scheduleDetails}>
                <div className={styles.detailItem}>
                  <i className="fas fa-calendar-week"></i>
                  <span>{formatDays(schedule.days)}</span>
                </div>
                <div className={styles.detailItem}>
                  <i className="fas fa-clock"></i>
                  <span>{schedule.time}</span>
                </div>
              </div>

              <div className={styles.scheduleActions}>
                <button
                  className={`${styles.actionButton} ${styles.joinButton}`}
                  onClick={() => handleJoin(schedule._id)}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Joining...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-user-plus"></i> Join Session
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
