'use client';

import { useState, useEffect } from 'react';
import styles from './reviews.module.css';
import api from '@/lib/axios'; // Make sure you have your axios instance here

interface Reviewer {
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

  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Fetch feedbacks and reviewers from API
  const fetchReviewer = async () => {
    try {
      const token = getCookie('MindMateToken');
      // Fetch feedbacks
      const feedbackRes = await api.get('/api/mentor/feedbacks', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        withCredentials: true,
      });

      const feedbacksData = feedbackRes.data || [];

      // For each feedback, fetch the learner (reviewer) details using the learner field
      const reviewerPromises = feedbacksData.map((fb: any) =>
        api.get(`/api/mentor/learners/${fb.learner}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          withCredentials: true,
        }).then(res => ({
          id: fb.learner,
          name: res.data.name,
          course: res.data.program,
          year: res.data.yearLevel,
          image: res.data.image,
        }))
        .catch(() => ({
          id: fb.learner,
          name: 'Unknown',
          course: 'N/A',
          year: 'N/A',
          image: '',
        }))
      );

      const reviewersData = await Promise.all(reviewerPromises);

      // Map reviewer data to feedbacks
      const feedbacksWithReviewer = feedbacksData.map((fb: any) => {
        const reviewer = reviewersData.find((r: any) => r.id === fb.learner);
        return {
          id: fb._id || fb.id,
          rating: fb.rating,
          comment: fb.comments || fb.comment,
          reviewerId: fb.learner,
          reviewer: reviewer
            ? {
                name: reviewer.name,
                course: reviewer.course,
                year: reviewer.year,
                image: reviewer.image,
              }
            : undefined,
        };
      });

      setRecords(feedbacksWithReviewer);
    } catch (error) {
      console.error('Error fetching feedbacks or reviewers:', error);
      setRecords([]);
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
          Session Records
        </h2>

        <div className={styles.reviewsSearchContainer}>
          <div className={styles.reviewsSearchWrapper}>
            <svg className={styles.reviewsSearchIcon} viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input
              type="text"
              placeholder="Search records..."
              className={styles.reviewsSearchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className={styles.reviewsTableScrollContainer}>
        <table className={styles.reviewsDataTable}>
          <thead>
            <tr>
              <th>LEARNER&apos;S NAME</th>
              <th>COURSE</th>
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
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.reviewsNoUsers}>
                  No records to display
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
                      <span className={styles.reviewsLabel}>Course:</span>
                      <span className={styles.reviewsValue}>{getReviewerCourse(recordView.reviewer)}</span>
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
                  <h5>Feedback</h5>
                  <div className={styles.reviewsFeedbackContent}>
                    <p>{recordView.comment || "No feedback provided"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}