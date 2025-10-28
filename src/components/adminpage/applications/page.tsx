"use client";

import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/axios';
import styles from "./page.module.css";

// Interfaces
interface Applicant {
  user_id: any;
  name: any;
  program: any;
  status: any;
}

interface Credential {
  id: number;
  name: string;
  previewLink: string;
  downloadLink: string;
}

interface ApplicantDetails {
  user: {
    name: string;
  };
  info: {
    image?: string;
    approval_status?: string;
    gender?: string;
    year?: string;
    program?: string;
    address?: string;
    proficiency?: string;
    learn_modality?: string;
    teach_sty?: string;
    availability?: string;
    subjects?: string;
    bio?: string;
    exp?: string;
  };
  image_url?: string;
}

interface CredentialsResponse {
  credentials: Credential[];
}

interface ApplicationsProps {
  applicants: any;
  onUpdateApplicants: () => void;
}

// Constants
const sampleApplicants = {
  mentors: {
    pending: [
      {
        user_id: 1,
        name: "John Smith",
        program: "BS Information Technology (BSIT)",
        applied_on: "2025-09-28",
        status: "pending"
      },
      {
        user_id: 2,
        name: "Maria Garcia",
        program: "BS Computer Science (BSCS)",
        applied_on: "2025-09-27",
        status: "pending"
      },
      {
        user_id: 7,
        name: "Alex Turner",
        program: "BS Information Systems (BSIS)",
        applied_on: "2025-09-26",
        status: "pending"
      }
    ],
    accepted: [
      {
        user_id: 3,
        name: "David Wilson",
        program: "BS Information Systems (BSIS)",
        applied_on: "2025-09-25",
        status: "accepted"
      },
      {
        user_id: 4,
        name: "Sarah Johnson",
        program: "BS Computer Engineering (BSCpE)",
        applied_on: "2025-09-24",
        status: "accepted"
      },
      {
        user_id: 8,
        name: "Emily Chen",
        program: "BS Information Technology (BSIT)",
        applied_on: "2025-09-23",
        status: "accepted"
      }
    ],
    rejected: [
      {
        user_id: 5,
        name: "Michael Brown",
        program: "BS Information Technology (BSIT)",
        applied_on: "2025-09-23",
        status: "rejected"
      },
      {
        user_id: 6,
        name: "Emma Davis",
        program: "BS Computer Science (BSCS)",
        applied_on: "2025-09-22",
        status: "rejected"
      }
    ]
  }
};

const Applications: React.FC<ApplicationsProps> = ({ 
  applicants = sampleApplicants, 
  onUpdateApplicants 
}) => {
  // State declarations
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [currentAppId, setCurrentAppId] = useState<string | null>(null);
  const [currentApp, setCurrentApp] = useState<any>({});
  const [actionToConfirm, setActionToConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Add new state to manage applicants data locally
  const [localApplicants, setLocalApplicants] = useState(applicants);

  const approve = async (roleId: number) => {
    try {
      const response = await api.patch(`/api/admin/mentor/status/approve/${roleId}`);

      if (response.status === 200) {
        console.log('Application accepted successfully!');
        return response.data;
      }
      throw new Error(`Failed to approve application: ${response.status}`);
    } catch (error) {
      console.error('Failed to approve application. Please try again.', error);
      throw error;
    }
  };

  const reject = async (roleId: number) => {
    try {
      const response = await api.patch(`/api/admin/mentor/status/reject/${roleId}`);

      if (response.status === 200) {
        console.log('Application rejected successfully.');
        return response.data;
      }
      throw new Error(`Failed to reject application: ${response.status}`);
    } catch (error) {
      console.error('Failed to reject application. Please try again.', error);
      throw error;
    }
  };

  const getApplicantDetails = async (applicantId: number): Promise<ApplicantDetails> => {
    try {
      const response = await api.get(`/api/admin/${applicantId}`);

      if (response.status === 200) {
        return response.data;
      }
      throw new Error(`Failed to fetch user details: ${response.status}`);
    } catch (error) {
      console.error('Error fetching applicant details:', error);
      throw error;
    }
  };

  // Helper functions
  const previewFile = (previewLink: string) => {
    if (previewLink) {
      window.open(previewLink, '_blank');
    }
  };

  const downloadFile = (downloadLink: string, fileName: string) => {
    if (downloadLink) {
      const link = document.createElement('a');
      link.href = downloadLink;
      link.download = fileName || 'credential.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const capitalizeFirstLetter = (str: string): string => {
    if (!str) return 'Not specified';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Data normalization
  const normalizeApplicants = (input: any): any[] => {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    if (input.mentors) {
      const { pending = [], accepted = [], rejected = [] } = input.mentors;
      const mapLegacy = (arr: any[], statusLabel: string) =>
        (arr || []).map((a: any) => ({
          roleId: a.user_id ?? a.roleId ?? a.id,
          userId: a.user_id ?? a.userId,
          name: a.name,
          email: a.email,
          studentId: a.studentId ?? a.student_id,
          program: a.program,
          mentorStatus: statusLabel,
          applied_on: a.applied_on,
        }));
      return [
        ...mapLegacy(pending, 'pending'),
        ...mapLegacy(accepted, 'accepted'),
        ...mapLegacy(rejected, 'rejected'),
      ];
    }
    return [];
  };

  // Modal handlers
  const showConfirmation = (id: string, action: string) => {
    setCurrentAppId(id);
    setActionToConfirm(action);
    setShowModal(true);
  };

  const hideConfirmation = () => {
    setShowModal(false);
    setCurrentAppId(null);
    setActionToConfirm('');
  };

  const showCredentials = async (app: any) => {
    try {
      setIsLoading(true);
      const mentorCreds = await api.get(`/api/admin/mentors/credentials/${app.roleId}`);
      const credsData = mentorCreds.data as CredentialsResponse;
      
      const response = await api.get(`/api/admin/mentors/${app.roleId}`);
      const data = response.data;
      
      const mockData = {
        user: data.name,
        info: {
          image: data.image,
          approval_status: data.accountStatus,
          gender: data.sex,
          year: data.yearLevel,
          program: data.program,
          address: data.address,
          proficiency: data.proficiency,
          learn_modality: data.modality,
          teach_sty: JSON.stringify(data.style),
          availability: JSON.stringify(data.availability),
          subjects: JSON.stringify(data.subjects),
          bio: data.bio,
          exp: data.exp,
        }
      };

      const mockCredentials = {
        credentials: [
          {
            id: 1,
            name: 'Resume.pdf',
            previewLink: '#',
            downloadLink: '#'
          },
          {
            id: 2,
            name: 'Certificate.pdf',
            previewLink: '#',
            downloadLink: '#'
          }
        ]
      };

      const applicantData = {
        applicant: data.name,
        image: data.image,
        status: mockData.info.approval_status,
        gender: mockData.info.gender,
        year: mockData.info.year,
        program: mockData.info.program,
        college: 'College of Computer Studies',
        city: mockData.info.address,
        proficiency: mockData.info.proficiency,
        modality: mockData.info.learn_modality,
        style: JSON.parse(mockData.info.teach_sty),
        availability: JSON.parse(mockData.info.availability),
        subjects: JSON.parse(mockData.info.subjects),
        bio: mockData.info.bio,
        experience: mockData.info.exp,
        files: credsData.credentials,
      };

      setCurrentApp(applicantData);
      setShowCredentialsModal(true);
    } catch (error) {
      console.error('Error showing credentials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hideCredentials = () => {
    setShowCredentialsModal(false);
    setCurrentApp({});
  };

  const getProgramName = (program: string): string => {
    const match = program.match(/\(([^)]+)\)/);
    return match?.[1] || program;
  };

  // Update the confirmAction function
  const confirmAction = async () => {
    if (!currentAppId) return;

    try {
      setIsLoading(true);
      if (actionToConfirm === 'Accepted') {
        await approve(currentAppId as any);
        setLocalApplicants((prev: any) =>
          prev.map((app: any) =>
            app.mentorId === currentAppId
              ? { ...app, mentorStatus: 'accepted' }
              : app
          )
        );
      } else if (actionToConfirm === 'Rejected') {
        await reject(currentAppId as any);
        setLocalApplicants((prev: any) =>
          prev.map((app: any) =>
            app.mentorId === currentAppId
              ? { ...app, mentorStatus: 'rejected' }
              : app
          )
        );
      }

      onUpdateApplicants();
      hideConfirmation();
    } catch (error) {
      console.error(`Error ${actionToConfirm.toLowerCase()} application`, error);
    } finally {
      setIsLoading(false);
    }
  };

  // SINGLE filteredApplicants declaration - removed the duplicate
  const filteredApplicants = useMemo(() => {
    let list = Array.isArray(localApplicants) ? [...localApplicants] : [];

    // Map UI filter -> data values ('accepted' in data is 'accepted', approved mapping handled below)
    if (activeFilter !== 'all') {
      list = list.filter((a: any) => {
        const status = (a.mentorStatus || '').toString().toLowerCase();
        return status === activeFilter.toLowerCase();
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((a: any) =>
        (a.name || '').toString().toLowerCase().includes(q) ||
        (a.program || '').toString().toLowerCase().includes(q) ||
        (a.studentId || '').toString().toLowerCase().includes(q)
      );
    }

    // ensure rendering fields exist and map status label for UI where necessary
    return list.map((a: any) => ({
      ...a,
      mentorId: a.mentorId ?? a.userId ?? a.id,
      studentId: a.studentId ?? a.student_id ?? '',
      mentorStatus: a.mentorStatus ?? a.status ?? '',
    }));
  }, [localApplicants, activeFilter, searchQuery]);

  // Effects
  useEffect(() => {
    setLocalApplicants(normalizeApplicants(applicants));
  }, [applicants]);

  useEffect(() => {
    console.log('Local applicants updated:', localApplicants);
  }, [localApplicants]);

  return (
    <>
      <div className={styles['applications-container']}>
        <div className={styles['applications-header']}>
          <h2 className={styles['applications-title']}>
            <i className={`fas fa-file-alt ${styles['header-icon']}`}></i>
            Applications
          </h2>

          <div className={styles['filter-buttons']}>
            <button
              className={`${styles['filter-btn']} ${activeFilter === 'all' ? styles.active : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All
            </button>
            <button
              className={`${styles['filter-btn']} ${activeFilter === 'accepted' ? styles.active : ''}`}
              onClick={() => setActiveFilter('accepted')}
            >
              Accepted
            </button>
            <button
              className={`${styles['filter-btn']} ${activeFilter === 'rejected' ? styles.active : ''}`}
              onClick={() => setActiveFilter('rejected')}
            >
              Rejected
            </button>
            <button
              className={`${styles['filter-btn']} ${activeFilter === 'pending' ? styles.active : ''}`}
              onClick={() => setActiveFilter('pending')}
            >
              Pending
            </button>
          </div>

          <div className={styles['search-container']}>
            <div className={styles['search-wrapper']}>
              <i className={`fas fa-search ${styles['search-icon']}`}></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search applications..."
                className={styles['search-input']}
              />
            </div>
          </div>
        </div>

        <div className={styles['table-scroll-container']}>
          <table className={styles['applications-table']}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Applicant</th>
                <th>Program</th>
                <th>Credentials</th>
                {activeFilter === 'all' ? <th>Actions</th> : <th>Status</th>}
              </tr>
            </thead>
            <tbody>
              {filteredApplicants.map((app: any) => (
                <tr key={app.roleId}>
                  <td>
                    <span className={styles['id-badge']}>{app.studentId}</span>
                  </td>
                  <td>{app.name}</td>
                  <td>{getProgramName(app.program)}</td>
                  <td>
                    <button
                      className={styles['credentials-btn']}
                      onClick={() => showCredentials(app)}
                    >
                      <i className="fas fa-eye"></i> <span>View</span>
                    </button>
                  </td>
                  {activeFilter === 'all' ? (
                    <td className={styles['action-buttons']}>
                      <button
                        className={`${styles['action-btn']} ${styles.accept} ${app.mentorStatus === 'accepted' ? styles.active : ''}`}
                        onClick={() => showConfirmation(app.roleId, 'Accepted')}
                        disabled={app.mentorStatus === 'accepted' || app.mentorStatus === 'rejected' || isLoading}
                      >
                        <i className="fas fa-check"></i>
                        <span>{app.mentorStatus === 'accepted' ? 'Accepted' : 'Approve'}</span>
                      </button>
                      <button
                        className={`${styles['action-btn']} ${styles.reject} ${app.mentorStatus === 'rejected' ? styles.active : ''}`}
                        onClick={() => showConfirmation(app.roleId, 'Rejected')}
                        disabled={app.mentorStatus === 'accepted' || app.mentorStatus === 'rejected' || isLoading}
                      >
                        <i className="fas fa-times"></i>
                        <span>{app.mentorStatus === 'rejected' ? 'Rejected' : 'Reject'}</span>
                      </button>
                    </td>
                  ) : (
                    <td>
                      <span className={`${styles['status-text']} ${styles[app.mentorStatus?.toLowerCase() || '']}`}>
                        {capitalizeFirstLetter(app.mentorStatus)}
                      </span>
                    </td>
                  )}
                </tr>
              ))}
              {filteredApplicants.length === 0 && (
                <tr>
                  <td colSpan={activeFilter === 'all' ? 6 : 6} className={styles['no-applications']}>
                    No applications to display
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className={styles['modal-overlay']} onClick={hideConfirmation}>
            <div className={styles['modal']} onClick={(e) => e.stopPropagation()}>
              <h3>Confirm Action</h3>
              <hr />
              <p>
                Are you sure you want to mark this application as
                <strong> {actionToConfirm}</strong>?
              </p>
              <div className={styles['modal-actions']}>
                <button className={`${styles['modal-btn']} ${styles.cancel}`} onClick={hideConfirmation}>
                  Cancel
                </button>
                <button className={`${styles['modal-btn']} ${styles.confirm}`} onClick={confirmAction}>
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {showCredentialsModal && (
          <div className={styles['modal-overlay']} onClick={hideCredentials}>
            <div className={styles['credentials-modal']} onClick={(e) => e.stopPropagation()}>
              <div className={styles['modal-header']}>
                <div className={styles['header-content']}>
                  <i className={`fas fa-user-graduate ${styles['modal-title-icon']}`}></i>
                  <h3 className={styles['modal-title']}>Applicant Credentials</h3>
                </div>
                <button className={styles['close-btn']} onClick={hideCredentials}>
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className={styles['modal-body']}>
                <div className={styles['applicant-profile']}>
                  <div className={styles['profile-image-container']}>
                    <img
                      src={currentApp.image || '/default-avatar.png'}
                      alt={`Portrait of ${currentApp.applicant}`}
                      className={styles['profile-image']}
                    />
                    {currentApp.mentorStatus && (
                      <div className={`${styles['status-badge']} ${styles[currentApp.mentorStatus?.toLowerCase() || '']}`}>
                        {currentApp.mentorStatus}
                      </div>
                    )}
                  </div>

                  <div className={styles['profile-info']}>
                    <h4 className={styles['applicant-name']}>{currentApp.applicant}</h4>
                    <hr className={styles['divider']} />
                    <div className={styles['info-grid']}>
                      <div className={styles['info-item']}>
                        <span className={styles['info-label']}>
                          <i className="fas fa-venus-mars"></i> Sex at Birth
                        </span>
                        <span className={styles['info-value']}>{currentApp.gender || 'NON-BINARY'}</span>
                      </div>
                      <div className={styles['info-item']}>
                        <span className={styles['info-label']}>
                          <i className="fas fa-calendar-alt"></i> Year
                        </span>
                        <span className={styles['info-value']}>{currentApp.year || '2nd Year'}</span>
                      </div>
                      <div className={styles['info-item']}>
                        <span className={styles['info-label']}>
                          <i className="fas fa-graduation-cap"></i> Program
                        </span>
                        <span className={styles['info-value']}>
                          {currentApp.program || 'Bachelor of Science in Information Technology'}
                        </span>
                      </div>
                      <div className={styles['info-item']}>
                        <span className={styles['info-label']}>
                          <i className="fas fa-university"></i> College
                        </span>
                        <span className={styles['info-value']}>
                          {currentApp.college || 'College of Computer Studies'}
                        </span>
                      </div>
                      <div className={styles['info-item']}>
                        <span className={styles['info-label']}>
                          <i className="fas fa-map-marker-alt"></i> Location
                        </span>
                        <span className={styles['info-value']}>{currentApp.city || 'Olongapo City'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles['details-section']}>
                  <div className={styles['details-card']}>
                    <h4 className={styles['section-title']}>
                      <i className="fas fa-info-circle"></i> Application Details
                    </h4>
                    <hr className={styles['divider2']} />
                    <div className={styles['details-content']}>
                      <div className={styles['detail-item']}>
                        <span className={styles['detail-label']}>Proficiency Level:</span>
                        <span className={styles['detail-value']}>{currentApp.proficiency || 'Advanced'}</span>
                      </div>
                      <div className={styles['detail-item']}>
                        <span className={styles['detail-label']}>Teaching Modality:</span>
                        <span className={styles['detail-value']}>
                          {currentApp.modality || 'Online and In-Person'}
                        </span>
                      </div>
                      <div className={styles['detail-item']}>
                        <span className={styles['detail-label']}>Teaching Style:</span>
                        <span className={styles['detail-value']}>{currentApp.style || 'Interactive'}</span>
                      </div>
                      <div className={styles['detail-item']}>
                        <span className={styles['detail-label']}>Availability:</span>
                        <span className={styles['detail-value']}>
                          {currentApp.availability || 'Monday, Wednesday, Friday'}
                        </span>
                      </div>
                      <div className={styles['detail-item']}>
                        <span className={styles['detail-label']}>Subjects Offered:</span>
                        <span className={styles['detail-value']}>
                          {currentApp.subjects || 'Web Development, Database Management'}
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
                        <span className={styles['detail-label']}>Bio:</span>
                        <span className={styles['detail-value2']}>
                          {currentApp.bio ||
                            'Passionate tutor with a love for helping students excel in technology and programming.'}
                        </span>
                      </div>
                      <div className={styles['detail-item2']}>
                        <span className={styles['detail-label']}>Tutoring Experience:</span>
                        <span className={styles['detail-value2']}>
                          {currentApp.experience ||
                            '2 years of experience in tutoring web development and database management.'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles['credentials-section']}>
                  <h4 className={styles['section-title']}>
                    <i className="fas fa-file-alt"></i> Submitted Credentials
                  </h4>
                  <div className={styles['credentials-grid']}>
                    {currentApp.files?.map((file: any) => (
                      <div key={file.id} className={styles['credential-card']}>
                        <div className={styles['file-icon']}>
                          <i className="fas fa-file-pdf"></i>
                        </div>
                        <div className={styles['file-info']}>
                          <span className={styles['file-name']}>{file.name}</span>
                          <div className={styles['file-actions']}>
                            <button
                              onClick={() => previewFile(file.previewLink)}
                              className={`${styles['action-btn']} ${styles.preview}`}
                            >
                              <i className="fas fa-eye"></i> Preview
                            </button>
                            <button
                              onClick={() => downloadFile(file.downloadLink, file.name)}
                              className={`${styles['action-btn']} ${styles.download}`}
                            >
                              <i className="fas fa-download"></i> Download
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!currentApp.files?.length && (
                      <div className={styles['no-credentials']}>No credentials submitted</div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles['modal-footer']}>
                <div className={styles['footer-actions']}>
                  <button className={`${styles['footer-btn']} ${styles.back}`} onClick={hideCredentials}>
                    <i className="fas fa-arrow-left"></i> Back to Applications
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isLoading && (
        <div className={styles['loading-overlay']}>
          <div className={styles['loading-spinner']}></div>
        </div>
      )}
    </>
  );
};

// Export the typed component as default so parent pages can pass props
export default Applications;

// Optional: keep a sample wrapper for local testing
export function ApplicationsPageSample() {
  const handleUpdateApplicants = () => {
    console.log('Updating applicants...');
  };
  return <Applications applicants={sampleApplicants} onUpdateApplicants={handleUpdateApplicants} />;
}