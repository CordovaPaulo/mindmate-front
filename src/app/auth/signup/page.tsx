'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './Signup.module.css';

export default function SignupPage() {
  const router = useRouter();

  // State declarations
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Refs
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const learnerCardRef = useRef<HTMLDivElement>(null);
  const mentorCardRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Constants
  const focusableElements = [
    { ref: backButtonRef, type: 'button' },
    { ref: learnerCardRef, type: 'card' },
    { ref: mentorCardRef, type: 'card' }
  ];

  const modalFocusableElements = [
    { ref: cancelButtonRef, type: 'button' },
    { ref: confirmButtonRef, type: 'button' }
  ];

  // Effects
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [focusedIndex, showConfirmationModal]);

  useEffect(() => {
    if (showConfirmationModal) {
      // When modal opens, focus cancel button
      setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 100);
      document.addEventListener('keydown', handleModalKeyDown);
    } else {
      document.removeEventListener('keydown', handleModalKeyDown);
      // When modal closes, return focus to the element that opened it
      if (selectedRole === 'learner') {
        learnerCardRef.current?.focus();
      } else if (selectedRole === 'mentor') {
        mentorCardRef.current?.focus();
      }
    }

    return () => {
      document.removeEventListener('keydown', handleModalKeyDown);
    };
  }, [showConfirmationModal]);

  // Auto-focus back button on component mount
  useEffect(() => {
    backButtonRef.current?.focus();
  }, []);

  // Navigation functions
  const scrollToGetStarted = () => {
    router.push('/#get-started');
  };

  const initiateSignUp = (role: string) => {
    setSelectedRole(role);
    setShowConfirmationModal(true);
  };

  const confirmSelection = () => {
    setShowConfirmationModal(false);
    
    // Store role selection
    localStorage.setItem('selectedRole', selectedRole);

    if (selectedRole === 'learner') {
      router.push('/info/learner');
    } else {
      router.push('/info/mentor');
    }
  };

  const cancelSelection = () => {
    setShowConfirmationModal(false);
    setSelectedRole('');
  };

  // Keyboard navigation functions
  const handleKeyDown = (e: KeyboardEvent) => {
    if (showConfirmationModal) return;

    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        const nextIndex = (focusedIndex + 1) % focusableElements.length;
        setFocusedIndex(nextIndex);
        focusableElements[nextIndex].ref.current?.focus();
        break;

      case 'ArrowRight':
        e.preventDefault();
        if (focusedIndex < focusableElements.length - 1) {
          const newIndex = focusedIndex + 1;
          setFocusedIndex(newIndex);
          focusableElements[newIndex].ref.current?.focus();
        }
        break;

      case 'ArrowLeft':
        e.preventDefault();
        if (focusedIndex > 0) {
          const newIndex = focusedIndex - 1;
          setFocusedIndex(newIndex);
          focusableElements[newIndex].ref.current?.focus();
        }
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex === 0) {
          // Back button
          scrollToGetStarted();
        } else if (focusedIndex === 1) {
          // Learner card
          initiateSignUp('learner');
        } else if (focusedIndex === 2) {
          // Mentor card
          initiateSignUp('mentor');
        }
        break;

      case 'Escape':
        if (focusedIndex > 0) {
          setFocusedIndex(0);
          backButtonRef.current?.focus();
        }
        break;
    }
  };

  const handleModalKeyDown = (e: KeyboardEvent) => {
    if (!showConfirmationModal) return;

    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        const currentModalIndex = modalFocusableElements.findIndex(
          item => document.activeElement === item.ref.current
        );
        const nextModalIndex = (currentModalIndex + 1) % modalFocusableElements.length;
        modalFocusableElements[nextModalIndex].ref.current?.focus();
        break;

      case 'ArrowRight':
        e.preventDefault();
        const currentRightIndex = modalFocusableElements.findIndex(
          item => document.activeElement === item.ref.current
        );
        if (currentRightIndex < modalFocusableElements.length - 1) {
          modalFocusableElements[currentRightIndex + 1].ref.current?.focus();
        }
        break;

      case 'ArrowLeft':
        e.preventDefault();
        const currentLeftIndex = modalFocusableElements.findIndex(
          item => document.activeElement === item.ref.current
        );
        if (currentLeftIndex > 0) {
          modalFocusableElements[currentLeftIndex - 1].ref.current?.focus();
        }
        break;

      case 'Enter':
        e.preventDefault();
        if (document.activeElement === cancelButtonRef.current) {
          cancelSelection();
        } else if (document.activeElement === confirmButtonRef.current) {
          confirmSelection();
        }
        break;

      case 'Escape':
        e.preventDefault();
        cancelSelection();
        break;
    }
  };

  // JSX Return
  return (
    <div className={styles.signupContainer}>
      <button 
        ref={backButtonRef}
        onClick={scrollToGetStarted} 
        className={styles.backBtn}
        onFocus={() => setFocusedIndex(0)}
        tabIndex={0}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M11.03 3.97a.75.75 0 010 1.06l-6.22 6.22H21a.75.75 0 010 1.5H4.81l6.22 6.22a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0z"
            clipRule="evenodd"
          />
        </svg>
        Back
      </button>

      {/* Confirmation Modal */}
      {showConfirmationModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmationModal}>
            <h3>Confirm Your Role</h3>
            <p>
              You've selected to proceed as
              <strong> {selectedRole.toUpperCase()}</strong>. Is this correct?
            </p>
            <div className={styles.modalActions}>
              <button 
                ref={cancelButtonRef}
                onClick={cancelSelection} 
                className={styles.cancelBtn}
                tabIndex={0}
              >
                Cancel
              </button>
              <button 
                ref={confirmButtonRef}
                onClick={confirmSelection} 
                className={styles.confirmBtn}
                tabIndex={0}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.headerText}>
        <h1>Complete Your Account</h1>
        <p>Pick a role to proceed with your profile setup</p>
      </div>

      <section className={styles.joinSection} id="get-started">
      {/* Learner Card */}
      <div className={`${styles.joinCard} ${styles.learnerCard}`}>
        <div className={styles.cardContent}>
          <div className={styles.roleTitle}>
            <span>PROCEED AS</span>
            <h3>LEARNER</h3>
            <hr className={styles.divider} />
          </div>

          <div className={styles.cardIcon}>
            <Image 
              src="/learners.png" 
              alt="Learner Icon" 
              width={230}
              height={200}
            />
          </div>

          <button
            type="button"
            className={styles.joinBtn}
            onClick={() => initiateSignUp('learner')}
            aria-label="Sign up as Learner"
          >
            Get Started
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mentor Card */}
      <div className={`${styles.joinCard} ${styles.mentorCard}`}>
        <div className={styles.cardContent}>
          <div className={styles.roleTitle}>
            <span>PROCEED AS</span>
            <h3>MENTOR</h3>
            <hr className={styles.divider} />
          </div>

          <div className={styles.cardIcon}>
            <Image 
              src="/mentors.png" 
              alt="Mentor Icon" 
              width={230}
              height={200}
            />
          </div>

          <button
            type="button"
            className={styles.joinBtn}
            onClick={() => initiateSignUp('mentor')}
            aria-label="Sign up as Mentor"
          >
            Get Started
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>

    </div>
  );
}