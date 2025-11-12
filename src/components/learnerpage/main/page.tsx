'use client';

import { useState, useEffect, useRef } from 'react';
import ViewUser from '@/components/learnerpage/viewUser/page';
import styles from './MainComponent.module.css';
import api from '@/lib/axios';

interface User {
  id: string;
  userName: string;
  yearLevel: string;
  course: string;
  image_url: string;
  proficiency: string;
  rating_ave: number;
}

interface MainComponentProps {
  userInformation: User[];
  schedule?: any;
  upcomingSchedule?: any;
}

export default function MainComponent({ 
  userInformation = [], 
  schedule, 
  upcomingSchedule 
}: MainComponentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>(userInformation);
  const [showViewUser, setShowViewUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // NEW: Keyboard navigation state
  const [focusedIndex, setFocusedIndex] = useState<number>(-1); // -1 means no focus, 0+ means card focus
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const userCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSeeMore = (user: User) => {
    console.log('See more clicked for user:', user);
    console.log('User ID:', user.id);
    
    // Add validation to ensure user has required data
    if (!user.id) {
      console.error('User ID is missing:', user);
      return;
    }
    
    setSelectedUser(user);
    setShowViewUser(true);
  };

  const handleCloseViewUser = () => {
    setShowViewUser(false);
    setSelectedUser(null);
    // Restore focus to the previously focused card when closing view
    setTimeout(() => {
      if (focusedIndex >= 0) {
        userCardRefs.current[focusedIndex]?.focus();
      }
    }, 0);
  };

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredUsers(userInformation);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = userInformation.filter((user) => {
      return (
        user.userName.toLowerCase().includes(query) ||
        user.course.toLowerCase().includes(query) ||
        user.yearLevel.toLowerCase().includes(query)
      );
    });
    setFilteredUsers(filtered);
    setFocusedIndex(-1); // Reset focus when search changes
    setIsNavigating(false);
  }, [searchQuery, userInformation]);

  // NEW: Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showViewUser) return; // Don't handle navigation when view popup is open

      const userCount = filteredUsers.length;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          setFocusedIndex(-1);
          setIsNavigating(false);
          searchInputRef.current?.focus();
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (!isNavigating && focusedIndex === -1) {
            // If not navigating and press up arrow, focus on search input
            searchInputRef.current?.focus();
            return;
          }
          
          if (focusedIndex === -1) {
            // Start navigation from the last card
            setFocusedIndex(userCount - 1);
            setIsNavigating(true);
          } else {
            // Navigate up in the grid
            setFocusedIndex(prev => {
              const newIndex = prev - 3;
              return newIndex >= 0 ? newIndex : prev;
            });
          }
          setIsNavigating(true);
          break;

        case 'ArrowDown':
          e.preventDefault();
          if (focusedIndex === -1 && userCount > 0) {
            // Start navigation from the first card
            setFocusedIndex(0);
            setIsNavigating(true);
          } else if (focusedIndex >= 0) {
            // Navigate down in the grid
            setFocusedIndex(prev => {
              const newIndex = prev + 3;
              return newIndex < userCount ? newIndex : prev;
            });
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (focusedIndex === -1 && userCount > 0) {
            setFocusedIndex(0);
          } else if (focusedIndex >= 0) {
            setFocusedIndex(prev => (prev > 0 ? prev - 1 : userCount - 1));
          }
          setIsNavigating(true);
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (focusedIndex === -1 && userCount > 0) {
            setFocusedIndex(0);
          } else if (focusedIndex >= 0) {
            setFocusedIndex(prev => (prev < userCount - 1 ? prev + 1 : 0));
          }
          setIsNavigating(true);
          break;

        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < userCount) {
            handleSeeMore(filteredUsers[focusedIndex]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredUsers, focusedIndex, showViewUser, isNavigating]);

  // NEW: Focus the current card when focusedIndex changes
  useEffect(() => {
    if (focusedIndex >= 0 && userCardRefs.current[focusedIndex]) {
      userCardRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  // NEW: Reset refs array when filteredUsers changes
  useEffect(() => {
    userCardRefs.current = userCardRefs.current.slice(0, filteredUsers.length);
  }, [filteredUsers]);

  // NEW: Handle search input focus - exit navigation mode
  const handleSearchFocus = () => {
    setFocusedIndex(-1);
    setIsNavigating(false);
  };

  // NEW: Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by useEffect, but we'll ensure it triggers
    if (filteredUsers.length > 0) {
      setFocusedIndex(0);
      setIsNavigating(true);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={styles.filledStar}>
        {i < Math.round(rating || 0) ? (
          <span style={{ color: '#ffd700' }}>★</span>
        ) : (
          <span style={{ color: '#e0e0e0' }}>☆</span>
        )}
      </span>
    ));
  };

  const getCourseAbbreviation = (course: string) => {
    const match = course.match(/\(([^)]+)\)/);
    return match ? match[1] : course;
  };

  const formatProficiency = (proficiency: string) => {
    if (!proficiency) return '';
    return proficiency.charAt(0).toUpperCase() + proficiency.slice(1).toLowerCase();
  };

  return (
    <div className={styles.mainWrapper}>
      {/* NEW: Added form element and ref for search */}
      <form onSubmit={handleSearchSubmit} className={styles.searchContainer}>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search by name, course, or year..."
          className={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleSearchFocus}
        />
        <button type="submit" className={styles.searchButton}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
      </form>

      <div className={styles.userGrid}>
        {filteredUsers.map((user, index) => (
          <div 
            key={user.id} 
            className={styles.userCard}
            // NEW: Added ref, tabIndex, and keyboard event handlers
            ref={el => { userCardRefs.current[index] = el; }} // <-- ensure void return
            tabIndex={focusedIndex === index ? 0 : -1}
            style={{
              border: focusedIndex === index ? '2px solid #6b7280' : 'none',
              boxShadow: focusedIndex === index ? '0 2px 2px rgba(146, 145, 145, 0.1)' : 'none',
              cursor: 'pointer'
            }}
            onClick={() => handleSeeMore(user)}
            onKeyDown={(e) => {
              // Handle Enter key on individual cards
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSeeMore(user);
              }
            }}
          >
            <div className={styles.upperElement}>
              <img
                src={user.image_url || 'https://placehold.co/600x400'}
                alt="profile-pic"
              />
              <h1>{user.userName}</h1>
              <div className={styles.stars}>
                {renderStars(user.rating_ave)}
              </div>
            </div>
            <div className={styles.lowerElement}>
              <p>{user.yearLevel}</p>
              <p>{getCourseAbbreviation(user.course)}</p>
              <p className={styles.proficiency}>{formatProficiency(user.proficiency)}</p>
              <div className={styles.buttonSpacer}></div>
              <button 
                onClick={() => handleSeeMore(user)}
                className={styles.seeMoreBtn}
              >
                See More
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal with proper overlay */}
      {showViewUser && selectedUser && (
        <div className={styles.modalOverlay}>
          <ViewUser 
            user={selectedUser}
            onClose={handleCloseViewUser}
            isOpen={showViewUser}
          />
        </div>
      )}
    </div>
  );
}