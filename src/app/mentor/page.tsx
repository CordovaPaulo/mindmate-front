'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import MainComponent from '@/components/mentorpage/main/page';
import SessionComponent from '@/components/mentorpage/session/page';
import ReviewsComponent from '@/components/mentorpage/reviews/page';
import FilesComponent from '@/components/mentorpage/files/page';
import FileManagerComponent from '@/components/mentorpage/filemanager/page';
import EditInformationComponent from '@/components/mentorpage/information/page';
import LogoutComponent from '@/components/mentorpage/logout/page';
import CommunityForumComponent from '@/components/mentorpage/community/page';
import SessionAnalyticsComponent from '@/components/mentorpage/analytics/page';
import GroupSessionInvite from '@/components/mentorpage/GroupSessionInvite/page';
import api from "@/lib/axios";
import { checkAuth } from '@/lib/auth';
import styles from './mentor.module.css';
import { toast } from 'react-toastify';
import Pusher from 'pusher-js';
import ChatbotWidget from '@/components/ChatbotWidget';

interface User {
  id: number | null;
  name: string;
  email: string;
  role: string;
}

interface Mentor {
  address: string;
  proficiency: string;
  year: string;
  course: string;
  availability: string[];
  prefSessDur: string;
  bio: string;
  subjects: string[];
  image: string;
  phoneNum: string;
  teach_sty: string[];
  credentials: string[];
  exp: string;
  rating_ave: number;
  gender?: string;
  learn_modality?: string;
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
  ment?: Mentor;
  user?: User;
  image_url?: string;
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
    image: string;
  };
}

interface LearnerFromAPI {
  _id: string;
  name: string;
  program: string;
  yearLevel: string;
  image?: string;
}

interface Feedback {
  _id: string;
  learner: string;
  mentor: string;
  schedule: string;
  rating: number;
  comments: string;
  createdAt: string;
  updatedAt: string;
}

interface RoleData {
  role: string;
  altRole: string | null;
}

interface BadgeDefinition {
  key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
}

interface EarnedBadge {
  badgeKey: string;
  awardedAt: string;
  metricsSnapshot?: any;
  definition?: BadgeDefinition | null;
}

interface ForumData {
  id: string;
  title: string;
  content?: string;
  author?: string;
  authorName?: string;
  createdAt?: string;
  upvotes?: number;
  downvotes?: number;
  commentsCount?: number;
  topics?: string;
  tags?: string[];
  userVote?: 'up' | 'down' | null;
}

// Constants
const TOPBAR_ITEMS = [
  { key: 'main', label: 'Learners', icon: '/main.svg' },
  { key: 'session', label: 'Schedules', icon: '/calendar.svg' },
  { key: 'reviews', label: 'Reviews', icon: '/records.svg' },
  { key: 'files', label: 'Files', icon: '/uploadCloud.svg' },
  { key: 'fileManage', label: 'File Manager', icon: '/files.svg' },
  { key: 'community', label: 'Community', icon: '/community.svg' },
  { key: 'analytics', label: 'Analytics', icon: '/analytics.svg' }
];

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className={styles.stars}>
      {[...Array(5)].map((_, i) => (
        <span key={i} className={i < Math.round(rating) ? styles.filledStar : styles.emptyStar}>
          {i < Math.round(rating) ? '★' : '☆'}
        </span>
      ))}
    </div>
  );
};

const HexBadge = ({ badge }: { badge: EarnedBadge }) => {
  const def = badge.definition || undefined;
  const bg = def?.color || '#8B5CF6';
  const icon = def?.icon || '🏅';
  const title = def?.name || badge.badgeKey;
  return (
    <div className={styles.hexBadge} title={title} aria-label={title}>
      <div className={styles.hexBadgeInner} style={{ background: bg }}>
        <span className={styles.hexBadgeIcon}>{icon}</span>
      </div>
    </div>
  );
};

