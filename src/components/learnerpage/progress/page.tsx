'use client';

import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import styles from './progress.module.css';

interface RoadmapTopic {
  name: string;
  completed: boolean;
  completedAt?: string;
  source?: 'manual' | 'challenge' | 'schedule';
}

interface RoadmapStage {
  stage: string;
  topics: RoadmapTopic[];
  isCompleted: boolean;
  completedAt?: string;
  progress: {
    completed: number;
    total: number;
  };
}

interface RoadmapProgress {
  specialization: string;
  course: string;
  stages: RoadmapStage[];
  completion: number;
  lastUpdated?: string;
}

interface SkillProgress {
  skill: string;
  score: number;
  level: number;
  lastUpdated?: string;
}

interface ProgressComponentProps {
  userData: any;
}

const Icons = {
  Target: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
    </svg>
  ),
  Star: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Refresh: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M23 4V10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M1 20V14H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3.51 9C4.01717 7.56678 4.87913 6.2854 6.01547 5.27542C7.1518 4.26543 8.52547 3.55976 10.0083 3.22426C11.4911 2.88875 13.0348 2.93434 14.4952 3.35677C15.9556 3.77921 17.2853 4.56471 18.36 5.64L23 10M1 14L5.64 18.36C6.71475 19.4353 8.04437 20.2208 9.50481 20.6432C10.9652 21.0657 12.5089 21.1113 13.9917 20.7757C15.4745 20.4402 16.8482 19.7346 17.9845 18.7246C19.1209 17.7146 19.9828 16.4332 20.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  AlertCircle: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
      <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
};

