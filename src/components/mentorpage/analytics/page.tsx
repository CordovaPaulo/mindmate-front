'use client';

import { useState, useEffect, useMemo } from 'react';
import styles from './analytics.module.css';
import api from '@/lib/axios';
import { toast } from 'react-toastify';

interface AnalyticsData {
  aveRating: number;
  totalSessions: number;
  groupSessions: number;
  oneOnOneSessions: number;
  topSubjects: { subject: string; count: number }[];
  topStyles: { style: string; count: number }[];
  schedules: Schedule[];
}

interface Schedule {
  id: string;
  date: string;
  subject: string;
  learners: string[]; // array of learner names
  duration: string; // "120 min" format
  type: string; // "one-on-one" | "group"
  learningStyle: string[]; // array of learning styles
  status: string; // "SCHEDULED" | "COMPLETED" | "CANCELLED"
}

interface SessionAnalyticsProps {
  analyticsData: AnalyticsData | null;
  userData: any;
  onDataRefresh: () => void;
}

// SVG Icons
const Icons = {
  Chart: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 3V21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 15L11 9L15 13L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Refresh: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M23 4V10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M1 20V14H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3.51 9C4.01717 7.56678 4.87913 6.2854 6.01547 5.27542C7.1518 4.26543 8.52547 3.55976 10.0083 3.22426C11.4911 2.88875 13.0348 2.93434 14.4952 3.35677C15.9556 3.77921 17.2853 4.56471 18.36 5.64L23 10M1 14L5.64 18.36C6.71475 19.4353 8.04437 20.2208 9.50481 20.6432C10.9652 21.0657 12.5089 21.1113 13.9917 20.7757C15.4745 20.4402 16.8482 19.7346 17.9845 18.7246C19.1209 17.7146 19.9828 16.4332 20.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Book: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Graduation: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 14L22 9L12 4L2 9L12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 9V17C22 17.5304 21.7893 18.0391 21.4142 18.4142C21.0391 18.7893 20.5304 19 20 19H4C3.46957 19 2.96086 18.7893 2.58579 18.4142C2.21071 18.0391 2 17.5304 2 17V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 12V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 13V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18 12V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Clock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
      <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Filter: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  TotalSessions: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 19V13C9 11.8954 9.89543 11 11 11H13C14.1046 11 15 11.8954 15 13V19C15 20.1046 15.8954 21 17 21H19C20.1046 21 21 20.1046 21 19V13C21 11.8954 20.1046 11 19 11H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 5C3 3.89543 3.89543 3 5 3H7C8.10457 3 9 3.89543 9 5V19C9 20.1046 8.10457 21 7 21H5C3.89543 21 3 20.1046 3 19V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 7H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  GroupSessions: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  OneOnOne: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 8H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Attendance: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 12C21 13.1819 20.7672 14.3522 20.3149 15.4442C19.8626 16.5361 19.1997 17.5282 18.364 18.364C17.5282 19.1997 16.5361 19.8626 15.4442 20.3149C14.3522 20.7672 13.1819 21 12 21C10.8181 21 9.64778 20.7672 8.55585 20.3149C7.46392 19.8626 6.47177 19.1997 5.63604 18.364C4.80031 17.5282 4.13738 16.5361 3.68508 15.4442C3.23279 14.3522 3 13.1819 3 12C3 9.61305 3.94821 7.32387 5.63604 5.63604C7.32387 3.94821 9.61305 3 12 3C14.3869 3 16.6761 3.94821 18.364 5.63604C20.0518 7.32387 21 9.61305 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
};

