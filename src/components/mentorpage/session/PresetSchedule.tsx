'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarPlus, 
  faEdit, 
  faTrash, 
  faUsers,
  faClock,
  faBook,
  faGraduationCap,
  faCalendarDays,
  faTimes,
  faChartLine
} from '@fortawesome/free-solid-svg-icons';
import api from '@/lib/axios';
import notify from '@/lib/toast';
import styles from './preset.module.css';

interface PresetSchedule {
  _id: string;
  mentor: string;
  mentorName: string;
  days: string[];
  time: string;
  subject: string;
  specialization: string;
  course: 'BSIT' | 'BSCS' | 'BSEMC';
  participants: string[];
  createdAt: string;
  updatedAt: string;
}

interface PresetScheduleProps {
  userData: any;
  onUpdate?: () => void;
}

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const COURSES = ['BSIT', 'BSCS', 'BSEMC'];

export default function PresetScheduleComponent({ userData, onUpdate }: PresetScheduleProps) {
  const [presetSchedules, setPresetSchedules] = useState<PresetSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<PresetSchedule | null>(null);

  const [formData, setFormData] = useState({
    days: [] as string[],
    time: '',
    subject: '',
    specialization: '',
    course: 'BSIT' as 'BSIT' | 'BSCS' | 'BSEMC'
  });

  const availableSpecializations = userData?.specializations || userData?.subjects || [];

  useEffect(() => {
    fetchPresetSchedules();
  }, []);

  const fetchPresetSchedules = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/mentor/schedules/preset');
      if (response.data.presetSchedules) {
        setPresetSchedules(response.data.presetSchedules);
      }
    } catch (error: any) {
      console.error('Error fetching preset schedules:', error);
      notify.error('Failed to load preset schedules');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.days.length || !formData.time || !formData.subject || !formData.specialization) {
      notify.error('Please fill in all required fields');
      return;
    }

    if (presetSchedules.length >= 3) {
      notify.error('You can only create a maximum of 3 preset schedules');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/api/mentor/schedules/preset', formData);
      notify.success('Preset schedule created successfully!');
      setShowCreateModal(false);
      resetForm();
      fetchPresetSchedules();
      onUpdate?.();
    } catch (error: any) {
      console.error('Error creating preset schedule:', error);
      notify.error(error.response?.data?.message || 'Failed to create preset schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedSchedule || !formData.days.length || !formData.time || !formData.subject || !formData.specialization) {
      notify.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await api.patch(`/api/mentor/schedules/preset/${selectedSchedule._id}`, formData);
      notify.success('Preset schedule updated successfully!');
      setShowEditModal(false);
      setSelectedSchedule(null);
      resetForm();
      fetchPresetSchedules();
      onUpdate?.();
    } catch (error: any) {
      console.error('Error updating preset schedule:', error);
      notify.error(error.response?.data?.message || 'Failed to update preset schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSchedule) return;

    setIsLoading(true);
    try {
      await api.delete(`/api/mentor/schedules/preset/${selectedSchedule._id}`);
      notify.success('Preset schedule deleted successfully!');
      setShowDeleteModal(false);
      setSelectedSchedule(null);
      fetchPresetSchedules();
      onUpdate?.();
    } catch (error: any) {
      console.error('Error deleting preset schedule:', error);
      notify.error('Failed to delete preset schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    if (presetSchedules.length >= 3) {
      notify.error('You can only create a maximum of 3 preset schedules');
      return;
    }
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (schedule: PresetSchedule) => {
    setSelectedSchedule(schedule);
    setFormData({
      days: schedule.days,
      time: schedule.time,
      subject: schedule.subject,
      specialization: schedule.specialization,
      course: schedule.course
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (schedule: PresetSchedule) => {
    setSelectedSchedule(schedule);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      days: [],
      time: '',
      subject: '',
      specialization: availableSpecializations[0] || '',
      course: 'BSIT'
    });
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const formatDays = (days: string[]) => {
    return days.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(', ');
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatSpecialization = (spec: string) => {
    return spec.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const totalParticipants = presetSchedules.reduce((sum, schedule) => sum + schedule.participants.length, 0);

  return (
    <div className={styles.presetWrapper}>
      <div className={styles.presetContent}>
        {/* Header with Analytics */}
        <div className={styles.presetHeader}>
          <div className={styles.presetHeaderContent}>
            <h2 className={styles.presetTitle}>
              <FontAwesomeIcon icon={faCalendarDays} className={styles.presetHeaderIcon} />
              Preset Schedules
            </h2>
            <p className={styles.presetSubtitle}>Create recurring schedules for learners to join</p>
          </div>
          <button 
            className={styles.createButton}
            onClick={openCreateModal}
            disabled={presetSchedules.length >= 3}
            title={presetSchedules.length >= 3 ? 'Maximum 3 preset schedules allowed' : 'Create new preset schedule'}
          >
            <FontAwesomeIcon icon={faCalendarPlus} />
            Create Schedule
          </button>
        </div>

        {/* Analytics Cards */}
        <div className={styles.analyticsGrid}>
          <div className={styles.analyticsCard}>
            <div className={styles.analyticsIcon} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <FontAwesomeIcon icon={faCalendarDays} />
            </div>
            <div className={styles.analyticsInfo}>
              <h3>Active Schedules</h3>
              <p className={styles.analyticsValue}>{presetSchedules.length}/3</p>
            </div>
          </div>

          <div className={styles.analyticsCard}>
            <div className={styles.analyticsIcon} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <FontAwesomeIcon icon={faUsers} />
            </div>
            <div className={styles.analyticsInfo}>
              <h3>Total Participants</h3>
              <p className={styles.analyticsValue}>{totalParticipants}</p>
            </div>
          </div>

          <div className={styles.analyticsCard}>
            <div className={styles.analyticsIcon} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <FontAwesomeIcon icon={faChartLine} />
            </div>
            <div className={styles.analyticsInfo}>
              <h3>Avg. Participants</h3>
              <p className={styles.analyticsValue}>
                {presetSchedules.length > 0 ? (totalParticipants / presetSchedules.length).toFixed(1) : '0'}
              </p>
            </div>
          </div>
        </div>

        {/* Preset Schedules List */}
        <div className={styles.schedulesContainer}>
        {isLoading && presetSchedules.length === 0 ? (
          <div className={styles.loadingMessage}>Loading preset schedules...</div>
        ) : presetSchedules.length === 0 ? (
          <div className={styles.emptyState}>
            <FontAwesomeIcon icon={faCalendarDays} className={styles.emptyIcon} />
            <h3>No Preset Schedules Yet</h3>
            <p>Create preset schedules for learners to easily join your sessions</p>
            <button className={styles.createButtonLarge} onClick={openCreateModal}>
              <FontAwesomeIcon icon={faCalendarPlus} />
              Create Your First Schedule
            </button>
          </div>
        ) : (
          <div className={styles.schedulesGrid}>
            {presetSchedules.map((schedule) => (
              <div key={schedule._id} className={styles.scheduleCard}>
                <div className={styles.scheduleHeader}>
                  <div className={styles.scheduleIcon}>
                    <FontAwesomeIcon icon={faBook} />
                  </div>
                  <div className={styles.scheduleActions}>
                    <button
                      className={styles.actionButton}
                      onClick={() => openEditModal(schedule)}
                      title="Edit"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                      onClick={() => openDeleteModal(schedule)}
                      title="Delete"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>

                <div className={styles.scheduleContent}>
                  <h3 className={styles.scheduleSubject}>{schedule.subject}</h3>
                  
                  <div className={styles.scheduleDetail}>
                    <FontAwesomeIcon icon={faCalendarDays} className={styles.detailIcon} />
                    <span>{formatDays(schedule.days)}</span>
                  </div>

                  <div className={styles.scheduleDetail}>
                    <FontAwesomeIcon icon={faClock} className={styles.detailIcon} />
                    <span>{formatTime(schedule.time)}</span>
                  </div>

                  <div className={styles.scheduleDetail}>
                    <FontAwesomeIcon icon={faGraduationCap} className={styles.detailIcon} />
                    <span>{formatSpecialization(schedule.specialization)}</span>
                  </div>

                  <div className={styles.scheduleDetail}>
                    <FontAwesomeIcon icon={faBook} className={styles.detailIcon} />
                    <span>{schedule.course}</span>
                  </div>

                  <div className={styles.participantsSection}>
                    <FontAwesomeIcon icon={faUsers} className={styles.participantsIcon} />
                    <span className={styles.participantsCount}>
                      {schedule.participants.length} {schedule.participants.length === 1 ? 'Participant' : 'Participants'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Create Preset Schedule</h3>
              <button className={styles.closeButton} onClick={() => setShowCreateModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Subject *</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Enter subject name"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Days of Week *</label>
                <div className={styles.daysGrid}>
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day}
                      type="button"
                      className={`${styles.dayButton} ${formData.days.includes(day) ? styles.dayButtonActive : ''}`}
                      onClick={() => toggleDay(day)}
                    >
                      {day.slice(0, 3).toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Time *</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Specialization *</label>
                <select
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className={styles.select}
                >
                  <option value="">Select specialization</option>
                  {availableSpecializations.map((spec: string) => (
                    <option key={spec} value={spec}>
                      {formatSpecialization(spec)}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Course *</label>
                <select
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value as 'BSIT' | 'BSCS' | 'BSEMC' })}
                  className={styles.select}
                >
                  {COURSES.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelButton} onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button 
                className={styles.saveButton} 
                onClick={handleCreate}
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedSchedule && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Edit Preset Schedule</h3>
              <button className={styles.closeButton} onClick={() => setShowEditModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Subject *</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Enter subject name"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Days of Week *</label>
                <div className={styles.daysGrid}>
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day}
                      type="button"
                      className={`${styles.dayButton} ${formData.days.includes(day) ? styles.dayButtonActive : ''}`}
                      onClick={() => toggleDay(day)}
                    >
                      {day.slice(0, 3).toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Time *</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Specialization *</label>
                <select
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className={styles.select}
                >
                  <option value="">Select specialization</option>
                  {availableSpecializations.map((spec: string) => (
                    <option key={spec} value={spec}>
                      {formatSpecialization(spec)}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Course *</label>
                <select
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value as 'BSIT' | 'BSCS' | 'BSEMC' })}
                  className={styles.select}
                >
                  {COURSES.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.infoBox}>
                <FontAwesomeIcon icon={faUsers} />
                <span>Currently {selectedSchedule.participants.length} learner(s) enrolled</span>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelButton} onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button 
                className={styles.saveButton} 
                onClick={handleUpdate}
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Update Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedSchedule && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ maxWidth: '450px' }}>
            <div className={styles.modalHeader} style={{ background: '#f44336' }}>
              <h3>Delete Preset Schedule</h3>
              <button className={styles.closeButton} onClick={() => setShowDeleteModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.warningBox}>
                <p>
                  Are you sure you want to delete the preset schedule for <strong>{selectedSchedule.subject}</strong>?
                </p>
                {selectedSchedule.participants.length > 0 && (
                  <p className={styles.warningText}>
                    ⚠️ This schedule has {selectedSchedule.participants.length} enrolled participant(s). They will be removed.
                  </p>
                )}
                <p className={styles.warningTextSmall}>This action cannot be undone.</p>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelButton} onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button 
                className={styles.deleteButtonLarge} 
                onClick={handleDelete}
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