export default function ProgressComponent({ userData }: ProgressComponentProps) {
  const [activeTab, setActiveTab] = useState<'roadmap' | 'skills'>('roadmap');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('');
  const [roadmapData, setRoadmapData] = useState<RoadmapProgress | null>(null);
  const [skillmapData, setSkillmapData] = useState<SkillProgress[]>([]);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingTopic, setPendingTopic] = useState<{ stage: string; topic: string } | null>(null);

  useEffect(() => {
    if (userData?.specialization && userData.specialization.length > 0) {
      setSelectedSpecialization(userData.specialization[0]);
    }
  }, [userData]);

  useEffect(() => {
    if (selectedSpecialization) {
      fetchProgressData();
    }
  }, [selectedSpecialization, activeTab]);

  const fetchProgressData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'roadmap') {
        const response = await axios.get(`/api/learner/guide/maps/roadmap/${selectedSpecialization}`);
        setRoadmapData(response.data);
        
        // Auto-expand incomplete stages
        if (response.data?.stages) {
          const incompleteStages = response.data.stages
            .filter((stage: RoadmapStage) => 
              !stage.isCompleted
            )
            .map((stage: RoadmapStage) => stage.stage);
          setExpandedStages(new Set(incompleteStages));
        }
      } else {
        const response = await axios.get(`/api/learner/guide/maps/skillmap/${selectedSpecialization}`);
        setSkillmapData(response.data.skills || []);
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicToggle = (stage: string, topic: string) => {
    setPendingTopic({ stage, topic });
    setShowConfirmModal(true);
  };

  const confirmTopicComplete = async () => {
    if (!pendingTopic) return;

    try {
      await axios.post(`/api/learner/guide/maps/roadmap/complete-topic`, {
        specialization: selectedSpecialization,
        stage: pendingTopic.stage,
        topic: pendingTopic.topic,
        source: 'manual'
      });

      await fetchProgressData();
      setShowConfirmModal(false);
      setPendingTopic(null);
    } catch (error) {
      console.error('Error completing topic:', error);
      alert('Failed to mark topic as complete. Please try again.');
    }
  };

  const cancelTopicComplete = () => {
    setShowConfirmModal(false);
    setPendingTopic(null);
  };

  const toggleStage = (stageId: string) => {
    setExpandedStages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stageId)) {
        newSet.delete(stageId);
      } else {
        newSet.add(stageId);
      }
      return newSet;
    });
  };

  const getStarRating = (level: number) => {
    return Math.min(level, 5);
  };

  return (
    <div className={styles.progressContainer}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Icons.Target />
          <h1>Your Learning Progress</h1>
        </div>
        
        {userData?.specialization && userData.specialization.length > 1 && (
          <div className={styles.specializationSelector}>
            <select
              value={selectedSpecialization}
              onChange={(e) => setSelectedSpecialization(e.target.value)}
              className={styles.specializationSelect}
            >
              {userData.specialization.map((spec: string) => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'roadmap' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('roadmap')}
        >
          🗺️ Roadmap
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'skills' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          ⚡ Skills
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <Icons.Refresh />
          <p>Loading progress...</p>
        </div>
      ) : (
        <>
          {activeTab === 'roadmap' && roadmapData && (
            <div className={styles.roadmapContent}>
              <div className={styles.completionOverview}>
                <div className={styles.statCard}>
                  <div className={styles.circleProgress}>
                    <svg className={styles.progressRing} width="120" height="120">
                      <circle
                        className={styles.progressRingCircle}
                        stroke="#e5e7eb"
                        strokeWidth="8"
                        fill="transparent"
                        r="52"
                        cx="60"
                        cy="60"
                      />
                      <circle
                        className={styles.progressRingCircle}
                        stroke="#3b82f6"
                        strokeWidth="8"
                        fill="transparent"
                        r="52"
                        cx="60"
                        cy="60"
                        strokeDasharray={`${2 * Math.PI * 52}`}
                        strokeDashoffset={`${2 * Math.PI * 52 * (1 - roadmapData.completion / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className={styles.progressText}>
                      <span className={styles.progressPercentage}>{roadmapData.completion}%</span>
                      <span className={styles.progressLabel}>Complete</span>
                    </div>
                  </div>
                  <div className={styles.statFooter}>
                    <span className={styles.statSubtitle}>Overall Progress</span>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statContent}>
                    <div className={styles.statMain}>
                      <div className={styles.statValue}>{roadmapData.stages.reduce((acc, s) => acc + s.progress.completed, 0)}</div>
                      <div className={styles.statTitle}>Completed Topics</div>
                    </div>
                    <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                      <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  </div>
                  <div className={styles.statFooter}>
                    <span className={styles.statSubtitle}>Topics finished</span>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statContent}>
                    <div className={styles.statMain}>
                      <div className={styles.statValue}>{roadmapData.stages.reduce((acc, s) => acc + s.progress.total, 0)}</div>
                      <div className={styles.statTitle}>Total Topics</div>
                    </div>
                    <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                      <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="9" y1="3" x2="9" y2="21"></line>
                        <line x1="15" y1="3" x2="15" y2="21"></line>
                      </svg>
                    </div>
                  </div>
                  <div className={styles.statFooter}>
                    <span className={styles.statSubtitle}>All topics available</span>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statContent}>
                    <div className={styles.statMain}>
                      <div className={styles.statValue}>{roadmapData.stages.length}</div>
                      <div className={styles.statTitle}>Learning Stages</div>
                    </div>
                    <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
                      <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <polyline points="5 12 12 5 19 12"></polyline>
                      </svg>
                    </div>
                  </div>
                  <div className={styles.statFooter}>
                    <span className={styles.statSubtitle}>Stages in roadmap</span>
                  </div>
                </div>
              </div>

              <div className={styles.stagesContainer}>
                {roadmapData.stages.map((stage, index) => {
                  const stageCompletion = stage.progress.total > 0 
                    ? (stage.progress.completed / stage.progress.total) * 100 
                    : 0;

                  return (
                    <div key={stage.stage} className={styles.stageCard}>
                      <div 
                        className={styles.stageHeader}
                        onClick={() => toggleStage(stage.stage)}
                      >
                        <div className={styles.stageInfo}>
                          <span className={styles.stageNumber}>Stage {index + 1}</span>
                          <h3>{stage.stage}</h3>
                        </div>
                        <div className={styles.stageProgress}>
                          <div className={styles.stageCompletion}>
                            {stage.progress.completed}/{stage.progress.total} Complete
                          </div>
                          <div className={styles.stageProgressBar}>
                            <div 
                              className={styles.stageProgressFill}
                              style={{ width: `${stageCompletion}%` }}
                            ></div>
                          </div>
                          <span className={expandedStages.has(stage.stage) ? styles.chevronUp : styles.chevronDown}>
                            <Icons.ChevronDown />
                          </span>
                        </div>
                      </div>

                      {expandedStages.has(stage.stage) && (
                        <div className={styles.topicsList}>
                          {stage.topics.map(topic => (
                            <div key={topic.name} className={styles.topicItem}>
                              <label className={styles.topicLabel}>
                                <input
                                  type="checkbox"
                                  checked={topic.completed}
                                  onChange={() => !topic.completed && handleTopicToggle(stage.stage, topic.name)}
                                  className={styles.topicCheckbox}
                                  disabled={topic.completed}
                                />
                                <div className={styles.topicContent}>
                                  <span className={topic.completed ? styles.topicTitleCompleted : styles.topicTitle}>
                                    {topic.name}
                                  </span>
                                  {topic.completed && topic.completedAt && (
                                    <span className={styles.completedInfo}>
                                      ✓ Completed {new Date(topic.completedAt).toLocaleDateString()}
                                      {topic.source && ` via ${topic.source}`}
                                    </span>
                                  )}
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'skills' && (
            <div className={styles.skillsContent}>
              {skillmapData.length > 0 ? (
                <div className={styles.skillsGrid}>
                  {skillmapData.map(skill => {
                    const stars = getStarRating(skill.level);
                    // Calculate XP thresholds (BASE_XP=1000, MULTIPLIER=2)
                    const currentLevelXP = skill.level > 1 
                      ? 1000 * (Math.pow(2, skill.level - 1) - 1) 
                      : 0;
                    const nextLevelXP = 1000 * (Math.pow(2, skill.level) - 1);
                    const xpInCurrentLevel = skill.score - currentLevelXP;
                    const xpNeededForNext = nextLevelXP - currentLevelXP;
                    const xpProgress = xpNeededForNext > 0 
                      ? (xpInCurrentLevel / xpNeededForNext) * 100 
                      : 0;

                    return (
                      <div key={skill.skill} className={styles.skillCard}>
                        <div className={styles.skillHeader}>
                          <h3>{skill.skill}</h3>
                          <div className={styles.skillLevel}>
                            Level {skill.level}
                          </div>
                        </div>

                        <div className={styles.starRating}>
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={i < stars ? styles.starFilled : styles.starEmpty}
                            >
                              <Icons.Star />
                            </span>
                          ))}
                        </div>

                        <div className={styles.xpBarContainer}>
                          <div className={styles.xpInfo}>
                            <span>{skill.score} XP</span>
                            <span>{nextLevelXP} XP</span>
                          </div>
                          <div className={styles.xpBar}>
                            <div
                              className={styles.xpBarFill}
                              style={{ width: `${Math.min(xpProgress, 100)}%` }}
                            ></div>
                          </div>
                          <div className={styles.xpLabel}>
                            {skill.level < 5 
                              ? `${Math.round(xpProgress)}% to Level ${skill.level + 1}` 
                              : 'Max Level Reached'}
                          </div>
                        </div>

                        {skill.lastUpdated && (
                          <div className={styles.levelDescriptions}>
                            <p className={styles.currentLevelDesc}>
                              Last updated: {new Date(skill.lastUpdated).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.noData}>No skill data available</div>
              )}
            </div>
          )}
        </>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && pendingTopic && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmModal}>
            <div className={styles.modalHeader}>
              <h3>
                <Icons.AlertCircle />
                Confirm Topic Completion
              </h3>
            </div>
            <div className={styles.modalBody}>
              <p>You are about to mark the following topic as complete:</p>
              <p style={{ fontWeight: 600, margin: '0.5rem 0' }}>{pendingTopic.topic}</p>
              <div className={styles.warningText}>
                ⚠️ This action is irreversible. Once marked as complete, it cannot be undone.
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelButton} onClick={cancelTopicComplete}>
                Cancel
              </button>
              <button className={styles.confirmButton} onClick={confirmTopicComplete}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
