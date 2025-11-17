'use client';

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import MainComponent from '@/components/learnerpage/main/page';
import SessionComponent from '@/components/learnerpage/session/page';
import ReviewsComponent from '@/components/learnerpage/reviews/page';
import EditInformation from '@/components/learnerpage/information/page';
import LogoutComponent from '@/components/learnerpage/logout/page';
import CommunityForumComponent from '@/components/learnerpage/community/page';
import SessionAnalyticsComponent from '@/components/learnerpage/analytics/page'; // Add this import
import api from "@/lib/axios";
import { checkAuth } from '@/lib/auth';
import styles from './learner.module.css';
import { toast } from 'react-toastify';
import Pusher from 'pusher-js';
import ChatbotWidget from '@/components/ChatbotWidget';

interface RoleData{
  role: string;
  altRole: string | null;
}

interface UserData {
  _id: string;
  userId: string;
  name: string;
  email: string;
  address: string;
  yearLevel: string;
  program: string;
  availability: string[];
  sessionDur: string;
  bio: string;
  subjects: string[];
  image: string;
  phoneNumber: string;
  style: string[];
  goals: string;
  sex: string;
  status: string;
  modality: string;
  createdAt: string;
  __v: number;
}

interface Schedule {
  id: string;
  date: string;
  time: string;
  subject: string;
  location: string;
  mentor: {
    id: string;
    name: string;
    program: string;
    yearLevel: string;
    image: string;
  };
  learner: {
    id: string;
    name: string;
    program: string;
    yearLevel: string;
  };
  feedback?: {
    rating: number;
    feedback: string;
  };
  has_feedback?: boolean;
}

interface MentorFile {
  id: number;
  name: string;
  url: string;
  type: string;
  owner_id: number;
  file_id: string;
  file_name: string;
}

interface Mentor {
  id: number;
  userName: string;
  yearLevel: string;
  course: string;
  image_id: string;
  proficiency: string;
  subjects: string[];
  availability: string[];
  rating_ave: number;
  bio: string;
  exp: string;
  prefSessDur: string;
  teach_sty: string[];
  credentials: string[];
  image_url: string;
}

interface MentorFromAPI {
  id: string;
  name: string;
  program: string;
  yearLevel: string;
  image: string;
  aveRating: number;
  proficiency: string
}

interface TransformedMentor {
  id: string;
  userName: string;
  yearLevel: string;
  course: string;
  image_url: string;
  proficiency: string;
  rating_ave: number;
}

interface ForumData {
  id: string; // MongoDB ObjectId as string
  title: string;
  content: string;
  author: string; // MongoDB ObjectId as string
  authorName: string;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  commentsCount: number; // backend uses commentsCount, not commentCount
  topics?: string; // backend uses topics, not category
  tags?: string[];
  userVote?: 'up' | 'down' | null;
}

interface ProgressData {
  sessionsAttended: number;
  totalSessions: number;
  progress: number;
}

// Add this
interface RankData {
  rank: string;
  progress: number;
  requiredSessions: number | null;
  sessionsToNextRank: number | null;
}

// Update the AnalyticsData interface to match the backend response exactly
interface AnalyticsData {
  totalSessions: number;
  oneOnOneSessions: number;
  groupSessions: number;
  subjectsOfInterest: { subject: string; count: number }[];
  schedules: AnalyticsSchedule[];
}

interface AnalyticsSchedule {
  id: string;
  date: string;
  time: string;
  subject: string;
  mentor: string;
  duration: string;
  type: string;
  location: string;
  status: string;
}

const transformSchedulesForReview = (schedules: any[]): any[] => {
  return schedules.map(schedule => ({
    id: schedule.id,
    date: `${schedule.date} ${schedule.time}`,
    subject: schedule.subject,
    location: schedule.location,
    mentor: {
      user: {
        name: schedule.mentor?.name || "Unknown Mentor"
      },
      year: schedule.mentor?.yearLevel || "Professor",
      course: schedule.mentor?.program || `${schedule.subject?.substring(0, 3).toUpperCase()})`,
      image: schedule.mentor?.image || "https://placehold.co/600x400"
    },
    learner: {
      name: schedule.learner?.name || "Unknown Learner",
      program: schedule.learner?.program || "N/A",
      yearLevel: schedule.learner?.yearLevel || "N/A"
    },
    feedback: schedule.feedback || {
      rating: 0,
      feedback: ""
    },
    has_feedback: schedule.has_feedback || false
  }));
};

