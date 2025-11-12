'use client';

import { useState, useEffect } from 'react';
import Schedule from '@/components/learnerpage/schedule/page';
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
  subjects: string[];
  learn_modality: string;
  learn_sty: string[];
  availability: string[];
  prefSessDur: string;
  goals: string;
  image: string;
  id: string;
}

export default function ViewUser({ user, onClose, isOpen }: ViewUserProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  // was any[] but we set an object - use any (object) for schedule data
  const [userDeetsForSched, setUserDeetsForSched] = useState<any>(null);

  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: '',
    year: '',
    course: '',
    gender: '',
    phoneNum: '',
    email: '',
    address: '',
    bio: '',
    subjects: [],
    learn_modality: '',
    learn_sty: [],
    availability: [],
    prefSessDur: '',
    goals: '',
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

    setUserInfo({
      name: mentor.mentor.name || '',
      year: mentor.mentor.yearLevel || '',
      course: mentor.mentor.program || '',
      gender: mentor.mentor.sex || '',
      phoneNum: mentor.mentor.phoneNumber || '',
      email: mentor.mentor.email || '',
      address: mentor.mentor.address || '',
      bio: mentor.mentor.bio || '',
      subjects: mentor.mentor.subjects || [],
      learn_modality: mentor.mentor.modality || '',
      learn_sty: mentor.mentor.style || [],
      availability: mentor.mentor.availability || [],
      prefSessDur: mentor.mentor.sessionDur || '',
      goals: mentor.mentor.goals || '',
      image: mentor.mentor.image || '',
      id: mentor.mentor._id || ''
    });

      setImageUrl(mentor.mentor.image || '');

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
        mentorSubjects: mentor.mentor.subjects || [],
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
        <div className={styles.spinner}></div>
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
            <div className={styles.detailsSection}>
              <div className={styles.detailsCard}>
                <h4 className={styles.sectionTitle}>
                  <i className="fas fa-book-open"></i> Teaching Details
                </h4>
                <hr className={styles.divider2} />
                <div className={styles.detailsContent}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Subjects Offered:</span>
                    <span className={`${styles.detailValue} ${styles.wrapText}`}>
                      {parseArrayString(userInfo.subjects) || "N/A"}
                    </span>
                  </div>
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
                      {userInfo.goals || "No experience provided"}
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