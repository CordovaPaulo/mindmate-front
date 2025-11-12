// src/components/mentorpage/main/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import ViewUser from '../viewUser/page';
import styles from './main.module.css';

// Updated interface to match the actual API response
interface User {
  id: string;
  name: string;
  yearLevel?: string;
  program?: string; // Make this optional since some learners don't have it
  image?: string | null;
}

interface MentorData {
  [key: string]: any;
}

interface MainComponentProps {
  users: User[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  mentorData?: MentorData;
  setUserId?: (id: string | null) => void;
  userData?: any;
}

export default function MainComponent({ 
  users, 
  searchQuery, 
  setSearchQuery,
  mentorData = {},
  setUserId,
  userData
}: MainComponentProps) {
  const [filteredUsers, setFilteredUsers] = useState<User[]>(users);
  const [isView, setIsView] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1); // -1 means no focus, 0+ means card focus
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const userCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = users.filter((user) => {
      // Safely handle undefined/null values
      const userName = user.name?.toLowerCase() || '';
      const yearLevel = user.yearLevel?.toLowerCase() || '';
      const program = user.program?.toLowerCase() || '';
      const programAbbreviation = user.program?.match(/\(([^)]+)\)/)?.[1]?.toLowerCase() || '';

      return (
        userName.includes(query) ||
        yearLevel.includes(query) ||
        program.includes(query) ||
        programAbbreviation.includes(query)
      );
    });
    
    setFilteredUsers(filtered);
    setFocusedIndex(-1); // Reset focus when search changes
    setIsNavigating(false);
  }, [searchQuery, users]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isView) return; // Don't handle navigation when view popup is open

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
            openView(filteredUsers[focusedIndex].id);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredUsers, focusedIndex, isView, isNavigating]);

  // Focus the current card when focusedIndex changes
  useEffect(() => {
    if (focusedIndex >= 0 && userCardRefs.current[focusedIndex]) {
      userCardRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by useEffect, but we'll ensure it triggers
    if (filteredUsers.length > 0) {
      setFocusedIndex(0);
      setIsNavigating(true);
    }
  };

  const openView = (id: string) => {
    setSelectedUserId(id);
    setIsView(true);
    if (setUserId) {
      setUserId(id);
    }
  };

  const closeView = () => {
    setIsView(false);
    setSelectedUserId(null);
    if (setUserId) {
      setUserId(null);
    }
  };

  // Helper function to get program abbreviation or full program name
  const getProgramDisplay = (program?: string) => {
    if (!program) return 'N/A';
    
    // Try to extract abbreviation from parentheses
    const abbreviation = program.match(/\(([^)]+)\)/)?.[1];
    return abbreviation || program;
  };

  // Helper function to handle image URLs
  const getImageUrl = (image?: string | null) => {
    if (!image || image === 'null' || image === null) {
      return 'https://placehold.co/600x400';
    }
    return image;
    // Restore focus to the previously focused card when closing view
    setTimeout(() => {
      if (focusedIndex >= 0) {
        userCardRefs.current[focusedIndex]?.focus();
      }
    }, 0);
  };

  // Reset refs array when filteredUsers changes
  useEffect(() => {
    userCardRefs.current = userCardRefs.current.slice(0, filteredUsers.length);
  }, [filteredUsers]);

  // Handle search input focus - exit navigation mode
  const handleSearchFocus = () => {
    setFocusedIndex(-1);
    setIsNavigating(false);
  };

  return (
    <div className={styles.mainWrapper}>
      <form onSubmit={handleSearchSubmit} className={styles.mainSearchContainer}>
        <input
          ref={searchInputRef}
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={handleSearchFocus}
          type="text"
          placeholder="Search by name, course, or year..."
          className={styles.mainSearchInput}
        />
        <button type="submit" className={styles.mainSearchButton}>
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
      
      <div className={styles.mainUserGrid}>
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user, index) => {
            const uid = user.id;
            return (
              <div 
              key={uid}
               className={styles.mainUserCard}
               ref={el => { userCardRefs.current[index] = el; }} // return void
               tabIndex={focusedIndex === index ? 0 : -1}
               style={{
                 border: focusedIndex === index ? '2px solid #6b7280' : 'none',
                 boxShadow: focusedIndex === index ? '0 2px 2px rgba(146, 145, 145, 0.1)' : 'none'
               }}
             >
               <div className={styles.mainUpperElement}>
                 <img
                   src={getImageUrl(user.image)}
                   alt={`${user.name || 'User'} profile`}
                   onError={(e) => {
                     e.currentTarget.src = 'https://placehold.co/600x400';
                   }}
                 />
                 <h1>{user.name || 'Unknown User'}</h1>
               </div>
               <div className={styles.mainLowerElement}>
                 <p>{user.yearLevel || 'N/A'}</p>
                 <p>{getProgramDisplay(user.program)}</p>
                 <div className={styles.mainButtonGroup}>
                   <button 
                     type="button"
                     className={styles.mainSeeMoreBtn}
                    onClick={() => openView(uid)}
                   >
                     See More
                   </button>
                 </div>
               </div>
             </div>
           );
          })
        ) : (
          <div className={styles.noResults}>
            <p>No learners found matching your search.</p>
          </div>
        )}
      </div>

      {/* View User Popup */}
      {isView && selectedUserId && (
        <div className={styles.mainViewPopupOverlay}>
          <div className={styles.mainViewPopup}>
            <ViewUser 
              userId={selectedUserId} 
              mentorData={mentorData}
              onClose={closeView}
            />
          </div>
        </div>
      )}
    </div>
  );
}