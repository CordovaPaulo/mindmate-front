'use client';

import React, { useId, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import styles from '../LearnerInfo.module.css';
import api from "@/lib/axios";

// Interfaces
interface DropdownOpenState {
  gender: boolean;
  yearLevel: boolean;
  program: boolean;
  modality: boolean;
  availability: boolean;
  learningStyle: boolean;
  sessionDuration: boolean;
}

interface ValidationErrors {
  address?: string;
  contactNumber?: string;
  gender?: string;
  selectedSubjects?: string;
  bio?: string;
  goals?: string;
  [key: string]: string | undefined;
}

// Constants
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const sessionStyles = [
  'Lecture-Based',
  'Interactive Discussion (hands-on)',
  'Q&A Session',
  'Demonstration',
  'Project-based',
  'Step-by-step process'
];
const modalityOptions = ['Online', 'In-person', 'Hybrid'];
const programs = [
  'Bachelor of Science in Information Technology (BSIT)',
  'Bachelor of Science in Computer Science (BSCS)',
  'Bachelor of Science in Entertainment and Multimedia Computing (BSEMC)'
];

const validationRules = {
  address: {
    minLength: 10,
    message: 'Address should be at least 10 characters long'
  },
  contactNumber: {
    pattern: /^09\d{9}$/,
    message: 'Contact number should start with 09 and have 11 digits'
  },
  bio: {
    minLength: 50,
    maxLength: 500,
    message: 'Bio should be between 50-500 characters'
  },
  goals: {
    minLength: 50,
    maxLength: 500,
    message: 'Goals should be between 50-500 characters'
  }
};

const LearnerInfo = () => {
  const router = useRouter();
  
  // State declarations
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;
  // success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Form data state
  const [gender, setGender] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [program, setProgram] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [modality, setModality] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [selectedSessionStyles, setSelectedSessionStyles] = useState<string[]>([]);
  const [sessionDuration, setSessionDuration] = useState('');
  const [goals, setGoals] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profilePictureName, setProfilePictureName] = useState('');
  
  // UI state
  const [dropdownOpen, setDropdownOpen] = useState<DropdownOpenState>({
    gender: false,
    yearLevel: false,
    program: false,
    modality: false,
    availability: false,
    learningStyle: false,
    sessionDuration: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isButtonActive, setIsButtonActive] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [showSubjectsDropdown, setShowSubjectsDropdown] = useState(false);
  
  // Subjects state
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

  // Refs
  const profileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRefs = {
    gender: useRef<HTMLDivElement>(null),
    yearLevel: useRef<HTMLDivElement>(null),
    program: useRef<HTMLDivElement>(null),
    modality: useRef<HTMLDivElement>(null),
    availability: useRef<HTMLDivElement>(null),
    learningStyle: useRef<HTMLDivElement>(null),
    sessionDuration: useRef<HTMLDivElement>(null),
  };
  const addressRef = useRef<HTMLInputElement>(null);
  const contactNumberRef = useRef<HTMLInputElement>(null);
  const genderRef = useRef<HTMLDivElement>(null);
  const yearLevelRef = useRef<HTMLDivElement>(null);
  const programRef = useRef<HTMLDivElement>(null);
  const profileUploadRef = useRef<HTMLDivElement>(null);
  const availabilityRef = useRef<HTMLDivElement>(null);
  const subjectsRef = useRef<HTMLDivElement>(null);
  const modalityRef = useRef<HTMLDivElement>(null);
  const sessionDurationRef = useRef<HTMLDivElement>(null);
  const learningStyleRef = useRef<HTMLDivElement>(null);
  const bioRef = useRef<HTMLTextAreaElement>(null);
  const goalsRef = useRef<HTMLTextAreaElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const prevStepButtonRef = useRef<HTMLButtonElement>(null);

  // Computed values
  const availabilityDaysDisplay = selectedDays.join(', ') || 'Select available days';
  const learningStyleDisplay = selectedSessionStyles.join(', ') || 'Select learning style(s)';
  const availabilityListboxId = 'availability-listbox';
  const modalityListboxId = 'modality-listbox';

  // Effects
  useEffect(() => {
    updateAvailableSubjects();
  }, [program]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isOutsideAll = Object.values(dropdownRefs).every(ref => {
        return ref.current && !ref.current.contains(event.target as Node);
      });

      if (isOutsideAll) {
        setDropdownOpen({
          gender: false,
          yearLevel: false,
          program: false,
          modality: false,
          availability: false,
          learningStyle: false,
          sessionDuration: false,
        });
        setShowSubjectsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyNavigation);
    return () => {
      document.removeEventListener('keydown', handleKeyNavigation);
    };
  }, [currentStep]);

  // Helper functions
  const toggleDropdown = (type: keyof DropdownOpenState) => {
    setDropdownOpen(prev => {
      const newState: DropdownOpenState = { ...prev };
      Object.keys(newState).forEach(key => {
        newState[key as keyof DropdownOpenState] = key === type ? !prev[key as keyof DropdownOpenState] : false;
      });
      return newState;
    });
    
    if (type !== 'availability' && type !== 'learningStyle') {
      setShowSubjectsDropdown(false);
    }
  };
  
  const toggleSubjectDropdown = () => {
    setShowSubjectsDropdown(!showSubjectsDropdown);
    
    setDropdownOpen({
      gender: false,
      yearLevel: false,
      program: false,
      modality: false,
      availability: false,
      learningStyle: false,
      sessionDuration: false
    });
  };
  
  const validateField = (field: string, value: string) => {
    const rules = validationRules[field as keyof typeof validationRules];
    if (!rules) return true;
    
    let isValid = true;
    let errorMessage = '';
    
    if ('pattern' in rules && rules.pattern && !rules.pattern.test(value)) {
      isValid = false;
      errorMessage = rules.message;
    }
    
    if ('minLength' in rules && rules.minLength && value.length < rules.minLength) {
      isValid = false;
      errorMessage = rules.message;
    }
    
    if ('maxLength' in rules && rules.maxLength && value.length > rules.maxLength) {
      isValid = false;
      errorMessage = rules.message;
    }
    
    setValidationErrors(prev => ({
      ...prev,
      [field]: isValid ? '' : errorMessage
    }));
    
    return isValid;
  };
  
  const validateForm = () => {
    const errors: ValidationErrors = {};
    
    if (currentStep === 1) {
      if (!gender) errors.gender = 'Gender is required';
      if (!contactNumber || contactNumber.length !== 11) errors.contactNumber = 'Valid Contact Number is required (11 digits)';
      if (!address.trim()) errors.address = 'Address is required';
    }
    
    if (currentStep === 2) {
      if (selectedSubjects.length === 0) errors.selectedSubjects = 'At least one subject is required';
      if (!bio.trim()) errors.bio = 'Short Bio is required';
      if (!goals.trim()) errors.goals = 'Learning goals is required';
      if (!profileImage) errors.profileImage = 'Profile Picture is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const updateAvailableSubjects = () => {
    switch (program) {
      case 'Bachelor of Science in Information Technology (BSIT)':
        setAvailableSubjects([
          'Web and Mobile Application Development',
          'Network Administration and Security Management',
          'Data Science and Software Design',
          'Service Management for Business Process Outsourcing',
          'Business Analytics',
          'Cloud Computing'
        ]);
        break;

      case 'Bachelor of Science in Computer Science (BSCS)':
        setAvailableSubjects([
          'Software Engineering',
          'Artificial Intelligence and Machine Learning',
          'Data Science',
          'Cloud Computing',
          'Cybersecurity'
        ]);
        break;

      case 'Bachelor of Science in Entertainment and Multimedia Computing (BSEMC)':
        setAvailableSubjects([
          'Game Development',
          'Digital Animation Technology',
          'Interactive Media and Web Development',
          'Virtual Reality and Augmented Reality',
          'Multimedia Design'
        ]);
        break;

      default:
        setAvailableSubjects([]);
    }
    // Clear selected subjects when program changes
    setSelectedSubjects([]);
  };

  // Navigation functions
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const nextStep = () => {
    if (isSubmitting) return;
    
    if (!validateForm()) {
      alert('Please complete all required fields before proceeding');
      return;
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      submitLearnerInfo();
    }
  };
  
  const goToStep = (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  // Keyboard navigation functions
  const handleKeyNavigation = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
      return;
    }

    const currentActiveElement = document.activeElement;
    const allFocusableElements = getFocusableElements();
    
    if (allFocusableElements.length === 0) return;

    const currentIndex = allFocusableElements.indexOf(currentActiveElement as HTMLElement);
    let nextIndex = -1;

    if (e.key === 'ArrowDown') {
      nextIndex = currentIndex < allFocusableElements.length - 1 ? currentIndex + 1 : 0;
    } else if (e.key === 'ArrowUp') {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : allFocusableElements.length - 1;
    } else if (e.key === 'ArrowLeft') {
      if (currentStep === 1) {
        if (currentActiveElement === nextButtonRef.current) {
          e.preventDefault();
          backButtonRef.current?.focus();
          return;
        }
      } else if (currentStep === 2) {
        if (currentActiveElement === nextButtonRef.current) {
          e.preventDefault();
          prevStepButtonRef.current?.focus();
          return;
        } else if (currentActiveElement === prevStepButtonRef.current) {
          e.preventDefault();
          const formElements = getFocusableElements().filter(el => 
            el !== backButtonRef.current && 
            el !== prevStepButtonRef.current && 
            el !== nextButtonRef.current
          );
          if (formElements.length > 0) {
            formElements[formElements.length - 1]?.focus();
          }
          return;
        }
      }
    } else if (e.key === 'ArrowRight') {
      if (currentStep === 1) {
        if (currentActiveElement === backButtonRef.current) {
          e.preventDefault();
          nextButtonRef.current?.focus();
          return;
        }
      } else if (currentStep === 2) {
        if (currentActiveElement === prevStepButtonRef.current) {
          e.preventDefault();
          nextButtonRef.current?.focus();
          return;
        } else if (currentActiveElement === backButtonRef.current) {
          e.preventDefault();
          const formElements = getFocusableElements().filter(el => 
            el !== backButtonRef.current && 
            el !== prevStepButtonRef.current && 
            el !== nextButtonRef.current
          );
          if (formElements.length > 0) {
            formElements[0]?.focus();
          }
          return;
        }
      }
    }

    if (nextIndex !== -1) {
      e.preventDefault();
      allFocusableElements[nextIndex]?.focus();
    }
  };

  const getFocusableElements = (): HTMLElement[] => {
    const focusableSelectors = [
      'input:not([disabled])',
      'textarea:not([disabled])',
      'button:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '.dropdown-container',
      '.dropdown-trigger',
      '.upload-controls'
    ].join(',');

    const currentStepElement = document.querySelector('.form-container');
    if (!currentStepElement) return [];

    const elements = Array.from(currentStepElement.querySelectorAll(focusableSelectors)) as HTMLElement[];
    
    if (nextButtonRef.current) {
      elements.push(nextButtonRef.current);
    }
    if (backButtonRef.current) {
      elements.push(backButtonRef.current);
    }
    if (prevStepButtonRef.current && currentStep === 2) {
      elements.push(prevStepButtonRef.current);
    }

    return elements.filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    });
  };

  const focusFirstDropdownOption = (dropdownElement: HTMLElement) => {
    const firstOption = dropdownElement.querySelector('.dropdown-option') as HTMLElement;
    firstOption?.focus();
  };

  const handleDropdownKeyNavigation = (e: React.KeyboardEvent, dropdownType: keyof DropdownOpenState) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!dropdownOpen[dropdownType]) {
        toggleDropdown(dropdownType);
        setTimeout(() => {
          const dropdownElement = dropdownRefs[dropdownType]?.current;
          if (dropdownElement) {
            focusFirstDropdownOption(dropdownElement);
          }
        }, 0);
      }
    } else if (e.key === 'Escape' && dropdownOpen[dropdownType]) {
      e.preventDefault();
      setDropdownOpen(prev => ({ ...prev, [dropdownType]: false }));
    }
  };

  const handleSubjectsKeyNavigation = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!showSubjectsDropdown) {
        toggleSubjectDropdown();
      }
    } else if (e.key === 'Escape' && showSubjectsDropdown) {
      e.preventDefault();
      setShowSubjectsDropdown(false);
    }
  };

  const handleCheckboxKeyNavigation = (e: React.KeyboardEvent, 
    type: 'day' | 'style' | 'subject', 
    value: string, 
    currentState: string[], 
    setState: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (currentState.includes(value)) {
        setState(currentState.filter(item => item !== value));
      } else {
        setState([...currentState, value]);
      }
    }
  };

  // File handling functions
  const uploadProfilePicture = () => {
    profileInputRef.current?.click();
  };
  
  const handleProfileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.match('image.*')) {
        alert('Please select an image file');
        return;
      }

      if (file.size > (5 * 1024 * 1024)) {
        alert('File size should be less than 5MB');
        return;
      }
      
      setProfilePictureName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // API functions
  function getCookie(name: string) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  }

  const submitLearnerInfo = async () => {
    if (!validateForm()) {
      alert('Please complete all required fields before submitting');
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      
      const mapProgram = (program: string) => {
        const programMap: { [key: string]: string } = {
          'Bachelor of Science in Information Technology (BSIT)': 'BSIT',
          'Bachelor of Science in Computer Science (BSCS)': 'BSCS',
          'Bachelor of Science in Entertainment and Multimedia Computing (BSEMC)': 'BSEMC'
        };
        return programMap[program] || program;
      };

      const mapYearLevel = (yearLevel: string) => {
        const yearMap: { [key: string]: string } = {
          '1st Year': '1st year',
          '2nd Year': '2nd year',
          '3rd Year': '3rd year',
          '4th Year': '4th year',
          'Graduate': 'graduate'
        };
        return yearMap[yearLevel] || yearLevel.toLowerCase();
      };

      const mapModality = (modality: string) => {
        const modalityMap: { [key: string]: string } = {
          'Online': 'online',
          'In-person': 'in-person',
          'Hybrid': 'mixed'
        };
        return modalityMap[modality] || modality.toLowerCase();
      };

      const mapSessionDuration = (duration: string) => {
        const durationMap: { [key: string]: string } = {
          '1 hour': '1hr',
          '2 hours': '2hrs',
          '3 hours': '3hrs'
        };
        return durationMap[duration] || duration;
      };

      const mapAvailability = (days: string[]) => {
        return days.map(day => day.toLowerCase());
      };

      const mapLearningStyle = (styles: string[]) => {
        const styleMap: { [key: string]: string } = {
          'Lecture-Based': 'lecture-based',
          'Interactive Discussion (hands-on)': 'interactive-discussion',
          'Q&A Session': 'q-and-a-discussion',
          'Demonstration': 'demonstrations',
          'Project-based': 'project-based',
          'Step-by-step process': 'step-by-step-discussion'
        };
        return styles.map(style => styleMap[style] || style.toLowerCase().replace(/\s+/g, '-'));
      };

      formData.append('program', mapProgram(program));
      formData.append('yearLevel', mapYearLevel(yearLevel));
      formData.append('phoneNumber', contactNumber);
      formData.append('bio', bio);
      formData.append('sex', gender.toLowerCase());
      formData.append('goals', goals || 'To improve my academic performance');
      formData.append('address', address);
      formData.append('modality', mapModality(modality));
      formData.append('sessionDur', mapSessionDuration(sessionDuration));
      
      formData.append('subjects', JSON.stringify(selectedSubjects));
      formData.append('availability', JSON.stringify(mapAvailability(selectedDays)));
      formData.append('style', JSON.stringify(mapLearningStyle(selectedSessionStyles)));
      
      if (profileInputRef.current?.files?.[0]) {
        formData.append('image', profileInputRef.current.files[0]);
      }

      const token = getCookie('MindMateToken');

      const response = await api.post('/api/auth/learner/alt-signup', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      console.log('Learner signup successful:', response.data);
      // show modal prompting user to verify email, then redirect on close
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Learner signup error:', error);
      alert('There was an error submitting your information. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsButtonActive(false);
    }
  };

  // Keyboard navigation helpers
  function focusFirstOption(listboxId: string) {
    const first = document.querySelector<HTMLElement>(`#${listboxId} [role="option"]`);
    first?.focus();
  }

  const handleComboboxKey =
    (toggleOpen: () => void, isOpen: boolean, listboxId: string) =>
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleOpen();
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        toggleOpen();
      } else if ((e.key === 'ArrowDown' || e.key === 'Down') && isOpen) {
        e.preventDefault();
        focusFirstOption(listboxId);
      }
    };

  const handleOptionKeyDown: React.KeyboardEventHandler<HTMLElement> = (e) => {
    const current = e.currentTarget;
    const options = Array.from(current.parentElement?.querySelectorAll<HTMLElement>('[role="option"]') || []);
    const idx = options.indexOf(current);

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const input = current.querySelector<HTMLInputElement>('input[type="checkbox"], input[type="radio"]');
      input?.click();
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'Down') {
      e.preventDefault();
      options[Math.min(idx + 1, options.length - 1)]?.focus();
      return;
    }
    if (e.key === 'ArrowUp' || e.key === 'Up') {
      e.preventDefault();
      options[Math.max(idx - 1, 0)]?.focus();
      return;
    }
    if (e.key === 'Home') {
      e.preventDefault();
      options[0]?.focus();
      return;
    }
    if (e.key === 'End') {
      e.preventDefault();
      options[options.length - 1]?.focus();
      return;
    }
  };

  return (
    <div className={`${styles.root} ${styles['learnerinfo-container']}`}>
      <Head>
        <title>Learner Information</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />
      </Head>

      <button 
        ref={backButtonRef}
        onClick={() => router.push('/auth/signup')} 
        className={styles['back-btn']}
        tabIndex={0}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path fillRule="evenodd" d="M11.03 3.97a.75.75 0 010 1.06l-6.22 6.22H21a.75.75 0 010 1.5H4.81l6.22 6.22a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0z" clipRule="evenodd"/>
        </svg>
        Back
      </button>

      <header className={styles['page-header']}>
        <h1>LEARNER INFO</h1>
        <p>Complete your profile to start learning.</p>
      </header>

      <div className={`${styles['form-container']} ${styles['scrollable-content']}`}>
        {currentStep === 1 && (
          <div>
            <h2 className={styles.title}>I. PERSONAL INFORMATION</h2>

            <div className={styles['personal-field']}>
              <label className={`${styles['personal-label']} ${styles.required}`} htmlFor="address">ADDRESS</label>
              <input
                ref={addressRef}
                type="text"
                id="address"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  validateField('address', e.target.value);
                }}
                onBlur={() => validateField('address', address)}
                placeholder="Enter your address"
                disabled={isSubmitting}
                className={`${styles['personal-input']} ${validationErrors.address ? styles.error : ''}`}
                tabIndex={0}
              />
              {validationErrors.address && (
                <span className={styles['validation-message']}>
                  {validationErrors.address}
                </span>
              )}
            </div>

            <div className={styles['personal-field']}>
              <label className={`${styles['personal-label']} ${styles.required}`} htmlFor="contact-number">
                CONTACT NUMBER
              </label>
              <input
                ref={contactNumberRef}
                type="text"
                id="contact-number"
                value={contactNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setContactNumber(value.slice(0, 11));
                  validateField('contactNumber', value);
                }}
                onBlur={() => validateField('contactNumber', contactNumber)}
                placeholder="Enter your contact number (11 digits)"
                disabled={isSubmitting}
                className={`${styles['personal-input']} ${validationErrors.contactNumber ? styles.error : ''}`}
                maxLength={11}
                tabIndex={0}
              />
              {validationErrors.contactNumber && (
                <span className={styles['validation-message']}>
                  {validationErrors.contactNumber}
                </span>
              )}
            </div>

            <div className={styles['personal-field']}>
              <label className={`${styles['personal-label']} ${styles.required}`} htmlFor="gender">
                SEX AT BIRTH
              </label>
              <div 
                ref={genderRef}
                className={styles['gender-dropdown']}
                tabIndex={0}
                onKeyDown={(e) => handleDropdownKeyNavigation(e, 'gender')}
              >
                <div className={styles['dropdown-container']} onClick={(e) => { e.stopPropagation(); toggleDropdown('gender'); }}>
                  <input
                    type="text"
                    value={gender}
                    placeholder="Select your sex"
                    disabled={isSubmitting}
                    className={styles['personal-input']}
                    readOnly
                    tabIndex={-1}
                  />
                  <i className={`fas fa-chevron-down ${styles['dropdown-icon']}`}></i>
                </div>
                {dropdownOpen.gender && (
                  <div className={styles['dropdown-options']}>
                    <div 
                      className={styles['dropdown-option']} 
                      onClick={() => {
                        setGender('Female');
                        setDropdownOpen({ ...dropdownOpen, gender: false });
                      }}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setGender('Female');
                          setDropdownOpen({ ...dropdownOpen, gender: false });
                        }
                      }}
                    >
                      Female
                    </div>
                    <div 
                      className={styles['dropdown-option']} 
                      onClick={() => {
                        setGender('Male');
                        setDropdownOpen({ ...dropdownOpen, gender: false });
                      }}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setGender('Male');
                          setDropdownOpen({ ...dropdownOpen, gender: false });
                        }
                      }}
                    >
                      Male
                    </div>
                  </div>
                )}
                {validationErrors.gender && (
                  <span className={styles['validation-message']}>
                    {validationErrors.gender}
                  </span>
                )}
              </div>
            </div>

            <div className={styles['personal-field']}>
               <label className={`${styles['personal-label']} ${styles.required}`} htmlFor="year-level">YEAR LEVEL</label>
              <div 
                ref={yearLevelRef}
                className={styles['year-dropdown']}
                tabIndex={0}
                onKeyDown={(e) => handleDropdownKeyNavigation(e, 'yearLevel')}
              >
                <div className={styles['dropdown-container']} onClick={(e) => { e.stopPropagation(); toggleDropdown('yearLevel'); }}>
                  <input
                    type="text"
                    value={yearLevel}
                    placeholder="Select your year level"
                    disabled={isSubmitting}
                    className={styles['personal-input']}
                    readOnly
                    tabIndex={-1}
                  />
                  <i className={`fas fa-chevron-down ${styles['dropdown-icon']}`}></i>
                </div>
                {dropdownOpen.yearLevel && (
                  <div className={styles['dropdown-options']}>
                    <div className={styles['dropdown-option']} onClick={() => { setYearLevel('1st Year'); setDropdownOpen({ ...dropdownOpen, yearLevel: false }); }} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setYearLevel('1st Year'); setDropdownOpen({ ...dropdownOpen, yearLevel: false }); } }}>1st Year</div>
                    <div className={styles['dropdown-option']} onClick={() => { setYearLevel('2nd Year'); setDropdownOpen({ ...dropdownOpen, yearLevel: false }); }} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setYearLevel('2nd Year'); setDropdownOpen({ ...dropdownOpen, yearLevel: false }); } }}>2nd Year</div>
                    <div className={styles['dropdown-option']} onClick={() => { setYearLevel('3rd Year'); setDropdownOpen({ ...dropdownOpen, yearLevel: false }); }} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setYearLevel('3rd Year'); setDropdownOpen({ ...dropdownOpen, yearLevel: false }); } }}>3rd Year</div>
                    <div className={styles['dropdown-option']} onClick={() => { setYearLevel('4th Year'); setDropdownOpen({ ...dropdownOpen, yearLevel: false }); }} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setYearLevel('4th Year'); setDropdownOpen({ ...dropdownOpen, yearLevel: false }); } }}>4th Year</div>
                  </div>
                )}
              </div>
            </div>
            
            <div className={styles['personal-field']}>
                <label className={`${styles['personal-label']} ${styles.required}`} htmlFor="program">PROGRAM</label>
              <div 
                ref={programRef}
                className={styles['program-dropdown']}
                tabIndex={0}
                onKeyDown={(e) => handleDropdownKeyNavigation(e, 'program')}
              >
                <div className={styles['dropdown-container']} onClick={(e) => { e.stopPropagation(); toggleDropdown('program'); }}>
                  <input
                    type="text"
                    value={program}
                    placeholder="Select your program"
                    className={styles['personal-input']}
                    disabled={isSubmitting}
                    readOnly
                    tabIndex={-1}
                  />
                  <i className={`fas fa-chevron-down ${styles['dropdown-icon']}`}></i>
                </div>
                {dropdownOpen.program && (
                  <div className={styles['dropdown-options']}>
                    {programs.map(programOption => (
                      <div
                        key={programOption}
                        className={styles['dropdown-option']}
                        onClick={() => {
                          setProgram(programOption);
                          setDropdownOpen({ ...dropdownOpen, program: false });
                        }}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setProgram(programOption);
                            setDropdownOpen({ ...dropdownOpen, program: false });
                          }
                        }}
                      >
                        {programOption}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <h2 className={styles.title}>II. PROFILE INFORMATION</h2>

            <div className={styles['upload-container']}>
              <div className={styles['profile-picture-upload']}>
                <label className={styles['profile-label']}>PROFILE PICTURE</label>
                <div 
                  ref={profileUploadRef}
                  className={styles['upload-controls']} 
                  onClick={uploadProfilePicture}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      uploadProfilePicture();
                    }
                  }}
                >
                  <div className={styles['profile-preview-container']}>
                    {profileImage ? (
                      <img src={profileImage} alt="Profile Preview" className={styles['profile-preview']} />
                    ) : (
                      <i className="fas fa-user-circle default-icon"></i>
                    )}
                  </div>
                  <div className={styles['upload-text']}>
                    <div className={styles['choose-file-container']}>
                      <i className="fas fa-upload"></i>
                      <span>Choose File</span>
                    </div>
                    <input type="file" ref={profileInputRef} accept="image/*" disabled={isSubmitting} className={styles['hidden-input']} onChange={handleProfileUpload} aria-label="Upload profile picture" />
                    <span className={styles['file-name']}>
                      {profilePictureName || 'No file chosen'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.divider}></div>

            <div className={styles['profile-field']}>
               <label className={`${styles['profile-label']} ${styles.required}`} htmlFor="availability-days">DAYS OF AVAILABILITY</label>
              <div 
                ref={availabilityRef}
                className={styles['availability-dropdown']}
                tabIndex={0}
                onKeyDown={(e) => handleDropdownKeyNavigation(e, 'availability')}
              >
                <div className={styles['dropdown-container']} onClick={(e) => { e.stopPropagation(); toggleDropdown('availability'); }}>
                  <input
                    type="text"
                    id="availability-days"
                    value={availabilityDaysDisplay}
                    placeholder="Select available days"
                    disabled={isSubmitting}
                    className={styles['profile-input']}
                    readOnly
                    tabIndex={-1}
                  />
                  <i className={`fas fa-chevron-down ${styles['dropdown-icon']}`}></i>
                </div>
                {dropdownOpen.availability && (
                  <div
                    id={availabilityListboxId}
                    className={`${styles['dropdown-options']} ${styles['availability-options']}`}
                    role="listbox"
                    aria-multiselectable="true"
                  >
                    {daysOfWeek.map((day) => {
                      const optionId = `day-${day}`;
                      const isSelected = selectedDays.includes(day);
                      return (
                        <div
                          key={day}
                          role="option"
                          aria-selected={`${isSelected}`}
                          tabIndex={-1}
                          className={`${styles['dropdown-option']} ${styles['availability-option']}`}
                          onKeyDown={handleOptionKeyDown}
                        >
                          <input
                            type="checkbox"
                            id={optionId}
                            disabled={isSubmitting}
                            checked={selectedDays.includes(day)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDays([...selectedDays, day]);
                              } else {
                                setSelectedDays(selectedDays.filter(d => d !== day));
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            tabIndex={0}
                            onKeyDown={(e) => handleCheckboxKeyNavigation(e, 'day', day, selectedDays, setSelectedDays)}
                          />
                          <label htmlFor={optionId}>{day}</label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Updated Subjects Dropdown with Direct Checkboxes */}
            <div className={styles['profile-field']}>
              <label className={`${styles['profile-label']} ${styles.required}`}>SPECIALIZATION</label>
              <div ref={subjectsRef} className={styles['dropdown-wrapper']} tabIndex={0} onKeyDown={handleSubjectsKeyNavigation}>
                <div className={styles['dropdown-trigger']} onClick={(e) => { e.stopPropagation(); toggleSubjectDropdown(); }}>
                  <input
                    type="text"
                    placeholder={
                      selectedSubjects.length
                        ? `${selectedSubjects.length} subjects selected`
                        : 'Select subjects'
                    }
                    readOnly
                    disabled={isSubmitting}
                    className={`${styles['profile-input']} ${validationErrors.selectedSubjects ? styles.error : ''}`}
                    tabIndex={-1}
                  />
                  <i className={`fas fa-chevron-down ${styles['dropdown-icon']}`}></i>
                </div>

                {showSubjectsDropdown && (
                  <div className={`${styles['dropdown-menu']} ${styles.subjects}`}>
                    {availableSubjects.length > 0 ? (
                      availableSubjects.map(subject => (
                        <div key={subject} className={`${styles['dropdown-item']} ${styles['subject-item']}`}>
                          <input
                            type="checkbox"
                            id={subject}
                            disabled={isSubmitting}
                            checked={selectedSubjects.includes(subject)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSubjects([...selectedSubjects, subject]);
                              } else {
                                setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
                              }
                            }}
                            tabIndex={0}
                            onKeyDown={(e) => handleCheckboxKeyNavigation(e, 'subject', subject, selectedSubjects, setSelectedSubjects)}
                          />
                          <label htmlFor={subject}>{subject}</label>
                        </div>
                      ))
                    ) : (
                      <div className={`${styles['dropdown-item']} ${styles['no-subjects']}`}>
                        {program ? 'No subjects available for selected program' : 'Please select a program first'}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {validationErrors.selectedSubjects && (
                <span className={styles['validation-message']}>
                  {validationErrors.selectedSubjects}
                </span>
              )}
            </div>

            <div className={styles['profile-field']}>
               <label className={`${styles['profile-label']} ${styles.required}`} htmlFor="modality">LEARNING MODALITY</label>
              <div 
                ref={modalityRef}
                className={styles['subjmodality-dropdown']}
                tabIndex={0}
                onKeyDown={(e) => handleDropdownKeyNavigation(e, 'modality')}
              >
                <div className={styles['dropdown-container']} onClick={(e) => { e.stopPropagation(); toggleDropdown('modality'); }}>
                  <input
                    type="text"
                    value={modality}
                    disabled={isSubmitting}
                    placeholder="Select learning modality"
                    className={styles['profile-input']}
                    readOnly
                    tabIndex={-1}
                  />
                  <i className={`fas fa-chevron-down ${styles['dropdown-icon']}`}></i>
                </div>
                {dropdownOpen.modality && (
                  <div className={styles['dropdown-options']}>
                    <div 
                      className={styles['dropdown-option']} 
                      onClick={() => {
                        setModality('Online');
                        setDropdownOpen({ ...dropdownOpen, modality: false });
                      }}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setModality('Online');
                          setDropdownOpen({ ...dropdownOpen, modality: false });
                        }
                      }}
                    >
                      Online
                    </div>
                    <div 
                      className={styles['dropdown-option']} 
                      onClick={() => {
                        setModality('In-person');
                        setDropdownOpen({ ...dropdownOpen, modality: false });
                      }}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setModality('In-person');
                          setDropdownOpen({ ...dropdownOpen, modality: false });
                        }
                      }}
                    >
                      In-person
                    </div>
                    <div 
                      className={styles['dropdown-option']} 
                      onClick={() => {
                        setModality('Hybrid');
                        setDropdownOpen({ ...dropdownOpen, modality: false });
                      }}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setModality('Hybrid');
                          setDropdownOpen({ ...dropdownOpen, modality: false });
                        }
                      }}
                    >
                      Hybrid
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles['profile-field']}>
             <label className={`${styles['profile-label']} ${styles.required}`} htmlFor="session-duration">PREFERRED SESSION DURATION</label>
            <div 
                ref={sessionDurationRef}
                className={styles['session-duration-dropdown']}
                tabIndex={0}
                onKeyDown={(e) => handleDropdownKeyNavigation(e, 'sessionDuration')}
              >
                <div className={styles['dropdown-container']} onClick={(e) => { e.stopPropagation(); toggleDropdown('sessionDuration'); }}>
                  <input
                    type="text"
                    value={sessionDuration}
                    disabled={isSubmitting}
                    placeholder="Select duration"
                    className={styles['profile-input']}
                    readOnly
                    tabIndex={-1}
                  />
                  <i className={`fas fa-chevron-down ${styles['dropdown-icon']}`}></i>
                </div>
                {dropdownOpen.sessionDuration && (
                  <div className={styles['dropdown-options']}>
                    <div 
                      className={styles['dropdown-option']} 
                      onClick={() => {
                        setSessionDuration('1 hour');
                        setDropdownOpen({ ...dropdownOpen, sessionDuration: false });
                      }}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setSessionDuration('1 hour');
                          setDropdownOpen({ ...dropdownOpen, sessionDuration: false });
                        }
                      }}
                    >
                      1 hour
                    </div>
                    <div 
                      className={styles['dropdown-option']} 
                      onClick={() => {
                        setSessionDuration('2 hours');
                        setDropdownOpen({ ...dropdownOpen, sessionDuration: false });
                      }}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setSessionDuration('2 hours');
                          setDropdownOpen({ ...dropdownOpen, sessionDuration: false });
                        }
                      }}
                    >
                      2 hours
                    </div>
                    <div 
                      className={styles['dropdown-option']} 
                      onClick={() => {
                        setSessionDuration('3 hours');
                        setDropdownOpen({ ...dropdownOpen, sessionDuration: false });
                      }}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setSessionDuration('3 hours');
                          setDropdownOpen({ ...dropdownOpen, sessionDuration: false });
                        }
                      }}
                    >
                      3 hours
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles['profile-field']}>
             <label className={`${styles['profile-label']} ${styles.required}`} htmlFor="learning-style">LEARNING STYLE</label>
            <div 
                ref={learningStyleRef}
                className={styles['learning-style-dropdown']}
                tabIndex={0}
                onKeyDown={(e) => handleDropdownKeyNavigation(e, 'learningStyle')}
              >
                <div className={styles['dropdown-container']} onClick={(e) => { e.stopPropagation(); toggleDropdown('learningStyle'); }}>
                  <input
                    type="text"
                    id="learning-style"
                    value={learningStyleDisplay}
                    disabled={isSubmitting}
                    placeholder="Select learning style(s)"
                    className={styles['profile-input']}
                    readOnly
                    tabIndex={-1}
                  />
                  <i className={`fas fa-chevron-down ${styles['dropdown-icon']}`}></i>
                </div>
                {dropdownOpen.learningStyle && (
                  <div className={styles['dropdown-options']}>
                    {sessionStyles.map(style => (
                      <div key={style} className={styles['dropdown-option']}>
                        <input
                          type="checkbox"
                          id={`style-${style}`}
                          checked={selectedSessionStyles.includes(style)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSessionStyles([...selectedSessionStyles, style]);
                            } else {
                              setSelectedSessionStyles(selectedSessionStyles.filter(s => s !== style));
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          tabIndex={0}
                          onKeyDown={(e) => handleCheckboxKeyNavigation(e, 'style', style, selectedSessionStyles, setSelectedSessionStyles)}
                        />
                        <label htmlFor={`style-${style}`}>{style}</label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={styles['profile-field']}>
               <label className={`${styles['profile-label']} ${styles.required}`} htmlFor="bio">SHORT BIO</label>              <textarea
                ref={bioRef}
                id="bio"
                value={bio}
                onChange={(e) => {
                  setBio(e.target.value);
                  validateField('bio', e.target.value);
                }}
                onBlur={() => validateField('bio', bio)}
                disabled={isSubmitting}
                placeholder="Tell us about yourself (50-500 characters)"
                rows={4}
                className={`${styles['profile-textarea']} ${validationErrors.bio ? styles.error : ''}`}
                tabIndex={0}
              ></textarea>
              {validationErrors.bio && (
                <span className={styles['validation-message']}>
                  {validationErrors.bio}
                </span>
              )}
            </div>

            <div className={styles['profile-field']}>
             <label className={`${styles['profile-label']} ${styles.required}`} htmlFor="goals">LEARNING GOALS</label>
              <textarea
                ref={goalsRef}
                id="goals"
                value={goals}
                onChange={(e) => {
                  setGoals(e.target.value);
                  validateField('goals', e.target.value);
                }}
                onBlur={() => validateField('goals', goals)}
                disabled={isSubmitting}
                placeholder="Describe your learning goals (50-500 characters)"
                rows={4}
                className={`${styles['profile-textarea']} ${validationErrors.goals ? styles.error : ''}`}
                tabIndex={0}
              ></textarea>
              {validationErrors.goals && (
                <span className={styles['validation-message']}>
                  {validationErrors.goals}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={styles['next-button-container']}>
        {currentStep === 2 && (
          <button ref={prevStepButtonRef} className={styles['prev-step-button']} onClick={prevStep} disabled={isSubmitting} tabIndex={0}>
            PREVIOUS
          </button>
        )}
        <button
          ref={nextButtonRef}
          className={`${styles['next-button']} ${isSubmitting ? styles.loading : ''} ${isButtonActive ? styles.active : ''}`}
          onClick={nextStep}
          onMouseDown={() => !isSubmitting && setIsButtonActive(true)}
          onMouseUp={() => setIsButtonActive(false)}
          onMouseLeave={() => setIsButtonActive(false)}
          disabled={isSubmitting}
          tabIndex={0}
        >
          {isSubmitting ? (
            <span className={styles['loading-spinner']}></span>
          ) : currentStep === totalSteps ? (
            'SUBMIT'
          ) : (
            'NEXT'
          )}
        </button>
      </div>

      {/* Success modal */}
      {showSuccessModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Registration successful"
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 9999
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: 24,
              borderRadius: 8,
              width: '90%',
              maxWidth: 480,
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              textAlign: 'center'
            }}
          >
            <h2 style={{ marginTop: 0, color: '#000' }}>Registration Successful</h2>
            <p style={{ color: '#000' }}>Please verify your account via the link we just sent to your email. You will be redirected to the login page after closing this message.</p>
            <div style={{ marginTop: 18 }}>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  router.replace('/auth/login');
                }}
                style={{
                  padding: '10px 18px',
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearnerInfo;