'use client';

import { useState, useEffect } from 'react';
import Schedule from '@/components/learnerpage/schedule/page';
import PresetSchedules from './PresetSchedules';
import api from '@/lib/axios';
import styles from './viewUser.module.css';

interface ViewUserProps {
  user: any;
  onClose: () => void;
  isOpen: boolean;
}

interface UserInfo {
  name: string;
  year: string;
  course: string;
  gender: string;
  phoneNum: string;
  email: string;
  address: string;
  bio: string;
  specializations: string[];
  subjects: any[];
  learn_modality: string;
  learn_sty: string[];
  availability: string[];
  prefSessDur: string;
  exp: string;
  proficiency: string;
  image: string;
  id: string;
}

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

export default function ViewUser({ user, onClose, isOpen }: ViewUserProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  // was any[] but we set an object - use any (object) for schedule data
  const [userDeetsForSched, setUserDeetsForSched] = useState<any>(null);
  const [presetSchedules, setPresetSchedules] = useState<PresetSchedule[]>([]);
  const [expandedSubjects, setExpandedSubjects] = useState<{ [key: number]: boolean }>({});

  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: '',
    year: '',
    course: '',
    gender: '',
    phoneNum: '',
    email: '',
    address: '',
    bio: '',
    specializations: [],
    subjects: [],
    learn_modality: '',
    learn_sty: [],
    availability: [],
    prefSessDur: '',
    exp: '',
    proficiency: '',
    image: '',
    id: ''
  });

  const [imageUrl, setImageUrl] = useState<string>('');

  const capitalizeFirstLetter = (str: string) => {
    if (!str) return "Not specified";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const parseArrayString = (str: string | string[]) => {
    if (Array.isArray(str)) {
      return str.join(", ");
    }
    
    try {
      if (typeof str === 'string') {
        const parsed = JSON.parse(str);
        return Array.isArray(parsed) ? parsed.join(", ") : str;
      }
      return str || "Not specified";
    } catch (e) {
      return str || "Not specified";
    }
  };

  const toggleSubjectDropdown = (index: number) => {
    setExpandedSubjects(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Fetch mentor info from backend using MindMateToken
  const fetchUserInfo = async (id: string) => {
    try {
      setIsLoading(true);
      const token = typeof document !== 'undefined'
        ? document.cookie.split('; ').find(row => row.startsWith('MindMateToken='))?.split('=')[1]
        : '';

      const res = await api.get(`/api/learner/mentors/${id}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const mentor = res.data;
      const specializations = mentor.mentor.specialization || [];

      // Fetch subjects based on specializations
      let subjects = [];
      if (specializations.length > 0) {
        try {
          const subjectsRes = await api.get('/api/learner/subjects', {
            params: { specializations: JSON.stringify(specializations) },
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          subjects = subjectsRes.data.subjects || [];
        } catch (subjectError) {
          console.error("Error fetching subjects:", subjectError);
        }
      }

    setUserInfo({
      name: mentor.mentor.name || '',
      year: mentor.mentor.yearLevel || '',
      course: mentor.mentor.program || '',
      gender: mentor.mentor.sex || '',
      phoneNum: mentor.mentor.phoneNumber || '',
      email: mentor.mentor.email || '',
      address: mentor.mentor.address || '',
      bio: mentor.mentor.bio || '',
      specializations: specializations,
      subjects: subjects,
      learn_modality: mentor.mentor.modality || '',
      learn_sty: mentor.mentor.style || [],
      availability: mentor.mentor.availability || [],
      prefSessDur: mentor.mentor.sessionDur || '',
      exp: mentor.mentor.exp || '',
      proficiency: mentor.mentor.proficiency || '',
      image: mentor.mentor.image || '',
      id: mentor.mentor._id || ''
    });

      setImageUrl(mentor.mentor.image || '');

      // Store preset schedules if available
      if (mentor.presetSchedules && Array.isArray(mentor.presetSchedules)) {
        setPresetSchedules(mentor.presetSchedules);
      }

      // Prepare data for schedule component - use more robust object structure
      const scheduleData = {
        mentorId: mentor.mentor._id || id,
        mentorName: mentor.mentor.name || '',
        mentorYear: mentor.mentor.yearLevel || '',
        mentorCourse: mentor.mentor.program || '',
        mentorSessionDur: mentor.mentor.sessionDur || '',
        mentorModality: mentor.mentor.modality || '',
        mentorTeachStyle: mentor.mentor.style || [],
        mentorAvailability: mentor.mentor.availability || [],
        mentorProfilePic: mentor.mentor.image || '',
        mentorSubjects: specializations,
      };
      
      setUserDeetsForSched(scheduleData);
      console.log("Mentor data prepared for Schedule:", scheduleData);
    } catch (error) {
      console.error("Error fetching user info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmSchedule = () => {
    setShowConfirmationModal(false);
    setShowSchedule(true);
  };

  const handleScheduleConfirm = async (scheduleData: any) => {
    try {
      setShowSchedule(false);
      onClose();
    } catch (error) {
      console.error("Error handling schedule confirmation:", error);
    }
  };

  // Extract userId from the user prop
  const userId = user?.id || user?._id || user?.userId;

  useEffect(() => {
    if (userId && isOpen) {
      fetchUserInfo(userId);
    }
  }, [userId, isOpen]); // Add isOpen to dependencies

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinnerWrap}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  if (!isOpen || !user) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.wrapper}>
        {/*  Modal Header - Title */}
        <div className={`${styles.upperElement} ${styles.stickyHeader}`}>
          <h3 className={styles.modalTitle}>
            <i className={`fas fa-user-graduate ${styles.modalTitleIcon}`}></i>
            Mentor Profile
          </h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.lowerElement}>
          {/* Mentor Profile Section */}
          <div className={styles.lowerUpper}>
            <div className={styles.profileImageContainer}>
              <img
                src={imageUrl || 'https://placehold.co/600x400'}
                alt="Profile Image"
                className={styles.profileImage}
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/600x400';
                }}
              />
            </div>

            <div className={styles.profileInformation}>
              <h4 className={styles.applicantName}>{userInfo.name}</h4>
              <hr className={styles.divider} />
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>
                    <i className="fas fa-venus-mars"></i> Sex at Birth
                  </span>
                  <span className={styles.infoValue}>
                    {capitalizeFirstLetter(userInfo.gender) || "N/A"}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>
                    <i className="fas fa-calendar-alt"></i> Year
                  </span>
                  <span className={styles.infoValue}>{userInfo.year || "N/A"}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>
                    <i className="fas fa-graduation-cap"></i> Program
                  </span>
                  <span className={styles.infoValue}>{userInfo.course || "N/A"}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>
                    <i className="fas fa-phone"></i> Contact
                  </span>
                  <span className={styles.infoValue}>{userInfo.phoneNum || "N/A"}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>
                    <i className="fas fa-envelope"></i> Email
                  </span>
                  <span className={styles.infoValue}>{userInfo.email || "N/A"}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>
                    <i className="fas fa-map-marker-alt"></i> Address
                  </span>
                  <span className={styles.infoValue}>{userInfo.address || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className={styles.lowerLower}>
            {/* Preset Schedules Section */}
            {presetSchedules.length > 0 && (
              <PresetSchedules
                schedules={presetSchedules}
                onScheduleUpdated={() => fetchUserInfo(userId)}
              />
            )}

            <div className={styles.detailsSection}>
              <div className={styles.detailsCard}>
                <h4 className={styles.sectionTitle}>
                  <i className="fas fa-book-open"></i> Teaching Details
                </h4>
                <hr className={styles.divider2} />
                <div className={styles.detailsContent}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Specialization Offered:</span>
                    <div className={`${styles.detailValue} ${styles.wrapText}`} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {userInfo.specializations && userInfo.specializations.length > 0
                        ? userInfo.specializations.map((spec, i) => (
                            <span key={i} style={{
                              display: 'inline-block',
                              background: '#f1f5f9',
                              color: '#0f172a',
                              padding: '6px 10px',
                              borderRadius: 16,
                              fontSize: 13,
                              marginBottom: 6
                            }}>{spec}</span>
                          ))
                        : "N/A"
                      }
                    </div>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Proficiency Level:</span>
                    <span className={styles.detailValue}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        background: '#eef2ff',
                        color: '#3730a3',
                        borderRadius: 12,
                        fontSize: 13
                      }}>{capitalizeFirstLetter(userInfo.proficiency) || 'N/A'}</span>
                    </span>
                  </div>

                  {userInfo.subjects.length > 0 && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Related Subjects:</span>
                      <div className={`${styles.detailValue} ${styles.wrapText}`}>
                        {userInfo.subjects.map((subjectDoc: any, index: number) => {
                          const proficiency = (userInfo.proficiency || '').toLowerCase();
                          const difficulty = subjectDoc.difficulty || {};
                          const isExpanded = expandedSubjects[index];

                          // build level arrays according to proficiency
                          const showBeginner = proficiency === 'beginner' || proficiency === 'intermediate' || proficiency === 'advanced';
                          const showIntermediate = proficiency === 'intermediate' || proficiency === 'advanced';
                          const showAdvanced = proficiency === 'advanced';

                          return (
                            <div key={index} style={{ 
                              background: '#fff', 
                              border: '1px solid #e5e7eb', 
                              borderRadius: 8, 
                              marginBottom: 10,
                              overflow: 'hidden'
                            }}>
                              {/* Dropdown Header */}
                              <button
                                onClick={() => toggleSubjectDropdown(index)}
                                style={{
                                  width: '100%',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '12px 16px',
                                  background: isExpanded ? '#f9fafb' : '#fff',
                                  border: 'none',
                                  cursor: 'pointer',
                                  transition: 'background 0.2s',
                                  textAlign: 'left'
                                }}
                              >
                                <span style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.95rem' }}>
                                  {subjectDoc.specialization}
                                </span>
                                <i 
                                  className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}
                                  style={{ 
                                    color: '#6b7280',
                                    fontSize: '0.85rem',
                                    transition: 'transform 0.2s'
                                  }}
                                ></i>
                              </button>

                              {/* Dropdown Content */}
                              {isExpanded && (
                                <div style={{ 
                                  padding: '12px 16px',
                                  borderTop: '1px solid #e5e7eb',
                                  background: '#fafbfc'
                                }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {showBeginner && difficulty.beginner && difficulty.beginner.length > 0 && (
                                      <div>
                                        <div style={{ 
                                          fontSize: '0.85rem', 
                                          fontWeight: 600, 
                                          marginBottom: 6,
                                          color: '#059669',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 6
                                        }}>
                                          <i className="fas fa-seedling" style={{ fontSize: '0.8rem' }}></i>
                                          Beginner
                                        </div>
                                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                                          {difficulty.beginner.map((s: string, si: number) => (
                                            <li key={si} style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: 4 }}>
                                              {s}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {showIntermediate && difficulty.intermediate && difficulty.intermediate.length > 0 && (
                                      <div>
                                        <div style={{ 
                                          fontSize: '0.85rem', 
                                          fontWeight: 600, 
                                          marginBottom: 6,
                                          color: '#f59e0b',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 6
                                        }}>
                                          <i className="fas fa-chart-line" style={{ fontSize: '0.8rem' }}></i>
                                          Intermediate
                                        </div>
                                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                                          {difficulty.intermediate.map((s: string, si: number) => (
                                            <li key={si} style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: 4 }}>
                                              {s}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {showAdvanced && difficulty.advanced && difficulty.advanced.length > 0 && (
                                      <div>
                                        <div style={{ 
                                          fontSize: '0.85rem', 
                                          fontWeight: 600, 
                                          marginBottom: 6,
                                          color: '#dc2626',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 6
                                        }}>
                                          <i className="fas fa-fire" style={{ fontSize: '0.8rem' }}></i>
                                          Advanced
                                        </div>
                                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                                          {difficulty.advanced.map((s: string, si: number) => (
                                            <li key={si} style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: 4 }}>
                                              {s}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Teaching Modality:</span>
                    <span className={styles.detailValue}>
                      {userInfo.learn_modality || "N/A"}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Teaching Style:</span>
                    <span className={styles.detailValue}>
                      {parseArrayString(userInfo.learn_sty) || "N/A"}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Availability:</span>
                    <span className={`${styles.detailValue} ${styles.availabilityText}`}>
                      {parseArrayString(userInfo.availability) || "N/A"}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Session Duration:</span>
                    <span className={styles.detailValue}>
                      {userInfo.prefSessDur || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.bioCard}>
                <h4 className={styles.sectionTitle}>
                  <i className="fas fa-user-edit"></i> Bio & Experience
                </h4>
                <hr className={styles.divider2} />
                <div className={styles.bioContent}>
                  <div className={styles.detailItem2}>
                    <span className={styles.detailLabel}>Bio:</span>
                    <span className={`${styles.detailValue2} ${styles.wrapText}`}>
                      {userInfo.bio || "No bio provided"}
                    </span>
                  </div>
                  <div className={styles.detailItem2}>
                    <span className={styles.detailLabel}>Experience:</span>
                    <span className={`${styles.detailValue2} ${styles.wrapText}`}>
                      {userInfo.exp || "No experience provided"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={styles.actionButton}>
              <div className={styles.buttonGroup}>
                <button 
                  className={styles.closeBtnNew} 
                  onClick={onClose}
                >
                 Close
                </button>
                <button 
                  className={styles.sendOfferBtn} 
                  onClick={() => setShowConfirmationModal(true)}
                >
                  <i className="fas fa-calendar-alt"></i> Schedule Session
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmationModal && (
          <div className={styles.confirmationModalOverlay}>
            <div className={styles.confirmationModal}>
              <h3>Confirm Schedule</h3>
              <hr className={styles.divider2} />
              <p>Are you sure you want to schedule a session with {userInfo.name}?</p>
              <div className={styles.modalActions}>
                <button
                  className={`${styles.modalBtn} ${styles.cancel}`}
                  onClick={() => setShowConfirmationModal(false)}
                >
                  Cancel
                </button>
                <button className={`${styles.modalBtn} ${styles.confirm}`} onClick={confirmSchedule}>
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Modal - This will appear when showSchedule is true */}
        {showSchedule && userDeetsForSched && (
          <div className={styles.popupOverlay}>
            <Schedule
              info={userDeetsForSched}
              onClose={() => setShowSchedule(false)}
              onConfirm={handleScheduleConfirm}
            />
          </div>
        )}
      </div>
    </div>
  );

}