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
import api from "@/lib/axios";
import './mentor.css';
import { toast } from 'react-toastify';
import Pusher from 'pusher-js';

// Interfaces
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

// Constants
const TOPBAR_ITEMS = [
  { key: 'main', label: 'Learners', icon: '/main.svg' },
  { key: 'session', label: 'Schedules', icon: '/calendar.svg' },
  { key: 'reviews', label: 'Reviews', icon: '/records.svg' },
  { key: 'files', label: 'Files', icon: '/uploadCloud.svg' },
  { key: 'fileManage', label: 'File Manager', icon: '/files.svg' }
];

// Helper Functions
function getCookie(name: string) {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="stars">
      {[...Array(5)].map((_, i) => (
        <span key={i} className={i < Math.round(rating) ? 'filledStar' : 'emptyStar'}>
          {i < Math.round(rating) ? '★' : '☆'}
        </span>
      ))}
    </div>
  );
};

export default function MentorPage() {
  const router = useRouter();
  
  // State Declarations
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
  
  const [users, setUsers] = useState<LearnerFromAPI[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<Schedule[]>([]);
  const [upcomingSchedule, setUpcomingSchedule] = useState<Schedule[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [roleData, setRoleData] = useState<RoleData | null>(null);
  
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOffer, setShowOffer] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [activeComponent, setActiveComponent] = useState("main");
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showEditInformation, setShowEditInformation] = useState(false);
  const [showAccessibilityNav, setShowAccessibilityNav] = useState(false);
  const [focusedTopbarIndex, setFocusedTopbarIndex] = useState(0);
  const [isTopbarFocused, setIsTopbarFocused] = useState(false);
  const [mentorData, setMentorData] = useState<any | null>(null);

  // Refs
  const topbarRef = useRef<HTMLDivElement>(null);

  // Computed Properties
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

  // proxy code
  useEffect(() => {
    // Initialize only after the mentor's User id is available
    if (!userData?.userId) return;

    // Optional: enable client logs while testing
    // @ts-ignore
    Pusher.logToConsole = true;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: `/api/pusher-auth`,
    });

    const channelName = `private-user-${userData.userId}`; // userId only
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

  // API Functions
  const fetchUserData = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      console.log("Starting fetchUserData...");
      const token = getCookie('MindMateToken');
      console.log("Token:", token ? "Found" : "Not found");
      
      try {
        const res = await api.get('/api/mentor/profile', {
          timeout: 10000,
          withCredentials: true,
        });
        
        if (res.data && res.data.userData) {
          setUserData(res.data.userData);
          setRoleData(res.data.roleData);
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
  };

  const fetchLearners = async () => {
    if (users.length > 0) return;
    
    setIsLoadingLearners(true);
    try {
      console.log("Fetching learners from API...");
      const token = getCookie('MindMateToken');
      const res = await api.get('/api/mentor/learners', {
        timeout: 10000,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
      const token = getCookie('MindMateToken');
      const res = await api.get('/api/mentor/schedules', {
        timeout: 10000,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
      const token = getCookie('MindMateToken');
      const res = await api.get('/api/mentor/feedbacks', {
        timeout: 10000,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

  // Component Functions
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

  // Account Functions
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
  // Edit Information Functions
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

  // UI Functions
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

  // Loading Functions
  const startLoading = () => setIsLoading(true);
  const stopLoading = () => setIsLoading(false);

  // Keyboard Navigation Functions
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

  // Components
  const ErrorDisplay = () => {
    if (!apiError) return null;
    
    return (
      <div className="api-error-banner">
        <div className="error-content">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{apiError}</span>
          <button 
            className="error-close"
            onClick={() => setApiError(null)}
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  const AccessibilityNavPad = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [focusedNavIndex, setFocusedNavIndex] = useState(0);

    const navItems = [
      { key: 'main', label: 'Learners', icon: '/main.svg' },
      { key: 'session', label: 'Schedules', icon: '/calendar.svg' },
      { key: 'reviews', label: 'Reviews', icon: '/records.svg' },
      { key: 'files', label: 'Files', icon: '/uploadCloud.svg' },
      { key: 'fileManage', label: 'File Manager', icon: '/files.svg' }
    ];

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
        <div className="accessibility-nav-pad-overlay" onClick={handleNavPadClose}></div>
        <div className="accessibility-nav-pad">
          <div className="nav-pad-header">
            <h3>Accessibility Navigation</h3>
            <button 
              className="close-nav-pad" 
              onClick={handleNavPadClose}
              aria-label="Close navigation pad"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="nav-pad-controls">
            <div className="nav-visual-indicator">
              <div className="nav-track">
                {navItems.map((item, index) => (
                  <div
                    key={item.key}
                    className={`nav-point ${index === focusedNavIndex ? 'focused' : ''} ${
                      item.key === activeComponent ? 'active' : ''
                    }`}
                    onClick={() => {
                      setFocusedNavIndex(index);
                      activateFocusedNavItem();
                    }}
                  >
                    <div className="nav-point-icon">
                      <img src={item.icon} alt={item.label} />
                    </div>
                    <span className="nav-point-label">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="nav-direction">
              <button 
                className="nav-btn left-btn"
                onClick={() => navigateNavItems('left')}
                aria-label="Navigate to previous nav item"
              >
                <i className="fas fa-arrow-left"></i>
                <span>Previous</span>
              </button>
              
              <div className="nav-display">
                <span className="current-nav-item">
                  {navItems[focusedNavIndex]?.label}
                </span>
                <span className="nav-position">
                  {focusedNavIndex + 1} of {navItems.length}
                </span>
              </div>
              
              <button 
                className="nav-btn right-btn"
                onClick={() => navigateNavItems('right')}
                aria-label="Navigate to next nav item"
              >
                <span>Next</span>
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>

            <div className="nav-activation">
              <button 
                className="activate-btn"
                onClick={activateFocusedNavItem}
                aria-label={`Activate ${navItems[focusedNavIndex]?.label} section`}
              >
                <i className="fas fa-arrow-right-to-bracket"></i>
                Activate {navItems[focusedNavIndex]?.label}
              </button>
            </div>

            <div className="quick-nav-grid">
              {navItems.map((item, index) => (
                <button 
                  key={item.key}
                  className={`quick-nav-btn ${item.key === activeComponent ? 'active' : ''} ${
                    index === focusedNavIndex ? 'focused' : ''
                  }`}
                  onClick={() => quickNavigate(item.key)}
                >
                  <img src={item.icon} alt={item.label} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <div className="nav-shortcuts">
              <div className="shortcut-item">
                <kbd>←</kbd> / <kbd>→</kbd>
                <span>Navigate Nav Items</span>
              </div>
              <div className="shortcut-item">
                <kbd>Enter</kbd> / <kbd>Space</kbd>
                <span>Activate Focused Item</span>
              </div>
              <div className="shortcut-item">
                <kbd>Home</kbd> / <kbd>End</kbd>
                <span>Jump to First/Last</span>
              </div>
              <div className="shortcut-item">
                <kbd>ESC</kbd>
                <span>Close Navigation Pad</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderComponent = () => {
    const mainContent = (() => {
      switch (activeComponent) {
        case 'main':
          return (
            <MainComponent 
              users={filteredUsers}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setUserId={setUserId}
              mentorData={userData}
              userData={userData}
            />
          );
        case 'session':
          return <SessionComponent 
            schedule={todaySchedule} 
            upcomingSchedule={upcomingSchedule}
            userData={userData}
            onScheduleCreated={fetchSchedules}
          />;
        case 'reviews':
          return <ReviewsComponent 
            feedbacks={feedbacks}
            userData={userData}
          />;
        case 'files':
          return <FilesComponent 
            files={files} 
            setFiles={setFiles}
            userData={userData}
          />;
        case 'fileManage':
          return <FileManagerComponent 
            files={files} 
            setFiles={setFiles}
            userData={userData}
          />;
        case 'logout': 
          return (
            <MainComponent 
              users={filteredUsers}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setUserId={setUserId}
              mentorData={userData}
              userData={userData}
            />
          );
        default:
          return (
            <MainComponent 
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

    return (
      <>
        {mainContent}
        
        {activeComponent === 'logout' && (
          <LogoutComponent 
            onCancel={() => switchComponent('main')} 
            onLogout={logout}
          />
        )}
      </>
    );
  };

  // Effects
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
    <div className="mentor-page">
      <ErrorDisplay />
      
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-backdrop"></div>
          <div className="loading-spinner">Loading...</div>
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

      <AccessibilityNavPad />

      <button 
        className="accessibility-toggle-btn"
        onClick={() => setShowAccessibilityNav(prev => !prev)}
        aria-label="Toggle accessibility navigation"
        title="Accessibility Navigation (Ctrl+Alt+N)"
      >
        <i className="fas fa-universal-access"></i>
      </button>

      {isMobileView && (
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          ☰
        </button>
      )}

      {isMobileView && isSidebarVisible && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}

      <div 
        className={`sidebar ${
          isMobileView ? 'sidebar-mobile' : ''
        } ${
          isMobileView && isSidebarVisible ? 'sidebar-mobile-visible' : ''
        }`}
      >
        <div className="logo-container">
          <img src="/logo_gccoed.png" alt="GCCoEd Logo" className="logo" />
          <span className="logo-text">MindMates</span>
        </div>

        <div className="upper-element">
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
            <StarRating rating={4.5} />
          </div>
        </div>

        <div className="footer-element">
          <div className="user-information">
            <h1>User Information</h1>
            <div className="lines">
              <h3>Year Level:</h3>
              <div>
                <p>{userData.yearLevel}</p>
              </div>
            </div>

            <div className="lines">
              <h3>Program:</h3>
              <div>
                <p>{courseAbbreviation}</p>
              </div>
            </div>
          </div>
          
          <div className="availability">
            <h1>Availability</h1>
            <div className="lines">
              <h3>Days:</h3>
              <div>
                <p>{userData.availability?.join(", ") || 'Not specified'}</p>
              </div>
            </div>
            <div className="lines">
              <h3>Duration:</h3>
              <div>
                <p>{userData.sessionDur || 'Not specified'}</p>
              </div>
            </div>
          </div>

          <div className="course-offered">
            <h1>Course Offered</h1>
            
            
            <div className="course-grid">
              {displayedCourses.map((card, index) => (
                <div key={index} className="course-card">
                  <div className="lines">
                    <div>
                      <p title={card}>{card}</p>
                    </div>
                  </div>
                </div>
              ))}
              {remainingCoursesCount > 0 && (
                <div 
                  className="course-card remaining-courses" 
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('See More clicked - courses:', subjects.length);
                    toggleShowAllCourses();
                  }}
                  style={{ 
                    cursor: 'pointer',
                    background: '#f0f0f0',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e0e0e0';
                    e.currentTarget.style.borderColor = '#007bff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f0f0f0';
                    e.currentTarget.style.borderColor = '#ccc';
                  }}
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
                  <div className="lines">
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
              <div className="all-courses-popup">
                <div className="popup-overlay" onClick={toggleShowAllCourses}></div>
                <div className="popup-content">
                  <h3>All Courses Offered ({subjects.length})</h3>
                  <div className="popup-courses">
                    {subjects.map((course, index) => (
                      <div key={index} className="popup-course">
                        {course}
                      </div>
                    ))}
                  </div>
                  <button 
                    className="close-popup"
                    onClick={toggleShowAllCourses}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="account-actions">
            <div className="account-dropdown">
              <button className="account-dropbtn">
                <img src="/person.svg" alt="Account" className="account-icon" />
                Account
              </button>
              <div className="account-dropdown-content">
                <a onClick={openEditInformation} style={{ cursor: 'pointer' }}>
                  <img src="/edit.svg" alt="Edit" /> Edit Information
                </a>
                <a onClick={registerLearnerRole} style={{ cursor: 'pointer' }}>
                  <img src="/register.svg" alt="Register" /> Register as Learner
                </a>
                <a onClick={switchRole} style={{ cursor: 'pointer' }}>
                  <img src="/switch.svg" alt="Switch" /> Switch Account Role
                </a>
                <a onClick={() => switchComponent('logout')} style={{ cursor: 'pointer' }}>
                  <img src="/logout.svg" alt="Logout" /> Logout
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div 
        ref={topbarRef}
        className={`topbar ${
          isMobileView && !isSidebarVisible ? 'topbar-expanded' : ''
        } ${isTopbarFocused ? 'topbar-focused' : ''}`}
        tabIndex={0}
        onKeyDown={handleTopbarKeyDown}
        onFocus={focusTopbar}
        onBlur={() => setIsTopbarFocused(false)}
        onClick={focusTopbar}
      >
        <div className="topbar-left">
          {TOPBAR_ITEMS.map((item, index) => (
            <div 
              key={item.key}
              onClick={() => switchComponent(item.key)}
              className={`topbar-option ${
                activeComponent === item.key ? 'active' : ''
              } ${index === focusedTopbarIndex && isTopbarFocused ? 'focused' : ''}`}
            >
              <img src={item.icon} alt={item.label} className="nav-icon" />
              <span className="nav-text">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="topbar-date">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      <div 
        className={`main-content ${
          isMobileView && !isSidebarVisible ? 'content-expanded' : ''
        }`}
        style={{ position: 'relative' }}
      >
        {renderComponent()}
      </div>

      {showOffer && (
        <div className="offer-popup">
          <div className="popup-container">
            <h3>Make Offer to Student</h3>
            <div className="form-group">
              <label>Subject:</label>
              <select>
                {subjects.map((subject, index) => (
                  <option key={index} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Date:</label>
              <input type="date" />
            </div>
            <div className="form-group">
              <label>Time:</label>
              <input type="time" />
            </div>
            <div className="form-actions">
              <button onClick={() => setShowOffer(false)}>Cancel</button>
              <button onClick={handleOfferConfirm}>Send Offer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}