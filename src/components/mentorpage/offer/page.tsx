// src/components/mentorpage/offer/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import styles from './offer.module.css';
import api from '@/lib/axios';
import notify from '@/lib/toast';

type MaybeStrArr = string | string[] | undefined;

function toArray(v: MaybeStrArr): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; }
}

export interface OfferInfo {
  learnerId: string;
  name: string;
  year: string;
  course: string;
  sessionDur: string;
  modality: string;
  learnStyle: MaybeStrArr;
  availability: MaybeStrArr;
  profilePic: string;
  subjects: MaybeStrArr;
  rank?: string;
}

interface OfferProps {
  info: OfferInfo;
  mentorId: string;          // kept if you need it later
  onClose: () => void;
  onConfirm: (offerData: any) => void;
}

export default function Offer({ info, mentorId, onClose, onConfirm }: OfferProps) {
  const subjectOptions = useMemo(() => toArray(info.subjects), [info.subjects]);
  const [relatedSubjectOptions, setRelatedSubjectOptions] = useState<string[]>([]);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const specs = toArray(info.subjects);
        if (!specs || specs.length === 0) return;
        const res = await api.get('/api/mentor/subjects', {
          params: { specializations: JSON.stringify(specs) },
          withCredentials: true,
          // headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });

        const subjects = res.data?.subjects || [];
        const seen = new Set<string>();
        const options: string[] = [];

        // Normalize rank and determine which difficulty tiers to show.
        // Mapping: empty rank -> show all; Beginner -> beginner only; Intermediate -> beginner+intermediate; Advanced/Expert/Professional -> all tiers
        const r = (info.rank || '').toLowerCase();
        const isBeginner = r.includes('beginner');
        const isIntermediate = r.includes('intermediate');
        const isAdvanced = r.includes('advanced') || r.includes('expert') || r.includes('professional');

        const showBeginner = r === '' || isBeginner || isIntermediate || isAdvanced;
        const showIntermediate = r === '' || isIntermediate || isAdvanced;
        const showAdvanced = r === '' || isAdvanced;

        subjects.forEach((doc: any) => {
          const spec = doc.specialization || '';
          const difficulty = doc.difficulty || {};
          if (showBeginner && Array.isArray(difficulty.beginner)) {
            difficulty.beginner.forEach((topic: string) => {
              const label = spec ? `${spec} — ${topic}` : topic;
              if (!seen.has(label)) { seen.add(label); options.push(label); }
            });
          }
          if (showIntermediate && Array.isArray(difficulty.intermediate)) {
            difficulty.intermediate.forEach((topic: string) => {
              const label = spec ? `${spec} — ${topic}` : topic;
              if (!seen.has(label)) { seen.add(label); options.push(label); }
            });
          }
          if (showAdvanced && Array.isArray(difficulty.advanced)) {
            difficulty.advanced.forEach((topic: string) => {
              const label = spec ? `${spec} — ${topic}` : topic;
              if (!seen.has(label)) { seen.add(label); options.push(label); }
            });
          }
        });

        setRelatedSubjectOptions(options);
      } catch (err: any) {
        // If unauthorized, quietly fallback to legacy subject list
        const status = err?.response?.status;
        if (status === 403 || status === 401) {
          console.debug('No permission to fetch related subjects (status', status, '). Falling back to provided subjects.');
          setRelatedSubjectOptions([]);
          return;
        }
        console.error('Error fetching related subjects for offer:', err);
      }
    };

    fetchRelated();
  }, [info.subjects, info.rank]);
  const availDays = useMemo(() => toArray(info.availability).map(d => d.toLowerCase()), [info.availability]);

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [sessionType, setSessionType] = useState<'in-person'|'online'>('in-person');
  const [offerType, setOfferType] = useState<'one-on-one'|'group'>('one-on-one');
  const [groupName, setGroupName] = useState('');
  const [maxParticipants, setMaxParticipants] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [meetingLocation, setMeetingLocation] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [days, setDays] = useState<any[]>([]);

  const availableTimes = ["8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM"];

  const isInPersonModality = useMemo(() => {
    const m = (info.modality || '').toLowerCase();
    return m === 'in-person' || m === 'hybrid';
  }, [info.modality]);
  const isOnlineModality = useMemo(() => {
    const m = (info.modality || '').toLowerCase();
    return m === 'online' || m === 'hybrid';
  }, [info.modality]);
  const isHybridModality = useMemo(() => (info.modality || '').toLowerCase() === 'hybrid', [info.modality]);

  const currentMonthYear = useMemo(() =>
    new Date(currentDate).toLocaleDateString('default', { month: 'long', year: 'numeric' }),
    [currentDate]
  );

  const formatDateForInput = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`; // YYYY-MM-DD
  };

  const isPastDate = (date: Date) => {
    const t = new Date(); t.setHours(0,0,0,0);
    const c = new Date(date); c.setHours(0,0,0,0);
    return c < t;
  };

  const isDateAvailable = (date: Date) => {
    if (isPastDate(date)) return false;
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return availDays.includes(dayName);
  };

  const isToday = (date: Date) => {
    const t = new Date();
    return date.getDate() === t.getDate() && date.getMonth() === t.getMonth() && date.getFullYear() === t.getFullYear();
  };

  const generateDays = () => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const prevCount = first.getDay();
    const nextCount = 6 - last.getDay();

    const list:any[] = [];
    const prevLast = new Date(y, m, 0).getDate();
    for (let i = prevLast - prevCount + 1; i <= prevLast; i++) {
      const d = new Date(y, m - 1, i);
      list.push({ date: d, isCurrentMonth: false, isSelected: false, isToday: isToday(d), isAvailable: isDateAvailable(d) });
    }
    for (let i = 1; i <= last.getDate(); i++) {
      const d = new Date(y, m, i);
      const ds = formatDateForInput(d);
      list.push({ date: d, isCurrentMonth: true, isSelected: selectedDate === ds, isToday: isToday(d), isAvailable: isDateAvailable(d) });
    }
    for (let i = 1; i <= nextCount; i++) {
      const d = new Date(y, m + 1, i);
      list.push({ date: d, isCurrentMonth: false, isSelected: false, isToday: isToday(d), isAvailable: isDateAvailable(d) });
    }
    setDays(list);
  };

  const selectDate = (day:any) => {
    if (!day.isAvailable) return;
    if (!day.isCurrentMonth) {
      const nd = new Date(day.date);
      setCurrentDate(new Date(nd.getFullYear(), nd.getMonth(), 1));
      return;
    }
    setSelectedDate(formatDateForInput(day.date)); // keep YYYY-MM-DD for backend
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => { const t = new Date(); setCurrentDate(t); setSelectedDate(formatDateForInput(t)); };

  useEffect(() => { generateDays(); }, [currentDate, selectedDate]);
  useEffect(() => { const t = new Date(); setSelectedDate(formatDateForInput(t)); }, []);

  const confirmSchedule = async () => {
    if (!selectedDate || !selectedTime || !selectedSubject) {
      notify.warn('Please select date, time and subject');
      return;
    }
    if (sessionType === 'in-person' && !meetingLocation) {
      notify.warn('Please enter a meeting location');
      return;
    }
    if (offerType === 'group' && maxParticipants && parseInt(maxParticipants) < 1) {
      notify.warn('Max participants must be at least 1');
      return;
    }
    const match = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) {
      notify.error('Invalid time format');
      return;
    }
    let h = parseInt(match[1], 10); const minutes = match[2]; const period = match[3].toUpperCase();
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    const formattedTime = `${String(h).padStart(2, '0')}:${minutes}`;

    const body: any = {
      date: selectedDate,                 // YYYY-MM-DD
      time: formattedTime,               // HH:mm (24h)
      location: sessionType === 'in-person' ? meetingLocation : 'online',
      subject: selectedSubject,
      message: notes || ''
    };

    // Add group-specific fields
    if (offerType === 'group') {
      if (groupName) body.groupName = groupName;
      if (maxParticipants) body.maxParticipants = parseInt(maxParticipants);
    }

    setIsSubmitting(true);
    try {
      // Use different endpoint for group offers
      const endpoint = offerType === 'group' 
        ? `/api/mentor/send-offer/group/${encodeURIComponent(info.learnerId)}`
        : `/api/mentor/send-offer/${encodeURIComponent(info.learnerId)}`;
      
      const res = await api.post(endpoint, body, { withCredentials: true });
      if (res.status >= 200 && res.status < 300) {
        notify.success(`${offerType === 'group' ? 'Group' : ''} Offer sent!`);
        onConfirm({ ...body, learnerId: info.learnerId, mentorId, offerType });
        onClose();
      } else {
        notify.error(res.data?.message || 'Failed to send offer');
      }
    } catch (e:any) {
      const msg = e?.response?.data?.message || 'Error sending tutoring offer';
      console.error('Error sending offer:', e?.response?.data || e.message);
      notify.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.offerBooking}>
      <div className={styles.offerHeader}>
        <div className="flex items-center space-x-3"><h1>Send Offer</h1></div>
        <button onClick={onClose} aria-label="Close" type="button">×</button>
      </div>

      <div className={styles.offerProfile}>
        <img src={info.profilePic || 'https://placehold.co/400x400'} alt="Profile" width="64" height="64" />
        <div>
          <p><strong>{info.name}</strong></p>
          <p>{info.year} - {info.course}</p>
          <p>College of Computer Studies</p>
        </div>
      </div>

      <div className={styles.offerContent}>
        <div className={styles.offerLeft}>
          {/* Session Type Selection */}
          <div className={styles.offerSessionTypeSection}>
            <h3 className={styles.offerSessionTypeHeader}>Session Type</h3>
            <div className={styles.offerSessionTypeButtons}>
              <button
                type="button"
                onClick={() => setOfferType('one-on-one')}
                className={`${styles.offerSessionTypeBtn} ${offerType === 'one-on-one' ? styles.offerSessionTypeActive : ''}`}
              >
                <span>One-on-One</span>
              </button>
              <button
                type="button"
                onClick={() => setOfferType('group')}
                className={`${styles.offerSessionTypeBtn} ${offerType === 'group' ? styles.offerSessionTypeActive : ''}`}
              >
                <span>Group Session</span>
              </button>
            </div>
          </div>

          {/* Group Session Options */}
          {offerType === 'group' && (
            <div className={styles.offerGroupOptions}>
              <div className={styles.offerGroupField}>
                <label htmlFor="groupName" className={styles.offerGroupLabel}>Group Name (Optional)</label>
                <input
                  id="groupName"
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., Math Study Group"
                  className={styles.offerGroupInput}
                />
              </div>
              <div className={styles.offerGroupField}>
                <label htmlFor="maxParticipants" className={styles.offerGroupLabel}>Max Participants (Optional)</label>
                <input
                  id="maxParticipants"
                  type="number"
                  min="1"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  placeholder="e.g., 5"
                  className={styles.offerGroupInput}
                />
              </div>
            </div>
          )}

          <div className={styles.offerTimeHeader}>
            <h2>Select Time Slots</h2>
            <p>({info.sessionDur} duration)</p>
          </div>
          <div className={styles.offerTimeSlots}>
            {availableTimes.map((t) => (
              <button key={t} onClick={() => setSelectedTime(t)}
                className={`${styles.offerTimeBtn} ${selectedTime === t ? styles.offerTimeSelected : ''}`}>
                {t}
              </button>
            ))}
          </div>

          <h3 className={styles.offerModeHeader}>Select Mode of Session</h3>
          <div className={styles.offerModeButtons}>
            <button type="button" onClick={() => setSessionType('in-person')}
              className={`${styles.offerModeBtn} ${sessionType === 'in-person' ? styles.offerModeActive : ''}`}
              disabled={!isInPersonModality}>
              <span aria-label="In Person"><i className="fas fa-user"></i></span><span>In Person</span>
            </button>
            <button type="button" onClick={() => setSessionType('online')}
              className={`${styles.offerModeBtn} ${sessionType === 'online' ? styles.offerModeActive : ''}`}
              disabled={!isOnlineModality}>
              <span aria-label="Online"><i className="fas fa-laptop"></i></span><span>Online</span>
            </button>
          </div>

          {sessionType === 'in-person' && (
            <div className={styles.offerLocationInput}>
              <input value={meetingLocation} onChange={(e) => setMeetingLocation(e.target.value)}
                type="text" placeholder="Enter meeting location" className={styles.offerLocationField} required />
            </div>
          )}
        </div>

        <div className={styles.offerRight}>
          <div className={styles.offerCalendar}>
            <div className={styles.offerCalendarHeader}>
              <button className={styles.offerArrow} onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>&lt;</button>
              <div className={styles.offerMonthContainer}>
                <button className={styles.offerMonth}>{currentMonthYear}</button>
                <button className={styles.offerTodayBtn} onClick={goToToday}>Today</button>
              </div>
              <button className={styles.offerArrow} onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>&gt;</button>
            </div>

            <div className={styles.offerCalendarLegend}>
              <div className={styles.offerLegendItem}><span className={`${styles.offerLegendDot} ${styles.offerLegendDotAvailable}`}></span><span>Available</span></div>
              <div className={styles.offerLegendItem}><span className={`${styles.offerLegendDot} ${styles.offerLegendDotUnavailable}`}></span><span>Unavailable</span></div>
            </div>

            <div className={styles.offerWeekdays}>{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d)=>(<div key={d}>{d}</div>))}</div>

            <div className={styles.offerDays}>
              {days.map((day, idx) => (
                <div key={idx} onClick={() => day.isAvailable ? selectDate(day) : null}
                  className={[
                    styles.offerDay,
                    day.isToday ? styles.offerDayToday : '',
                    day.isSelected ? styles.offerDaySelected : '',
                    day.isCurrentMonth ? styles.offerDayCurrent : styles.offerDayOther,
                    day.isAvailable ? styles.offerDayAvailable : styles.offerDayUnavailable
                  ].join(' ')}>
                  {day.date.getDate()}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.offerSubjectSelect}>
            <h3 className={styles.offerSubjectHeader}>Select Specialization</h3>
            <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}
              className={styles.offerSubjectDropdown} required>
              <option value="" disabled>Choose a specialization</option>
              {(relatedSubjectOptions.length > 0 ? relatedSubjectOptions : subjectOptions).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* <div className={styles.offerNotes}>
            <textarea placeholder="Notes or message (optional)" value={notes} onChange={(e)=>setNotes(e.target.value)} />
          </div> */}
        </div>
      </div>

      <div className={styles.offerFooter}>
        <button onClick={onClose} type="button" className={styles.offerBtnCancel}>CANCEL</button>
        <button onClick={confirmSchedule} type="button" className={styles.offerBtnProceed} disabled={isSubmitting}>
          {isSubmitting ? 'SENDING...' : 'PROCEED'}
        </button>
      </div>
    </div>
  );
}