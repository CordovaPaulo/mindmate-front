"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
// import html2pdf from 'html2pdf.js'; // removed: causes "self is not defined"
import styles from "./page.module.css";
import api from '@/lib/axios';
import { toast } from 'react-toastify';

// Interfaces
interface User {
  roleId: any;
  name: any;
  email: any;
  course?: any;
  program?: any;
  role: any;
  secondaryRole?: any;
  yearLevel?: any;
  secondRole?: any;
  studentId?: any;
  phoneNumber?: any;
  sex?: any;
  address?: any;
}

interface DetailedUser extends User {
  phoneNumber?: any;
  sex?: any;
  image?: any;
  address?: any;
  modality?: any;
  availability?: any;
  proficiency?: any;
  style?: any;
  sessionDur?: any;
  subjects?: any;
  status?: any;
  bio?: any;
  exp?: any;
  goals?: any;
}

interface UsersProps {
  users: User[];
  onUpdateUsers: () => void;
}

// Sample data
const sampleUsers: User[] = [
  {
    roleId: 1,
    name: "John Smith",
    email: "john.smith@gordon.edu.ph",
    course: "BS Information Technology (BSIT)",
    program: "BSIT",
    role: "Mentor",
    secondaryRole: "N/A",
    yearLevel: "3rd Year",
  },
  {
    roleId: 2,
    name: "Maria Garcia",
    email: "maria.garcia@gordon.edu.ph",
    course: "BS Computer Science (BSCS)",
    program: "BSCS",
    role: "Learner",
    secondaryRole: "N/A",
    yearLevel: "2nd Year",
  },
  {
    roleId: 3,
    name: "David Wilson",
    email: "david.wilson@gordon.edu.ph",
    course: "BS Information Systems (BSIS)",
    program: "BSIS",
    role: "Mentor",
    secondaryRole: "Learner",
    yearLevel: "4th Year",
  },
  {
    roleId: 4,
    name: "Emily Chen",
    email: "emily.chen@gordon.edu.ph",
    course: "BS Information Technology (BSIT)",
    program: "BSIT",
    role: "Learner",
    secondaryRole: "Mentor",
    yearLevel: "3rd Year",
  }
];

