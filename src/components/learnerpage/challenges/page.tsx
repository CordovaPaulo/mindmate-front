'use client';

import { useState, useEffect } from 'react';
import styles from './challenges.module.css';
import api from '@/lib/axios';
import { toast } from 'react-toastify';

interface Challenge {
  _id: string;
  title: string;
  description: string;
  requirements: string[];
  specialization: string;
  skill?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  xpReward: number;
  isActive: boolean;
  createdAt?: string;
  mentorName: string;
  hasSubmitted?: boolean;
  submissionStatus?: 'pending' | 'approved' | 'rejected' | null;
  mySubmission?: Submission | null;
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

export default function ChallengesComponent({ userData, userSpecializations, challenges: initialChallenges, onChallengesUpdate }: ChallengesComponentProps) {
  const [challenges, setChallenges] = useState<Challenge[]>(initialChallenges);
  const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'challenges' | 'mySubmissions'>('challenges');
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submissionText, setSubmissionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableSpecs = userSpecializations && userSpecializations.length > 0 
    ? userSpecializations 
    : (userData?.specializations || userData?.subjects || []);
  
  const specializations = ['all', ...availableSpecs];

  useEffect(() => {
    setChallenges(initialChallenges);
  }, [initialChallenges]);

  useEffect(() => {
    filterChallenges();
  }, [challenges, selectedSpecialization, searchQuery]);

  const filterChallenges = () => {
    if (!challenges || !Array.isArray(challenges)) {
      setFilteredChallenges([]);
      return;
    }
    
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

  const getMySubmissions = () => {
    if (!challenges || !Array.isArray(challenges)) return [];
    
    return challenges
      .filter(challenge => challenge.mySubmission)
      .map(challenge => ({
        ...challenge.mySubmission!,
        challengeId: challenge._id
      }));
  };

  const openSubmitModal = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setSubmissionUrl('');
    setSubmissionText('');
    setShowSubmitModal(true);
  };

  const handleSubmitChallenge = async () => {
    if (!selectedChallenge) return;
    
    if (!submissionText || !submissionText.trim()) {
      toast.error('Description is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/api/challenge/submit/${selectedChallenge._id}`, {
        submissionUrl: submissionUrl || undefined,
        submissionText: submissionText || undefined
      });
      
      toast.success('Challenge submitted successfully!');
      setShowSubmitModal(false);
      setSelectedChallenge(null);
      setSubmissionUrl('');
      setSubmissionText('');
      await onChallengesUpdate();
    } catch (error: any) {
      console.error('Error submitting challenge:', error);
      toast.error(error.response?.data?.message || 'Failed to submit challenge');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openChallengeDetails = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setShowChallengeModal(true);
  };

  const getSpecializationIcon = (specialization: string) => {
    switch (specialization.toLowerCase()) {
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
    if (!spec) return '';
    return spec.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const hasSubmitted = (challenge: Challenge) => {
    return challenge.hasSubmitted;
  };

  const getMySubmissionStatus = (challenge: Challenge): 'pending' | 'approved' | 'rejected' | null | undefined => {
    return challenge.submissionStatus;
  };

  const mySubmissions = getMySubmissions();

  return (
    <div className={styles.challengesContainer}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Learning Challenges</h1>
        </div>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'challenges' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('challenges')}
        >
          Available Challenges ({challenges?.length || 0})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'mySubmissions' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('mySubmissions')}
        >
          My Submissions ({mySubmissions?.length || 0})
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
              <h3>Available Challenges</h3>
              <span className={styles.statNumber}>{challenges?.length || 0}</span>
            </div>
            <div className={styles.statCard}>
              <h3>My Submissions</h3>
              <span className={styles.statNumber}>{mySubmissions?.length || 0}</span>
            </div>
            <div className={styles.statCard}>
              <h3>Points Earned</h3>
              <span className={styles.statNumber}>
                {mySubmissions
                  ?.filter(sub => sub.status === 'approved')
                  .reduce((total, sub) => {
                    const challenge = challenges?.find(c => c._id === sub.challengeId);
                    return total + (challenge?.xpReward || 0);
                  }, 0) || 0}
              </span>
            </div>
          </div>

          <div className={styles.challengesGrid}>
            {filteredChallenges?.map(challenge => {
              const submitted = challenge.hasSubmitted;
              const submissionStatus = challenge.submissionStatus;
              
              return (
                <div key={challenge._id} className={styles.challengeCard}>
                  <div className={styles.challengeHeader}>
                    <span className={styles.categoryIcon}>
                      {getSpecializationIcon(challenge.specialization)}
                    </span>
                    <div className={styles.challengeInfo}>
                      <h3 className={styles.challengeTitle}>{challenge.title}</h3>
                      <div className={styles.challengeMeta}>
                        <span className={styles.points}>
                          {challenge.xpReward} XP
                        </span>
                        <span className={styles.specializationTag}>
                          {formatSpecialization(challenge.specialization)}
                        </span>
                        <span className={`${styles.difficultyBadge} ${styles[challenge.difficulty]}`}>
                          {challenge.difficulty}
                          </span>
                      </div>
                    </div>
                  </div>

                  <p className={styles.challengeDescription}>{challenge.description}</p>

                  <div className={styles.challengeFooter}>
                    <div className={styles.submissionInfo}>
                      {submitted ? (
                        <div className={styles.submissionStatus}>
                          <span 
                            className={styles.statusBadge}
                            style={{ backgroundColor: getStatusColor(submissionStatus || 'pending') }}
                          >
                            {submissionStatus?.toUpperCase() || 'SUBMITTED'}
                          </span>
                          {submissionStatus === 'approved' && (
                            <span className={styles.pointsAwarded}>
                              +{challenge.xpReward} XP earned!
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className={styles.notSubmitted}>Not submitted yet</span>
                      )}
                    </div>
                    
                    <div className={styles.challengeActions}>
                      <button
                        className={styles.viewButton}
                        onClick={() => openChallengeDetails(challenge)}
                        title="View Challenge Details"
                      >
                        <svg className={styles.buttonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Details
                      </button>
                      {!submitted && (
                        <button
                          className={styles.submitButton}
                          onClick={() => openSubmitModal(challenge)}
                          title="Submit Solution"
                        >
                          <svg className={styles.buttonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Submit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredChallenges.length === 0 && (
              <div className={styles.noResults}>
                <h3>No challenges found</h3>
                <p>Try adjusting your filters or check back later for new challenges</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'mySubmissions' && (
        <div className={styles.submissionsContainer}>
          {mySubmissions && mySubmissions.length > 0 ? (
            <div className={styles.submissionsList}>
              {mySubmissions.map(submission => {
                const challenge = challenges?.find(c => c._id === submission.challengeId);
                return (
                  <div key={submission._id} className={styles.submissionCardCompact}>
                    <div className={styles.submissionHeaderCompact}>
                      <div className={styles.submissionInfoCompact}>
                        <h4>{challenge?.title || 'Unknown Challenge'}</h4>
                        <div className={styles.submissionMeta}>
                          <span className={styles.challengeTitleCompact}>
                            {formatSpecialization(challenge?.specialization || '')} • {challenge?.xpReward || 0} XP
                          </span>
                          <div className={styles.submissionDetailsRow}>
                            <span className={styles.submissionDate}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v14a2 2 0 002 2z" />
                              </svg>
                              {new Date(submission.submittedAt).toLocaleDateString()}
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
                    
                    <div className={styles.submissionContent}>
                      {submission.submissionUrl && (
                        <p><strong>URL:</strong> <a href={submission.submissionUrl} target="_blank" rel="noopener noreferrer">{submission.submissionUrl}</a></p>
                      )}
                      {submission.submissionText && (
                        <p><strong>Description:</strong> {submission.submissionText}</p>
                      )}
                    </div>

                    {submission.feedback && (
                      <div className={styles.feedbackSection}>
                        <strong>Mentor Feedback:</strong>
                        <p>{submission.feedback}</p>
                        {submission.status === 'approved' && challenge && (
                          <div className={styles.pointsAwarded}>
                            <strong>XP Awarded:</strong> {challenge.xpReward}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.noResults}>
              <h3>No submissions yet</h3>
              <p>Start by submitting your first challenge!</p>
            </div>
          )}
        </div>
      )}

      {/* Challenge Details Modal */}
      {showChallengeModal && selectedChallenge && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ maxWidth: '800px' }}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleSection}>
                <h3>{selectedChallenge.title}</h3>
                <div className={styles.challengeMetaInfo}>
                  <span className={styles.specializationBadge}>
                    {formatSpecialization(selectedChallenge.specialization)}
                  </span>
                  <span className={styles.points}>{selectedChallenge.xpReward} XP</span>
                  <span className={`${styles.difficultyBadge} ${styles[selectedChallenge.difficulty]}`}>
                    {selectedChallenge.difficulty}
                    </span>
                </div>
              </div>
              <button 
                className={styles.closeButton}
                onClick={() => setShowChallengeModal(false)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className={styles.modalContent}>
              <div className={styles.instructionsSection}>
                <div className={styles.sectionHeader}>
                  <h4>📋 Challenge Description</h4>
                </div>
                <div className={styles.instructionsContent}>
                  <p>{selectedChallenge.description}</p>
                  {selectedChallenge.skill && (
                    <div style={{ marginTop: '12px', padding: '8px 12px', backgroundColor: '#f0f7ff', borderRadius: '6px', borderLeft: '3px solid #2196F3' }}>
                      <strong>🎓 Skill Focus:</strong> {selectedChallenge.skill}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.instructionsSection}>
                <div className={styles.sectionHeader}>
                  <h4>🎯 Requirements</h4>
                </div>
                <div className={styles.instructionsContent}>
                  <ul>
                    {selectedChallenge.requirements && selectedChallenge.requirements.length > 0 ? (
                      selectedChallenge.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))
                    ) : (
                      <li>No specific requirements listed</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className={styles.submissionGuidelines}>
                <h4>📝 Submission Guidelines:</h4>
                <ul>
                  <li>Provide a URL to your solution (GitHub repo, deployed site, etc.)</li>
                  <li>Add a description explaining your approach and implementation</li>
                  <li>Ensure your submission meets all requirements listed above</li>
                  <li>Mentor will review and provide feedback</li>
                  <li>You will earn {selectedChallenge.xpReward} XP if your submission is approved</li>
                </ul>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowChallengeModal(false)}
              >
                Close
              </button>
              {!selectedChallenge.hasSubmitted && (
                <button 
                  className={styles.saveButton}
                  onClick={() => {
                    setShowChallengeModal(false);
                    openSubmitModal(selectedChallenge);
                  }}
                >
                  Submit Solution
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit Challenge Modal */}
      {showSubmitModal && selectedChallenge && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ maxWidth: '600px' }}>
            <div className={styles.modalHeader}>
              <h3>Submit Solution: {selectedChallenge.title}</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowSubmitModal(false)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className={styles.modalContent}>
              <div className={styles.formGroup}>
                <label>Solution URL (Google Drive, GitHub, etc.)</label>
                <input
                  type="url"
                  value={submissionUrl}
                  onChange={(e) => setSubmissionUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or https://github.com/..."
                  className={styles.submissionInput}
                />
                <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '6px', display: 'block' }}>
                  Provide a link to your solution (Google Drive folder, GitHub repo, deployed site, etc.)
                </small>
              </div>

              <div className={styles.formGroup}>
                <label>Description *</label>
                <textarea
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Describe your approach, methodology, challenges faced, and any important details about your solution..."
                  rows={6}
                  className={styles.submissionTextarea}
                  required
                />
              </div>

              <div className={styles.submissionGuidelines}>
                <h4>📋 Submission Guidelines:</h4>
                <ul>
                  <li>Provide a URL if your solution is hosted or in a repository</li>
                  <li>Clearly describe your solution approach and thought process</li>
                  <li>Ensure your submission meets all challenge requirements</li>
                  <li>Mentor will review and provide feedback</li>
                  <li>You will earn {selectedChallenge.xpReward} XP if approved</li>
                </ul>
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                className={styles.saveButton}
                onClick={handleSubmitChallenge}
                disabled={!submissionText.trim() || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Solution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}