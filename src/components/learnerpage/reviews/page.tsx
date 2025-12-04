'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import notify from '@/lib/toast';
import './ReviewsComponent.css';

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
  reviewer?: Reviewer;
  date?: string;
  subject?: string;
  location?: string;
  mentor?: any;
  learner?: any;
  feedback?: any;
  has_feedback?: boolean;
  mentorId?: string;
  scheduleId?: string;
}

interface FeedbackFromAPI {
  _id: string;
  learner: string;
  mentor: string;
  schedule: string;
  rating: number;
  comments: string;
  createdAt: string;
  updatedAt: string;
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
  schedForReview?: any[];
  userData?: any;
  data?: {
    schedForReview: any[];
  };
}

export default function ReviewsComponent({ schedForReview = [], userData, data }: ReviewsComponentProps) {
  const [records, setRecords] = useState<Feedback[]>([]);
  const [recordView, setRecordView] = useState<Feedback | null>(null);
  const [isFeedback, setIsFeedback] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tempRating, setTempRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingFeedbacks, setExistingFeedbacks] = useState<FeedbackFromAPI[]>([]);
  
  // Evaluation form state
  const [evaluation, setEvaluation] = useState({
    knowledge: 0,
    pacing: 0,
    communication: 0,
    engagement: 0,
    feedbackQuality: 0,
    professionalism: 0,
    resources: 0,
    accessibility: 0,
    learningOutcomes: 0,
    whatHelped: '',
    suggestions: ''
  });

  const baseURL = process.env.NEXT_PUBLIC_API_URL

  const fetchExistingFeedbacks = async () => {
    try {
      const response = await api.get('/api/learner/feedback-given');
      console.log('Existing feedbacks:', response.data);
      setExistingFeedbacks(response.data);
    } catch (error: any) {
      console.error('Error fetching existing feedbacks:', error);
      if (error.response?.status === 404) {
        setExistingFeedbacks([]);
      }
    }
  };

  const transformScheduleToFeedback = (schedule: any, existingFeedbacks: FeedbackFromAPI[]): Feedback => {
    const existingFeedback = existingFeedbacks.find(feedback => 
      feedback.schedule === schedule.id || feedback.schedule === schedule._id
    );

    return {
      id: schedule.id,
      rating: existingFeedback?.rating || schedule.feedback?.rating || 0,
      comment: existingFeedback?.comments || schedule.feedback?.feedback || "",
      date: schedule.date,
      subject: schedule.subject,
      location: schedule.location,
      has_feedback: !!existingFeedback || schedule.has_feedback || false,
      reviewer: {
        name: schedule.mentor?.user?.name || schedule.mentor?.name || "Unknown Mentor",
        course: schedule.mentor?.course || schedule.mentor?.program || "N/A",
        year: schedule.mentor?.year || schedule.mentor?.yearLevel || "N/A",
        image: schedule.mentor?.image || "https://placehold.co/600x400"
      },
      mentor: schedule.mentor,
      learner: schedule.learner,
      feedback: existingFeedback || schedule.feedback,
      mentorId: schedule.mentor?.id || schedule.mentor?._id || schedule.mentor,
      scheduleId: schedule.id
    };
  };

  const sampleData: Feedback[] = [
    {
      id: "1",
      rating: 5,
      comment: "Excellent mentor! Very patient and knowledgeable. The sessions were well-structured and helped me understand complex topics easily.",
      reviewer: {
        name: "Alice Johnson",
        course: "Computer Science (CS)",
        year: "2nd Year",
        image: "alice.jpg"
      }
    },
    {
      id: "2",
      rating: 4,
      comment: "Very helpful sessions with great explanations. The mentor was professional and provided valuable insights.",
      reviewer: {
        name: "Bob Smith",
        course: "Information Technology (IT)",
        year: "1st Year",
        image: "bob.jpg"
      }
    },
    {
      id: "3",
      rating: 0,
      comment: "",
      reviewer: {
        name: "Carol Davis",
        course: "Software Engineering (SE)",
        year: "3rd Year",
        image: "carol.jpg"
      }
    }
  ];

  useEffect(() => {
    fetchExistingFeedbacks();
  }, []);

  useEffect(() => {
    console.log("schedForReview received:", schedForReview);
    console.log("data.schedForReview received:", data?.schedForReview);
    console.log("existingFeedbacks:", existingFeedbacks);
    
    if (schedForReview && schedForReview.length > 0) {
      const transformedRecords = schedForReview.map(schedule => 
        transformScheduleToFeedback(schedule, existingFeedbacks)
      );
      setRecords(transformedRecords);
      console.log("Transformed records with feedback:", transformedRecords);
    } else if (data?.schedForReview && data.schedForReview.length > 0) {
      const transformedRecords = data.schedForReview.map(schedule => 
        transformScheduleToFeedback(schedule, existingFeedbacks)
      );
      setRecords(transformedRecords);
      console.log("Using data.schedForReview with feedback:", transformedRecords);
    } else {
      // setRecords(sampleData);
      console.log("Using sample data");
    }
  }, [schedForReview, data, existingFeedbacks]);

  const viewFeedback = (record: Feedback) => {
    setIsFeedback(true);
    setRecordView(record);
    setTempRating(record.rating || 0);
    setFeedbackText(record.comment || '');
    
    // Load existing evaluation data if feedback exists, otherwise reset
    if (record.feedback?.evaluation) {
      setEvaluation({
        knowledge: record.feedback.evaluation.knowledge || 0,
        pacing: record.feedback.evaluation.pacing || 0,
        communication: record.feedback.evaluation.communication || 0,
        engagement: record.feedback.evaluation.engagement || 0,
        feedbackQuality: record.feedback.evaluation.feedbackQuality || 0,
        professionalism: record.feedback.evaluation.professionalism || 0,
        resources: record.feedback.evaluation.resources || 0,
        accessibility: record.feedback.evaluation.accessibility || 0,
        learningOutcomes: record.feedback.evaluation.learningOutcomes || 0,
        whatHelped: record.feedback.evaluation.whatHelped || '',
        suggestions: record.feedback.evaluation.suggestions || ''
      });
    } else {
      // Reset evaluation form for new feedback
      setEvaluation({
        knowledge: 0,
        pacing: 0,
        communication: 0,
        engagement: 0,
        feedbackQuality: 0,
        professionalism: 0,
        resources: 0,
        accessibility: 0,
        learningOutcomes: 0,
        whatHelped: '',
        suggestions: ''
      });
    }
  };

  const closeFeedback = () => {
    setIsFeedback(false);
    setRecordView(null);
    setTempRating(0);
    setHoverRating(0);
    setFeedbackText('');
    
    // Reset evaluation
    setEvaluation({
      knowledge: 0,
      pacing: 0,
      communication: 0,
      engagement: 0,
      feedbackQuality: 0,
      professionalism: 0,
      resources: 0,
      accessibility: 0,
      learningOutcomes: 0,
      whatHelped: '',
      suggestions: ''
    });
  };

  const handleSetRating = (rating: number) => {
    setTempRating(rating);
  };

  // Check if all required fields are filled
  const isFormComplete = () => {
    // Check overall rating
    if (tempRating === 0) return false;

    // Check all evaluation categories
    const requiredCategories: (keyof typeof evaluation)[] = [
      'knowledge', 'pacing', 'communication', 'engagement', 
      'feedbackQuality', 'professionalism', 'resources', 
      'accessibility', 'learningOutcomes'
    ];
    
    for (const category of requiredCategories) {
      if (evaluation[category] === 0) return false;
    }

    // Check text fields
    if (!evaluation.whatHelped || evaluation.whatHelped.trim() === '') return false;
    if (!evaluation.suggestions || evaluation.suggestions.trim() === '') return false;

    return true;
  };

  const handleSubmitFeedback = async () => {
    if (tempRating === 0) {
      alert('Please provide an overall rating before submitting feedback.');
      return;
    }

    // Validate all evaluation categories are filled
    const requiredCategories = [
      'knowledge', 'pacing', 'communication', 'engagement', 
      'feedbackQuality', 'professionalism', 'resources', 
      'accessibility', 'learningOutcomes'
    ];
    
    for (const category of requiredCategories) {
      if (evaluation[category as keyof typeof evaluation] === 0) {
        alert(`Please rate all evaluation categories. Missing: ${category.replace(/([A-Z])/g, ' $1').trim()}`);
        return;
      }
    }

    // Validate text fields are filled
    if (!evaluation.whatHelped || evaluation.whatHelped.trim() === '') {
      alert('Please describe what helped you learn.');
      return;
    }

    if (!evaluation.suggestions || evaluation.suggestions.trim() === '') {
      alert('Please provide suggestions for improvement.');
      return;
    }

    if (!recordView) {
      alert('No session selected for feedback.');
      return;
    }

    const mentorId = recordView.mentorId;
    const scheduleId = recordView.scheduleId;
    
    if (!mentorId) {
      alert('Mentor ID not found. Cannot submit feedback.');
      return;
    }

    if (!scheduleId) {
      alert('Schedule ID not found. Cannot submit feedback.');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Submitting feedback:', {
        mentorId: mentorId,
        scheduleId: scheduleId,
        rating: tempRating,
        comments: feedbackText,
        evaluation: evaluation
      });

      // Use the axios instance which will automatically handle the token
      const response = await api.post(`/api/learner/feedback/${scheduleId}`, {
        schedule: scheduleId,
        rating: tempRating,
        comments: feedbackText,
        evaluation: evaluation
      });

      console.log('Feedback submitted successfully:', response.data);

      const updatedRecord = {
        ...recordView,
        rating: tempRating,
        comment: feedbackText,
        has_feedback: true
      };

      setRecords(prev => prev.map(r => r.id === recordView.id ? updatedRecord : r));
      
      await fetchExistingFeedbacks();
      
      closeFeedback();
      notify.success('Feedback submitted successfully!');

    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      if (error.response) {
        const statusCode = error.response.status;
        const errorMessage = error.response.data?.message || 'Failed to submit feedback';
        if (statusCode === 401) {
          notify.error('Session expired. Please log in again.');
          if (typeof window !== 'undefined') window.location.href = '/auth/login';
        } else if (statusCode === 403) {
          notify.error('You are not authorized to perform this action.');
        } else if (statusCode === 400) {
          notify.error(errorMessage);
        } else {
          notify.error(`Server error: ${errorMessage}`);
        }
      } else if (error.request) {
        notify.error('Network error. Please check your connection and try again.');
      } else {
        notify.error('Unexpected error. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
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
      (reviewer.year?.toLowerCase() || '').includes(searchTerm) ||
      (record.subject?.toLowerCase() || '').includes(searchTerm) ||
      (record.location?.toLowerCase() || '').includes(searchTerm)
    );
  });

  const StarRating = ({ rating }: { rating: number }) => {
    return (
      <div className="stars">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="star">
            {i < rating ? (
              <span className="filled">★</span>
            ) : (
              <span>☆</span>
            )}
          </span>
        ))}
      </div>
    );
  };

  const getReviewerName = (reviewer?: Reviewer) => {
    return reviewer?.name || 'Unknown Mentor';
  };

  const getReviewerCourse = (reviewer?: Reviewer) => {
    return reviewer?.course ? reviewer.course.match(/\(([^)]+)\)/)?.[1] || reviewer.course : 'N/A';
  };

  const getReviewerYear = (reviewer?: Reviewer) => {
    return reviewer?.year || 'N/A';
  };

  const hasFeedback = (record: Feedback) => {
    return record.rating > 0 && record.comment !== '';
  };

  return (
    <div className="reviews-container">
      <div className="reviews-header">
        <h2 className="reviews-title">
          <svg className="header-icon" viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
          </svg>
          Session Reviews
        </h2>

        <div className="search-container">
          <div className="search-wrapper">
            <svg className="search-icon" viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input
              type="text"
              placeholder="Search reviews..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="table-scroll-container">
        <table className="reviews-table">
          <thead>
            <tr>
              <th>MENTOR&apos;S NAME</th>
              <th>SPECIALIZATION</th>
              <th>DATE</th>
              <th>RATING</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record) => (
              <tr key={record.id}>
                <td>{getReviewerName(record.reviewer)}</td>
                <td>{record.subject || 'N/A'}</td>
                <td>{record.date || 'N/A'}</td>
                <td>
                  <StarRating rating={record.rating} />
                </td>
                <td>
                  <button 
                    onClick={() => viewFeedback(record)} 
                    className={`details-btn ${hasFeedback(record) ? 'sent' : ''}`}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    </svg>
                    <span>{hasFeedback(record) ? 'View Feedback' : 'Give Feedback'}</span>
                  </button>
                </td>
              </tr>
            ))}
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={5} className="no-records">
                  No review to display
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isFeedback && recordView && (
        <div className="modal-overlay" onClick={closeFeedback}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-content">
                <svg className="modal-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
                <h3>Feedback</h3>
              </div>
              <button className="close-btn" onClick={closeFeedback}   aria-label="Close feedback form">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="user-profile">
                <div className="profile-image">
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
                <div className="profile-info">
                  <h4>{getReviewerName(recordView.reviewer)}</h4>
                  <div className="profile-details">
                    <div className="detail-item">
                      <span className="detail-label">Specialization:</span>
                      <span className="detail-value">{recordView.subject || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Date:</span>
                      <span className="detail-value">{recordView.date || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Location:</span>
                      <span className="detail-value">{recordView.location || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {!hasFeedback(recordView) ? (
                <div className="feedback-section">
                  {/* Overall Rating */}
                  <div className="feedback-card">
                    <h5>
                      <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: '0.5rem' }}>
                        <path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                      </svg>
                      Overall Session Rating
                    </h5>
                    <div className="rating-stars">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <span
                          key={i}
                          onClick={() => handleSetRating(i)}
                          onMouseEnter={() => setHoverRating(i)}
                          onMouseLeave={() => setHoverRating(0)}
                          className={`star ${i <= (hoverRating || tempRating) ? 'filled' : ''}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Evaluation Categories */}
                  <div className="feedback-card">
                    <h5 style={{ marginBottom: '1rem' }}>Detailed Evaluation</h5>
                    <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1.5rem' }}>
                      Please rate each aspect of your mentoring session on a scale of 1-5 stars.
                    </p>
                    
                    <div style={{ display: 'grid', gap: '1.25rem' }}>
                      {[
                        { 
                          key: 'knowledge', 
                          label: 'Subject Matter Expertise', 
                          description: 'How well did the mentor demonstrate knowledge and explain concepts clearly?' 
                        },
                        { 
                          key: 'pacing', 
                          label: 'Session Pacing', 
                          description: 'Was the session pace appropriate - not too fast or too slow?' 
                        },
                        { 
                          key: 'communication', 
                          label: 'Communication & Explanation', 
                          description: 'How effectively did the mentor communicate and explain difficult topics?' 
                        },
                        { 
                          key: 'engagement', 
                          label: 'Engagement & Interaction', 
                          description: 'Did the mentor keep you engaged and encourage active participation?' 
                        },
                        { 
                          key: 'feedbackQuality', 
                          label: 'Quality of Feedback', 
                          description: 'How helpful and constructive was the feedback you received?' 
                        },
                        { 
                          key: 'professionalism', 
                          label: 'Professionalism & Respect', 
                          description: 'Was the mentor professional, respectful, and punctual?' 
                        },
                        { 
                          key: 'resources', 
                          label: 'Learning Materials & Resources', 
                          description: 'How effective were the materials, examples, and resources used?' 
                        },
                        { 
                          key: 'accessibility', 
                          label: 'Approachability & Support', 
                          description: 'Did you feel comfortable asking questions and seeking help?' 
                        },
                        { 
                          key: 'learningOutcomes', 
                          label: 'Achievement of Learning Goals', 
                          description: 'Did you achieve your learning objectives and gain new understanding?' 
                        }
                      ].map(({ key, label, description }) => (
                        <div key={key} style={{ 
                          padding: '1rem', 
                          borderRadius: '8px', 
                          backgroundColor: '#f8f9fa',
                          border: '1px solid #e9ecef'
                        }}>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '0.375rem', 
                            fontSize: '0.9375rem', 
                            fontWeight: '600',
                            color: '#2c3e50'
                          }}>
                            {label}
                          </label>
                          <p style={{ 
                            fontSize: '0.8125rem', 
                            color: '#6c757d', 
                            marginBottom: '0.625rem',
                            lineHeight: '1.4'
                          }}>
                            {description}
                          </p>
                          <div className="rating-stars" style={{ fontSize: '1.5rem' }}>
                            {[1, 2, 3, 4, 5].map((i) => (
                              <span
                                key={i}
                                onClick={() => setEvaluation(prev => ({ ...prev, [key]: i }))}
                                className={`star ${i <= (evaluation[key as keyof typeof evaluation] as number) ? 'filled' : ''}`}
                                style={{ 
                                  cursor: 'pointer', 
                                  marginRight: '0.375rem',
                                  transition: 'transform 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                              >
                                ★
                              </span>
                            ))}
                            <span style={{ 
                              marginLeft: '0.5rem', 
                              fontSize: '0.875rem', 
                              color: '#495057',
                              fontWeight: '500'
                            }}>
                              {(evaluation[key as keyof typeof evaluation] as number) > 0 
                                ? `${evaluation[key as keyof typeof evaluation]}/5` 
                                : 'Not rated'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Open-ended Questions */}
                  <div className="feedback-card">
                    <h5 style={{ marginBottom: '0.5rem' }}>Written Feedback</h5>
                    <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1.5rem' }}>
                      Share specific examples and insights to help improve future sessions.
                    </p>
                    
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '0.625rem', 
                        fontSize: '0.9375rem', 
                        fontWeight: '600',
                        color: '#2c3e50'
                      }}>
                        What Helped You Learn Most?
                      </label>
                      <p style={{ 
                        fontSize: '0.8125rem', 
                        color: '#6c757d', 
                        marginBottom: '0.625rem',
                        lineHeight: '1.4'
                      }}>
                        Describe specific teaching methods, explanations, examples, or resources that were particularly effective. 
                        What made the difficult concepts click for you?
                      </p>
                      <textarea
                        value={evaluation.whatHelped}
                        onChange={(e) => setEvaluation(prev => ({ ...prev, whatHelped: e.target.value }))}
                        placeholder="Example: The mentor used real-world analogies to explain the algorithm, which made it much easier to understand. The step-by-step breakdown on the whiteboard was particularly helpful..."
                        className="feedback-input"
                        rows={4}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          borderRadius: '8px', 
                          border: '1px solid #dee2e6',
                          fontSize: '0.9375rem',
                          lineHeight: '1.5'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '0.5rem' }}>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '0.625rem', 
                        fontSize: '0.9375rem', 
                        fontWeight: '600',
                        color: '#2c3e50'
                      }}>
                        Suggestions for Future Improvement
                      </label>
                      <p style={{ 
                        fontSize: '0.8125rem', 
                        color: '#6c757d', 
                        marginBottom: '0.625rem',
                        lineHeight: '1.4'
                      }}>
                        What could make future sessions even better? Be constructive - suggest specific areas for growth, 
                        additional topics to cover, or different teaching approaches that might help.
                      </p>
                      <textarea
                        value={evaluation.suggestions}
                        onChange={(e) => setEvaluation(prev => ({ ...prev, suggestions: e.target.value }))}
                        placeholder="Example: It would be helpful to have more practice problems during the session. Perhaps we could spend a bit more time on error handling. Overall, maybe start with a quick review of previous topics..."
                        className="feedback-input"
                        rows={4}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          borderRadius: '8px', 
                          border: '1px solid #dee2e6',
                          fontSize: '0.9375rem',
                          lineHeight: '1.5'
                        }}
                      />
                    </div>
                  </div>

                  {/* General Comments */}
                  <div className="feedback-card">
                    <h5>
                      <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: '0.5rem' }}>
                        <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                      </svg>
                      General Comments
                    </h5>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Any other comments or feedback you'd like to share..."
                      className="feedback-input"
                      rows={4}
                    />
                  </div>
                </div>
              ) : (
                <div className="feedback-section">
                  {/* Overall Rating - View Mode */}
                  <div className="feedback-card">
                    <h5>
                      <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: '0.5rem' }}>
                        <path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                      </svg>
                      Overall Session Rating
                    </h5>
                    <div className="rating-stars">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <span
                          key={i}
                          className={`star ${i <= tempRating ? 'filled' : ''} disabled`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <div className="current-rating">
                      Your rating: {recordView.rating} stars
                    </div>
                  </div>

                  {/* Evaluation Categories - View Mode */}
                  <div className="feedback-card">
                    <h5 style={{ marginBottom: '1rem' }}>Your Detailed Evaluation</h5>
                    
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      {[
                        { 
                          key: 'knowledge', 
                          label: 'Subject Matter Expertise', 
                          description: 'Knowledge and explanation clarity' 
                        },
                        { 
                          key: 'pacing', 
                          label: 'Session Pacing', 
                          description: 'Appropriateness of session speed' 
                        },
                        { 
                          key: 'communication', 
                          label: 'Communication & Explanation', 
                          description: 'Effectiveness in teaching difficult topics' 
                        },
                        { 
                          key: 'engagement', 
                          label: 'Engagement & Interaction', 
                          description: 'Student involvement and participation' 
                        },
                        { 
                          key: 'feedbackQuality', 
                          label: 'Quality of Feedback', 
                          description: 'Helpfulness and constructiveness' 
                        },
                        { 
                          key: 'professionalism', 
                          label: 'Professionalism & Respect', 
                          description: 'Conduct and punctuality' 
                        },
                        { 
                          key: 'resources', 
                          label: 'Learning Materials & Resources', 
                          description: 'Effectiveness of materials used' 
                        },
                        { 
                          key: 'accessibility', 
                          label: 'Approachability & Support', 
                          description: 'Comfort in asking questions' 
                        },
                        { 
                          key: 'learningOutcomes', 
                          label: 'Achievement of Learning Goals', 
                          description: 'Success in meeting objectives' 
                        }
                      ].map(({ key, label, description }) => (
                        <div key={key} style={{ 
                          padding: '0.875rem', 
                          borderRadius: '8px', 
                          backgroundColor: '#f8f9fa',
                          border: '1px solid #e9ecef'
                        }}>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '0.25rem', 
                            fontSize: '0.9375rem', 
                            fontWeight: '600',
                            color: '#2c3e50'
                          }}>
                            {label}
                          </label>
                          <p style={{ 
                            fontSize: '0.8125rem', 
                            color: '#6c757d', 
                            marginBottom: '0.5rem',
                            lineHeight: '1.4'
                          }}>
                            {description}
                          </p>
                          <div className="rating-stars" style={{ fontSize: '1.25rem' }}>
                            {[1, 2, 3, 4, 5].map((i) => (
                              <span
                                key={i}
                                className={`star ${i <= (evaluation[key as keyof typeof evaluation] as number) ? 'filled' : ''} disabled`}
                                style={{ marginRight: '0.25rem' }}
                              >
                                ★
                              </span>
                            ))}
                            <span style={{ 
                              marginLeft: '0.5rem', 
                              fontSize: '0.875rem', 
                              color: '#495057',
                              fontWeight: '600'
                            }}>
                              {(evaluation[key as keyof typeof evaluation] as number) || 0}/5
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Written Feedback - View Mode */}
                  <div className="feedback-card">
                    <h5 style={{ marginBottom: '1rem' }}>Your Written Feedback</h5>
                    
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '0.5rem', 
                        fontSize: '0.9375rem', 
                        fontWeight: '600',
                        color: '#2c3e50'
                      }}>
                        What Helped You Learn Most
                      </label>
                      <div style={{ 
                        padding: '0.75rem', 
                        borderRadius: '8px', 
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        fontSize: '0.9375rem',
                        lineHeight: '1.6',
                        color: '#495057',
                        minHeight: '4rem',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {evaluation.whatHelped || 'No response provided'}
                      </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '0.5rem', 
                        fontSize: '0.9375rem', 
                        fontWeight: '600',
                        color: '#2c3e50'
                      }}>
                        Suggestions for Future Improvement
                      </label>
                      <div style={{ 
                        padding: '0.75rem', 
                        borderRadius: '8px', 
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        fontSize: '0.9375rem',
                        lineHeight: '1.6',
                        color: '#495057',
                        minHeight: '4rem',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {evaluation.suggestions || 'No response provided'}
                      </div>
                    </div>
                  </div>

                  {/* General Comments - View Mode */}
                  <div className="feedback-card">
                    <h5>
                      <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: '0.5rem' }}>
                        <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                      </svg>
                      General Comments
                    </h5>
                    <div style={{ 
                      padding: '0.75rem', 
                      borderRadius: '8px', 
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #dee2e6',
                      fontSize: '0.9375rem',
                      lineHeight: '1.6',
                      color: '#495057',
                      minHeight: '4rem',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {feedbackText || 'No additional comments'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="modal-btn back" onClick={closeFeedback}>
                <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: '0.5rem' }}>
                  <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                </svg>
                Back to Reviews
              </button>
              {!hasFeedback(recordView) && (
                <button
                  onClick={handleSubmitFeedback}
                  className="modal-btn submit"
                  disabled={!isFormComplete() || isSubmitting}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: '0.5rem' }}>
                    <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}