export default function MentorPage() {
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLearners, setIsLoadingLearners] = useState(false);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
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
  
  const [users, setUsers] = useState<any[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [upcomingSchedule, setUpcomingSchedule] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [roleData, setRoleData] = useState<RoleData | null>(null);
  const [forumData, setForumData] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [badges, setBadges] = useState<EarnedBadge[]>([]);
  
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOffer, setShowOffer] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeComponent, setActiveComponent] = useState("main");
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showEditInformation, setShowEditInformation] = useState(false);
  const [showAccessibilityNav, setShowAccessibilityNav] = useState(false);
  const [focusedTopbarIndex, setFocusedTopbarIndex] = useState(0);
  const [isTopbarFocused, setIsTopbarFocused] = useState(false);
  const [mentorData, setMentorData] = useState<any | null>(null);
  const [showDatePopup, setShowDatePopup] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showBadgesPopup, setShowBadgesPopup] = useState(false);
  const [showGroupInviteModal, setShowGroupInviteModal] = useState(false);
  const [selectedGroupSessionId, setSelectedGroupSessionId] = useState<string | null>(null);
  
  const topbarRef = useRef<HTMLDivElement>(null);
  const datePopupRef = useRef<HTMLDivElement>(null);

  const subjects = userData?.subjects || [];
  const displayedCourses = subjects.slice(0, 5);
  const remainingCoursesCount = Math.max(subjects.length - 5, 0);
  const courseAbbreviation = userData.program?.match(/\(([^)]+)\)/)?.[1] || userData.program;
  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      searchQuery === "" ||
      user.name.toLowerCase().includes(searchLower) ||
      user.yearLevel.toLowerCase().includes(searchLower) ||
      user.program.toLowerCase().includes(searchLower)
    );
  });

  // Authentication guard - check if user is logged in and has mentor role
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const auth = await checkAuth();
        
        if (!auth.authenticated) {
          toast.error('Please log in to access this page');
          router.replace('/auth/login');
          return;
        }

        if (auth.user?.role !== 'mentor') {
          toast.error('Access denied. This page is for mentors only.');
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
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authorizer: (channel, options) => ({
        authorize: (socketId, callback) => {
          const body = `socket_id=${encodeURIComponent(socketId)}&channel_name=${encodeURIComponent(channel.name)}`;
          fetch('/api/pusher-auth', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
          })
            .then(async (res) => {
              if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
              return res.json();
            })
            .then((data) => callback(null, data))
            .catch((err) => callback(err, null));
        },
      }),
    });

    const channelName = `private-user-${userData.userId}`;
    const channel = pusher.subscribe(channelName);

    channel.bind('pusher:subscription_succeeded', () => {
      console.log('[Pusher] subscribed:', channelName);
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

    channel.bind('new-feedback', (fb: any) => {
      console.log('[Pusher] new-feedback', fb);
      toast.info(`New feedback received!`);
      setFeedbacks(prev => [fb, ...prev]);
    });

    return () => {
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [userData.userId]);

  const fetchUserData = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      console.log("Starting fetchUserData...");
      // const token = getCookie('MindMateToken');
      // console.log("Token:", token ? "Found" : "Not found");
      
      try {
        const res = await api.get('/api/mentor/profile', {
          timeout: 50000,
          withCredentials: true,
        });

        if (res.data && res.data.userData) {
          setUserData(res.data.userData);
          setRoleData(res.data.roleData);
          setBadges(Array.isArray(res.data.badges) ? res.data.badges : []);
          console.log("Mentor profile data:", res.data);
        } else {
          throw new Error('Invalid response format');
        }
        
      } catch (apiError: any) {
        console.error('API Error details:', {
          message: apiError.message,
          code: apiError.code,
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          url: apiError.config?.url
        });
        
        if (apiError.code === 'NETWORK_ERROR' || apiError.code === 'ECONNREFUSED') {
          setApiError('Cannot connect to server. Please check if the backend is running.');
          useMockData();
        } else if (apiError.response?.status === 401) {
          setApiError('Authentication failed. Redirecting to login...');
          setTimeout(() => router.push('/auth/login'), 2000);
        } else {
          throw apiError;
        }
      }
      
    } catch (error) {
      console.error('Error fetching mentor data:', error);
      setApiError('Failed to load mentor data. Using demo data.');
      useMockData();
    } finally {
      setIsLoading(false);
    }
  };

  const useMockData = () => {
    const mockUserData: UserData = {
      _id: "mock_id",
      userId: "mock_user_id",
      name: "John Doe",
      email: "john@example.com",
      address: "123 Main St",
      yearLevel: "3rd Year",
      program: "Computer Science (CS)",
      availability: ["Monday", "Wednesday", "Friday"],
      sessionDur: "1 hour",
      bio: "Experienced mentor with 3 years of teaching experience in computer science subjects.",
      subjects: ["Mathematics", "Physics", "Programming", "Algorithms", "Data Structures", "Web Development", "Database Management"],
      image: "https://placehold.co/600x400",
      phoneNumber: "123-456-7890",
      style: ["Interactive", "Practical"],
      goals: "Help students excel",
      sex: "Male",
      status: "Active",
      modality: "Online",
      createdAt: new Date().toISOString(),
      __v: 0
    };
    setUserData(mockUserData);
    
    const mockLearners: LearnerFromAPI[] = [
      {
        _id: "1",
        name: "Alice Johnson",
        program: "BSCS",
        yearLevel: "2nd Year",
        image: "https://placehold.co/600x400"
      },
      {
        _id: "2",
        name: "Bob Smith",
        program: "BSIT",
        yearLevel: "1st Year",
        image: "https://placehold.co/600x400"
      },
      {
        _id: "3",
        name: "Carol Davis",
        program: "BSSE",
        yearLevel: "3rd Year",
        image: "https://placehold.co/600x400"
      }
    ];
    setUsers(mockLearners);
    
    const mockTodaySchedule: Schedule[] = [
      { 
        id: "1", 
        date: new Date().toISOString().split('T')[0],
        time: "10:00 AM", 
        subject: "Mathematics",
        location: "Room 101",
        mentor: {
          id: "mentor1",
          name: "John Doe",
          program: "BSCS",
          yearLevel: "Professor",
          image: "https://placehold.co/600x400"
        },
        learner: { 
          id: "learner1",
          name: "Alice Johnson",
          program: "BSCS",
          yearLevel: "2nd Year",
          image: "https://placehold.co/600x400"
        }
      }
    ];
    
    const mockUpcomingSchedule: Schedule[] = [
      { 
        id: "2", 
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        time: "11:00 AM", 
        subject: "Algorithms",
        location: "Library",
        mentor: {
          id: "mentor1",
          name: "John Doe",
          program: "BSCS",
          yearLevel: "Professor",
          image: "https://placehold.co/600x400"
        },
        learner: { 
          id: "learner2",
          name: "Carol Davis",
          program: "BSSE",
          yearLevel: "3rd Year",
          image: "https://placehold.co/600x400"
        }
      }
    ];
    
    setTodaySchedule(mockTodaySchedule);
    setUpcomingSchedule(mockUpcomingSchedule);
    
    const mockFeedbacks: Feedback[] = [
      { 
        _id: "1",
        learner: "learner1",
        mentor: "mentor1",
        schedule: "schedule1",
        rating: 5, 
        comments: "Excellent mentor! Very patient and knowledgeable.", 
        createdAt: "2024-01-15T00:00:00.000Z",
        updatedAt: "2024-01-15T00:00:00.000Z"
      },
      { 
        _id: "2",
        learner: "learner2", 
        mentor: "mentor1",
        schedule: "schedule2",
        rating: 4, 
        comments: "Very helpful sessions, great explanations.", 
        createdAt: "2024-01-12T00:00:00.000Z",
        updatedAt: "2024-01-12T00:00:00.000Z"
      }
    ];
    setFeedbacks(mockFeedbacks);

    const mockForumData = [
      {
        id: 1,
        title: "Best practices for teaching Algorithms?",
        author: "Alice Johnson",
        replies: 12,
        views: 45,
        lastActivity: "2 hours ago",
        category: "Teaching Methods"
      },
      {
        id: 2,
        title: "How to handle difficult students?",
        author: "Bob Smith",
        replies: 8,
        views: 32,
        lastActivity: "5 hours ago",
        category: "Student Management"
      }
    ];
    setForumData(mockForumData);

    const mockAnalyticsData = {
      totalSessions: 24,
      participationRate: 85,
      averageRating: 4.7,
      popularSubjects: ["Mathematics", "Programming", "Algorithms"],
      weeklyTrend: [12, 19, 15, 17, 14, 16, 18],
      learnerEngagement: 78
    };
    setAnalyticsData(mockAnalyticsData);
  };

  const fetchLearners = async () => {
    if (users.length > 0) return;
    
    setIsLoadingLearners(true);
    try {
      console.log("Fetching learners from API...");
      // const token = getCookie('MindMateToken');
      const res = await api.get('/api/mentor/learners', {
        timeout: 50000,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          // ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      console.log("Learners API Response:", res.data);
      setUsers(res.data);
      
    } catch (error) {
      console.error('Error fetching learners:', error);
    } finally {
      setIsLoadingLearners(false);
    }
  };

  const fetchSchedules = async () => {
    if (todaySchedule.length > 0) return;
    
    setIsLoadingSchedules(true);
    try {
      console.log("Fetching schedules from API...");
      // const token = getCookie('MindMateToken');
      const res = await api.get('/api/mentor/schedules', {
        timeout: 50000,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          // ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      setTodaySchedule(res.data.todaySchedule || []);
      setUpcomingSchedule(res.data.upcomingSchedule || []);
      console.log("Schedules fetched:", res.data);
      
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  const fetchFeedbacks = async () => {
    if (feedbacks.length > 0) return;
    
    setIsLoadingFeedbacks(true);
    try {
      console.log("Fetching feedbacks from API...");
      // const token = getCookie('MindMateToken');
      const res = await api.get('/api/mentor/feedbacks', {
        timeout: 50000,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          // ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      console.log("Feedbacks API Response:", res.data);
      setFeedbacks(res.data);
      
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setIsLoadingFeedbacks(false);
    }
  };

  const fetchForumData = async () => {
    try {
      console.log("Fetching forum data...");
      const res = await api.get('/api/forum/posts', {
        timeout: 50000,
        withCredentials: true,
      });
      
      console.log("Forum API Response:", res.data);
      // normalize to expected ForumData[]
      if (Array.isArray(res.data)) {
        const mapped = res.data.map((p: any) => ({
          id: p.id || p._id || '',
          title: p.title || '',
          content: p.content || '',
          author: typeof p.author === 'string' ? p.author : (p.author?.toString?.() || ''),
          authorName: p.authorName || '',
          createdAt: p.createdAt || new Date().toISOString(),
          upvotes: typeof p.upvotes === 'number' ? p.upvotes : 0,
          downvotes: typeof p.downvotes === 'number' ? p.downvotes : 0,
          commentsCount: typeof p.commentsCount === 'number' ? p.commentsCount : (p.commentsCount ?? 0),
          topics: p.topics || 'General',
          tags: p.tags || [],
          userVote: null
        }));
        setForumData(mapped);
      } else {
        setForumData([]);
      }
      
    } catch (error) {
      console.error('Error fetching forum data:', error);
      setForumData([]);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      console.log("Fetching analytics data...");
      const res = await api.get('/api/mentor/session/analytics', {
        timeout: 50000,
        withCredentials: true,
      });
      
      console.log("Analytics API Response:", res.data);
      if (res.data?.data) {
        setAnalyticsData(res.data.data);
      }
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Error fetching analytics data');
    }
  };

  const getFiles = async () => {
    try {
      console.log("Fetching files...");
      const mockFiles = [
        { id: 1, name: "Mathematics_Notes.pdf", size: "2.4 MB", date: "2024-01-10" },
        { id: 2, name: "Programming_Exercises.zip", size: "5.1 MB", date: "2024-01-08" },
      ];
      setFiles(mockFiles);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  const switchComponent = (component: string) => {
    console.log('Switching to component:', component);
    if (activeComponent !== component) {
      setActiveComponent(component);
    }
    if (isMobileView) {
      setIsSidebarVisible(false);
    }
    const newIndex = TOPBAR_ITEMS.findIndex(item => item.key === component);
    if (newIndex >= 0) {
      setFocusedTopbarIndex(newIndex);
    }
  };

  const toggleShowAllCourses = () => {
    console.log('Toggle clicked, current state:', showAllCourses);
    setShowAllCourses(!showAllCourses);
    console.log('New state should be:', !showAllCourses);
  };

  const registerLearnerRole = async () => {
    try {
      if(roleData?.altRole !== null && roleData?.altRole === 'learner') {
        toast.info('You have already registered as a Learner.');
        return;
      }

      router.replace('/info/learner/alt');
    } catch (error) {
      console.error('Error registering role:', error);
    }
  };

  const switchRole = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    try {
      if (roleData?.altRole === null) { 
        toast.error('No alternate role registered. Please register as a Learner first.');
        return;
      }
      const res = await api.post('/api/auth/switch-role', {}, { withCredentials: true });

      if (res.status === 200) {
        const newRole = res.data?.newRole;
        toast.success(`Role switched to ${newRole}. Please log in again.`);
        try { document.cookie = 'MindMateToken=; Max-Age=0; path=/'; } catch {}
        localStorage.removeItem('auth_token');
        router.replace('/auth/login');
      } else if (res.status === 403) {
        toast.error('Mentor account still pending approval. Cannot switch roles at this time.');
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

  const openLogoutModal = () => setShowLogoutModal(true);
  const cancelLogout = () => setShowLogoutModal(false);
  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
  };
  
  const openEditInformation = () => {
    setShowEditInformation(true);
  };

  const handleSaveInformation = (updatedData: UserData) => {
    setUserData(updatedData);
    setShowEditInformation(false);
  };

  const handleCancelEdit = () => {
    setShowEditInformation(false);
  };

  const handleUpdateUserData = (updatedData: Partial<UserData>) => {
    setUserData(prev => ({
      ...prev,
      ...updatedData
    }));
  };

  const handleOfferConfirm = () => {
    setShowOffer(false);
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
      } else {
        setIsSidebarVisible(false);
      }
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
        setFocusedTopbarIndex(TOPBAR_ITEMS.length - 1);
        break;
      case 'Escape':
        e.preventDefault();
        setIsTopbarFocused(false);
        break;
    }
  };

  const navigateTopbar = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      setFocusedTopbarIndex((prev) => (prev + 1) % TOPBAR_ITEMS.length);
    } else {
      setFocusedTopbarIndex((prev) => (prev - 1 + TOPBAR_ITEMS.length) % TOPBAR_ITEMS.length);
    }
  };

  const activateTopbarItem = () => {
    const focusedItem = TOPBAR_ITEMS[focusedTopbarIndex];
    switchComponent(focusedItem.key);
  };

  const focusTopbar = () => {
    setIsTopbarFocused(true);
    const currentIndex = TOPBAR_ITEMS.findIndex(item => item.key === activeComponent);
    setFocusedTopbarIndex(currentIndex >= 0 ? currentIndex : 0);
  };

  const ErrorDisplay = () => {
    if (!apiError) return null;
    
    return (
      <div className={styles.apiErrorBanner}>
        <div className={styles.errorContent}>
          <span className={styles.errorIcon}>⚠️</span>
          <span className={styles.errorMessage}>{apiError}</span>
          <button 
            className={styles.errorClose}
            onClick={() => setApiError(null)}
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  /*
  const AccessibilityNavPad = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [focusedNavIndex, setFocusedNavIndex] = useState(0);

    const navItems = TOPBAR_ITEMS;

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.altKey && e.key === 'n') {
          e.preventDefault();
          setIsVisible(prev => !prev);
          const currentIndex = navItems.findIndex(item => item.key === activeComponent);
          setFocusedNavIndex(currentIndex >= 0 ? currentIndex : 0);
        }

        if (isVisible) {
          switch (e.key) {
            case 'ArrowLeft':
              e.preventDefault();
              navigateNavItems('left');
              break;
            case 'ArrowRight':
              e.preventDefault();
              navigateNavItems('right');
              break;
            case 'Enter':
            case ' ':
              e.preventDefault();
              activateFocusedNavItem();
              break;
            case 'Escape':
              e.preventDefault();
              setIsVisible(false);
              break;
            case 'Home':
              e.preventDefault();
              setFocusedNavIndex(0);
              break;
            case 'End':
              e.preventDefault();
              setFocusedNavIndex(navItems.length - 1);
              break;
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isVisible, focusedNavIndex, activeComponent]);

    const navigateNavItems = (direction: 'left' | 'right') => {
      if (direction === 'right') {
        setFocusedNavIndex((prev) => (prev + 1) % navItems.length);
      } else {
        setFocusedNavIndex((prev) => (prev - 1 + navItems.length) % navItems.length);
      }
    };

    const activateFocusedNavItem = () => {
      const focusedItem = navItems[focusedNavIndex];
      setActiveComponent(focusedItem.key);
    };

    const quickNavigate = (component: string) => {
      setActiveComponent(component);
      const index = navItems.findIndex(item => item.key === component);
      if (index >= 0) {
        setFocusedNavIndex(index);
      }
    };

    const handleNavPadClose = () => {
      setIsVisible(false);
      const currentIndex = navItems.findIndex(item => item.key === activeComponent);
      setFocusedNavIndex(currentIndex >= 0 ? currentIndex : 0);
    };

    if (!isVisible) return null;

    return (
      <>
        <div className={styles.accessibilityNavPadOverlay} onClick={handleNavPadClose}></div>
        <div className={styles.accessibilityNavPad}>
          <div className={styles.navPadHeader}>
            <h3>Accessibility Navigation</h3>
            <button 
              className={styles.closeNavPad} 
              onClick={handleNavPadClose}
              aria-label="Close navigation pad"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className={styles.navPadControls}>
            <div className={styles.navVisualIndicator}>
              <div className={styles.navTrack}>
                {navItems.map((item, index) => (
                  <div
                    key={item.key}
                    className={`${styles.navPoint} ${index === focusedNavIndex ? styles.focused : ''} ${
                      item.key === activeComponent ? styles.active : ''
                    }`}
                    onClick={() => {
                      setFocusedNavIndex(index);
                      activateFocusedNavItem();
                    }}
                  >
                    <div className={styles.navPointIcon}>
                      <img src={item.icon} alt={item.label} />
                    </div>
                    <span className={styles.navPointLabel}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.navDirection}>
              <button 
                className={styles.navBtn}
                onClick={() => navigateNavItems('left')}
                aria-label="Navigate to previous nav item"
              >
                <i className="fas fa-arrow-left"></i>
                <span>Previous</span>
              </button>
              
              <div className={styles.navDisplay}>
                <span className={styles.currentNavItem}>
                  {navItems[focusedNavIndex]?.label}
                </span>
                <span className={styles.navPosition}>
                  {focusedNavIndex + 1} of {navItems.length}
                </span>
              </div>
              
              <button 
                className={styles.navBtn}
                onClick={() => navigateNavItems('right')}
                aria-label="Navigate to next nav item"
              >
                <span>Next</span>
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>

            <div className={styles.navActivation}>
              <button 
                className={styles.activateBtn}
                onClick={activateFocusedNavItem}
                aria-label={`Activate ${navItems[focusedNavIndex]?.label} section`}
              >
                <i className="fas fa-arrow-right-to-bracket"></i>
                Activate {navItems[focusedNavIndex]?.label}
              </button>
            </div>

            <div className={styles.quickNavGrid}>
              {navItems.map((item, index) => (
                <button 
                  key={item.key}
                  className={`${styles.quickNavBtn} ${item.key === activeComponent ? styles.active : ''} ${
                    index === focusedNavIndex ? styles.focused : ''
                  }`}
                  onClick={() => quickNavigate(item.key)}
                >
                  <img src={item.icon} alt={item.label} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <div className={styles.navShortcuts}>
              <div className={styles.shortcutItem}>
                <kbd>←</kbd> / <kbd>→</kbd>
                <span>Navigate Nav Items</span>
              </div>
              <div className={styles.shortcutItem}>
                <kbd>Enter</kbd> / <kbd>Space</kbd>
                <span>Activate Focused Item</span>
              </div>
              <div className={styles.shortcutItem}>
                <kbd>Home</kbd> / <kbd>End</kbd>
                <span>Jump to First/Last</span>
              </div>
              <div className={styles.shortcutItem}>
                <kbd>ESC</kbd>
                <span>Close Navigation Pad</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };
  */

  const renderComponent = () => {
    const MainComp: any = MainComponent;
    const SessionComp: any = SessionComponent;
    const ReviewsComp: any = ReviewsComponent;
    const FilesComp: any = FilesComponent;
    const FileManagerComp: any = FileManagerComponent;
    const CommunityForumComp: any = CommunityForumComponent;
    const SessionAnalyticsComp: any = SessionAnalyticsComponent;

    const mainContent = (() => {
      switch (activeComponent) {
        case 'main':
          return (
            <MainComp 
              users={users.map(u => ({
                id: u.id,
                name: u.name,
                yearLevel: u.yearLevel,
                program: u.program,
                image: u.image
              }))}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setUserId={(id: string | null) => setUserId(id)}
              mentorData={userData}
              userData={userData}
            />
          );
        case 'session':
          return <SessionComp 
            schedule={todaySchedule} 
            upcomingSchedule={upcomingSchedule}
            userData={{
              ...userData,
              onOpenGroupInvite: (sessionId: string) => {
                setSelectedGroupSessionId(sessionId);
                setShowGroupInviteModal(true);
              }
            }}
            onScheduleCreated={fetchSchedules}
          />;
        case 'reviews':
          return <ReviewsComp 
            feedbacks={feedbacks}
            userData={userData}
          />;
        case 'files':
          return <FilesComp 
            files={files} 
            setFiles={setFiles}
            userData={userData}
          />;
        case 'fileManage':
          return <FileManagerComp 
            files={files} 
            setFiles={setFiles}
            userData={userData}
          />;
        case 'community':
          return <CommunityForumComp 
            forumData={forumData}
            userData={userData}
            onForumUpdate={fetchForumData}
          />;
        case 'analytics':
          return <SessionAnalyticsComp 
            analyticsData={analyticsData}
            userData={userData}
            onDataRefresh={fetchAnalyticsData}
          />;
        case 'logout':
          return null;
        default:
          return (
            <MainComp 
              users={filteredUsers}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setUserId={setUserId}
              mentorData={userData}
              userData={userData}
            />
          );
      }
    })();
    return <>{mainContent}</>;
  };
  
  useEffect(() => {
    if (activeComponent === 'logout') {
      setShowLogoutModal(true);
      setActiveComponent('main');
    }
  }, [activeComponent]);

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
          fetchLearners(),
          fetchSchedules(),
          fetchFeedbacks(),
          getFiles(),
          fetchForumData(),
          fetchAnalyticsData(),
        ]);
      } catch (error) {
        console.error("Critical error during initialization:", error);
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
    console.log('Courses Debug:', {
      subjects,
      displayedCourses,
      remainingCoursesCount,
      showAllCourses
    });
  }, [subjects, displayedCourses, remainingCoursesCount, showAllCourses]);

  useEffect(() => {
    console.log("Current mentor userData state:", userData);
  }, [userData]);

  return (
    <div className={styles.mentorPage}>
      <ErrorDisplay />
      
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingBackdrop}></div>
          <div className={styles.loadingSpinner}>Loading...</div>
        </div>
      )}

      {showEditInformation && (
        <EditInformationComponent 
          userData={userData}
          onSave={handleSaveInformation}
          onCancel={handleCancelEdit}
          onUpdateUserData={handleUpdateUserData}
        />
      )}
      
      {/* <AccessibilityNavPad /> */}
      
      {showLogoutModal && (
        <LogoutComponent
          // userData={userData}
          // onConfirm={confirmLogout}
          onCancel={cancelLogout}
        />
      )}

      {showBadgesPopup && (
        <div
          className={styles.badgesOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Mentor medals"
          onClick={() => setShowBadgesPopup(false)}
        >
          <div
            className={styles.badgesModal}
            onClick={(e) => e.stopPropagation()}
            style={{
              margin: 'auto',
              position: 'relative',
              maxHeight: '80vh',
              width: 'min(920px, 92vw)',
              overflow: 'auto'
            }}
          >
            <div className={styles.badgesHeader}>
              <h3>Badges</h3>
              <button
                className={styles.badgesClose}
                onClick={() => setShowBadgesPopup(false)}
                aria-label="Close medals"
              >
                ×
              </button>
            </div>

            <div className={styles.badgesSubheader}>
              <span className={styles.latestDot} /> Latest
            </div>

            <div className={styles.badgesGrid}>
              {(badges || []).map((b, i) => {
                const def = b.definition || undefined;
                const name = def?.name || b.badgeKey;
                const desc = def?.description || '';
                return (
                  <div key={`${b.badgeKey}-${i}`} className={styles.badgeCard}>
                    <HexBadge badge={b} />
                    <div className={styles.badgeMeta}>
                      <div className={styles.badgeName}>{name}</div>
                      {desc ? (
                        <div className={styles.badgeDesc}>{desc}</div>
                      ) : null}
                      <div className={styles.badgeDate}>
                        {new Date(b.awardedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!badges || badges.length === 0) && (
                <div className={styles.emptyBadges}>
                  No medals yet. Complete activities to earn medals.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/*
      <button 
        className={styles.accessibilityToggleBtn}
        onClick={() => setShowAccessibilityNav(prev => !prev)}
        aria-label="Toggle accessibility navigation"
        title="Accessibility Navigation (Ctrl+Alt+N)"
      >
        <i className="fas fa-universal-access"></i>
      </button>
      */}

      {isMobileView && (
        <button className={styles.sidebarToggle} onClick={toggleSidebar}>
          ☰
        </button>
      )}

      {isMobileView && isSidebarVisible && (
        <div className={styles.sidebarOverlay} onClick={toggleSidebar}></div>
      )}

      <div 
        className={`${styles.sidebar} ${
          isMobileView ? styles.sidebarMobile : ''
        } ${
          isMobileView && isSidebarVisible ? styles.sidebarMobileVisible : ''
        }`}
      >
        <div className={styles.logoContainer}>
          <img src="/logo_gccoed.png" alt="GCCoEd Logo" className={styles.logo} />
          <span className={styles.logoText}>MindMates</span>
        </div>

        <div className={styles.upperElement}>
          <div>
            <h1>Hi, Mentor!</h1>
            <img
              src={userData.image || 'https://placehold.co/600x400'}
              alt="profile-pic"
              width={100}
              height={100}
              style={{ borderRadius: '50%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.src = 'https://placehold.co/600x400';
              }}
            />
          </div>
          <div>
            <h2>{userData.name}</h2>
            <i><p>{userData.yearLevel}</p></i>
            <p style={{ marginBottom: '-1.5rem' }}>{courseAbbreviation}</p>
          </div>
        </div>

        <div className={styles.footerElement}>
          <div className={styles.medalsSection} style={{ 
            marginTop: '0.1rem',
            marginBottom: '0.5rem' 
          }}>
            <div className={styles.medalsHeader}>
              <h1 style={{ 
                fontSize: '1rem', 
                marginBottom: '0.1rem'
              }}>Badges</h1>
              <button
                className={styles.viewAllBadgesBtn}
                onClick={() => setShowBadgesPopup(true)}
                style={{ 
                  fontSize: '0.8rem',
                  padding: '2px 8px',
                  height: 'auto'
                }}
              >
                View All
              </button>
            </div>

            <div className={styles.medalsLatestRow} style={{ marginTop: '0.2rem' }}>
              <span className={styles.latestLabel} style={{ 
                fontSize: '0.8rem',
                marginBottom: '0.1rem'
              }}>Latest</span>
              <div className={styles.badgeRow} style={{ 
                transform: 'scale(0.8)', 
                transformOrigin: 'left',
                marginTop: '0.1rem'
              }}>
                {(badges || []).slice(0, 3).map((b, i) => (
                  <HexBadge key={`${b.badgeKey}-${i}`} badge={b} />
                ))}
                {(!badges || badges.length === 0) && (
                  <div className={styles.noBadgesText}>No medals yet</div>
                )}
              </div>
            </div>
          </div>
          
          <div className={styles.availability}>
            <h1>Availability</h1>
            <div className={styles.lines}>
              <h3>Days:</h3>
              <div>
                <p>{userData.availability?.join(", ") || 'Not specified'}</p>
              </div>
            </div>
            <div className={styles.lines}>
              <h3>Duration:</h3>
              <div>
                <p>{userData.sessionDur || 'Not specified'}</p>
              </div>
            </div>
          </div>

          <div className={styles.courseOffered}>
            <h1>Course Offered</h1>
            
            <div className={styles.courseGrid}>
              {displayedCourses.map((card, index) => (
                <div key={index} className={styles.courseCard}>
                  <div className={styles.lines}>
                    <div>
                      <p title={card}>{card}</p>
                    </div>
                  </div>
                </div>
              ))}
              {remainingCoursesCount > 0 && (
                <div 
                  className={`${styles.courseCard} ${styles.remainingCourses}`} 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleShowAllCourses();
                  }}
                  style={{ cursor: 'pointer' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleShowAllCourses();
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Show all ${subjects.length} courses`}
                >
                  <div className={styles.lines}>
                    <div>
                      <p style={{ color: '#007bff', fontWeight: 'bold' }}>
                        +{remainingCoursesCount} more
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {showAllCourses && (
              <div className={styles.allCoursesPopup}>
                <div className={styles.popupOverlay} onClick={toggleShowAllCourses}></div>
                <div className={styles.popupContent}>
                  <h3>All Courses Offered ({subjects.length})</h3>
                  <div className={styles.popupCourses}>
                    {subjects.map((course, index) => (
                      <div key={index} className={styles.popupCourse}>
                        {course}
                      </div>
                    ))}
                  </div>
                  <button 
                    className={styles.closePopup}
                    onClick={toggleShowAllCourses}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className={styles.accountActions}>
            <div className={styles.accountDropdown}>
              <button className={styles.accountDropbtn}>
                <img src="/person.svg" alt="Account" className={styles.accountIcon} />
                Account
              </button>
              <div className={styles.accountDropdownContent}>
                <a onClick={openEditInformation} style={{ cursor: 'pointer' }}>
                  <img src="/edit.svg" alt="Edit" /> Edit Information
                </a>
                <a onClick={registerLearnerRole} style={{ cursor: 'pointer' }}>
                  <img src="/register.svg" alt="Register" /> Register as Learner
                </a>
                <a onClick={switchRole} style={{ cursor: 'pointer' }}>
                  <img src="/switch.svg" alt="Switch" /> Switch Account Role
                </a>
                <a onClick={openLogoutModal} style={{ cursor: 'pointer' }}>
                  <img src="/logout.svg" alt="Logout" /> Logout
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div 
        ref={topbarRef}
        className={`${styles.topbar} ${
          isMobileView && !isSidebarVisible ? styles.topbarExpanded : ''
        } ${isTopbarFocused ? styles.topbarFocused : ''}`}
        tabIndex={0}
        onKeyDown={handleTopbarKeyDown}
        onFocus={focusTopbar}
        onBlur={() => setIsTopbarFocused(false)}
        onClick={focusTopbar}
      >
        <div className={styles.topbarLeft}>
          {TOPBAR_ITEMS.map((item, index) => (
            <div 
              key={item.key}
              onClick={() => switchComponent(item.key)}
              className={`${styles.topbarOption} ${
                activeComponent === item.key ? styles.active : ''
              } ${index === focusedTopbarIndex && isTopbarFocused ? styles.focused : ''}`}
            >
              <img src={item.icon} alt={item.label} className={styles.navIcon} />
              <span className={styles.navText}>{item.label}</span>
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
        className={`${styles.mainContent} ${
          isMobileView && !isSidebarVisible ? styles.contentExpanded : ''
        }`}
        style={{ position: 'relative' }}
      >
        {renderComponent()}
      </div>

      {showOffer && (
        <div className={styles.offerPopup}>
          <div className={styles.popupContainer}>
            <h3>Make Offer to Student</h3>
            <div className={styles.formGroup}>
                <label htmlFor="subject-select">Subject:</label>
                <select id="subject-select">
                  {subjects.map((subject, index) => (
                    <option key={index} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
            <div className={styles.formGroup}>
              <label>Date:</label>
              <input type="date" aria-label="Date" />
            </div>
            <div className={styles.formGroup}>
              <label>Time:</label>
              <input type="time" aria-label="Time" />
            </div>
            <div className={styles.formActions}>
              <button onClick={() => setShowOffer(false)}>Cancel</button>
              <button onClick={handleOfferConfirm}>Send Offer</button>
            </div>
          </div>
        </div>
      )}
      {/* Chatbot visible only on mentor page */}
      <ChatbotWidget />
    </div>
  );
}