const Users: React.FC<UsersProps> = ({ users, onUpdateUsers }) => {
  // State declarations
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<DetailedUser>({} as DetailedUser);

  // Refs
  const printRef = useRef<HTMLDivElement>(null);

  // PDF exporter hook
  function usePdfExporter() {
    const exportPdf = useCallback(async (element: HTMLElement, filename = 'export.pdf') => {
      if (!element) return;
      const mod = await import('html2pdf.js'); // loads only in browser
      const html2pdf: any = (mod as any).default || (mod as any);
      const opt = {
        margin: 0.5,
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      };
      html2pdf().set(opt).from(element).save();
    }, []);
    return exportPdf;
  }

  const exportPdf = usePdfExporter();

  // Helper functions
  const capitalizeFirstLetter = (str?: string) => {
    if (!str) return 'Not specified';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const parseArrayString = (str?: string) => {
    if (!str) return 'Not specified';
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) ? parsed.join(', ') : str;
    } catch (e) {
      return str;
    }
  };

  // Extract program from course string
  const getProgramFromCourse = (course?: string) => {
    if (!course) return 'N/A';
    const match = course.match(/\(([^)]+)\)/);
    return match?.[1] || course;
  };

  // utilities to combine module classes with role-specific classes
  const roleBadgeClass = (role?: string) =>
    `${styles['role-badge']} ${role ? ((styles as any)[role.toLowerCase()] || '') : ''}`.trim();

  const secondaryRoleBadgeClass = (role?: string) =>
    `${styles['secondary-role-badge']} ${role ? ((styles as any)[role.toLowerCase()] || '') : ''}`.trim();

  const statusBadgeClass = (role?: string) =>
    `${styles['status-badge']} ${role ? ((styles as any)[role.toLowerCase()] || '') : ''}`.trim();

  // API functions
  const fetchUserData = async (userId: any, role: any)  => {
    try {
      console.log('Fetching data for userId:', userId, 'with role:', role);
      if (!role) {
        toast.error('User role is not defined. Cannot fetch data.');
        return null;
      }
      
      switch (role.toLowerCase()) {
        case 'mentor':
          const mentorData = await api.get(`/api/admin/mentors/${userId}`);
          return mentorData.data;
        case 'learner':
          const learnerData = await api.get(`/api/admin/learners/${userId}`);
          return learnerData.data;
        default:
          toast.error('Unknown user role. Cannot fetch data.');
          return null;
      }
    } catch (error) {
      toast.error('Failed to fetch user data. Please try again later.');
      console.error('Error fetching user data:', error);
    }
  }

  // Event handlers
  const showUserDetails = async (studentId: any, role: any) => {
    const detailedData = await fetchUserData(studentId, role);
    if (detailedData) {
      // Combine the basic user info with the detailed data fetched from the API
      setCurrentUser({ ...detailedData });
      setShowUserModal(true);
    }
  };

  const hideUserDetails = () => {
    setShowUserModal(false);
  };

  const handleExportPdf = () => {
    if (printRef.current) exportPdf(printRef.current, 'users.pdf');
  };

  const exportUsersToCSV = () => {
    const data = displayedUsers.map((user, ) => ({
      ID: user.studentId,
      Name: user.name,
      Email: user.email,
      YearLevel: user.yearLevel || 'N/A',
      Program: user.program || 'N/A',
      Role: user.role,
      Phone: user.phoneNumber || 'N/A',
      Department: 'College of Computer Studies',
      Sex: user.sex,
      Address: user.address || 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    const colWidths = [
      { wch: 8 },
      { wch: 25 },
      { wch: 30 },
      { wch: 10 },
      { wch: 20 },
      { wch: 12 },
      { wch: 20 },
      { wch: 25 },
      { wch: 10 },
      { wch: 30 },
    ];
    worksheet['!cols'] = colWidths;

    const headerRange = XLSX.utils.decode_range(worksheet['!ref']!);
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: headerRange.s.r, c: C });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = {
        font: { bold: true },
        alignment: { horizontal: 'center' },
        fill: { fgColor: { rgb: 'D3D3D3' } },
      };
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

    let reportType = 'users';
    if (activeFilter === 'mentors') reportType = 'mentors';
    if (activeFilter === 'learners') reportType = 'learners';
    const formattedDate = new Date().toISOString().slice(0, 10);

    XLSX.writeFile(workbook, `${reportType}_report_${formattedDate}.xlsx`);
  };

  // Memoized computations
  // Filter and search users
  const displayedUsers = useMemo(() => {
    let filteredUsers = users ? [...users] : [];

    // Apply role filters
    if (activeFilter === 'mentors') {
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.role?.toLowerCase() === 'mentor' ||
          user.secondaryRole?.toLowerCase() === 'mentor'
      );
    } else if (activeFilter === 'learners') {
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.role?.toLowerCase() === 'learner' ||
          user.secondaryRole?.toLowerCase() === 'learner'
      );
    }

    // Apply search filter
    return filteredUsers.filter(
      (user) =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.program?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.yearLevel?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, activeFilter, searchQuery]);

  return (
    <>
      <div className={styles['applications-container']}>
        <div className={styles['applications-header']}>
          <h2 className={styles['applications-title']}>
            <i className={`fas fa-users ${styles['header-icon']}`}></i>
            Users
          </h2>

          <div className={styles['filter-buttons']}>
            <button
              className={`${styles['filter-btn']} ${activeFilter === 'all' ? styles.active : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All
            </button>
            <button
              className={`${styles['filter-btn']} ${activeFilter === 'mentors' ? styles.active : ''}`}
              onClick={() => setActiveFilter('mentors')}
            >
              Mentors
            </button>
            <button
              className={`${styles['filter-btn']} ${activeFilter === 'learners' ? styles.active : ''}`}
              onClick={() => setActiveFilter('learners')}
            >
              Learners
            </button>
          </div>

          <div className={styles['search-container']}>
            <div className={styles['search-wrapper']}>
              <i className={`fas fa-search ${styles['search-icon']}`}></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className={styles['search-input']}
              />
            </div>
            <button className={styles['export-btn']} onClick={exportUsersToCSV}>
              <i className="fas fa-download"></i> Export
            </button>
          </div>
        </div>

        <div className={styles['table-scroll-container']}>
          <table className={styles['applications-table']}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Year</th>
                <th>Program</th>
                <th>Role</th>
                <th>Alternative Role</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {displayedUsers.map((user) => (
                <tr key={user.studentId}>
                  <td>
                    <span className={styles['id-badge']}>{user.studentId}</span>
                  </td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.yearLevel || 'N/A'}</td>
                  <td>{getProgramFromCourse(user.program)}</td>
                  <td>
                    <span className={roleBadgeClass(user.role)}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span
                      className={secondaryRoleBadgeClass(
                        user.secondaryRole?.toLowerCase() === 'n/a'
                          ? 'na'
                          : user.secondaryRole?.toLowerCase()
                      )}
                    >
                      {user.secondaryRole || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <button className={styles['credentials-btn']} onClick={() => showUserDetails(user.roleId, user.role)}>
                      <i className="fas fa-eye"></i> <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
              {displayedUsers.length === 0 && (
                <tr>
                  <td colSpan={8} className={styles['no-applications']}>
                    No users to display
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* User Details Modal */}
        {showUserModal && (
          <div className={styles['modal-overlay']} onClick={hideUserDetails}>
            <div className={styles['credentials-modal']} onClick={(e) => e.stopPropagation()}>
              <div className={styles['modal-header']}>
                <div className={styles['header-content']}>
                  <i className={`fas fa-user ${styles['modal-title-icon']}`}></i>
                  <h3 className={styles['modal-title']}>User Details</h3>
                </div>
                <button className={styles['close-btn']} onClick={hideUserDetails}>
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className={styles['modal-body']}>
                <div className={styles['applicant-profile']}>
                  <div className={styles['profile-image-container']}>
                    <img
                      src={currentUser.image || "https://gordoncollegeccs.edu.ph/ccs/students/lamp/assets/profile.jpg"}
                      alt={`Portrait of ${currentUser.name}`}
                      className={styles['profile-image']}
                    />
                    <div
                      className={statusBadgeClass(currentUser.role)}
                    >
                      {currentUser.role}
                    </div>
                  </div>

                  <div className={styles['profile-info']}>
                    <h4 className={styles['applicant-name']}>{currentUser.name}</h4>
                    <hr className={styles['divider']} />
                    <div className={styles['info-grid']}>
                      <div className={styles['info-item']}>
                        <span className={styles['info-label']}>
                          <i className="fas fa-envelope"></i> Email
                        </span>
                        <span className={styles['info-value']}>{currentUser.email}</span>
                      </div>
                      <div className={styles['info-item']}>
                        <span className={styles['info-label']}>
                          <i className="fas fa-phone"></i> Contact Number
                        </span>
                        <span className={styles['info-value']}>
                          {currentUser.phoneNumber || 'Not provided'}
                        </span>
                      </div>
                      <div className={styles['info-item']}>
                        <span className={styles['info-label']}>
                          <i className="fas fa-calendar-alt"></i> Year Level
                        </span>
                        <span className={styles['info-value']}>{currentUser.yearLevel || 'N/A'}</span>
                      </div>
                      <div className={styles['info-item']}>
                        <span className={styles['info-label']}>
                          <i className="fas fa-graduation-cap"></i> Program
                        </span>
                        <span className={styles['info-value']}>{currentUser.program || 'N/A'}</span>
                      </div>
                      <div className={styles['info-item']}>
                        <span className={styles['info-label']}>
                          <i className="fas fa-university"></i> Department
                        </span>
                        <span className={styles['info-value']}>
                          {'College of Computer Studies'}
                        </span>
                      </div>
                      <div className={styles['info-item']}>
                        <span className={styles['info-label']}>
                          <i className="fas fa-venus-mars"></i> Sex at Birth
                        </span>
                        <span className={styles['info-value']}>
                          {capitalizeFirstLetter(currentUser.sex)}
                        </span>
                      </div>
                      <div className={styles['info-item']}>
                        <span className={styles['info-label']}>
                          <i className="fas fa-map-marker-alt"></i> Address
                        </span>
                        <span className={styles['info-value']}>
                          {currentUser.address || 'Not provided'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role-Specific Details Section */}
                <div className={styles['details-section']}>
                  {/* Mentor Specific Information */}
                  {(currentUser.role === 'mentor' || currentUser.role === 'Mentor') && (
                    <>
                      <div className={styles['details-card']}>
                        <h4 className={styles['section-title']}>
                          <i className="fas fa-chalkboard-teacher"></i> Teaching Information
                        </h4>
                        <hr className={styles['divider2']} />
                        <div className={styles['details-content']}>
                          <div className={styles['detail-item']}>
                            <span className={styles['detail-label']}>Teaching Modality:</span>
                            <span className={styles['detail-value']}>
                              {currentUser.modality || 'Not specified'}
                            </span>
                          </div>
                          <div className={styles['detail-item']}>
                            <span className={styles['detail-label']}>Days of Availability:</span>
                            <span className={styles['detail-value']}>
                              {parseArrayString(currentUser.availability)}
                            </span>
                          </div>
                          <div className={styles['detail-item']}>
                            <span className={styles['detail-label']}>Proficiency Level:</span>
                            <span className={styles['detail-value']}>
                              {currentUser.proficiency || 'Not specified'}
                            </span>
                          </div>
                          <div className={styles['detail-item']}>
                            <span className={styles['detail-label']}>Teaching Style:</span>
                            <span className={styles['detail-value']}>
                              {parseArrayString(currentUser.style)}
                            </span>
                          </div>
                          <div className={styles['detail-item']}>
                            <span className={styles['detail-label']}>Preferred Session Duration:</span>
                            <span className={styles['detail-value']}>
                              {currentUser.sessionDur|| 'Not specified'}
                            </span>
                          </div>
                          <div className={styles['detail-item']}>
                            <span className={styles['detail-label']}>Subjects:</span>
                            <span className={styles['detail-value']}>
                              {parseArrayString(currentUser.subjects)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={styles['bio-card']}>
                        <h4 className={styles['section-title']}>
                          <i className="fas fa-user-edit"></i> Bio & Experience
                        </h4>
                        <hr className={styles['divider2']} />
                        <div className={styles['bio-content']}>
                          <div className={styles['detail-item2']}>
                            <span className={styles['detail-label']}>Short Bio:</span>
                            <span className={styles['detail-value2']}>
                              {currentUser.bio || 'No bio provided'}
                            </span>
                          </div>
                          <div className={styles['detail-item2']}>
                            <span className={styles['detail-label']}>Tutoring Experience:</span>
                            <span className={styles['detail-value2']}>
                              {currentUser.exp || 'No experience provided'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Learner Specific Information */}
                  {(currentUser.role === 'learner' || currentUser.role === 'Learner') && (
                    <>
                      <div className={styles['details-card']}>
                        <h4 className={styles['section-title']}>
                          <i className="fas fa-book-open"></i> Learning Preferences
                        </h4>
                        <hr className={styles['divider2']} />
                        <div className={styles['details-content']}>
                          <div className={styles['detail-item']}>
                            <span className={styles['detail-label']}>Learning Modality:</span>
                            <span className={styles['detail-value']}>
                              {currentUser.modality || 'Not specified'}
                            </span>
                          </div>
                          <div className={styles['detail-item']}>
                            <span className={styles['detail-label']}>Days of Availability:</span>
                            <span className={styles['detail-value']}>
                              {parseArrayString(currentUser.availability)}
                            </span>
                          </div>
                          <div className={styles['detail-item']}>
                            <span className={styles['detail-label']}>Learning Style:</span>
                            <span className={styles['detail-value']}>
                              {parseArrayString(currentUser.style)}
                            </span>
                          </div>
                          <div className={styles['detail-item']}>
                            <span className={styles['detail-label']}>Preferred Session Duration:</span>
                            <span className={styles['detail-value']}>
                              {currentUser.sessionDur || 'Not specified'}
                            </span>
                          </div>
                          <div className={styles['detail-item']}>
                            <span className={styles['detail-label']}>Subject of Interest:</span>
                            <span className={styles['detail-value']}>
                              {parseArrayString(currentUser.subjects)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={styles['bio-card']}>
                        <h4 className={styles['section-title']}>
                          <i className="fas fa-user-edit"></i> Bio & Goals
                        </h4>
                        <hr className={styles['divider2']} />
                        <div className={styles['bio-content']}>
                          <div className={styles['detail-item2']}>
                            <span className={styles['detail-label']}>Short Bio:</span>
                            <span className={styles['detail-value2']}>
                              {currentUser.bio || 'No bio provided'}
                            </span>
                          </div>
                          <div className={styles['detail-item2']}>
                            <span className={styles['detail-label']}>Learning Goals:</span>
                            <span className={styles['detail-value2']}>
                              {currentUser.goals || 'No goals provided'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className={styles['modal-footer']}>
                <div className={styles['footer-actions']}>
                  <button className={`${styles['footer-btn']} ${styles.back}`} onClick={hideUserDetails}>
                    <i className="fas fa-arrow-left"></i> Back to Users
                  </button>
                  <button
                    className={`${styles['footer-btn']} ${styles.export}`}
                    onClick={handleExportPdf}
                  >
                    <i className="fas fa-file-pdf"></i> Export PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div ref={printRef}>
        {/* ...existing table/content to export... */}
      </div>
    </>
  );
};

// Export the typed Users component so parents can pass props
export default Users;

// Optional sample page for local previews
export function UsersPageSample() {
  return <Users users={sampleUsers} onUpdateUsers={() => console.log('Updating users...')} />;
}