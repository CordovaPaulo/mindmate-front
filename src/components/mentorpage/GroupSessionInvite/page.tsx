'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faTimes, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import styles from './GroupSessionInvite.module.css';
import api from '@/lib/axios';
import notify from '@/lib/toast';

interface Learner {
  id: string;
  name: string;
  image?: string;
  program?: string;
  yearLevel?: string;
}

interface GroupSession {
  _id: string;
  subject: string;
  date: string;
  time: string;
  location: string;
  groupName?: string;
  maxParticipants?: number;
  learners: Array<{ _id: string; name: string }>;
  sessionType: string;
}

interface GroupSessionInviteProps {
  learnerId: string; // Now just a single learner ID
  learnerName: string; // Display name for confirmation
  onClose: () => void;
  onInviteSent?: () => void;
  preSelectedSessionId?: string | null;
}

export default function GroupSessionInvite({ learnerId, learnerName, onClose, onInviteSent, preSelectedSessionId }: GroupSessionInviteProps) {
  const [groupSessions, setGroupSessions] = useState<GroupSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>(preSelectedSessionId || '');
  const [message, setMessage] = useState('');
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadGroupSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const response = await api.get('/api/mentor/schedules/group', { withCredentials: true });
      if (response.status === 200 && response.data.groupSessions) {
        setGroupSessions(response.data.groupSessions);
        
        // If a session was pre-selected, ensure it's still selected after loading
        if (preSelectedSessionId) {
          setSelectedSession(preSelectedSessionId);
        }
      }
    } catch (error: any) {
      console.error('Error loading group sessions:', error);
      notify.error(error?.response?.data?.message || 'Failed to load group sessions');
    } finally {
      setIsLoadingSessions(false);
    }
  };

  // Auto-load sessions on mount
  useEffect(() => {
    loadGroupSessions();
  }, []);

  const handleInvite = async () => {
    if (!selectedSession) {
      notify.warn('Please select a group session');
      return;
    }

    setIsSubmitting(true);
    try {
      const body = message ? { message } : {};
      // Updated to match backend route: /send-existing-offer/group/:learnerId/:sessionId
      const response = await api.post(
        `/api/mentor/send-existing-offer/group/${learnerId}/${selectedSession}`,
        body,
        { withCredentials: true }
      );

      if (response.status === 200) {
        notify.success('Group session invitation sent successfully!');
        onInviteSent?.();
        onClose();
      }
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      notify.error(error?.response?.data?.message || 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const selectedSessionData = groupSessions.find(s => s._id === selectedSession);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.headerTitle}>
            <FontAwesomeIcon icon={faUsers} className={styles.headerIcon} />
            <h2>Invite to Group Session</h2>
          </div>
          <button onClick={onClose} className={styles.closeButton} aria-label="Close">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Learner Info Display */}
          <div className={styles.learnerInfo}>
            <div className={styles.learnerInfoHeader}>
              <FontAwesomeIcon icon={faUserPlus} className={styles.learnerIcon} />
              <div>
                <span className={styles.learnerLabel}>Inviting:</span>
                <span className={styles.learnerName}>{learnerName}</span>
              </div>
            </div>
          </div>

          {/* Group Session Selection */}
          <div className={styles.formGroup}>
            <label htmlFor="session-select" className={styles.label}>
              <FontAwesomeIcon icon={faUsers} className={styles.labelIcon} />
              Select Group Session
            </label>
            {isLoadingSessions ? (
              <div className={styles.loadingState}>Loading group sessions...</div>
            ) : groupSessions.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No group sessions available</p>
                <p className={styles.emptyStateHint}>Create a group session first by sending a group offer to a learner</p>
              </div>
            ) : (
              <select
                id="session-select"
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className={styles.select}
                disabled={isSubmitting}
              >
                <option value="">Choose a session...</option>
                {groupSessions.map((session) => (
                  <option key={session._id} value={session._id}>
                    {session.groupName || session.subject} - {formatDate(session.date)} at {formatTime(session.time)}
                    {session.maxParticipants && ` (${session.learners.length}/${session.maxParticipants})`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Session Details */}
          {selectedSessionData && (
            <div className={styles.sessionDetails}>
              <h3 className={styles.detailsTitle}>Session Details</h3>
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Subject:</span>
                  <span className={styles.detailValue}>{selectedSessionData.subject}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Date:</span>
                  <span className={styles.detailValue}>{formatDate(selectedSessionData.date)}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Time:</span>
                  <span className={styles.detailValue}>{formatTime(selectedSessionData.time)}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Location:</span>
                  <span className={styles.detailValue}>{selectedSessionData.location}</span>
                </div>
                {selectedSessionData.groupName && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Group Name:</span>
                    <span className={styles.detailValue}>{selectedSessionData.groupName}</span>
                  </div>
                )}
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Participants:</span>
                  <span className={styles.detailValue}>
                    {selectedSessionData.learners.length}
                    {selectedSessionData.maxParticipants && ` / ${selectedSessionData.maxParticipants}`}
                  </span>
                </div>
              </div>
              
              {selectedSessionData.learners.length > 0 && (
                <div className={styles.participantsList}>
                  <span className={styles.participantsLabel}>Current participants:</span>
                  <div className={styles.participantNames}>
                    {selectedSessionData.learners.map((learner, idx) => (
                      <span key={learner._id} className={styles.participantChip}>
                        {learner.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Optional Message */}
          {selectedSession && (
            <div className={styles.formGroup}>
              <label htmlFor="message-input" className={styles.label}>
                Personal Message (Optional)
              </label>
              <textarea
                id="message-input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={styles.textarea}
                placeholder="Add a personal message to the invitation..."
                rows={4}
                disabled={isSubmitting}
              />
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            onClick={onClose}
            className={styles.cancelButton}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleInvite}
            className={styles.inviteButton}
            disabled={!selectedSession || isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send Invitation'}
          </button>
        </div>
      </div>
    </div>
  );
}
