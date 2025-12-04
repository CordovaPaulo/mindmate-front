'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/axios';
import notify from '@/lib/toast';
import styles from './Schedule.module.css';

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

interface ScheduleProps {
  info: any;
  onClose: () => void;
  onConfirm: (data: any) => void;
}

interface Day {
  date: Date;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  isAvailable: boolean;
  isPast: boolean;
}

export default function Schedule({ info, onClose, onConfirm }: ScheduleProps) {
  // State declarations in same order as first component
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [sessionType, setSessionType] = useState<'in-person'|'online'>('in-person');
  const [meetingLocation, setMeetingLocation] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [days, setDays] = useState<Day[]>([]);
  const [showYearSelection, setShowYearSelection] = useState(false);

  // Constants and computed values
  const availableTimes = useMemo(() => [
    "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
  ], []);

  // Destructure mentor info
  const {
    mentorId,
    mentorName,
    mentorYear,
    mentorCourse,
    mentorSessionDur,
    mentorModality,
    mentorTeachStyle,
    mentorAvailability,
    mentorProfilePic,
    mentorSubjects,
  } = info || {};

  // Helper functions
  const subjectOptions: string[] = useMemo(() => {
    try {
      if (Array.isArray(mentorSubjects)) return mentorSubjects as string[];
      if (typeof mentorSubjects === 'string') return JSON.parse(mentorSubjects) as string[];
      return [];
    } catch (e) {
      console.error("Error parsing subjects:", e);
      return [];
    }
  }, [mentorSubjects]);

  // fetched related subject options (topics) based on mentor specializations
  const [relatedSubjectOptions, setRelatedSubjectOptions] = useState<string[]>([]);

  useEffect(() => {
    const fetchRelatedSubjects = async () => {
      try {
        let specs: string[] = [];
        if (Array.isArray(mentorSubjects)) specs = mentorSubjects as string[];
        else if (typeof mentorSubjects === 'string') specs = JSON.parse(mentorSubjects) as string[];
        if (!specs || specs.length === 0) return;

        const token = getCookie('MindMateToken');
        const res = await api.get('/api/learner/subjects', {
          params: { specializations: JSON.stringify(specs) },
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const subjects = res.data?.subjects || [];
        const seen = new Set<string>();
        const options: string[] = [];

        subjects.forEach((doc: any) => {
          const spec = doc.specialization || '';
          const difficulty = doc.difficulty || {};
          ['beginner', 'intermediate', 'advanced'].forEach((level) => {
            const arr = difficulty[level] || [];
            arr.forEach((topic: string) => {
              const label = spec ? `${spec} — ${topic}` : topic;
              if (!seen.has(label)) {
                seen.add(label);
                options.push(label);
              }
            });
          });
        });

        setRelatedSubjectOptions(options);
      } catch (err) {
        console.error('Error fetching related subjects for schedule:', err);
      }
    };

    fetchRelatedSubjects();
  }, [mentorSubjects]);

  const availableDays = useMemo(() => {
    try {
      if (Array.isArray(mentorAvailability)) {
        return mentorAvailability.map((day: string) => day.toLowerCase());
      }
      if (typeof mentorAvailability === 'string') {
        return JSON.parse(mentorAvailability).map((day: string) => day.toLowerCase());
      }
      return [];
    } catch (e) {
      console.error("Error parsing availability:", e);
      return [];
    }
  }, [mentorAvailability]);

  const years = useMemo(() => 
    Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i), 
    []
  );

  const currentMonthYear = useMemo(() =>
    new Date(currentDate).toLocaleDateString('default', { month: 'long', year: 'numeric' }),
    [currentDate]
  );

  const isInPersonModality = useMemo(() => {
    const m = (mentorModality || '').toLowerCase();
    return m === 'in-person' || m === 'both';
  }, [mentorModality]);

  const isOnlineModality = useMemo(() => {
    const m = (mentorModality || '').toLowerCase();
    return m === 'online' || m === 'both';
  }, [mentorModality]);

  // Utility functions
  const formatDateForInput = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const isPastDate = (date: Date) => {
    const t = new Date(); t.setHours(0,0,0,0);
    const c = new Date(date); c.setHours(0,0,0,0);
    return c < t;
  };

  const isDateAvailable = (date: Date) => {
    if (isPastDate(date)) return false;
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return availableDays.includes(dayName);
  };

  const isToday = (date: Date) => {
    const t = new Date();
    return date.getDate() === t.getDate() && date.getMonth() === t.getMonth() && date.getFullYear() === t.getFullYear();
  };

  // Calendar generation
  const generateDays = () => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const prevCount = first.getDay();
    const nextCount = 6 - last.getDay();

    const list: Day[] = [];
    const prevLast = new Date(y, m, 0).getDate();
    
    // Previous month
    for (let i = prevLast - prevCount + 1; i <= prevLast; i++) {
      const d = new Date(y, m - 1, i);
      list.push({ 
        date: d, 
        isCurrentMonth: false, 
        isSelected: false, 
        isToday: isToday(d), 
        isAvailable: isDateAvailable(d),
        isPast: isPastDate(d)
      });
    }
    
    // Current month
    for (let i = 1; i <= last.getDate(); i++) {
      const d = new Date(y, m, i);
      const ds = formatDateForInput(d);
      list.push({ 
        date: d, 
        isCurrentMonth: true, 
        isSelected: selectedDate === ds, 
        isToday: isToday(d), 
        isAvailable: isDateAvailable(d),
        isPast: isPastDate(d)
      });
    }
    
    // Next month
    for (let i = 1; i <= nextCount; i++) {
      const d = new Date(y, m + 1, i);
      list.push({ 
        date: d, 
        isCurrentMonth: false, 
        isSelected: false, 
        isToday: isToday(d), 
        isAvailable: isDateAvailable(d),
        isPast: isPastDate(d)
      });
    }
    
    setDays(list);
  };

  // Calendar interactions
  const selectDate = (day: Day) => {
    if (!day.isAvailable) return;
    if (!day.isCurrentMonth) {
      const nd = new Date(day.date);
      setCurrentDate(new Date(nd.getFullYear(), nd.getMonth(), 1));
      return;
    }
    setSelectedDate(formatDateForInput(day.date));
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => { const t = new Date(); setCurrentDate(t); setSelectedDate(formatDateForInput(t)); };
  const selectYear = (year: number) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(year);
    setCurrentDate(newDate);
    setShowYearSelection(false);
  };

  // Schedule confirmation
  const confirmSchedule = async () => {
    if (!selectedDate || !selectedTime || !selectedSubject) {
      notify.warn('Please select date, time and subject');
      return;
    }
    if (sessionType === 'in-person' && !meetingLocation) {
      notify.warn('Please enter a meeting location');
      return;
    }
    if (!mentorId) {
      notify.error("Unable to schedule: mentor information is incomplete.");
      return;
    }

    const match = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) {
      notify.error('Invalid time format');
      return;
    }
    
    let h = parseInt(match[1], 10); 
    const minutes = match[2]; 
    const period = match[3].toUpperCase();
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    const formattedTime = `${String(h).padStart(2, '0')}:${minutes}`;

    const scheduleDate = new Date(selectedDate);
    const scheduleData = {
      date: scheduleDate.toISOString(),
      time: formattedTime,
      location: sessionType === 'in-person' ? meetingLocation : 'online',
      subject: selectedSubject,
    };

    setIsSubmitting(true);
    try {
      const token = getCookie('MindMateToken');
      const response = await api.post(`/api/learner/schedule/${mentorId}`, scheduleData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.status !== 201) {
        throw new Error('Failed to create schedule');
      }
      
      notify.success('Session scheduled successfully!');
      onConfirm(response.data);
      onClose();
    } catch (error: any) {
      console.error("Error scheduling:", error);
      notify.error(error?.response?.data?.message || 'Failed to create schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Effects
  useEffect(() => {
    console.log("Schedule component received info:", info);
  }, [info]);

  useEffect(() => {
    setSelectedDate(formatDateForInput(new Date()));
    generateDays();
  }, []);

  useEffect(() => {
    generateDays();
  }, [currentDate, selectedDate]);

  return (
    <div className={styles.booking}>
      <div className={styles.header}>
        <div className="flex items-center space-x-3"><h1>Book a Session</h1></div>
        <button onClick={onClose} aria-label="Close" type="button">×</button>
      </div>

      <div className={styles.profile}>
        <img 
          src={mentorProfilePic || 'https://placehold.co/400x400'} 
          alt="Profile" 
          width="64" 
          height="64" 
          onError={(e) => {
            e.currentTarget.src = 'https://placehold.co/400x400';
          }}
        />
        <div>
          <p><strong>{mentorName || 'Mentor Name'}</strong></p>
          <p>{mentorYear || 'Year'} - {mentorCourse || 'Course'}</p>
          <p>College of Computer Studies</p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.left}>
          <div className={styles.timeHeader}>
            <h2>Select Time Slots</h2>
            <p>({mentorSessionDur || 'Duration not specified'})</p>
          </div>
          <div className={styles.timeSlots}>
            {availableTimes.map((t) => (
              <button key={t} onClick={() => setSelectedTime(t)}
                className={`${styles.timeBtn} ${selectedTime === t ? styles.timeSelected : ''}`}>
                {t}
              </button>
            ))}
          </div>

          <h3 className={styles.modeHeader}>Select Mode of Session</h3>
          <div className={styles.modeButtons}>
            <button type="button" onClick={() => setSessionType('in-person')}
              className={`${styles.modeBtn} ${sessionType === 'in-person' ? styles.modeActive : ''}`}
              disabled={!isInPersonModality}>
              <span aria-label="In Person"><i className="fas fa-user"></i></span><span>In Person</span>
            </button>
            <button type="button" onClick={() => setSessionType('online')}
              className={`${styles.modeBtn} ${sessionType === 'online' ? styles.modeActive : ''}`}
              disabled={!isOnlineModality}>
              <span aria-label="Online"><i className="fas fa-laptop"></i></span><span>Online</span>
            </button>
          </div>

          {sessionType === 'in-person' && (
            <div className={styles.locationInput}>
              <input value={meetingLocation} onChange={(e) => setMeetingLocation(e.target.value)}
                type="text" placeholder="Enter meeting location" className={styles.locationField} required />
            </div>
          )}
        </div>

        <div className={styles.right}>
          <div className={styles.calendar}>
            <div className={styles.calendarHeader}>
              <button className={styles.arrow} onClick={prevMonth}>&lt;</button>
              <div className={styles.monthContainer}>
                <button className={styles.month} onClick={() => setShowYearSelection(!showYearSelection)}>
                  {currentMonthYear}
                </button>
                <button className={styles.todayBtn} onClick={goToToday}>Today</button>
              </div>
              <button className={styles.arrow} onClick={nextMonth}>&gt;</button>
            </div>

            {showYearSelection && (
              <div className={styles.yearSelect}>
                {years.map((year) => (
                  <div key={year} onClick={() => selectYear(year)}
                    className={`${styles.yearOption} ${currentDate.getFullYear() === year ? styles.yearActive : ''}`}>
                    {year}
                  </div>
                ))}
              </div>
            )}

            <div className={styles.calendarLegend}>
              <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.legendDotAvailable}`}></span><span>Available</span></div>
              <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.legendDotUnavailable}`}></span><span>Unavailable</span></div>
            </div>

            <div className={styles.weekdays}>{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d)=>(<div key={d}>{d}</div>))}</div>

            <div className={styles.days}>
              {days.map((day, idx) => (
                <div key={idx} onClick={() => day.isAvailable ? selectDate(day) : null}
                  className={[
                    styles.day,
                    day.isToday ? styles.today : '',
                    day.isSelected ? styles.selected : '',
                    day.isCurrentMonth ? styles.current : styles.other,
                    day.isAvailable ? styles.available : styles.unavailable,
                    day.isPast ? styles.pastDate : ''
                  ].join(' ')}>
                  {day.date.getDate()}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.subjectSelect}>
            <h3 className={styles.subjectHeader}>Select Subject</h3>
            <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}
              className={styles.subjectDropdown} required
                aria-label="Select subject">
              <option value="" disabled>Choose a subject</option>
              {(relatedSubjectOptions.length > 0 ? relatedSubjectOptions : subjectOptions).map((s, index) => (
                <option key={`${s}-${index}`} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <button onClick={onClose} type="button" className={styles.btnCancel}>CANCEL</button>
        <button onClick={confirmSchedule} type="button" className={styles.btnProceed} disabled={isSubmitting}>
          {isSubmitting ? 'PROCESSING...' : 'PROCEED'}
        </button>
      </div>
    </div>
  );
}