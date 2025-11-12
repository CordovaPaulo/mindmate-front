'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faChalkboard, 
  faExpand,
  faCompress,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import api from '@/lib/axios';
import styles from './meeting.module.css';

interface MeetingData {
  jitsiSession: {
    id: string;
    roomName: string;
    meetingUrl: string;
    subject: string;
    isActive: boolean;
    startedAt: string;
  };
  schedule: {
    id: string;
    date: string;
    time: string;
    subject: string;
    location: string;
    sessionType: string;
  };
  userRole: 'mentor' | 'learner';
  userName: string;
  isModerator: boolean;
}

export default function MeetingPage() {
  const params = useParams();
  const router = useRouter();
  const scheduleId = params.scheduleId as string;

  const [meetingData, setMeetingData] = useState<MeetingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const fetchMeetingData = async () => {
      try {
        setIsLoading(true);
        const role = await api.get('/api/role', { withCredentials: true });
        setUserRole(role.data.role);

        const response = await api.get(`/api/jitsi/session/${scheduleId}`, {
          withCredentials: true
        });

        if (response.data && response.data.jitsiSession) {
          console.log('Meeting data received:', response.data);
          console.log('User role:', response.data.userRole);
          setMeetingData(response.data);
          setError(null);
        }
      } catch (err: any) {
        console.error('Error fetching meeting data:', err);
        setError(err.response?.data?.message || 'Failed to load meeting');
      } finally {
        setIsLoading(false);
      }
    };

    if (scheduleId) {
      fetchMeetingData();
    }
  }, [scheduleId]);

  const handleBack = () => {
    // Prefer the role we fetched separately; fallback to meetingData
    const role = (userRole || meetingData?.userRole || '').toLowerCase();

    if (role === 'mentor') {
      router.push('/mentor');
      return;
    }
    if (role === 'learner') {
      router.push('/learner');
      return;
    }
    // Final fallback
    router.push('/');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const openWhiteboard = async () => {
    try {
      const res = await api.get(`/api/whiteboard/room/${scheduleId}`, { withCredentials: true });
      const url = res?.data?.roomUrl;
      if (url) window.open(url, '_blank', 'noopener');
      else alert('Whiteboard room unavailable.');
    } catch {
      alert('Failed to open whiteboard.');
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading meeting...</p>
      </div>
    );
  }

  if (error || !meetingData) {
    return (
      <div className={styles.errorContainer}>
        <h2>Unable to Join Meeting</h2>
        <p>{error || 'Meeting not found'}</p>
        <button onClick={handleBack} className={styles.backButton}>
          <FontAwesomeIcon icon={faArrowLeft} /> Go Back
        </button>
      </div>
    );
  }

  const displayName = encodeURIComponent(meetingData.userName || 'User');
  const jitsiUrl = `https://meet.jit.si/${meetingData.jitsiSession.roomName}#` +
    `userInfo.displayName=${displayName}` +
    `&config.prejoinPageEnabled=false` +
    `&config.disableModeratorIndicator=true` +
    `&config.startWithAudioMuted=false` +
    `&config.startWithVideoMuted=false`;

  const isOnline = String(meetingData.schedule.location || '').toLowerCase().includes('online');

  return (
    <div className={styles.meetingContainer}>
      {/* Header */}
      <header className={styles.meetingHeader}>
        <button onClick={handleBack} className={styles.backBtn}>
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Back to Dashboard</span>
        </button>
        
        <div className={styles.meetingInfo}>
          <h1>{meetingData.jitsiSession.subject}</h1>
          <span className={styles.roleTag}>
            {meetingData.userRole === 'mentor' ? '👨‍🏫 Mentor' : '👨‍🎓 Learner'}
          </span>
        </div>

        <div className={styles.headerActions}>
          {isOnline && (
            <button
              className={`${styles.whiteboardToggleBtn}`}
              onClick={openWhiteboard}
              title="Open collaborative whiteboard in a new tab"
            >
              Open Whiteboard
            </button>
          )}
          <button onClick={toggleFullscreen} className={styles.fullscreenBtn}>
            <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
          </button>
        </div>
      </header>

      {/* Content Area */}
      <div className={styles.contentArea}>
        {/* Video Call */}
        <div className={styles.videoContainer}>
          {meetingData.userRole === 'mentor' && (
            <div className={styles.mentorTip}>
              <p>💡 <strong>Tip:</strong> You're joining as the mentor. Join first to become the meeting host!</p>
            </div>
          )}
          {meetingData.userRole === 'learner' && (
            <div className={styles.learnerTip}>
              <p>📝 <strong>Note:</strong> Your mentor should join first. The first person becomes the host.</p>
            </div>
          )}
          <iframe
            src={jitsiUrl}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className={styles.jitsiFrame}
          />
        </div>
      </div>
    </div>
  );
}