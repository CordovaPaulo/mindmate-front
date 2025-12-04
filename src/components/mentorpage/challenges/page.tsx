'use client';

import { useState, useEffect } from 'react';
import styles from './challenges.module.css';
import { toast } from 'react-toastify';
import api from '@/lib/axios';

interface Challenge {
  _id: string;
  title: string;
  description: string;
  requirements: string[];
  specialization?: string;
  skill?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  xpReward: number;
  isActive: boolean;
  mentor: string;
  mentorName: string;
  createdAt: string;
  updatedAt: string;
  submissions: Submission[];
  totalSubmissions?: number;
  pendingSubmissions?: number;
  approvedSubmissions?: number;
}

interface Submission {
  _id: string;
  learner: string;
  learnerName: string;
  submittedAt: string;
  submissionUrl?: string;
  submissionText?: string;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  challengeId?: string;
  challengeTitle?: string;
  xpReward?: number;
  specialization?: string;
  skill?: string;
}

interface UserData {
  _id: string;
  name: string;
  subjects: string[];
  specializations?: string[];
}

interface ChallengesComponentProps {
  userData: UserData;
  userSpecializations?: string[];
  challenges: Challenge[];
  onChallengesUpdate: () => Promise<void>;
}

export default function ChallengesComponent({ 
  userData, 
  userSpecializations, 
  challenges: challengesProp,
  onChallengesUpdate 
}: ChallengesComponentProps) {
  const challenges = challengesProp || [];
  const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSubmissionSpecialization, setSelectedSubmissionSpecialization] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'challenges' | 'submissions'>('challenges');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showSubmissionDetailsModal, setShowSubmissionDetailsModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete' | 'approve' | 'reject';
    challengeId?: string;
    submission?: Submission;
    feedback?: string;
  } | null>(null);
  const [rejectionFeedback, setRejectionFeedback] = useState('');
  const [submissionToReject, setSubmissionToReject] = useState<Submission | null>(null);

  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    requirements: [] as string[],
    specialization: '',
    skill: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    xpReward: 100,
    isActive: true
  });

  const availableSpecs = userSpecializations && userSpecializations.length > 0 
    ? userSpecializations 
    : (userData?.specializations || userData?.subjects || []);
  
  const specializations = ['all', ...availableSpecs];
  const difficulties = ['beginner', 'intermediate', 'advanced'];
  const statuses = ['all', 'pending', 'approved', 'rejected'];

  useEffect(() => {
    filterChallenges();
  }, [challenges, selectedSpecialization, searchQuery]);

  useEffect(() => {
    filterSubmissions();
  }, [challenges, selectedStatus, selectedSubmissionSpecialization]);

  const filterChallenges = () => {
    let filtered = challenges;

    if (selectedSpecialization !== 'all') {
      filtered = filtered.filter(challenge => challenge.specialization === selectedSpecialization);
    }

    if (searchQuery) {
      filtered = filtered.filter(challenge =>
        challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        challenge.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredChallenges(filtered);
  };

  const filterSubmissions = () => {
    const allSubmissions = challenges.flatMap(challenge => 
      challenge.submissions.map(submission => ({
        ...submission,
        challengeId: challenge._id,
        challengeTitle: challenge.title,
        xpReward: challenge.xpReward,
        specialization: challenge.specialization,
        skill: challenge.skill
      }))
    );

    let filtered = allSubmissions;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(sub => sub.status === selectedStatus);
    }

    if (selectedSubmissionSpecialization !== 'all') {
      filtered = filtered.filter(sub => sub.specialization === selectedSubmissionSpecialization);
    }

    setFilteredSubmissions(filtered);
  };
  
  const handleCreateChallenge = async () => {
    if (!newChallenge.title || !newChallenge.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/challenge/create', newChallenge);
      toast.success('Challenge created successfully!');
      setShowCreateModal(false);
      resetNewChallenge();
      await onChallengesUpdate();
    } catch (error: any) {
      console.error('Error creating challenge:', error);
      toast.error(error.response?.data?.message || 'Failed to create challenge');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditChallenge = async () => {
    if (!selectedChallenge) return;

    if (!newChallenge.title || !newChallenge.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await api.patch(`/challenge/edit/${selectedChallenge._id}`, newChallenge);
      toast.success('Challenge updated successfully!');
      setShowEditModal(false);
      setSelectedChallenge(null);
      resetNewChallenge();
      await onChallengesUpdate();
    } catch (error: any) {
      console.error('Error updating challenge:', error);
      toast.error(error.response?.data?.message || 'Failed to update challenge');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChallenge = async () => {
    if (!confirmAction?.challengeId) return;

    setIsLoading(true);
    try {
      await api.delete(`/challenge/delete/${confirmAction.challengeId}`);
      toast.success('Challenge deleted successfully!');
      setShowConfirmModal(false);
      setConfirmAction(null);
      await onChallengesUpdate();
    } catch (error: any) {
      console.error('Error deleting challenge:', error);
      toast.error(error.response?.data?.message || 'Failed to delete challenge');
    } finally {
      setIsLoading(false);
    }
  };
  const handleReviewSubmission = async () => {
    if (!confirmAction?.submission) return;

    const { submission, type, feedback } = confirmAction;

    setIsLoading(true);
    try {
      const endpoint = type === 'approve' 
        ? `/challenge/submission/approve/${submission.challengeId}/${submission._id}`
        : `/challenge/submission/reject/${submission.challengeId}/${submission._id}`;

      await api.post(endpoint, { feedback: feedback || (type === 'approve' ? 'Approved' : 'Needs improvement') });
      
      toast.success(`Submission ${type === 'approve' ? 'approved' : 'rejected'} successfully!`);
      setShowConfirmModal(false);
      setConfirmAction(null);
      setShowSubmissionsModal(false);
      setSelectedSubmission(null);
      await onChallengesUpdate();
    } catch (error: any) {
      console.error('Error reviewing submission:', error);
      toast.error(error.response?.data?.message || `Failed to ${type} submission`);
    } finally {
      setIsLoading(false);
    }
  };
  const resetNewChallenge = () => {
    setNewChallenge({
      title: '',
      description: '',
      requirements: [],
      specialization: availableSpecs[0] || '',
      skill: '',
      difficulty: 'beginner',
      xpReward: 100,
      isActive: true
    });
  };

  const openEditModal = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setNewChallenge({
      title: challenge.title,
      description: challenge.description,
      requirements: challenge.requirements || [],
      specialization: challenge.specialization || '',
      skill: challenge.skill || '',
      difficulty: challenge.difficulty as 'beginner' | 'intermediate' | 'advanced',
      xpReward: challenge.xpReward,
      isActive: challenge.isActive
    });
    setShowEditModal(true);
  };

  const openSubmissionsModal = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setShowSubmissionsModal(true);
  };

  const openSubmissionDetails = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowSubmissionDetailsModal(true);
  };

  const openConfirmModal = (type: 'delete' | 'approve' | 'reject', challengeId?: string, submission?: Submission) => {
    if (type === 'delete' && challengeId) {
      setConfirmAction({ type: 'delete', challengeId });
      setShowConfirmModal(true);
    } else if ((type === 'approve' || type === 'reject') && submission) {
      if (type === 'reject') {
        setSubmissionToReject(submission);
        setRejectionFeedback('');
        setShowRejectionModal(true);
      } else {
        setConfirmAction({ type, submission, feedback: 'Great work!' });
        setShowConfirmModal(true);
      }
    }
  };
  //   }
  // };

  const handleRejectWithFeedback = () => {
    if (!submissionToReject) return;

    setConfirmAction({ 
      type: 'reject', 
      submission: submissionToReject, 
      feedback: rejectionFeedback || 'Submission needs improvement.' 
    });
    setShowRejectionModal(false);
    setShowConfirmModal(true);
  };

  const getSpecializationIcon = (specialization: string) => {
    switch (specialization) {
      case 'programming': return '💻';
      case 'mathematics': return '📊';
      case 'science': return '🔬';
      case 'language': return '📝';
      case 'business': return '💼';
      case 'design': return '🎨';
      case 'data-science': return '📈';
      case 'cybersecurity': return '🔒';
      default: return '🎯';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#4CAF50';
      case 'rejected': return '#F44336';
      case 'pending': return '#FF9800';
      default: return '#666';
    }
  };

  const formatSpecialization = (spec: string) => {
    return spec.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const totalSubmissions = challenges.reduce((total, challenge) => total + challenge.submissions.length, 0);
  const pendingSubmissions = challenges.reduce((total, challenge) => 
    total + challenge.submissions.filter(sub => sub.status === 'pending').length, 0
  );

  if (isLoading) {
    return (
      <div className={styles.challengesContainer}>
        <div className={styles.loading}>Loading challenges...</div>
      </div>
    );
  }

  return (
    <div className={styles.challengesContainer}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Learning Challenges</h1>
        </div>
        <button 
          className={styles.createButton}
          onClick={() => setShowCreateModal(true)}
        >
          <svg className={styles.plusIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Challenge
        </button>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'challenges' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('challenges')}
        >
          Challenges ({challenges.length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'submissions' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('submissions')}
        >
          Submissions ({totalSubmissions})
          {pendingSubmissions > 0 && (
            <span className={styles.pendingBadge}>{pendingSubmissions}</span>
          )}
        </button>
      </div>

      {activeTab === 'challenges' && (
        <>
          <div className={styles.controls}>
            <div className={styles.searchBox}>
              <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search challenges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.filters}>
              <div className={styles.selectWrapper}>
                <select
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className={`${styles.filterSelect} ${styles.specializationFilter}`}
                >
                  {specializations.map(spec => (
                    <option key={spec} value={spec}>
                      {spec === 'all' ? 'All Specializations' : formatSpecialization(spec)}
                    </option>
                  ))}
                </select>
                <svg className={styles.selectArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className={styles.stats}>
            <div className={styles.statCard}>
              <h3>Total Challenges</h3>
              <span className={styles.statNumber}>{challenges.length}</span>
            </div>
            <div className={styles.statCard}>
              <h3>Total Submissions</h3>
              <span className={styles.statNumber}>{totalSubmissions}</span>
            </div>
            <div className={styles.statCard}>
              <h3>Pending Reviews</h3>
              <span className={styles.statNumber}>{pendingSubmissions}</span>
            </div>
          </div>

          <div className={styles.challengesGrid}>
            {filteredChallenges.map(challenge => (
              <div key={challenge._id} className={styles.challengeCard}>
                <div className={styles.challengeHeader}>
                  <span className={styles.categoryIcon}>
                    {getSpecializationIcon(challenge.specialization || '')}
                  </span>
                  <div className={styles.challengeInfo}>
                    <h3 className={styles.challengeTitle}>{challenge.title}</h3>
                    <div className={styles.challengeMeta}>
                      <span className={styles.points}>
                        {challenge.xpReward} XP
                      </span>
                      <span className={styles.specializationTag}>
                        {formatSpecialization(challenge.specialization || '')}
                      </span>
                      <span className={styles.difficultyBadge}>
                        {challenge.difficulty}
                      </span>
                    </div>
                  </div>
                </div>

                <p className={styles.challengeDescription}>{challenge.description}</p>

                <div className={styles.challengeFooter}>
                  <div className={styles.submissionInfo}>
                    <svg className={styles.submissionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{challenge.submissions.length} submissions</span>
                    {challenge.submissions.filter(sub => sub.status === 'pending').length > 0 && (
                      <span className={styles.pendingCount}>
                        {challenge.submissions.filter(sub => sub.status === 'pending').length} pending
                      </span>
                    )}
                  </div>
                  
                  <div className={styles.challengeActions}>
                    <button
                      className={styles.viewButton}
                      onClick={() => openSubmissionsModal(challenge)}
                      title="View Submissions"
                    >
                      <svg className={styles.buttonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      className={styles.editButton}
                      onClick={() => openEditModal(challenge)}
                      title="Edit Challenge"
                    >
                      <svg className={styles.buttonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => openConfirmModal('delete', challenge._id)}
                      title="Delete Challenge"
                    >
                      <svg className={styles.buttonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredChallenges.length === 0 && (
              <div className={styles.noResults}>
                <h3>No challenges found</h3>
                <p>Try adjusting your filters or create a new challenge</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'submissions' && (
        <div className={styles.submissionsContainer}>
          <div className={styles.controls}>
            <div className={styles.searchBox}>
              <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search submissions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.submissionFilters}>
              <div className={styles.selectWrapper}>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className={styles.submissionFilterSelect}
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
                <svg className={styles.selectArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              <div className={styles.selectWrapper}>
                <select
                  value={selectedSubmissionSpecialization}
                  onChange={(e) => setSelectedSubmissionSpecialization(e.target.value)}
                  className={`${styles.submissionFilterSelect} ${styles.specializationFilter}`}
                >
                  {specializations.map(spec => (
                    <option key={spec} value={spec}>
                      {spec === 'all' ? 'All Specializations' : formatSpecialization(spec)}
                    </option>
                  ))}
                </select>
                <svg className={styles.selectArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className={styles.submissionsList}>
            {filteredSubmissions.map(submission => {
              const challenge = challenges.find(c => c._id === submission.challengeId);
              return (
                <div key={submission._id} className={styles.submissionCardCompact}>
                  <div className={styles.submissionHeaderCompact}>
                    <div className={styles.submissionInfoCompact}>
                      <h4>{submission.learnerName}</h4>
                      <div className={styles.submissionMeta}>
                        <span className={styles.challengeTitleCompact}>
                          {challenge?.title}
                        </span>
                        <div className={styles.submissionDetailsRow}>
                          <span className={styles.submissionDate}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v14a2 2 0 002 2z" />
                            </svg>
                            {new Date(submission.submittedAt).toLocaleDateString()}
                          </span>
                          {(submission.submissionUrl || submission.submissionText) && (
                            <span className={styles.fileCount}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Submission
                            </span>
                          )}
                          <span className={styles.specializationBadge}>
                            {formatSpecialization(submission.specialization || '')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span 
                      className={styles.statusBadge}
                      style={{ backgroundColor: getStatusColor(submission.status) }}
                    >
                      {submission.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className={styles.submissionActions}>
                    <button
                      className={styles.viewDetailsButton}
                      onClick={() => openSubmissionDetails(submission)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Details
                    </button>

                    {submission.status === 'pending' && (
                      <div className={styles.actionButtons}>
                        <button
                          className={styles.approveButton}
                          onClick={() => openConfirmModal('approve', undefined, submission)}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Approve
                        </button>
                        <button
                          className={styles.rejectButton}
                          onClick={() => openConfirmModal('reject', undefined, submission)}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {filteredSubmissions.length === 0 && (
              <div className={styles.noResults}>
                <h3>No submissions found</h3>
                <p>Try adjusting your filters or check back later for new submissions</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submissions Modal with Instructions */}
      {showSubmissionsModal && selectedChallenge && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ maxWidth: '1000px' }}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleSection}>
                <h3>Submissions for: {selectedChallenge.title}</h3>
                <div className={styles.challengeMetaInfo}>
                  <span className={styles.specializationBadge}>
                    {formatSpecialization(selectedChallenge.specialization || '')}
                  </span>
                  <span className={styles.points}>{selectedChallenge.xpReward} XP</span>
                  <span className={styles.difficultyBadge}>{selectedChallenge.difficulty}</span>
                </div>
              </div>
              <button 
                className={styles.closeButton}
                onClick={() => setShowSubmissionsModal(false)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className={styles.modalContent}>
              {/* Challenge Details Section */}
              <div className={styles.instructionsSection}>
                <div className={styles.sectionHeader}>
                  <h4>📋 Challenge Details</h4>
                </div>
                <div className={styles.instructionsContent}>
                  <p><strong>Description:</strong> {selectedChallenge.description}</p>
                  {selectedChallenge.requirements && selectedChallenge.requirements.length > 0 && (
                    <>
                      <p><strong>Requirements:</strong></p>
                      <ul className={styles.requirementsList}>
                        {selectedChallenge.requirements.map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {selectedChallenge.skill && (
                    <p><strong>Skill Focus:</strong> {selectedChallenge.skill}</p>
                  )}
                </div>
              </div>

              {/* Submissions List */}
              <div className={styles.submissionsSection}>
                <div className={styles.sectionHeader}>
                  <h4>👥 Learner Submissions ({selectedChallenge.submissions.length})</h4>
                </div>
                {selectedChallenge.submissions.length > 0 ? (
                  <div className={styles.submissionsListModal}>
                    {selectedChallenge.submissions.map(submission => (
                      <div key={submission._id} className={styles.submissionItemModal}>
                        <div className={styles.submissionHeaderModal}>
                          <div className={styles.submissionLearnerInfo}>
                            <div className={styles.learnerName}>
                              <strong>{submission.learnerName}</strong>
                              <span className={styles.submissionDate}>
                                {new Date(submission.submittedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <span 
                            className={styles.statusBadge}
                            style={{ backgroundColor: getStatusColor(submission.status) }}
                          >
                            {submission.status.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className={styles.submissionContentModal}>
                          <div className={styles.submissionText}>
                            {submission.submissionText && <p>{submission.submissionText}</p>}
                            {submission.submissionUrl && (
                              <p>
                                <strong>Submission URL:</strong>{' '}
                                <a href={submission.submissionUrl} target="_blank" rel="noopener noreferrer">
                                  {submission.submissionUrl}
                                </a>
                              </p>
                            )}
                          </div>
                          
                          {submission.feedback && (
                            <div className={styles.feedbackSection}>
                              <div className={styles.feedbackHeader}>
                                <strong>Your Feedback</strong>
                              </div>
                              <div className={styles.feedbackContent}>
                                <p>{submission.feedback}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {submission.status === 'pending' && (
                          <div className={styles.submissionActionsModal}>
                            <button
                              className={styles.approveButton}
                              onClick={() => openConfirmModal('approve', undefined, submission)}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Approve
                            </button>
                            <button
                              className={styles.rejectButton}
                              onClick={() => openConfirmModal('reject', undefined, submission)}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.noSubmissions}>
                    <p>No submissions yet for this challenge.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowSubmissionsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Challenge Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Create New Challenge</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowCreateModal(false)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className={styles.modalContent}>
              <div className={styles.formGroup}>
                <label>Challenge Title</label>
                <input
                  type="text"
                  value={newChallenge.title}
                  onChange={(e) => setNewChallenge(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter challenge title"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={newChallenge.description}
                  onChange={(e) => setNewChallenge(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the challenge"
                  rows={3}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Requirements (Optional - one per line)</label>
                <textarea
                  value={newChallenge.requirements.join('\n')}
                  onChange={(e) => setNewChallenge(prev => ({ 
                    ...prev, 
                    requirements: e.target.value.split('\n').filter(r => r.trim()) 
                  }))}
                  placeholder="Enter requirements, one per line...\ne.g., Complete within 2 weeks\nSubmit code with documentation"
                  rows={4}
                />
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Specialization</label>
                  <select
                    value={newChallenge.specialization}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, specialization: e.target.value }))}
                    className={styles.filterSelect}
                  >
                    {specializations.filter(spec => spec !== 'all').map(specialization => (
                      <option key={specialization} value={specialization}>
                        {formatSpecialization(specialization)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label>Skill (Optional)</label>
                  <input
                    type="text"
                    value={newChallenge.skill}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, skill: e.target.value }))}
                    placeholder="e.g., React, Python, etc."
                  />
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Difficulty</label>
                  <select
                    value={newChallenge.difficulty}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, difficulty: e.target.value as 'beginner' | 'intermediate' | 'advanced' }))}
                    className={styles.filterSelect}
                  >
                    {difficulties.map(diff => (
                      <option key={diff} value={diff}>
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label>XP Reward</label>
                  <input
                    type="number"
                    value={newChallenge.xpReward}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, xpReward: parseInt(e.target.value) || 0 }))}
                    min="1"
                  />
                </div>
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.saveButton}
                onClick={handleCreateChallenge}
                disabled={!newChallenge.title || !newChallenge.description}
              >
                Create Challenge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Challenge Modal */}
      {showEditModal && selectedChallenge && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Edit Challenge</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowEditModal(false)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className={styles.modalContent}>
              <div className={styles.formGroup}>
                <label>Challenge Title</label>
                <input
                  type="text"
                  value={newChallenge.title}
                  onChange={(e) => setNewChallenge(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={newChallenge.description}
                  onChange={(e) => setNewChallenge(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Requirements (Optional - one per line)</label>
                <textarea
                  value={newChallenge.requirements.join('\n')}
                  onChange={(e) => setNewChallenge(prev => ({ 
                    ...prev, 
                    requirements: e.target.value.split('\n').filter(r => r.trim()) 
                  }))}
                  placeholder="Enter requirements, one per line..."
                  rows={4}
                />
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Specialization</label>
                  <select
                    value={newChallenge.specialization}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, specialization: e.target.value }))}
                    className={styles.filterSelect}
                  >
                    {specializations.filter(spec => spec !== 'all').map(specialization => (
                      <option key={specialization} value={specialization}>
                        {formatSpecialization(specialization)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label>Skill (Optional)</label>
                  <input
                    type="text"
                    value={newChallenge.skill}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, skill: e.target.value }))}
                    placeholder="e.g., React, Python, etc."
                  />
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Difficulty</label>
                  <select
                    value={newChallenge.difficulty}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, difficulty: e.target.value as 'beginner' | 'intermediate' | 'advanced' }))}
                    className={styles.filterSelect}
                  >
                    {difficulties.map(diff => (
                      <option key={diff} value={diff}>
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label>XP Reward</label>
                  <input
                    type="number"
                    value={newChallenge.xpReward}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, xpReward: parseInt(e.target.value) || 0 }))}
                    min="1"
                  />
                </div>
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.saveButton}
                onClick={handleEditChallenge}
                disabled={!newChallenge.title || !newChallenge.description}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submission Details Modal */}
      {showSubmissionDetailsModal && selectedSubmission && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ maxWidth: '800px' }}>
            <div className={styles.modalHeader}>
              <h3>Submission Details</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowSubmissionDetailsModal(false)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className={styles.modalContent}>
              <div className={styles.submissionDetails}>
                <div className={styles.submissionHeader}>
                  <div className={styles.submissionInfo}>
                    <h4>{selectedSubmission.learnerName}</h4>
                    <p>Submitted for: {challenges.find(c => c._id === selectedSubmission.challengeId)?.title}</p>
                    <span className={styles.submissionDate}>
                      {new Date(selectedSubmission.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span 
                    className={styles.statusBadge}
                    style={{ backgroundColor: getStatusColor(selectedSubmission.status) }}
                  >
                    {selectedSubmission.status.toUpperCase()}
                  </span>
                </div>
                
                <div className={styles.submissionContentFull}>
                  <p><strong>Submission Content:</strong></p>
                  {selectedSubmission.submissionText && <p>{selectedSubmission.submissionText}</p>}
                  {selectedSubmission.submissionUrl && (
                    <div style={{ marginTop: '8px' }}>
                      <p><strong>Submission URL:</strong></p>
                      <a href={selectedSubmission.submissionUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'underline' }}>
                        {selectedSubmission.submissionUrl}
                      </a>
                    </div>
                  )}
                  
                  {selectedSubmission.feedback && (
                    <div style={{ marginTop: '12px' }}>
                      <p><strong>Your Feedback:</strong></p>
                      <p style={{ background: '#f8f9fa', padding: '8px', borderRadius: '4px', marginTop: '4px' }}>
                        {selectedSubmission.feedback}
                      </p>
                    </div>
                  )}
                </div>

                {selectedSubmission.status === 'pending' && (
                  <div className={styles.submissionActions}>
                    <button
                      className={styles.approveButton}
                      onClick={() => {
                        setShowSubmissionDetailsModal(false);
                        openConfirmModal('approve', undefined, selectedSubmission);
                      }}
                    >
                      <svg className={styles.buttonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Approve
                    </button>
                    <button
                      className={styles.rejectButton}
                      onClick={() => {
                        setShowSubmissionDetailsModal(false);
                        openConfirmModal('reject', undefined, selectedSubmission);
                      }}
                    >
                      <svg className={styles.buttonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowSubmissionDetailsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Confirmation Modal */}
      {showRejectionModal && submissionToReject && (
        <div className={styles.modalOverlay}>
          <div className={styles.rejectionModal}>
            <div className={styles.modalHeader}>
              <h3>Reject Submission</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowRejectionModal(false)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className={styles.modalContent}>
              <p>
                Please provide feedback for rejecting {submissionToReject.learnerName}'s submission. 
                This feedback will help the learner understand what needs improvement.
              </p>
              
              <div className={styles.formGroup}>
                <label>Feedback for Learner</label>
                <textarea
                  value={rejectionFeedback}
                  onChange={(e) => setRejectionFeedback(e.target.value)}
                  placeholder="Explain why this submission was rejected and what improvements are needed..."
                  className={styles.rejectionTextarea}
                />
              </div>

              {rejectionFeedback && (
                <div className={styles.feedbackPreview}>
                  <strong>Preview of your feedback:</strong>
                  <p>{rejectionFeedback}</p>
                </div>
              )}
            </div>
            
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowRejectionModal(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.rejectButton}
                onClick={handleRejectWithFeedback}
                disabled={!rejectionFeedback.trim()}
              >
                Reject Submission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ maxWidth: '500px' }}>
            <div className={styles.modalHeader}>
              <h3>
                {confirmAction.type === 'delete' && 'Delete Challenge'}
                {confirmAction.type === 'approve' && 'Approve Submission'}
                {confirmAction.type === 'reject' && 'Reject Submission'}
              </h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowConfirmModal(false)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className={styles.modalContent}>
              <p>
                {confirmAction.type === 'delete' && 'Are you sure you want to delete this challenge? This action cannot be undone.'}
                {confirmAction.type === 'approve' && `Are you sure you want to approve ${confirmAction.submission?.learnerName}'s submission? This will award ${confirmAction.submission && challenges.find(c => c._id === confirmAction.submission?.challengeId)?.xpReward} XP.`}
                {confirmAction.type === 'reject' && `Are you sure you want to reject ${confirmAction.submission?.learnerName}'s submission?`}
              </p>
              {confirmAction.type === 'reject' && confirmAction.feedback && (
                <div className={styles.feedbackPreview}>
                  <strong>Your feedback:</strong>
                  <p>{confirmAction.feedback}</p>
                </div>
              )}
            </div>
            
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button 
                className={confirmAction.type === 'delete' ? styles.deleteButton : confirmAction.type === 'approve' ? styles.approveButton : styles.rejectButton}
                onClick={confirmAction.type === 'delete' ? handleDeleteChallenge : handleReviewSubmission}
              >
                {confirmAction.type === 'delete' && 'Delete Challenge'}
                {confirmAction.type === 'approve' && 'Approve'}
                {confirmAction.type === 'reject' && 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
