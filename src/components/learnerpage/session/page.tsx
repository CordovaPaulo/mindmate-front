'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEllipsisH, 
  faCalendarAlt, 
  faTimes, 
  faUser, 
  faClock, 
  faMapMarkerAlt, 
  faFileAlt, 
  faEye, 
  faDownload,
  faFile
} from '@fortawesome/free-solid-svg-icons';
import RescheduleDialog from '@/components/learnerpage/RescheduleDialog/page';
import api from '@/lib/axios';
import styles from './session.module.css';

interface ScheduleItem {
  id: string;
  subject: string;
  mentor: {
    user: {
      name: string;
    };
    ment_inf_id: number;
  };
  date: string;
  time: string;
  location: string;
  files?: any[];
}

interface SessionComponentProps {
  schedule?: ScheduleItem[];
  upcomingSchedule?: ScheduleItem[];
  mentFiles?: {
    files: Array<{
      id: number;
      file_name: string;
      file_id: string;
      owner_id: number;
    }>;
  };
  schedForReview?: ScheduleItem[];
  userInformation?: any[];
  userData?: any;
}

interface PopupState {
  type: string | null;
  index: number | null;
}

export default function SessionComponent({ 
  schedule = [], 
  upcomingSchedule = [], 
  mentFiles = { files: [] },
  schedForReview = [],
  userInformation = [],
  userData
}: SessionComponentProps) {
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [activePopup, setActivePopup] = useState<PopupState>({ type: null, index: null });
  const [todaySchedule, setTodaySchedule] = useState<ScheduleItem[]>([]);
  const [upcommingSchedule, setUpcommingSchedule] = useState<ScheduleItem[]>([]);
  const [selectedMentorId, setSelectedMentorId] = useState<number | null>(null);
  const [mentorFilesLocal, setMentorFilesLocal] = useState<Array<{
    id: number | string;
    file_name: string;
    file_id: string;
    owner_id: number | string;
  }>>([]);
  const [isFetchingFiles, setIsFetchingFiles] = useState(false);
  const [reschedIsOpen, setReschedIsOpen] = useState(false);
  const [selectedSessionID, setSelectedSessionID] = useState<number | string | null>(null);

  // NEW: confirmation before opening reschedule dialog
  const [showRescheduleConfirmation, setShowRescheduleConfirmation] = useState(false);

  // Use local fetched files first, fallback to prop mentFiles
  const filteredFiles = (mentorFilesLocal.length > 0
    ? mentorFilesLocal
    : (mentFiles?.files || [])
  ).filter(file => String(file.owner_id) === String(selectedMentorId)) || [];

  const openFileModal = async (event: React.MouseEvent, mentorId: number | string) => {
    event.stopPropagation();
    setSelectedMentorId(Number(mentorId) || mentorId);
    setMentorFilesLocal([]); // clear previous
    setIsFileModalOpen(true);
    setIsFetchingFiles(true);

    try {
      const res = await api.get(`/api/learner/learning-mats/${mentorId}`, { withCredentials: true });
      const files = (res.data?.files || []).map((f: any) => ({
        id: f.id ?? f.file_id ?? f.fileId ?? 0,
        file_name: f.file_name || f.name || f.fileName || '',
        file_id: f.file_id || f.id || '',
        owner_id: f.owner_id ?? String(mentorId),
        // include the direct links returned by backend so we can use them directly
        webViewLink: f.webViewLink || f.web_view_link || '',
        webContentLink: f.webContentLink || f.web_content_link || ''
      }));
      setMentorFilesLocal(files);
    } catch (err) {
      console.error('Error fetching mentor files:', err);
    } finally {
      setIsFetchingFiles(false);
    }
  };

  const closeFileModal = () => {
    setIsFileModalOpen(false);
    setSelectedMentorId(null);
  };

  const togglePopup = (type: string, index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    if (activePopup.type === type && activePopup.index === index) {
      setActivePopup({ type: null, index: null });
    } else {
      setActivePopup({ type, index });
    }
  };

  const handleOptionClick = (option: string, item: ScheduleItem, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedItem(item);

    switch (option) {
      case "reschedule":
        // Show confirmation first, then open reschedule modal on confirm
        setSelectedSessionID(item.id);
        setShowRescheduleConfirmation(true);
        break;
      case "cancel":
        setShowCancelConfirmation(true);
        break;
    }
    setActivePopup({ type: null, index: null });
  };

  const cancelSession = async (item: ScheduleItem | null) => {
    if (!item) return;
    
    try {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };

      const token = getCookie('MindMateToken');
      
      const response = await api.post(`/api/learner/cancel-sched/${item.id}`, {}, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (response.status === 200) {
        setTodaySchedule(prev => prev.filter(session => String(session.id) !== String(item.id)));
        setUpcommingSchedule(prev => prev.filter(session => String(session.id) !== String(item.id)));
        alert('Session cancelled successfully!');
      }
    } catch (error: any) {
      console.error('Error cancelling session:', error);
      const errorMessage = error.response?.data?.message || 'Failed to cancel session';
      alert(errorMessage);
    } finally {
      setShowCancelConfirmation(false);
    }
  };

  const previewFile = async (linkOrId: string) => {
    try {
      // If we already received a direct webViewLink, open it directly
      if (linkOrId && (linkOrId.startsWith('http://') || linkOrId.startsWith('https://'))) {
        window.open(linkOrId, '_blank');
        return;
      }

      // Fallback: call backend preview endpoint which returns webViewLink
      const response = await fetch(`/api/preview/file/${linkOrId}`);
      const data = await response.json();
      if (data?.webViewLink) window.open(data.webViewLink, '_blank');
    } catch (error) {
      console.error('Error previewing file:', error);
    }
  };

  const downloadFile = async (linkOrId: string, fileName?: string) => {
    try {
      // If we have a direct download link, use it
      if (linkOrId && (linkOrId.startsWith('http://') || linkOrId.startsWith('https://'))) {
        // Create an anchor and click it to initiate download (works for direct links like webContentLink)
        const a = document.createElement('a');
        a.href = linkOrId;
        if (fileName) a.download = fileName;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      // Fallback: call backend download endpoint which streams the file
      const response = await fetch(`/api/download/file/${linkOrId}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      if (fileName) a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleReschedule = async (newDate: string, newTime: string) => {
    if (!selectedSessionID) return;
    
    try {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };

      const token = getCookie('MindMateToken');
      
      const response = await api.post(`/api/learner/resched-sched/${selectedSessionID}`, {
        date: newDate,
        time: newTime
      }, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (response.status === 200) {
        const data = response.data;
        const updated = data.schedule || {};

        if (updated && updated._id) {
          const sid = String(updated._id);
          const normalizeServerItem = (s: any) => ({
            id: String(s._id || s.id || ''),
            subject: s.subject || '',
            mentor: s.mentor || {},
            date: s.date ? new Date(s.date).toISOString().split('T')[0] : '',
            time: s.time || '',
            location: s.location || '',
            files: s.files || []
          });
          
          setTodaySchedule(prev => prev.map(s => String(s.id) === sid ? normalizeServerItem(updated) : s));
          setUpcommingSchedule(prev => prev.map(s => String(s.id) === sid ? normalizeServerItem(updated) : s));
        } else {
          setTodaySchedule(prev => prev.map(session => 
            String(session.id) === String(selectedSessionID) 
              ? { ...session, date: newDate, time: newTime }
              : session
          ));
          setUpcommingSchedule(prev => prev.map(session => 
            String(session.id) === String(selectedSessionID) 
              ? { ...session, date: newDate, time: newTime }
              : session
          ));
        }

        setReschedIsOpen(false);
        alert('Session rescheduled successfully!');
      }
    } catch (error: any) {
      console.error('Error rescheduling session:', error);
      const errorMessage = error.response?.data?.message || 'Failed to reschedule session';
      alert(errorMessage);
    }
  };

  // Close popups when clicking outside (use data attributes with CSS Modules)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const el = event.target as Element;
      if (!el.closest('[data-popup-menu]') && !el.closest('[data-ellipsis]')) {
        setActivePopup({ type: null, index: null });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setTodaySchedule(schedule || []);
    setUpcommingSchedule(upcomingSchedule || []);
  }, [schedule, upcomingSchedule]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className={styles['session-wrapper']}>
      <div className={styles['table-header']}>
        <h2 className={styles['table-title']}>
          <FontAwesomeIcon icon={faCalendarAlt} className={styles['header-icon']} />
          Session Schedule
        </h2>
      </div>

      <div className={styles['lower-element']}>
        <div className={styles['session-grid']}>
          {/* Today Schedule */}
          <div className={styles['session-card']}>
            <h1>TODAY</h1>
            <div className={styles['session-card-content']}>
              {todaySchedule.length === 0 ? (
                <div className={styles['no-sessions']}>
                  <p>No sessions scheduled for today</p>
                </div>
              ) : (
                todaySchedule.map((item, index) => (
                  <div key={`${item.id}-${index}`} className={styles['today-card']}>
                    <div className={styles['card-header']}>
                      <h1>{item.subject}</h1>
                      <div className={styles['ellipsis-container']} data-ellipsis>
                        <FontAwesomeIcon
                          icon={faEllipsisH}
                          size="2x"
                          style={{ color: '#066678', cursor: 'pointer' }}
                          onClick={(e) => togglePopup('today', index, e)}
                        />
                        {activePopup.type === 'today' && activePopup.index === index && (
                          <div className={styles['popup-menu']} data-popup-menu onClick={e => e.stopPropagation()}>
                            <div
                              className={styles['popup-option']}
                              onClick={(e) => handleOptionClick('reschedule', item, e)}
                            >
                              <FontAwesomeIcon
                                icon={faCalendarAlt}
                                size="1x"
                                style={{ color: '#066678' }}
                                className={styles['option-icon']}
                              />
                              <p className={styles['option-text']}>Reschedule</p>
                            </div>
                            <div
                              className={styles['popup-option']}
                              onClick={(e) => handleOptionClick('cancel', item, e)}
                            >
                              <FontAwesomeIcon
                                icon={faTimes}
                                size="1x"
                                style={{ color: '#066678' }}
                                className={styles['option-icon']}
                              />
                              <p className={styles['option-text']}>Cancel Session</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={[styles.info, styles.name].join(' ')}>
                      <FontAwesomeIcon icon={faUser} size="2x" style={{ color: '#533566' }} />
                      <h2>{item.mentor?.user?.name || 'Unknown Mentor'}</h2>
                    </div>
                    <div className={styles.info}>
                      <FontAwesomeIcon icon={faCalendarAlt} size="2x" style={{ color: '#0084ce' }} />
                      <p>{formatDate(item.date)}</p>
                    </div>
                    <div className={styles.info}>
                      <FontAwesomeIcon icon={faClock} size="2x" style={{ color: '#f8312f' }} />
                      <p>{item.time}</p>
                    </div>
                    <div className={[styles.info, styles.last].join(' ')}>
                      <div className={styles['location-container']}>
                        <FontAwesomeIcon icon={faMapMarkerAlt} size="2x" style={{ color: '#f72197' }} />
                        <p className={styles['location-text']}>{item.location}</p>
                      </div>
                      <div className={styles['action-icons']}>
                        <FontAwesomeIcon
                          icon={faFileAlt}
                          size="2x"
                          style={{ color: '#f72197', cursor: 'pointer' }}
                          className={styles['file-icon']}
                          onClick={(e) => openFileModal(e, item.mentor?.id ?? item.mentor?.ment_inf_id ?? 0)}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Schedule */}
          <div className={styles['session-card']}>
            <h1>UPCOMING</h1>
            <div className={styles['session-card-content']}>
              {upcommingSchedule.length === 0 ? (
                <div className={styles['no-sessions']}>
                  <p>No upcoming sessions</p>
                </div>
              ) : (
                upcommingSchedule.map((item, index) => (
                  <div key={`${item.id}-${index}`} className={styles['upcomming-card']}>
                    <div className={styles['card-header']}>
                      <h1>{item.subject}</h1>
                      <div className={styles['ellipsis-container']} data-ellipsis>
                        <FontAwesomeIcon
                          icon={faEllipsisH}
                          size="2x"
                          style={{ color: '#066678', cursor: 'pointer' }}
                          onClick={(e) => togglePopup('upcoming', index, e)}
                        />
                        {activePopup.type === 'upcoming' && activePopup.index === index && (
                          <div className={styles['popup-menu']} data-popup-menu onClick={e => e.stopPropagation()}>
                            <div
                              className={styles['popup-option']}
                              onClick={(e) => handleOptionClick('reschedule', item, e)}
                            >
                              <FontAwesomeIcon
                                icon={faCalendarAlt}
                                size="1x"
                                style={{ color: '#066678' }}
                                className={styles['option-icon']}
                              />
                              <p className={styles['option-text']}>Reschedule</p>
                            </div>
                            <div
                              className={styles['popup-option']}
                              onClick={(e) => handleOptionClick('cancel', item, e)}
                            >
                              <FontAwesomeIcon
                                icon={faTimes}
                                size="1x"
                                style={{ color: '#066678' }}
                                className={styles['option-icon']}
                              />
                              <p className={styles['option-text']}>Cancel Session</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={[styles.info, styles.name].join(' ')}>
                      <FontAwesomeIcon icon={faUser} size="2x" style={{ color: '#533566' }} />
                      <h2>{item.mentor?.user?.name || 'Unknown Mentor'}</h2>
                    </div>
                    <div className={styles.info}>
                      <FontAwesomeIcon icon={faCalendarAlt} size="2x" style={{ color: '#0084ce' }} />
                      <p>{formatDate(item.date)}</p>
                    </div>
                    <div className={styles.info}>
                      <FontAwesomeIcon icon={faClock} size="2x" style={{ color: '#f8312f' }} />
                      <p>{item.time}</p>
                    </div>
                    <div className={[styles.info, styles.last].join(' ')}>
                      <div className={styles['location-container']}>
                        <FontAwesomeIcon icon={faMapMarkerAlt} size="2x" style={{ color: '#f72197' }} />
                        <p className={styles['location-text']}>{item.location}</p>
                      </div>
                      <div className={styles['action-icons']}>
                        <FontAwesomeIcon
                          icon={faFileAlt}
                          size="2x"
                          style={{ color: '#f72197', cursor: 'pointer' }}
                          className={styles['file-icon']}
                          onClick={(e) => openFileModal(e, item.mentor?.id ?? item.mentor?.ment_inf_id ?? 0)}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* File Modal */}
      {isFileModalOpen && (
        <div className={styles['modal-overlay']}>
          <div className={styles['modal-content']}>
            <div className={styles['modal-header']}>
              <h3>Mentor&apos;s Files</h3>
              <button onClick={closeFileModal} className={styles['close-button']}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className={styles['modal-body']}>
              {isFetchingFiles ? (
                <div>Loading files...</div>
              ) : (
                <div>
                  {(filteredFiles || []).length === 0 ? (
                    <div>No files available</div>
                  ) : (
                filteredFiles.map((file) => (
                  <div key={file.id} className={styles['file-item']}>
                    <FontAwesomeIcon icon={faFile} className={styles['file-icon']} />
                    <span className={styles['file-name']}>{file.file_name}</span>
                    <div className={styles['file-actions']}>
                      <button
                        className={[styles['modal-button'], styles['preview']].join(' ')}
                        onClick={() => previewFile(file.webViewLink || file.file_id)}
                        title="Preview"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button
                        className={[styles['modal-button'], styles['download']].join(' ')}
                        onClick={() => downloadFile(file.webContentLink || file.file_id, file.file_name)}
                        title="Download"
                      >
                        <FontAwesomeIcon icon={faDownload} />
                      </button>
                    </div>
                  </div>
                ))
                )}
                  {/* <button onClick={closeFileModal}>Close</button> */}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirmation && (
        <div className={styles['modal-overlay']}>
          <div className={styles['modal-content']}>
            <div className={styles['modal-header']}>
              <h3>Cancel Session</h3>
            </div>
            <div className={styles['modal-body']}>
              <p>
                Are you sure you want to cancel
                <strong> {selectedItem?.subject}</strong> with
                <strong> {selectedItem?.mentor?.user?.name}</strong>?
              </p>
              <p className={styles['warning-text']}>This action cannot be undone.</p>
            </div>
            <div className={styles['modal-footer']}>
              <button
                className={[styles['modal-button'], styles['cancel']].join(' ')}
                onClick={() => setShowCancelConfirmation(false)}
              >
                No, Keep It
              </button>
              <button
                className={[styles['modal-button'], styles['confirm'], styles['danger']].join(' ')}
                onClick={() => cancelSession(selectedItem)}
              >
                Yes, Cancel Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Reschedule Confirmation Modal */}
      {showRescheduleConfirmation && (
        <div className={styles['modal-overlay']}>
          <div className={styles['modal-content']}>
            <div className={styles['modal-header']}>
              <h3>Reschedule Session</h3>
            </div>
            <div className={styles['modal-body']}>
              <p>
                Are you sure you want to reschedule
                <strong> {selectedItem?.subject}</strong> with
                <strong> {selectedItem?.mentor?.user?.name}</strong>?
              </p>
            </div>
            <div className={styles['modal-footer']}>
              <button
                className={[styles['modal-button'], styles['cancel']].join(' ')}
                onClick={() => setShowRescheduleConfirmation(false)}
              >
                No, Keep It
              </button>
              <button
                className={[styles['modal-button'], styles['confirm']].join(' ')}
                onClick={() => {
                  setShowRescheduleConfirmation(false);
                  setReschedIsOpen(true);
                }}
              >
                Yes, Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Dialog */}
      {reschedIsOpen && selectedSessionID && (
        <div className={styles['modal-overlay']}>
          <RescheduleDialog
            sessionId={selectedSessionID as number}
            currentDate={selectedItem?.date || ''}
            currentTime={selectedItem?.time || ''}
            onClose={() => setReschedIsOpen(false)}
            onReschedule={handleReschedule}
          />
        </div>
      )}
    </div>
  );
}

export const sampleData = {
  schedule: [
    {
      id: 1,
      subject: "Mathematics",
      mentor: {
        user: {
          name: "John Smith"
        },
        ment_inf_id: 101
      },
      date: new Date().toISOString().split('T')[0],
      time: "10:00 AM",
      location: "Room 201, Building A",
      files: []
    },
    {
      id: 2,
      subject: "Physics",
      mentor: {
        user: {
          name: "Sarah Johnson"
        },
        ment_inf_id: 102
      },
      date: new Date().toISOString().split('T')[0],
      time: "2:30 PM",
      location: "Online via Zoom",
      files: []
    }
  ],
  
  upcomingSchedule: [
    {
      id: 3,
      subject: "Chemistry",
      mentor: {
        user: {
          name: "Michael Brown"
        },
        ment_inf_id: 103
      },
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time: "11:00 AM",
      location: "Lab 305, Science Building",
      files: []
    },
    {
      id: 4,
      subject: "Programming",
      mentor: {
        user: {
          name: "Emily Davis"
        },
        ment_inf_id: 104
      },
      date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
      time: "3:00 PM",
      location: "Computer Lab 101",
      files: []
    }
  ],

  mentFiles: {
    files: [
      {
        id: 1,
        file_name: "Math_Notes.pdf",
        file_id: "math123",
        owner_id: 101
      },
      {
        id: 2,
        file_name: "Physics_Assignment.docx",
        file_id: "phys456",
        owner_id: 102
      },
      {
        id: 3,
        file_name: "Chemistry_Lab_Guide.pdf",
        file_id: "chem789",
        owner_id: 103
      },
      {
        id: 4,
        file_name: "Programming_Tutorial.pdf",
        file_id: "prog101",
        owner_id: 104
      }
    ]
  }
};