const transformMentorData = (apiMentors: MentorFromAPI[]): TransformedMentor[] => {
  return apiMentors.map(mentor => ({
    id: mentor.id,
    userName: mentor.name,
    yearLevel: mentor.yearLevel,
    course: mentor.program,
    image_url: mentor.image,
    proficiency: mentor.proficiency,
    rating_ave: mentor.aveRating
  }));
};

export default function LearnerPage() {
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    _id: "",
    userId: "",
    name: "",
    email: "",
    address: "",
    yearLevel: "",
    program: "",
    availability: [],
    sessionDur: "",
    bio: "",
    subjects: [],
    image: "",
    phoneNumber: "",
    style: [],
    goals: "",
    sex: "",
    status: "",
    modality: "",
    createdAt: "",
    __v: 0
  });
  
  const [schedForReview, setSchedForReview] = useState<Schedule[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<Schedule[]>([]);
  const [upcomingSchedule, setUpcomingSchedule] = useState<Schedule[]>([]);
  const [mentorFiles, setMentorFiles] = useState<MentorFile[]>([]);
  const [users, setUsers] = useState<Mentor[]>([]);
  const [profile, setProfile] = useState<UserData[]>([]);
  const [mentors, setMentors] = useState<MentorFromAPI[]>([]);
  const [roleData, setRoleData] = useState<RoleData | null>(null);
  const [transformedMentors, setTransformedMentors] = useState<TransformedMentor[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [forumData, setForumData] = useState<ForumData[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null); // Add analytics data state
  const [isLoadingMentors, setIsLoadingMentors] = useState(false);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  
  const [isEdit, setIsEdit] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [activeComponent, setActiveComponent] = useState("main");
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showDatePopup, setShowDatePopup] = useState(false);
  const datePopupRef = useRef<HTMLDivElement>(null);

  const [focusedTopbarIndex, setFocusedTopbarIndex] = useState(0);
  const [isTopbarFocused, setIsTopbarFocused] = useState(false);
  const topbarRef = useRef<HTMLDivElement>(null);

  // Progress Data State - Simplified to just session attendance
  const [progressData, setProgressData] = useState<ProgressData>({
    sessionsAttended: 0,
    totalSessions: 0,
    progress: 0
  });

  // Add this state
  const [rankData, setRankData] = useState<RankData | null>(null);

  // Update topbarItems to include Analytics
  const topbarItems = [
    { key: 'main', label: 'Mentors', icon: '/main.svg' },
    { key: 'session', label: 'Schedules', icon: '/calendar.svg' },
    { key: 'records', label: 'Reviews', icon: '/records.svg' },
    { key: 'community', label: 'Community', icon: '/community.svg' },
    { key: 'analytics', label: 'Analytics', icon: '/analytics.svg' } // Add Analytics
  ];

  // Authentication guard - check if user is logged in and has learner role
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const auth = await checkAuth();
        
        if (!auth.authenticated) {
          toast.error('Please log in to access this page');
          router.replace('/auth/login');
          return;
        }

        if (auth.user?.role !== 'learner') {
          toast.error('Access denied. This page is for learners only.');
          router.replace('/auth/login');
          return;
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.replace('/auth/login');
      }
    };

    verifyAuth();
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePopupRef.current && !datePopupRef.current.contains(event.target as Node)) {
        setShowDatePopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!userData?.userId) return;

    Pusher.logToConsole = true;

    // Use a custom authorizer so the browser will include httpOnly cookies
    // (credentials: 'include') when calling the auth endpoint. This avoids
    // reading httpOnly cookies from JavaScript (not allowed) and ensures the
    // backend `authenticateToken()` middleware can read the cookie.
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authorizer: (channel, options) => ({
        authorize: (socketId, callback) => {
          const body = `socket_id=${encodeURIComponent(socketId)}&channel_name=${encodeURIComponent(channel.name)}`;
          // Call the backend auth endpoint directly so the browser will send
          // the httpOnly cookie that was set by the backend (same host).
          api.post(`${backendUrl}/api/pusher/pusher/auth`, body, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          })
            .then((res) => callback(null, res.data))
            .catch((err) => callback(err, null));
        },
      }),
    });

    const channelName = `private-user-${userData.userId}`;
    const channel = pusher.subscribe(channelName);

    channel.bind('pusher:subscription_succeeded', () => {
      console.log('[Pusher] subscribed:', channelName);
    });
    channel.bind('pusher:subscription_error', (status: any) => {
      console.error('[Pusher] subscription error:', status);
    });

    channel.bind('new-schedule', (newSchedule: any) => {
      console.log('[Pusher] new-schedule received:', newSchedule);
      toast.info(`New schedule request from ${newSchedule.learner.name}!`);
      const scheduleDate = new Date(newSchedule.date);
      const today = new Date();
      scheduleDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      if (scheduleDate.getTime() === today.getTime()) {
        setTodaySchedule(prev => [newSchedule, ...prev]);
      } else {
        setUpcomingSchedule(prev => [newSchedule, ...prev]);
      }
    });

    channel.bind('schedule-rescheduled', (updated: any) => {
      console.log('[Pusher] schedule-rescheduled', updated);
      setTodaySchedule(prev => prev.filter(s => s.id !== updated.id));
      setUpcomingSchedule(prev => prev.filter(s => s.id !== updated.id));
      const d = new Date(updated.date); d.setHours(0,0,0,0);
      const t = new Date(); t.setHours(0,0,0,0);
      if (d.getTime() === t.getTime()) setTodaySchedule(prev => [updated, ...prev]);
      else if (d > t) setUpcomingSchedule(prev => [updated, ...prev]);
    });

    channel.bind('schedule-cancelled', (cancelled: any) => {
      console.log('[Pusher] schedule-cancelled', cancelled);
      setTodaySchedule(prev => prev.filter(s => s.id !== cancelled.id));
      setUpcomingSchedule(prev => prev.filter(s => s.id !== cancelled.id));
    });

    return () => {
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [userData.userId]);

  // Update progress based on completed sessions
  useEffect(() => {
    const updateProgress = () => {
      const sessionsAttended = schedForReview.filter(session => session.has_feedback).length;
      const totalSessions = schedForReview.length;
      const progress = totalSessions > 0 ? (sessionsAttended / totalSessions) * 100 : 0;
      
      setProgressData({
        sessionsAttended,
        totalSessions,
        progress
      });
    };

    updateProgress();
  }, [schedForReview]);

  const fetchForumData = async () => {
    try {
      console.log("Fetching forum data...");
      const res = await api.get('/api/forum/posts', {
        timeout: 10000,
        withCredentials: true,
      });
      
      console.log("Forum API Response:", res.data);
      setForumData(res.data);
      
    } catch (error) {
      console.error('Error fetching forum data:', error);
    }
  };

  // Add fetchAnalyticsData function
  const fetchAnalyticsData = async () => {
    try {
      console.log("Fetching analytics data...");
      const res = await api.get('/api/learner/analytics', {
        timeout: 50000,
        withCredentials: true,
      });
      
      console.log("Analytics API Response:", res.data);
      if (res.data?.data) {
        // Mount the data exactly as received from backend
        setAnalyticsData(res.data.data);
      }
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Error fetching analytics data');
    }
  };

  const startLoading = () => setIsLoading(true);
  const stopLoading = () => setIsLoading(false);

  const handleTopbarKeyDown = (e: React.KeyboardEvent) => {
    if (!isTopbarFocused) return;

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        navigateTopbar('right');
        break;
      case 'ArrowLeft':
        e.preventDefault();
        navigateTopbar('left');
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        activateTopbarItem();
        break;
      case 'Home':
        e.preventDefault();
        setFocusedTopbarIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedTopbarIndex(topbarItems.length - 1);
        break;
      case 'Escape':
        e.preventDefault();
        setIsTopbarFocused(false);
        break;
    }
  };

  const navigateTopbar = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      setFocusedTopbarIndex((prev) => (prev + 1) % topbarItems.length);
    } else {
      setFocusedTopbarIndex((prev) => (prev - 1 + topbarItems.length) % topbarItems.length);
    }
  };

  const activateTopbarItem = () => {
    const focusedItem = topbarItems[focusedTopbarIndex];
    switchComponent(focusedItem.key);
  };

  const focusTopbar = () => {
    setIsTopbarFocused(true);
    const currentIndex = topbarItems.findIndex(item => item.key === activeComponent);
    setFocusedTopbarIndex(currentIndex >= 0 ? currentIndex : 0);
  };

  const sessionInfo = async () => {
    try {
      console.log("Fetching session info...");
      const res = await api.get('/api/learner/schedules', {
        withCredentials: true,
      });

      setTodaySchedule(res.data);
    } catch (error) {
      console.error('Error fetching session info:', error);
    }
  };

  const mentorProfile = async () => {
    try {
      console.log("Fetching mentor profiles...");
      const res = await api.get('/api/learner/mentors', {
        withCredentials: true,
      });
      setUsers(res.data);
    } catch (error) {
      console.error('Error fetching mentors:', error);
    }
  };

  const fetchMentFiles = async () => {
    try {
      console.log("Fetching mentor files...");
      const res = await api.get('/api/learner/files', {
        withCredentials: true,
      });
      setMentorFiles(res.data);
    } catch (error) {
      console.error('Error fetching mentor files:', error);
    }
  };

  const registerMentorRole = async () => {
     try {
      if(roleData?.altRole !== null && roleData?.altRole === 'mentor') {
        toast.info('You have already registered as a Mentor.');
        return;
      }

      router.push('/info/mentor/alt');
    } catch (error) {
      console.error('Error registering role:', error);
    }
  };
  
  const switchRole = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    try {
      if (roleData?.altRole === null) { 
        toast.error('No alternate role registered. Please register as a Mentor first.');
        return;
      }
      const res = await api.post('/api/auth/switch-role', {}, { withCredentials: true });

      if (res.status === 200) {
        const newRole = res.data?.newRole;
        toast.success(`Role switched to ${newRole}. Please log in again.`);
        // httpOnly cookie is cleared by backend logout endpoint
        localStorage.removeItem('auth_token');
        router.replace('/auth/login');
      } else {
        toast.error('Error switching role. Please try again.');
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Error switching role. Please try again.';
      console.error('Error switching role:', error);
      toast.error(message);
    }
  };

  const logout = async () => {
    try {
      console.log("Logging out...");
      localStorage.removeItem('auth_token');
      await api.post('/api/auth/logout');
      router.replace('/auth/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error during logout. Please try again.');
    }
  };

  const handleUpdateUserData = (updatedData: Partial<UserData>) => {
    setUserData(prev => ({
      ...prev,
      ...updatedData
    }));
  };

  const filteredUsers = transformedMentors.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      searchQuery === "" ||
      user.userName.toLowerCase().includes(searchLower) ||
      user.yearLevel.toLowerCase().includes(searchLower) ||
      user.course.toLowerCase().includes(searchLower)
    );
  });

  const handleLogout = () => {
    setConfirmLogout(false);
    logout();
  };

  const handleCancelLogout = () => {
    setConfirmLogout(false);
  };

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const checkMobileView = () => {
    if (typeof window !== 'undefined') {
      const mobile = window.innerWidth <= 768;
      setIsMobileView(mobile);
      if (!mobile) {
        setIsSidebarVisible(true);
      }
    }
  };

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      console.log("Starting fetchUserData...");
      // const token = getCookie('MindMateToken');
      // console.log("Token:", token ? "Found" : "Not found");
      
      const res = await api.get('/api/learner/profile', {
        withCredentials: true,
      });
      
      setUserData(res.data.userData);
      setRoleData({
        role: res.data.roleData.role,
        altRole: res.data.roleData.altRole
      });
      // Mount rank data from payload
      setRankData(res.data.rankData || null);
      console.log(res.data);
      
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMentors = async () => {
    setIsLoadingMentors(true);
    try {
      console.log("Fetching mentors from API...");
      // const token = getCookie('MindMateToken');
      const res = await api.get('/api/learner/mentors', {
        withCredentials: true,
      });
      
      console.log("Mentors API Response:", res.data);
      setMentors(res.data);
      const transformed = transformMentorData(res.data);
      setTransformedMentors(transformed);
      console.log("Transformed mentors:", transformed);
      
    } catch (error) {
      console.error('Error fetching mentors:', error);
    } finally {
      setIsLoadingMentors(false);
    }
  };

  const fetchSchedules = async () => {
    setIsLoadingSchedules(true);
    try {
      // const token = getCookie('MindMateToken');
      const res = await api.get('/api/learner/schedules', {
        withCredentials: true,
      });

      setTodaySchedule(res.data.todaySchedule || []);
      setUpcomingSchedule(res.data.upcomingSchedule || []);
      setSchedForReview(res.data.schedForReview || []);
      console.log("Schedules fetched:", res.data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  const switchComponent = (component: string) => {
    console.log('Switching to component:', component);
    if (activeComponent !== component) {
      setActiveComponent(component);
      if (isMobileView) {
        setIsSidebarVisible(false);
      }
      const newIndex = topbarItems.findIndex(item => item.key === component);
      if (newIndex >= 0) {
        setFocusedTopbarIndex(newIndex);
      }
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      startLoading();
      checkMobileView();

      if (typeof window !== 'undefined') {
        window.addEventListener('resize', checkMobileView);
      }

      try {
        await fetchUserData();
        await Promise.allSettled([
          mentorProfile(),
          fetchMentFiles(),
          fetchMentors(),
          fetchSchedules(),
          fetchForumData(),
          fetchAnalyticsData() // Add analytics data fetch
        ]);
      } catch (error) {
        console.error('Error during initialization:', error);
      } finally {
        stopLoading();
      }
    };

    initializeData();

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', checkMobileView);
      }
    };
  }, []);

  useEffect(() => {
    console.log("Current userData state:", userData);
  }, [userData]);

  // Helper for rank progress percentage
  const rankProgressPct = (() => {
    if (!rankData) return 0;
    if (rankData.requiredSessions == null) return 100; // top rank
    const req = Math.max(Number(rankData.requiredSessions) || 0, 1);
    const prog = Math.max(Number(rankData.progress) || 0, 0);
    return Math.min(Math.round((prog / req) * 100), 100);
  })();

  const renderComponent = () => {
    const transformedSchedForReview = transformSchedulesForReview(schedForReview);

    const normalizeForSession = (items: any[] = []) =>
      items.map((s: any) => ({
        id: String(s.id ?? s._id ?? ''),
        subject: s.subject || '',
        mentor: {
          user: { name: s.mentor?.user?.name || s.mentor?.name || 'Unknown Mentor' },
          ment_inf_id: Number(s.mentor?.ment_inf_id ?? s.mentor?.id ?? 0),
          id: String(s.mentor?.id ?? s.mentor?.ment_inf_id ?? '')
        },
        learner: {
          id: String(s.learner?.id ?? s.learner?._id ?? ''),
          name: s.learner?.name || ''
        },
        date: s.date ? String(s.date) : '',
        time: s.time || '',
        location: s.location || '',
        files: s.files || []
      }));

    const sessionSchedule = normalizeForSession(todaySchedule as any[]);
    const sessionUpcoming = normalizeForSession(upcomingSchedule as any[]);
    const sessionMentFiles = {
      files: (mentorFiles || []).map(f => ({
        id: Number(f.id) || 0,
        file_name: f.file_name || f.name || '',
        file_id: f.file_id || '',
        owner_id: Number(f.owner_id) || 0
      }))
    };

    const props = {
      userInformation: filteredUsers,
      userData,
      upcomingSchedule: sessionUpcoming,
      schedule: sessionSchedule,
      schedForReview: schedForReview,
      mentFiles: sessionMentFiles,
      onScheduleCreated: fetchSchedules 
    };

    switch (activeComponent) {
      case 'main':
        return <MainComponent {...props} />;
      case 'session':
        return (
          <SessionComponent
            schedule={sessionSchedule}
            upcomingSchedule={sessionUpcoming}
            mentFiles={sessionMentFiles}
            schedForReview={transformSchedulesForReview(schedForReview)}
            userInformation={filteredUsers}
            userData={userData}
          />
        );
      case 'records':
        return (
          <ReviewsComponent
            schedForReview={schedForReview}
            userData={userData}
            data={{ schedForReview: schedForReview }}
          />
        );
      case 'community':
        return (
          <CommunityForumComponent 
            forumData={forumData}
            userData={userData}
            onForumUpdate={fetchForumData}
          />
        );
      case 'analytics': // Add analytics case
        return (
          <SessionAnalyticsComponent 
            analyticsData={analyticsData}
            userData={userData}
            onDataRefresh={fetchAnalyticsData}
          />
        );
      default:
        return <MainComponent {...props} />;
    }
  };

  const courseAbbreviation = userData.program;

  return (
    <>
      {isLoading && (
        <div className={styles['loading-overlay']}>
          <div className={styles['loading-backdrop']}></div>
          <div className={styles['loading-spinner']}></div>
        </div>
      )}

      {isMobileView && (
        <button className={styles['sidebar-toggle']} onClick={toggleSidebar}>
          ☰
        </button>
      )}

      {isMobileView && isSidebarVisible && (
        <div className={styles['sidebar-overlay']} onClick={toggleSidebar}></div>
      )}

      <div
        className={[
          styles.sidebar,
          isMobileView ? styles['sidebar-mobile'] : '',
          isMobileView && isSidebarVisible ? styles['sidebar-mobile-visible'] : ''
        ].filter(Boolean).join(' ')}
      >
        <div className={styles['logo-container']}>
          <img src="/logo_gccoed.png" alt="GCCoEd Logo" className={styles.logo} />
          <span className={styles['logo-text']}>MindMates</span>
        </div>

        <div className={styles['upper-element']}>
          <div>
            <h1>Hi, Learner!</h1>
            <img
              src={userData.image || 'https://placehold.co/100x100'}
              alt="profile-pic"
              width={100}
              height={100}
            />
          </div>
          <div>
            <h2>{userData.name}</h2>
            <i><p>{userData.yearLevel}</p></i>
            <i><p>{courseAbbreviation}</p></i>
          </div>
        </div>

        <div className={styles['progress-tracker']}>
          <h1>Learning Progress</h1>
          <div className={styles['progress-item']}>
            <div className={styles['progress-header']}>
              <span className={styles['progress-title']}>
                <p className={styles['progress-label']}>Rank:</p>
                {rankData ? `${rankData.rank}` : 'Sessions Attended'}
              </span>
              <span className={styles['progress-percentage']}>
                {rankData ? `${rankProgressPct}%` : `${Math.round(progressData.progress)}%`}
              </span>
            </div>
            <div className={styles['progress-bar']}>
              <div 
                className={styles['progress-fill']}
                style={{ width: `${rankData ? rankProgressPct : progressData.progress}%` }}
              ></div>
            </div>
            <div className={styles['progress-details']}>
              <span className={styles['progress-count']}>
                {rankData
                  ? (rankData.requiredSessions == null
                      ? 'Top rank achieved'
                      : `${rankData.progress} / ${rankData.requiredSessions} sessions` +
                        (typeof rankData.sessionsToNextRank === 'number'
                          ? ` • ${rankData.sessionsToNextRank} to next rank`
                          : '')
                    )
                  : `${progressData.sessionsAttended} / ${progressData.totalSessions} sessions`
                }
              </span>
            </div>
          </div>
        </div>

        <div className={styles['footer-element']}>
          <div className={styles.availability}>
            <h1>Availability</h1>
            <div className={styles.lines}>
              <h3>Days:</h3>
              <div>
                <p>{userData.availability?.join(', ') || 'Not specified'}</p>
              </div>
            </div>
            <div className={styles.lines}>
              <h3>Duration:</h3>
              <div>
                <p>{userData.sessionDur || 'Not specified'}</p>
              </div>
            </div>
          </div>

          <div className={styles['subject-interest']}>
            <h1>Subject of Interest</h1>
            <div className={styles['course-grid']}>
              {userData.subjects?.slice(0, 5).map((subject, index) => (
                <div key={index} className={styles['course-card']}>
                  <div className={styles.lines}>
                    <div>
                      <p title={subject}>{subject}</p>
                    </div>
                  </div>
                </div>
              )) || []}
              {(userData.subjects?.length || 0) > 5 && (
                <div
                  className={[
                    styles['course-card'],
                    styles['remaining-courses']
                  ].join(' ')}
                  onClick={() => setShowAllCourses(!showAllCourses)}
                >
                  <div className={styles.lines}>
                    <div>
                      <p>+{(userData.subjects?.length || 0) - 5}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {showAllCourses && (
              <div className={styles['all-courses-popup']}>
                <div
                  className={styles['popup-overlay']}
                  onClick={() => setShowAllCourses(false)}
                />
                <div className={styles['popup-content']}>
                  <h3>All Subject of Interest</h3>
                  <div className={styles['popup-courses']}>
                    {userData.subjects?.map((subject, index) => (
                      <div key={index} className={styles['popup-course']}>
                        {subject}
                      </div>
                    )) || []}
                  </div>
                  <button
                    className={styles['popup-close-btn']}
                    onClick={() => setShowAllCourses(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className={styles['account-actions']}>
            <div className={styles['account-dropdown']}>
              <button className={styles['account-dropbtn']}>
                <img src="/person.svg" alt="Account" className={styles['account-icon']} />
                Account
              </button>
              <div className={styles['account-dropdown-content']}>
                <a onClick={() => setIsEdit(true)}>
                  <img src="/edit.svg" alt="Edit" /> Edit Information
                </a>
                <a onClick={registerMentorRole}>
                  <img src="/register.svg" alt="Register" /> Register as Mentor
                </a>
                <a onClick={switchRole}>
                  <img src="/switch.svg" alt="Switch" /> Switch Account Role
                </a>
                <a onClick={() => setConfirmLogout(true)}>
                  <img src="/logout.svg" alt="Logout" /> Logout
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={topbarRef}
        className={[
          styles.topbar,
          isTopbarFocused ? styles['topbar-focused'] : ''
        ].filter(Boolean).join(' ')}
        tabIndex={0}
        onKeyDown={handleTopbarKeyDown}
        onFocus={focusTopbar}
        onBlur={() => setIsTopbarFocused(false)}
        onClick={focusTopbar}
      >
        <div className={styles['topbar-left']}>
          {topbarItems.map((item, index) => (
            <div
              key={item.key}
              onClick={() => switchComponent(item.key)}
              className={[
                styles['topbar-option'],
                activeComponent === item.key ? styles['active'] : '',
                index === focusedTopbarIndex && isTopbarFocused ? styles['focused'] : ''
              ].filter(Boolean).join(' ')}
            >
              <img src={item.icon} alt={item.label} className={styles['nav-icon']} />
              <span className={styles['nav-text']}>{item.label}</span>
            </div>
          ))}
        </div>
        
        <div className={styles.dateContainer} ref={datePopupRef}>
          <button 
            className={styles.calendarIconBtn}
            onClick={() => setShowDatePopup(!showDatePopup)}
            aria-label="Show current date and time"
          >
            <img src="/time.svg" alt="Calendar" className={styles.calendarIcon} />
          </button>
          
          {showDatePopup && (
            <div className={styles.datePopup}>
              <div className={styles.dateContent}>
                <div className={styles.currentDate}>
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className={styles.currentTime}>
                  {new Date().toLocaleTimeString("en-US", {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </div>
              </div>
              <div className={styles.popupArrow}></div>
            </div>
          )}
        </div>
      </div>

      <div
        className={[
          styles['main-content'],
          isMobileView && !isSidebarVisible ? styles['content-expanded'] : ''
        ].filter(Boolean).join(' ')}
      >
        {renderComponent()}
      </div>

      {isEdit && (
        <div className={styles['edit-information-popup']}>
          <EditInformation 
            userData={userData}
            onCancel={() => setIsEdit(false)}
            onSave={(updatedData) => {
              console.log('Data saved:', updatedData);
              // Update the user data with the saved changes
              handleUpdateUserData(updatedData);
              // Close the modal
              setIsEdit(false);
            }}
            onUpdateUserData={handleUpdateUserData}
          />
        </div>
      )}

      {confirmLogout && (
        <LogoutComponent onCancel={handleCancelLogout} />
      )}

      {/* Chatbot visible only on learner page */}
      <ChatbotWidget />
    </>
  );
}