export default function SessionAnalyticsComponent({ 
  analyticsData, 
  userData, 
  onDataRefresh 
}: SessionAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [isLoading, setIsLoading] = useState(false);
  const [sortKey, setSortKey] = useState<keyof Schedule | ''>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    learningStyle: 'all',
    subject: 'all'
  });

  // Fetch analytics data from API
  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/mentor/session/analytics', { 
        withCredentials: true 
      });

      if (response.status === 200 && response.data?.data) {
        const apiData = response.data.data;
        
        // Map backend data to frontend structure
        const mappedData: AnalyticsData = {
          aveRating: typeof apiData.aveRating === 'number' ? apiData.aveRating : 0,
          totalSessions: typeof apiData.totalSessions === 'number' ? apiData.totalSessions : 0,
          groupSessions: typeof apiData.groupSessions === 'number' ? apiData.groupSessions : 0,
          oneOnOneSessions: typeof apiData.oneOnOneSessions === 'number' ? apiData.oneOnOneSessions : 0,
          topSubjects: Array.isArray(apiData.topSubjects) ? apiData.topSubjects.map((s: any) => ({
            subject: s.subject || '',
            count: typeof s.count === 'number' ? s.count : 0
          })) : [],
          topStyles: Array.isArray(apiData.topStyles) ? apiData.topStyles.map((s: any) => ({
            style: s.style || '',
            count: typeof s.count === 'number' ? s.count : 0
          })) : [],
          schedules: Array.isArray(apiData.schedules) ? apiData.schedules.map((s: any) => ({
            id: s.id || '',
            date: s.date || '',
            subject: s.subject || '',
            learners: Array.isArray(s.learners) ? s.learners : [],
            duration: s.duration || 'N/A',
            type: s.type || 'N/A',
            learningStyle: Array.isArray(s.learningStyle) ? s.learningStyle : [],
            status: s.status || 'SCHEDULED'
          })) : []
        };

        setData(mappedData);
        console.log('Analytics data loaded:', mappedData);
      } else {
        toast.error('Failed to load analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Error fetching analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (analyticsData) {
      // Use prop data if provided
      setData(analyticsData);
    } else {
      // Fetch from API
      fetchAnalyticsData();
    }
  }, [analyticsData]);

  const handleRefresh = async () => {
    await fetchAnalyticsData();
    if (onDataRefresh) {
      onDataRefresh();
    }
  };

  const handleSort = (key: keyof Schedule) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const getSortArrow = (key: keyof Schedule) => {
    if (sortKey !== key) return null;
    return (
      <span className={`${styles.sortArrow} ${sortOrder === 'desc' ? styles.sortArrowDesc : ''}`}>
        ▲
      </span>
    );
  };

  // Filter and sort sessions
  const filteredAndSortedSessions = useMemo(() => {
    const sessions = data?.schedules || [];
    
    let filtered = sessions.filter(session => {
      if (filters.status !== 'all' && session.status !== filters.status) return false;
      if (filters.type !== 'all' && session.type !== filters.type) return false;
      if (filters.learningStyle !== 'all' && !session.learningStyle.includes(filters.learningStyle)) return false;
      if (filters.subject !== 'all' && session.subject !== filters.subject) return false;
      return true;
    });

    if (!sortKey) return filtered;

    return filtered.sort((a, b) => {
      let A: any = a[sortKey];
      let B: any = b[sortKey];
      
      if (sortKey === 'date') {
        A = new Date(a.date).getTime();
        B = new Date(b.date).getTime();
      }
      if (sortKey === 'duration') {
        // Extract numeric value from "120 min" format
        A = parseInt(a.duration) || 0;
        B = parseInt(b.duration) || 0;
      }
      if (sortKey === 'learners') {
        A = a.learners.join(', ');
        B = b.learners.join(', ');
      }
      if (sortKey === 'learningStyle') {
        A = a.learningStyle.join(', ');
        B = b.learningStyle.join(', ');
      }
      
      if (A < B) return sortOrder === 'asc' ? -1 : 1;
      if (A > B) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data?.schedules, filters, sortKey, sortOrder]);

  // Get unique values for filter dropdowns
  const uniqueValues = useMemo(() => {
    const sessions = data?.schedules || [];
    const allStyles = sessions.flatMap(s => s.learningStyle);
    return {
      statuses: ['all', ...new Set(sessions.map(s => s.status))],
      types: ['all', ...new Set(sessions.map(s => s.type))],
      learningStyles: ['all', ...new Set(allStyles)],
      subjects: ['all', ...new Set(sessions.map(s => s.subject))]
    };
  }, [data?.schedules]);

  // Calculate attendance rate (completed sessions / total sessions)
  const attendanceRate = useMemo(() => {
    if (!data || data.totalSessions === 0) return 0;
    const completedSessions = data.schedules.filter(s => s.status === 'COMPLETED').length;
    return Math.round((completedSessions / data.totalSessions) * 100);
  }, [data]);

  const StatCard = ({ title, value, subtitle, trend, icon, color }: any) => (
    <div className={styles.statCard}>
      <div className={styles.statContent}>
        <div className={styles.statMain}>
          <h3>{value}</h3>
          <p>{title}</p>
        </div>
        <div className={styles.statIcon} style={{ color: color }}>
          {icon}
        </div>
      </div>
      <div className={styles.statFooter}>
        {subtitle && <span className={styles.statSubtitle}>{subtitle}</span>}
        {trend && <div className={styles.statTrend}>{trend}</div>}
      </div>
    </div>
  );

  const ProgressBar = ({ percentage, color }: { percentage: number; color: string }) => (
    <div className={styles.progressBar}>
      <div 
        className={styles.progressFill} 
        style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: color }}
      ></div>
    </div>
  );

  const getStatusBadge = (status: string) => {
    const statusClass = {
      COMPLETED: styles.statusCompleted,
      SCHEDULED: styles.statusScheduled,
      CANCELLED: styles.statusCancelled
    }[status] || styles.statusDefault;
    
    return <span className={`${styles.statusBadge} ${statusClass}`}>{status}</span>;
  };

  const getSessionTypeBadge = (type: string) => {
    const typeClass = {
      'group': styles.typeGroup,
      'one-on-one': styles.typeOneOnOne
    }[type] || styles.typeDefault;
    
    return <span className={`${styles.typeBadge} ${typeClass}`}>{type}</span>;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  // Safe data access functions
  const getTopSubjects = () => data?.topSubjects || [];
  const getTopLearningStyles = () => data?.topStyles || [];
  const getMaxSubjectCount = () => Math.max(...getTopSubjects().map(s => s.count), 1);
  const getMaxLearningStyleCount = () => Math.max(...getTopLearningStyles().map(s => s.count), 1);

  if (!data && isLoading) {
    return (
      <div className={styles.analyticsLoading}>
        <div className={styles.loadingSpinner}>
          <Icons.Refresh />
          Loading analytics...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.analyticsContainer}>
      <div className={styles.analyticsHeader}>
        <div className={styles.headerMain}>
          <div className={styles.headerTitle}>
            <div className={styles.headerIcon}>
              <Icons.Chart />
            </div>
            <h1>Session Analytics Dashboard</h1>
          </div>
          {data?.aveRating && (
            <div className={styles.averageRating}>
              <span className={styles.ratingLabel}>Average Rating:</span>
              <span className={styles.ratingValue}>{data.aveRating.toFixed(2)} ⭐</span>
            </div>
          )}
        </div>

        <div className={styles.analyticsControls}>
          <div className={styles.customSelect}>
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className={styles.timeRangeSelect}
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 90 Days</option>
            </select>
            <div className={styles.selectArrow}>
              <Icons.ChevronDown />
            </div>
          </div>
          
          <button 
            className={`${styles.refreshBtn} ${isLoading ? styles.refreshing : ''}`}
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <Icons.Refresh />
            {isLoading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Main Statistics Cards */}
      <div className={styles.statsGrid}>
        <StatCard
          title="Total Sessions"
          value={data?.totalSessions || 0}
          subtitle="All time"
          icon={<Icons.TotalSessions />}
          color="#4f46e5"
        />
        <StatCard
          title="Group Sessions"
          value={data?.groupSessions || 0}
          subtitle={`${Math.round(((data?.groupSessions || 0) / (data?.totalSessions || 1)) * 100)}% of total`}
          icon={<Icons.GroupSessions />}
          color="#7c3aed"
        />
        <StatCard
          title="One-on-One"
          value={data?.oneOnOneSessions || 0}
          subtitle={`${Math.round(((data?.oneOnOneSessions || 0) / (data?.totalSessions || 1)) * 100)}% of total`}
          icon={<Icons.OneOnOne />}
          color="#a855f7"
        />
        <StatCard
          title="Completion Rate"
          value={`${attendanceRate}%`}
          subtitle="Completed sessions"
          icon={<Icons.Attendance />}
          color="#10b981"
        />
      </div>

      <div className={styles.chartsSection}>
        {/* Top Subjects */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}>
              <Icons.Book />
              Top Subjects
            </div>
          </div>
          <div className={styles.subjectsList}>
            {getTopSubjects().length > 0 ? (
              getTopSubjects().map((item, index) => (
                <div key={item.subject} className={styles.subjectItem}>
                  <div className={styles.subjectInfo}>
                    <span className={styles.subjectName}>{item.subject}</span>
                    <span className={styles.subjectCount}>{item.count} sessions</span>
                  </div>
                  <ProgressBar 
                    percentage={(item.count / getMaxSubjectCount()) * 100} 
                    color={['#4f46e5', '#7c3aed', '#a855f7', '#c084fc', '#d8b4fe'][index % 5]}
                  />
                </div>
              ))
            ) : (
              <div className={styles.noData}>
                No subject data available
              </div>
            )}
          </div>
        </div>

        {/* Top Learning Styles */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}>
              <Icons.Graduation />
              Top Learning Styles
            </div>
          </div>
          <div className={styles.learningStylesList}>
            {getTopLearningStyles().length > 0 ? (
              getTopLearningStyles().map((item, index) => (
                <div key={item.style} className={styles.learningStyleItem}>
                  <div className={styles.learningStyleInfo}>
                    <span className={styles.learningStyleName}>{item.style}</span>
                    <span className={styles.learningStyleCount}>{item.count} occurrences</span>
                  </div>
                  <ProgressBar 
                    percentage={(item.count / getMaxLearningStyleCount()) * 100} 
                    color={['#10b981', '#059669', '#047857', '#065f46', '#064e3b'][index % 5]}
                  />
                </div>
              ))
            ) : (
              <div className={styles.noData}>
                No learning style data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Sessions Table */}
      <div className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <div className={styles.tableTitleSection}>
            <div className={styles.tableTitle}>
              <Icons.Clock />
              Recent Sessions
            </div>
            <div className={styles.tableInfo}>
              Showing {filteredAndSortedSessions.length} of {data?.schedules?.length || 0} sessions
            </div>
          </div>

          {/* Table Filters */}
          <div className={styles.tableFilters}>
            <div className={styles.filterGroup}>
              <Icons.Filter />
              <select 
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className={styles.filterSelect}
              >
                {uniqueValues.statuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Status' : status}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <select 
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className={styles.filterSelect}
              >
                {uniqueValues.types.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <select 
                value={filters.learningStyle}
                onChange={(e) => setFilters(prev => ({ ...prev, learningStyle: e.target.value }))}
                className={styles.filterSelect}
              >
                {uniqueValues.learningStyles.map(style => (
                  <option key={style} value={style}>
                    {style === 'all' ? 'All Styles' : style}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <select 
                value={filters.subject}
                onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
                className={styles.filterSelect}
              >
                {uniqueValues.subjects.map(subject => (
                  <option key={subject} value={subject}>
                    {subject === 'all' ? 'All Subjects' : subject}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className={styles.tableScrollContainer}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th 
                  onClick={() => handleSort('date')} 
                  className={styles.sortableHeader}
                >
                  <div className={styles.headerContent}>
                    <Icons.Calendar />
                    DATE {getSortArrow('date')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('subject')} 
                  className={styles.sortableHeader}
                >
                  <div className={styles.headerContent}>
                    SUBJECT {getSortArrow('subject')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('learners')} 
                  className={styles.sortableHeader}
                >
                  <div className={styles.headerContent}>
                    LEARNERS {getSortArrow('learners')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('duration')} 
                  className={styles.sortableHeader}
                >
                  <div className={styles.headerContent}>
                    DURATION {getSortArrow('duration')}
                  </div>
                </th>
                <th>TYPE</th>
                <th>LEARNING STYLES</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedSessions.length > 0 ? (
                filteredAndSortedSessions.map(session => (
                  <tr key={session.id} className={styles.tableRow}>
                    <td>
                      <div className={styles.dateCell}>
                        {formatDate(session.date)}
                      </div>
                    </td>
                    <td className={styles.subjectCell}>
                      {session.subject}
                    </td>
                    <td>
                      <div className={styles.learnersCell}>
                        {session.learners.join(', ')}
                      </div>
                    </td>
                    <td>
                      <div className={styles.durationCell}>
                        {session.duration}
                      </div>
                    </td>
                    <td>{getSessionTypeBadge(session.type)}</td>
                    <td>
                      <div className={styles.stylesCell}>
                        {session.learningStyle.map((style, idx) => (
                          <span key={idx} className={styles.learningStyleBadge}>
                            {style}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>{getStatusBadge(session.status)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className={styles.noSessions}>
                    <div className={styles.noSessionsContent}>
                      <Icons.Book />
                      No sessions match the current filters
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}