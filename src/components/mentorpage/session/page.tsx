'use client';

import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendar, 
  faEllipsisH, 
  faBell, 
  faCalendarAlt, 
  faTimes, 
  faUser, 
  faClock, 
  faMapMarkerAlt,
  faVideo
} from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';
import RescheduleDialog from '../RescheduleDialog/page';
import api from '@/lib/axios';
import notify from '@/lib/toast';
import styles from './session.module.css';

// Updated interface to match API response
interface SessionItem {
  id: string; // Changed from number to string
  subject: string;
  date: string;
  time: string;
  location: string;
  sessionType?: 'one-on-one' | 'group';
  groupName?: string;
  maxParticipants?: number;
  learner: {
    id: string;
    name: string; // Direct name, not nested in user object
    image: string;
    program: string;
    yearLevel: string;
  };
  learners?: Array<{
    id: string;
    name: string;
  }>;
  mentor?: {
    id: string;
    name: string;
    image: string;
    program: string;
    yearLevel: string;
  };
}

interface SessionComponentProps {
  schedule?: SessionItem[];
  upcomingSchedule?: SessionItem[];
  userData?: any; // allow mentor page to pass user data
  onScheduleCreated?: () => Promise<void>;
}

// Helper to get cookie value
function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export default function SessionComponent({ schedule = [], upcomingSchedule = [], userData, onScheduleCreated }: SessionComponentProps) {
  const router = useRouter();
  
  const [todaySchedule, setTodaySchedule] = useState<SessionItem[]>([]);
  const [upcommingSchedule, setUpcommingSchedule] = useState<SessionItem[]>([]);
  const [selectedSessionID, setSelectedSessionID] = useState<string | null>(null); // keep string|null
  const [activePopup, setActivePopup] = useState<{ type: string | null; index: number | null }>({ type: null, index: null });
  const [showRemindConfirmation, setShowRemindConfirmation] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SessionItem | null>(null);
  const [reschedIsOpen, setReschedIsOpen] = useState(false);

  // const [showJitsiModal, setShowJitsiModal] = useState(false);
  // const [selectedJitsiScheduleId, setSelectedJitsiScheduleId] = useState<string | null>(null);

  const todayPopupRefs = useRef<(HTMLDivElement | null)[]>([]);
  const upcomingPopupRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Initialize schedules
  useEffect(() => {
    console.log('SessionComponent received schedule:', schedule);
    console.log('SessionComponent received upcomingSchedule:', upcomingSchedule);
    
    setTodaySchedule(schedule);
    setUpcommingSchedule(upcomingSchedule);
  }, [schedule, upcomingSchedule]);

  // Close popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isOutsideToday = todayPopupRefs.current.every(
        ref => ref && !ref.contains(event.target as Node)
      );
      const isOutsideUpcoming = upcomingPopupRefs.current.every(
        ref => ref && !ref.contains(event.target as Node)
      );

      if (isOutsideToday && isOutsideUpcoming) {
        setActivePopup({ type: null, index: null });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sendReminder = async (item: SessionItem) => {
    try {
      const token = getCookie('MindMateToken');
      console.log(item);
      // Use your actual API endpoint for sending reminders
      const response = await api.post(`/api/mentor/remind-sched/${item.id}`, {}, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.status === 200) {
        notify.success('Reminder sent successfully!');
      } else {
        notify.error('Failed to send reminder.');
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      notify.error('Error sending reminder. Please try again.');
    } finally {
      setShowRemindConfirmation(false);
    }
  };

  const cancelSession = async (item: SessionItem) => {
    try {
      const token = getCookie('MindMateToken');
      
      // Use your actual API endpoint for cancelling sessions
      const response = await api.post(`/api/mentor/cancel-sched/${item.id}`, {}, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.status === 200) {
        setTodaySchedule(prev => prev.filter(session => session.id !== item.id));
        setUpcommingSchedule(prev => prev.filter(session => session.id !== item.id));
        notify.success('Session cancelled successfully!');
      } else {
        notify.error('Failed to cancel session.');
      }
    } catch (error) {
      console.error('Error cancelling session:', error);
      notify.error('Error cancelling session. Please try again.');
    } finally {
      setShowCancelConfirmation(false);
    }
  };

  const handleReschedule = async (selectedDate: Date) => {
    try {
      if (!selectedItem) return;

      const token = getCookie('MindMateToken');

      // Format date and time
      const formattedDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      const formattedTime = selectedDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      const response = await api.post(`/api/mentor/resched-sched/${selectedItem.id}`, {
        date: formattedDate,
        time: formattedTime,
      }, {
        withCredentials: true,
      });

      if (response.status === 200) {
        // Update the local state with new session details
        const updatedSession = {
          ...selectedItem,
          date: formattedDate,
          time: formattedTime,
        };

        setTodaySchedule(prev => prev.map(session => 
          session.id === selectedItem.id ? updatedSession : session
        ));
        setUpcommingSchedule(prev => prev.map(session => 
          session.id === selectedItem.id ? updatedSession : session
        ));
        
        setReschedIsOpen(false);
        notify.success('Session rescheduled successfully!');
      } else {
        notify.error('Failed to reschedule session.');
      }
    } catch (error) {
      console.error('Error rescheduling session:', error);
      notify.error('Error rescheduling session. Please try again.');
    }
  };

  const togglePopup = (type: string, index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    const popupId = `${type}-${index}`;
    if (activePopup.type === popupId) {
      setActivePopup({ type: null, index: null });
    } else {
      setActivePopup({ type: popupId, index });
    }
  };

  const handleOptionClick = (option: string, item: SessionItem, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedItem(item);

    switch (option) {
      case 'remind':
        setShowRemindConfirmation(true);
        break;
      case 'reschedule':
        setSelectedSessionID(item.id);
        setReschedIsOpen(true);
        break;
      case 'cancel':
        setShowCancelConfirmation(true);
        break;
    }
    setActivePopup({ type: null, index: null });
  };

  // Helper function to format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Helper function to format time for display
  const formatTime = (timeString: string) => {
    // If time is in HH:MM format, convert to 12-hour format
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Helper to check if session is online
  const isOnlineSession = (location: string) => {
    if (!location) return false;
    const loc = location.toLowerCase().trim();
    return loc === 'online' || loc.includes('online');
  };

  // NEW: Handler for joining meeting
  const handleJoinMeeting = (scheduleId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    router.push(`/meeting/${scheduleId}`);
  };

  return (
    <div className={styles.sessionWrapper}>
      {/* Header Section */}
      <div className={styles.sessionTableHeader}>
        <h2 className={styles.sessionTableTitle}>
          <FontAwesomeIcon icon={faCalendar} className={styles.sessionHeaderIcon} />
          Session Schedule
        </h2>
      </div>

      {/* Main Content Section */}
      <div className={styles.sessionLowerElement}>
        <div className={styles.sessionGrid}>
          {/* Today Schedule */}
          <div className={styles.sessionCard}>
            <h1>TODAY</h1>
            <div className={styles.sessionCardContent}>
              {todaySchedule.length > 0 ? (
                todaySchedule.map((item, index) => (
                  <div key={item.id} className={styles.sessionTodayCard}>
                    <div className={styles.sessionCardHeader}>
                      <div className={styles.sessionTitleContainer}>
                        <h1>{item.subject}</h1>
                      </div>
                      <div className={styles.sessionHeaderActions}>
                        {/* Join Meeting button - available for all sessions */}
                        <button
                          className={styles.sessionJoinBtn}
                          onClick={(e) => handleJoinMeeting(item.id, e)}
                          title="Join Online Meeting"
                        >
                          <FontAwesomeIcon icon={faVideo} style={{ color: '#4CAF50', fontSize: '1.5rem' }} />
                        </button>
                        <div 
                          className={styles.sessionEllipsisContainer} 
                          ref={el => { todayPopupRefs.current[index] = el; }}
                        >
                          <FontAwesomeIcon 
                            icon={faEllipsisH}
                            style={{ cursor: 'pointer', color: '#066678', fontSize: '1.2rem' }}
                            onClick={(e) => togglePopup('today', index, e)}
                          />
                          {activePopup.type === `today-${index}` && (
                            <div className={styles.sessionPopupMenu} onClick={(e) => e.stopPropagation()}>
                              <div 
                                className={styles.sessionPopupOption}
                                onClick={(e) => handleOptionClick('remind', item, e)}
                              >
                                <FontAwesomeIcon icon={faBell} className={styles.sessionOptionIcon} />
                                <p className={styles.sessionOptionText}>Remind</p>
                              </div>
                              <div 
                                className={styles.sessionPopupOption}
                                onClick={(e) => handleOptionClick('reschedule', item, e)}
                              >
                                <FontAwesomeIcon icon={faCalendarAlt} className={styles.sessionOptionIcon} />
                                <p className={styles.sessionOptionText}>Reschedule</p>
                              </div>
                              <div 
                                className={styles.sessionPopupOption}
                                onClick={(e) => handleOptionClick('cancel', item, e)}
                              >
                                <FontAwesomeIcon icon={faTimes} className={styles.sessionOptionIcon} />
                                <p className={styles.sessionOptionText}>Cancel Session</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={styles.sessionInfo}>
                      <FontAwesomeIcon icon={faUser} style={{ color: '#533566', fontSize: '1.2rem' }} />
                      <h2>{item.learner?.name || "Unknown User"}</h2>
                    </div>
                    <div className={styles.sessionInfo}>
                      <FontAwesomeIcon icon={faCalendarAlt} style={{ color: '#0084ce', fontSize: '1.2rem' }} />
                      <p>{formatDate(item.date)}</p>
                    </div>
                    <div className={styles.sessionInfo}>
                      <FontAwesomeIcon icon={faClock} style={{ color: '#f8312f', fontSize: '1.2rem' }} />
                      <p>{formatTime(item.time)}</p>
                    </div>
                    <div className={styles.sessionInfo}>
                      <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#f72197', fontSize: '1.2rem' }} />
                      <p>{item.location}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.noScheduleMessage}>
                  <p>No sessions scheduled for today</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Schedule - same structure, no join button */}
          <div className={styles.sessionCard}>
            <h1>UPCOMING</h1>
            <div className={styles.sessionCardContent}>
              {upcommingSchedule.length > 0 ? (
                upcommingSchedule.map((item, index) => (
                  <div key={item.id} className={styles.sessionUpcomingCard}>
                    <div className={styles.sessionCardHeader}>
                      <div className={styles.sessionTitleContainer}>
                        <h1>{item.subject}</h1>
                      </div>
                      <div 
                        className={styles.sessionEllipsisContainer} 
                        ref={el => { upcomingPopupRefs.current[index] = el; }} // return void
                      >
                        <FontAwesomeIcon 
                          icon={faEllipsisH}
                          style={{ cursor: 'pointer', color: '#066678', fontSize: '1.2rem' }}
                          onClick={(e) => togglePopup('upcoming', index, e)}
                        />
                        {activePopup.type === `upcoming-${index}` && (
                          <div className={styles.sessionPopupMenu} onClick={(e) => e.stopPropagation()}>
                            <div 
                              className={styles.sessionPopupOption}
                              onClick={(e) => handleOptionClick('remind', item, e)}
                            >
                              <FontAwesomeIcon icon={faBell} className={styles.sessionOptionIcon} />
                              <p className={styles.sessionOptionText}>Remind</p>
                            </div>
                            <div 
                              className={styles.sessionPopupOption}
                              onClick={(e) => handleOptionClick('reschedule', item, e)}
                            >
                              <FontAwesomeIcon icon={faCalendarAlt} className={styles.sessionOptionIcon} />
                              <p className={styles.sessionOptionText}>Reschedule</p>
                            </div>
                            <div 
                              className={styles.sessionPopupOption}
                              onClick={(e) => handleOptionClick('cancel', item, e)}
                            >
                              <FontAwesomeIcon icon={faTimes} className={styles.sessionOptionIcon} />
                              <p className={styles.sessionOptionText}>Cancel</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={styles.sessionInfo}>
                      <FontAwesomeIcon icon={faUser} style={{ color: '#533566', fontSize: '1.2rem' }} />
                      <h2>{item.learner?.name || "Unknown User"}</h2>
                    </div>
                    <div className={styles.sessionInfo}>
                      <FontAwesomeIcon icon={faCalendarAlt} style={{ color: '#0084ce', fontSize: '1.2rem' }} />
                      <p>{formatDate(item.date)}</p>
                    </div>
                    <div className={styles.sessionInfo}>
                      <FontAwesomeIcon icon={faClock} style={{ color: '#f8312f', fontSize: '1.2rem' }} />
                      <p>{formatTime(item.time)}</p>
                    </div>
                    <div className={styles.sessionInfo}>
                      <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#f72197', fontSize: '1.2rem' }} />
                      <p>{item.location}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.noScheduleMessage}>
                  <p>No upcoming sessions scheduled</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Remind Confirmation Modal */}
      {showRemindConfirmation && (
        <div className={styles.sessionModalOverlay}>
          <div className={styles.sessionModalContent}>
            <div className={styles.sessionModalHeader}>
              <h3>Send Reminder</h3>
            </div>
            <div className={styles.sessionModalBody}>
              <p>
                Are you sure you want to send a reminder for
                <strong> {selectedItem?.subject} </strong> to
                <strong> {selectedItem?.learner?.name}</strong>?
              </p>
            </div>
            <div className={styles.sessionModalFooter}>
              <button
                className={`${styles.sessionModalButton} ${styles.sessionModalButtonCancel}`}
                onClick={() => setShowRemindConfirmation(false)}
              >
                Cancel
              </button>
              <button
                className={`${styles.sessionModalButton} ${styles.sessionModalButtonConfirm}`}
                onClick={() => selectedItem && sendReminder(selectedItem)}
              >
                Send Reminder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirmation && (
        <div className={styles.sessionModalOverlay}>
          <div className={styles.sessionModalContent}>
            <div className={styles.sessionModalHeader}>
              <h3>Cancel Session</h3>
            </div>
            <div className={styles.sessionModalBody}>
              <p>
                Are you sure you want to cancel
                <strong> {selectedItem?.subject} </strong> with
                <strong> {selectedItem?.learner?.name}</strong>?
              </p>
              <p className={styles.sessionWarningText}>This action cannot be undone.</p>
            </div>
            <div className={styles.sessionModalFooter}>
              <button
                className={`${styles.sessionModalButton} ${styles.sessionModalButtonCancel}`}
                onClick={() => setShowCancelConfirmation(false)}
              >
                No, Keep It
              </button>
              <button
                className={`${styles.sessionModalButton} ${styles.sessionModalButtonConfirm} ${styles.sessionModalButtonConfirmDanger}`}
                onClick={() => selectedItem && cancelSession(selectedItem)}
              >
                Yes, Cancel Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Dialog */}
      {reschedIsOpen && selectedItem && (
        <RescheduleDialog
          id={selectedItem.id}
          onClose={() => setReschedIsOpen(false)}
          onReschedule={handleReschedule}
        />
      )}
    </div>
  );
}