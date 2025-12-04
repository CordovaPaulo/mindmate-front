"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { splineCurve } from 'chart.js/helpers';
import api from '@/lib/axios';
import { checkAuth } from '@/lib/auth';
import Dashboard from '@/components/adminpage/dashboard/page';
import Applications from '@/components/adminpage/applications/page';
import Users from '@/components/adminpage/users/page'; 
import ForumMonitoring from '@/components/adminpage/forumMonitoring/page';
import styles from './admin.module.css';
import { toast } from 'react-toastify';

interface User {
  roleId: any;
  name: any;
  email: any;
  gender?: any;
  course?: any;
  program?: any;
  role: any;
  secondaryRole?: any;
  yearLevel?: any;
  secondRole?: any;
  studentId?: any;
}

interface Applicant {
  id: any;
  name: any;
  email: any;
  program: any;
  status: any;
}

interface Stats {
  activeLearners: number;
  approvedMentors: number;
  pendingMentors: number;
}

interface ChartData {
  userCounts: any | null;
  courseBreakdown: any | null;
  yearBreakdown: any | null;
}

const AdminProfile: React.FC = () => {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(false);
  const [isMobileView, setIsMobileView] = useState<boolean>(false);
  const [adminNameValue, setAdminNameValue] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [stats, setStats] = useState<Stats>({
    activeLearners: 0,
    approvedMentors: 0,
    pendingMentors: 0,
  });
  const [chartData, setChartData] = useState<ChartData>({
    userCounts: null,
    courseBreakdown: null,
    yearBreakdown: null,
  });
  const [usersFetch, setUsersFetch] = useState<User[]>([]);
  const [applicantsList, setApplicantsList] = useState<any[]>([]);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const auth = await checkAuth();
        
        if (!auth.authenticated) {
          toast.error('Please log in to access this page');
          router.replace('/auth/login');
          return;
        }

        if (auth.user?.role !== 'admin') {
          toast.error('Access denied. This page is for administrators only.');
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
    const initializeData = async (): Promise<void> => {
      setIsLoading(true);
      
      checkMobileView();
      window.addEventListener('resize', checkMobileView);

      setCurrentDate(new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }));

      try {
        await Promise.all([fetchAll(), fetchApplicants(), fetchAdminName()]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();

    return () => {
      window.removeEventListener('resize', checkMobileView);
    };
  }, []);

  const checkMobileView = () => {
    const mobile = window.innerWidth <= 768;
    setIsMobileView(mobile);
    if (!mobile) {
      setIsSidebarVisible(true);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const fetchAdminName = async (): Promise<void> => {
    try {
      const response = await api.get('/api/admin/profile');
      if (response.status === 200) {
        setAdminNameValue(response.data.name || 'Admin');
      }
    } catch (error) {
      console.error('Error fetching admin name:', error);
    }
  };

  const fetchAll = async (): Promise<void> => {
    try {
      const statsResponse = await api.get('/api/admin/stats');
      const learnerResponse = await api.get('/api/admin/learners');
      const mentorResponse = await api.get('/api/admin/mentors');

      const learners = (learnerResponse.data || []).map((u: any) => ({ ...u, _profileType: 'learner' }));
      const mentors  = (mentorResponse.data  || []).map((u: any) => ({ ...u, _profileType: 'mentor'  }));

      const byUser = new Map<string, any>();
      const pushWithPriority = (u: any) => {
        const key = String(u.userId || u.roleId || u.email);
        const existing = byUser.get(key);
        const thisMatchesPrimary = u.role === u._profileType;

        if (!existing) {
          byUser.set(key, u);
          return;
        }

        const existingMatchesPrimary = existing.role === existing._profileType;

        if (thisMatchesPrimary && !existingMatchesPrimary) {
          byUser.set(key, u);
        }
      };

      [...learners, ...mentors].forEach(pushWithPriority);

      const deduped = Array.from(byUser.values());

      const usersData: User[] = deduped.map((user: any) => ({
        roleId: user.roleId,
        name: user.name,
        email: user.email,
        role: user.role,
        secondRole: user.secondRole,
        yearLevel: user.yearLevel,
        program: user.program,
        studentId: user.studentId,
        phoneNumber: user.phoneNumber,
        sex: user.sex,
        address: user.address,
      }));

      setUsersFetch(usersData);

      setStats({
        activeLearners: statsResponse.data.learnerCount || 0,
        approvedMentors: statsResponse.data.approvedMentorCount || 0,
        pendingMentors: statsResponse.data.pendingMentorCount || 0,
      });

      setChartData({
        userCounts: { 
          activeLearners: statsResponse.data.learnerCount,
          approvedMentors: statsResponse.data.approvedMentorCount,
          pendingMentors: statsResponse.data.pendingMentorCount
        },
        courseBreakdown: statsResponse.data.courseCount || null,
        yearBreakdown: statsResponse.data.yearLevelCount || null,
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      setChartData({
        userCounts: null,
        courseBreakdown: null,
        yearBreakdown: null,
      });
    }
  };

  const fetchApplicants = async (): Promise<void> => {
    try {
      const response = await api.get('/api/admin/mentors');
      setApplicantsList(response.data);
    } catch (error) {
      console.error('Error fetching applicants:', error);
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await api.post('/api/auth/logout', {}, { withCredentials: true });
      setShowLogoutModal(false);
      router.replace('/auth/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Error during logout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const LoadingOverlay: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
    if (!isLoading) return null;
    return (
      <div className={styles.loadingOverlay}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  };

  return (
    <>
      <div className={styles.profilePage}>
        <LoadingOverlay isLoading={isLoading} />

        {isMobileView && (
          <button
            className={styles.sidebarToggle}
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
           >
          <svg className={styles.toggleIcon} viewBox="0 0 24 24">
        <path
      fill="currentColor"
      d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z"
    />
  </svg>
</button>

        )}

        {isMobileView && isSidebarVisible && (
          <div className={styles.sidebarOverlay} onClick={toggleSidebar}></div>
        )}

        <header className={`${styles.appHeader} ${isMobileView && !isSidebarVisible ? styles.headerExpanded : ''}`}>
          <div className={styles.profileSection}>
            <div className={styles.avatarContainer}>
              <img
                alt="Profile image"
                className={styles.avatar}
                src="https://gordoncollegeccs.edu.ph/ccs/students/lamp/assets/profile.jpg"
              />
            </div>
            <div className={styles.profileMeta}>
              <h1 className={styles.profileName}>{adminNameValue}</h1>
              <p className={styles.profileTitle}>
                College of Computer Studies | Program Coordinator
              </p>
            </div>
          </div>
          <div className={styles.topbarDate}>
            <svg className={styles.dateIcon} width="16" height="16" viewBox="0 0 24 24" fill="#066678">
              <path d="M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19M7,10H12V15H7V10Z"/>
            </svg>
            {currentDate}
          </div>
        </header>

        <div className={styles.mainContainer}>
          <aside className={`${styles.sidebar} ${isMobileView ? styles.sidebarMobile : ''} ${isSidebarVisible ? styles.sidebarMobileVisible : ''}`}>
            <nav className={styles.appNavigation}>
              <button
                className={`${styles.navBtn} ${activeTab === 'dashboard' ? styles.navBtnActive : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <svg className={styles.navIcon} viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M13,3V9H21V3M13,21H21V11H13M3,21H11V15H3M3,13H11V3H3V13Z"
                  />
                </svg>
                Dashboard
              </button>
              <button
                className={`${styles.navBtn} ${activeTab === 'application' ? styles.navBtnActive : ''}`}
                onClick={() => setActiveTab('application')}
              >
                <svg className={styles.navIcon} viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"
                  />
                </svg>
                Applications
              </button>
              <button
                className={`${styles.navBtn} ${activeTab === 'users' ? styles.navBtnActive : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <svg className={styles.navIcon} viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"
                  />
                </svg>
                Users
              </button>
              <button
                className={`${styles.navBtn} ${activeTab === 'forumposts' ? styles.navBtnActive : ''}`}
                onClick={() => setActiveTab('forumposts')}
              >
                <svg className={styles.navIcon} viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M21,6V8H3V6H21M3,18H12V16H3V18M3,13H21V11H3V13Z"
                  />
                </svg>
                Forum Posts
              </button>

              <div className={styles.navBottom}>
                <button 
                  className={`${styles.navBtn} ${styles.logoutBtn}`} 
                  onClick={() => setShowLogoutModal(true)}
                >
                  <svg className={styles.navIcon} viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M16,17V14H9V10H16V7L21,12L16,17M14,2A2,2 0 0,1 16,4V6H14V4H5V20H14V18H16V20A2,2 0 0,1 14,22H5A2,2 0 0,1 3,20V4A2,2 0 0,1 5,2H14Z"
                    />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </nav>
          </aside>

          <main className={`${styles.contentArea} ${isMobileView && !isSidebarVisible ? styles.contentExpanded : ''}`}>
            {activeTab === 'dashboard' && (
              <Dashboard stats={stats} chartData={chartData} />
            )}
            {activeTab === 'application' && (
              <Applications 
                applicants={applicantsList}
                onUpdateApplicants={fetchApplicants}
              />
            )}
            {activeTab === 'users' && (
              <Users 
                users={usersFetch}
                onUpdateUsers={fetchAll}
              />
            )}
            {activeTab === 'forumposts' && (
              <ForumMonitoring />
            )}
          </main>
        </div>

        {showLogoutModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <h2>Confirm Logout</h2>
              <p>Are you sure you want to logout?</p>
              <div className={styles.modalButtons}>
                <button onClick={handleLogout} className={styles.confirmBtn}>
                  Logout
                </button>
                <button onClick={() => setShowLogoutModal(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default AdminProfile;