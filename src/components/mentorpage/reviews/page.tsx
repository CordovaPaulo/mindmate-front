'use client';

import { useState, useEffect } from 'react';
import styles from './reviews.module.css';
import api from '@/lib/axios'; // Make sure you have your axios instance here

interface Reviewer {
  _id?: string;
  name: string;
  course: string;
  year: string;
  image?: string;
}

interface Feedback {
  id: string;
  rating: number;
  comment: string;
  reviewerId: string;
  reviewer?: Reviewer;
  specialization?: string;
  sessionDate?: string | null;
  evaluation?: {
    knowledge?: number;
    pacing?: number;
    communication?: number;
    engagement?: number;
    feedbackQuality?: number;
    professionalism?: number;
    resources?: number;
    accessibility?: number;
    learningOutcomes?: number;
    whatHelped?: string;
    suggestions?: string;
    categoryAverage?: number;
  };
}

interface ReviewsComponentProps {
  feedbacks?: Feedback[];
}

// Helper to get cookie value
function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export default function ReviewsComponent({ feedbacks = [] }: ReviewsComponentProps) {
  const [records, setRecords] = useState<Feedback[]>([]);
  const [recordView, setRecordView] = useState<Feedback | null>(null);
  const [isFeedback, setIsFeedback] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Fetch feedbacks and reviewers from API
  const fetchReviewer = async () => {
    setIsLoading(true);
    try {
      const token = getCookie('MindMateToken');
      // Fetch feedbacks with populated learner data
      const feedbackRes = await api.get('/api/mentor/feedbacks', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        withCredentials: true,
      });

      const feedbacksData = feedbackRes.data || [];
      console.log('Fetched feedbacks with learner info:', feedbacksData);

      // Map feedback data - learner info is already populated by backend
      const feedbacksWithReviewer = feedbacksData.map((fb: any) => {
        console.log('Processing feedback:', fb);
        
        return {
          id: fb._id || fb.id,
          rating: fb.rating,
          comment: fb.comments || fb.comment,
          reviewerId: fb.learner?._id || fb.learner,
          evaluation: fb.evaluation || null,
          reviewer: {
            _id: fb.learner?._id || fb.learner,
            name: fb.learnerName || fb.learner?.name || 'Unknown',
            course: fb.learnerProgram || fb.learner?.program || 'N/A',
            year: fb.learnerYearLevel || fb.learner?.yearLevel || 'N/A',
            image: fb.learnerImage || fb.learner?.image || '',
          },
          specialization: fb.specialization || 'N/A',
          sessionDate: fb.sessionDate || null
        };
      });

      console.log('Mapped feedbacks:', feedbacksWithReviewer);
      setRecords(feedbacksWithReviewer);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewer();
  }, []);

  const viewFeedback = (record: Feedback) => {
    setIsFeedback(true);
    setRecordView(record);
  };

  const closeFeedback = () => {
    setIsFeedback(false);
    setRecordView(null);
  };

  const filteredRecords = records.filter(record => {
    if (!record.reviewer) {
      return false;
    }
    const reviewer = record.reviewer;
    const searchTerm = searchQuery.toLowerCase();
    return (
      (reviewer.name?.toLowerCase() || '').includes(searchTerm) ||
      (reviewer.course?.toLowerCase() || '').includes(searchTerm) ||
      (reviewer.year?.toLowerCase() || '').includes(searchTerm)
    );
  });

  const StarRating = ({ rating }: { rating: number }) => (
    <div className={styles.reviewsStars}>
      {[...Array(5)].map((_, i) => (
        <span key={i} className={styles.reviewsStar}>
          {i < rating ? (
            <span className={styles.reviewsFilled}>★</span>
          ) : (
            <span>☆</span>
          )}
        </span>
      ))}
    </div>
  );

  const getReviewerName = (reviewer?: Reviewer) => reviewer?.name || 'Unknown Learner';
  const getReviewerCourse = (reviewer?: Reviewer) =>
    reviewer?.course ? reviewer.course.match(/\(([^)]+)\)/)?.[1] || reviewer.course : 'N/A';
  const getReviewerYear = (reviewer?: Reviewer) => reviewer?.year || 'N/A';

  return (
    <div className={styles.reviewsTableContainer}>
      <div className={styles.reviewsTableHeader}>
        <h2 className={styles.reviewsTableTitle}>
          <svg className={styles.reviewsHeaderIcon} viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
          </svg>
          Session Reviews
        </h2>

        <div className={styles.reviewsSearchContainer}>
          <div className={styles.reviewsSearchWrapper}>
            <svg className={styles.reviewsSearchIcon} viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input
              type="text"
              placeholder="Search reviews..."
              className={styles.reviewsSearchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className={styles.reviewsTableScrollContainer}>
        {isLoading ? (
          <div className={styles.reviewsLoadingContainer}>
            <div className={styles.reviewsLoader}></div>
            <p className={styles.reviewsLoadingText}>Loading feedbacks...</p>
          </div>
        ) : (
        <table className={styles.reviewsDataTable}>
          <thead>
            <tr>
              <th>LEARNER&apos;S NAME</th>
              <th>PROGRAM</th>
              <th>YEAR</th>
              <th>RATING</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record) => (
              <tr key={record.id}>
                <td>{getReviewerName(record.reviewer)}</td>
                <td>{getReviewerCourse(record.reviewer)}</td>
                <td>{getReviewerYear(record.reviewer)}</td>
                <td>
                  <StarRating rating={record.rating} />
                </td>
                <td>
                  <button 
                    onClick={() => viewFeedback(record)} 
                    className={styles.reviewsDetailsBtn}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    </svg>
                    <span>View Feedback</span>
                  </button>
                </td>
              </tr>
            ))}
            {filteredRecords.length === 0 && !isLoading && (
              <tr>
                <td colSpan={5} className={styles.reviewsNoUsers}>
                  No reviews to display
                </td>
              </tr>
            )}
          </tbody>
        </table>
        )}
      </div>

      {isFeedback && recordView && (
        <div className={styles.reviewsModalOverlay} onClick={closeFeedback}>
          <div className={styles.reviewsModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.reviewsModalHeader}>
              <div className={styles.reviewsHeaderContent}>
                <svg className={styles.reviewsModalIcon} viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
                <h3>Feedback Details</h3>
              </div>
              <button className={styles.reviewsCloseBtn} onClick={closeFeedback}>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <div className={styles.reviewsModalBody}>
              <div className={styles.reviewsUserProfile}>
                <div className={styles.reviewsProfileImage}>
                  <img
                    src={recordView.reviewer?.image 
                      ? `${baseURL}/api/image/${recordView.reviewer.image}`
                      : `https://placehold.co/120x120/3b9aa9/ffffff?text=${getReviewerName(recordView.reviewer).charAt(0)}`
                    }
                    alt={getReviewerName(recordView.reviewer)}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://placehold.co/120x120/3b9aa9/ffffff?text=${getReviewerName(recordView.reviewer).charAt(0)}`;
                    }}
                  />
                </div>
                <div className={styles.reviewsProfileInfo}>
                  <h4>{getReviewerName(recordView.reviewer)}</h4>
                  <div className={styles.reviewsProfileDetails}>
                    <div className={styles.reviewsDetailItem}>
                      <span className={styles.reviewsLabel}>Specialization:</span>
                      <span className={styles.reviewsValue}>{recordView.specialization || getReviewerCourse(recordView.reviewer)}</span>
                    </div>
                    <div className={styles.reviewsDetailItem}>
                      <span className={styles.reviewsLabel}>Year Level:</span>
                      <span className={styles.reviewsValue}>{getReviewerYear(recordView.reviewer)}</span>
                    </div>
                    <div className={styles.reviewsDetailItem}>
                      <span className={styles.reviewsLabel}>Rating:</span>
                      <span className={styles.reviewsValue}>
                        <StarRating rating={recordView.rating} />
                        <span className={styles.reviewsRatingText}>({recordView.rating}/5)</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.reviewsFeedbackSection}>
                <div className={styles.reviewsFeedbackCard}>
                  <h5>Overall Feedback</h5>
                  <div className={styles.reviewsFeedbackContent}>
                    <p>{recordView.comment || "No feedback provided"}</p>
                  </div>
                </div>

                {/* Display evaluation details if available */}
                {recordView.evaluation && (
                  <>
                    <div className={styles.reviewsFeedbackCard} style={{ marginTop: '1.5rem' }}>
                      <h5>Detailed Evaluation</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                        {[
                          { key: 'knowledge', label: 'Knowledge & Clarity' },
                          { key: 'pacing', label: 'Session Pacing' },
                          { key: 'communication', label: 'Communication Skills' },
                          { key: 'engagement', label: 'Engagement & Motivation' },
                          { key: 'feedbackQuality', label: 'Feedback Quality' },
                          { key: 'professionalism', label: 'Professionalism' },
                          { key: 'resources', label: 'Use of Resources' },
                          { key: 'accessibility', label: 'Accessibility & Inclusivity' },
                          { key: 'learningOutcomes', label: 'Learning Outcomes' }
                        ].map(({ key, label }) => {
                          const value = recordView.evaluation?.[key as keyof typeof recordView.evaluation];
                          if (typeof value !== 'number') return null;
                          return (
                            <div key={key} style={{ padding: '0.75rem', background: 'white', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>{label}</div>
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                {[1, 2, 3, 4, 5].map((i) => (
                                  <span key={i} style={{ color: i <= value ? '#ffd700' : '#e0e0e0', fontSize: '1.2rem' }}>★</span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {(recordView.evaluation.whatHelped || recordView.evaluation.suggestions) && (
                      <div className={styles.reviewsFeedbackCard} style={{ marginTop: '1.5rem' }}>
                        <h5>Additional Feedback</h5>
                        {recordView.evaluation.whatHelped && (
                          <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0b3e8a', marginBottom: '0.5rem' }}>What helped you learn:</div>
                            <div style={{ padding: '1rem', background: 'white', borderRadius: '8px', borderLeft: '4px solid #4CAF50', fontSize: '0.9rem', color: '#495057' }}>
                              {recordView.evaluation.whatHelped}
                            </div>
                          </div>
                        )}
                        {recordView.evaluation.suggestions && (
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0b3e8a', marginBottom: '0.5rem' }}>Suggestions for improvement:</div>
                            <div style={{ padding: '1rem', background: 'white', borderRadius: '8px', borderLeft: '4px solid #FF9800', fontSize: '0.9rem', color: '#495057' }}>
                              {recordView.evaluation.suggestions}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}