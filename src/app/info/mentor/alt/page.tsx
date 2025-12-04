'use client';

import React, { useId, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import styles from '../MentorInfo.module.css';
import api from "@/lib/axios";
import { toast } from 'react-toastify';

// Interfaces
interface DropdownOpenState {
  gender: boolean;
  yearLevel: boolean;
  program: boolean;
  modality: boolean;
  proficiency: boolean;
  availability: boolean;
  learningStyle: boolean;
  sessionDuration: boolean;
  topics: boolean;
}

interface ValidationErrors {
  address?: string;
  contactNumber?: string;
  gender?: string;
  selectedSubjects?: string;
  bio?: string;
  experience?: string;
  [key: string]: string | undefined;
}

interface CredentialFile extends File {
  // We can extend File if needed
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
const programs = [
  'Bachelor of Science in Information Technology (BSIT)',
  'Bachelor of Science in Computer Science (BSCS)',
  'Bachelor of Science in Entertainment and Multimedia Computing (BSEMC)'
];
const modalityOptions = ['Online', 'In-person', 'Hybrid'];
const topicOptions = ['Programming', 'Mathematics', 'Science', 'Literature']; // Example topics

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
  experience: {
    minLength: 50,
    maxLength: 500,
    message: 'Experience should be between 50-500 characters'
  }
};

// Helper to get cookie value (works only for non-httpOnly cookies)
// function getCookie(name: string) {
//   const value = `; ${document.cookie}`;
//   const parts = value.split(`; ${name}=`);
//   if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
//   return null;
// }

export default function MentorInfoPage() {
  const router = useRouter();
  
  // State declarations
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;
  
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
  const [proficiency, setProficiency] = useState('');
  const [selectedSessionStyles, setSelectedSessionStyles] = useState<string[]>([]);
  const [sessionDuration, setSessionDuration] = useState('');
  const [experience, setExperience] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profilePictureName, setProfilePictureName] = useState('');
  const [credentials, setCredentials] = useState<CredentialFile[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  
  // UI state
  const [dropdownOpen, setDropdownOpen] = useState<DropdownOpenState>({
    gender: false,
    yearLevel: false,
    program: false,
    modality: false,
    proficiency: false,
    availability: false,
    learningStyle: false,
    sessionDuration: false,
    topics: false
  });
  
  const [showFileList, setShowFileList] = useState(false);
  const [showStatusPopup, setShowStatusPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isButtonActive, setIsButtonActive] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  
  // Subjects state
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [showSubjectsDropdown, setShowSubjectsDropdown] = useState(false);

  // Refs
  const profileInputRef = useRef<HTMLInputElement>(null);
  const credentialInputRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const contactNumberRef = useRef<HTMLInputElement>(null);
  const genderRef = useRef<HTMLDivElement>(null);
  const yearLevelRef = useRef<HTMLDivElement>(null);
  const programRef = useRef<HTMLDivElement>(null);
  const profileUploadRef = useRef<HTMLDivElement>(null);
  const credentialsUploadRef = useRef<HTMLDivElement>(null);
  const availabilityRef = useRef<HTMLDivElement>(null);
  const subjectsRef = useRef<HTMLDivElement>(null);
  const teachingStyleRef = useRef<HTMLDivElement>(null);
  const modalityRef = useRef<HTMLDivElement>(null);
  const sessionDurationRef = useRef<HTMLDivElement>(null);
  const proficiencyRef = useRef<HTMLDivElement>(null);
  const bioRef = useRef<HTMLTextAreaElement>(null);
  const experienceRef = useRef<HTMLTextAreaElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const prevStepButtonRef = useRef<HTMLButtonElement>(null);

  // IDs for accessibility
  const availabilityListboxId = useId();
  const modalityListboxId = useId();
  const topicComboboxId = useId();
  const topicListboxId = useId();

  // Computed values
  const availabilityDaysDisplay = selectedDays.join(', ') || 'Select available days';
  const learningStyleDisplay = selectedSessionStyles.join(', ') || 'Select teaching style(s)';

  // Effects
  useEffect(() => {
    updateAvailableSubjects();
  }, [program]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyNavigation);
    return () => {
      document.removeEventListener('keydown', handleKeyNavigation);
    };
  }, [currentStep]);

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
      submitApplication();
    }
  };
  
  const goToStep = (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step);
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
  
  const uploadCredentials = () => {
    credentialInputRef.current?.click();
  };
  
  const handleCredentialUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setCredentials(prev => [...prev, ...files as CredentialFile[]]);
  };
  
  const deleteCredential = (index: number) => {
    setCredentials(prev => prev.filter((_, i) => i !== index));
  };
  
  const toggleFileList = () => {
    setShowFileList(!showFileList);
  };
  
  const closeFileList = () => {
    setShowFileList(false);
  };

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
      proficiency: false,
      availability: false,
      learningStyle: false,
      sessionDuration: false,
      topics: false
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
      if (!yearLevel) errors.yearLevel = 'Year level is required';
      if (!program) errors.program = 'Program is required';
      if (!contactNumber || contactNumber.length !== 11) errors.contactNumber = 'Valid Contact Number is required (11 digits)';
      if (!address.trim()) errors.address = 'Address is required';
    }
    
    if (currentStep === 2) {
      if (selectedSubjects.length === 0) errors.selectedSubjects = 'At least one subject is required';
      if (!modality) errors.modality = 'Teaching modality is required';
      if (!proficiency) errors.proficiency = 'Proficiency level is required';
      if (!sessionDuration) errors.sessionDuration = 'Session duration is required';
      if (selectedDays.length === 0) errors.selectedDays = 'At least one day of availability is required';
      if (selectedSessionStyles.length === 0) errors.selectedSessionStyles = 'At least one teaching style is required';
      if (!bio.trim()) errors.bio = 'Short Bio is required';
      if (!experience.trim()) errors.experience = 'Tutoring experience is required';
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
      // Handle left arrow navigation specifically for step 1
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
          // In step 2, focus should go to the last form element when pressing left from prev button
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
      // Handle right arrow navigation specifically for step 1
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
          // In step 2, focus should go to the first form element when pressing right from back button
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
      '.upload-controls',
      '.choose-file-container',
      '.file-link'
    ].join(',');

    const currentStepElement = document.querySelector(`.${styles.formContainer}`);
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
    const firstOption = dropdownElement.querySelector(`.${styles.dropdownOption}`) as HTMLElement;
    firstOption?.focus();
  };

  const handleDropdownKeyNavigation = (e: React.KeyboardEvent, dropdownType: keyof DropdownOpenState) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!dropdownOpen[dropdownType]) {
        toggleDropdown(dropdownType);
        setTimeout(() => {
          const dropdownElement = document.querySelector(`.${styles[dropdownType + 'Dropdown']}`) as HTMLElement;
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

  const handleUploadKeyNavigation = (e: React.KeyboardEvent, uploadType: 'profile' | 'credentials') => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (uploadType === 'profile') {
        uploadProfilePicture();
      } else {
        uploadCredentials();
      }
    }
  };

  const handleFileListKeyNavigation = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleFileList();
    }
  };

  // Keyboard navigation helpers
  function focusFirstOption(listboxId: string) { 
    const first = document.querySelector<HTMLElement>(`#${listboxId} [role="option"]`); 
    first?.focus(); 
  }
  
  const handleComboboxKey = (toggleOpen: () => void, isOpen: boolean, listboxId: string) =>
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === 'Enter' || e.key === ' ') { 
        e.preventDefault(); 
        toggleOpen(); 
      }
      else if (e.key === 'Escape' && isOpen) { 
        e.preventDefault(); 
        toggleOpen(); 
      }
      else if ((e.key === 'ArrowDown' || e.key === 'Down') && isOpen) { 
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
      current.querySelector<HTMLInputElement>('input')?.click(); 
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

  // API functions
  const submitApplication = async () => {
    if (!validateForm()) {
      // alert('Please complete all required fields before submitting');
      toast.error('Please complete all required fields before submitting');
      return;
    }
    
    try {
      setIsSubmitting(true);

      // Create FormData object
      const formData = new FormData();

      // Map dropdown values to backend enums
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
          'Hybrid': 'hybrid'
        };
        return modalityMap[modality] || modality.toLowerCase();
      };

      const mapProficiency = (proficiency: string) => {
        const profMap: { [key: string]: string } = {
          'Beginner': 'beginner',
          'Intermediate': 'intermediate',
          'Advanced': 'advanced'
        };
        return profMap[proficiency] || proficiency.toLowerCase();
      };

      const mapSessionDuration = (duration: string) => {
        const durationMap: { [key: string]: string } = {
          '1 hour': '1hr',
          '2 hours': '2hrs',
          '3 hours': '3hrs'
        };
        return durationMap[duration] || duration;
      };

      const mapAvailability = (days: string[]) => days.map(day => day.toLowerCase());
    
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

      // Append all required fields to match backend expectations exactly
      formData.append('sex', gender.toLowerCase());
      formData.append('program', mapProgram(program));
      formData.append('yearLevel', mapYearLevel(yearLevel));
      formData.append('phoneNumber', contactNumber);
      formData.append('bio', bio);
      formData.append('exp', experience);
      formData.append('address', address);
      formData.append('modality', mapModality(modality));
      formData.append('proficiency', mapProficiency(proficiency));
      formData.append('sessionDur', mapSessionDuration(sessionDuration));
      formData.append('subjects', JSON.stringify(selectedSubjects));
      formData.append('availability', JSON.stringify(mapAvailability(selectedDays)));
      formData.append('style', JSON.stringify(mapLearningStyle(selectedSessionStyles)));

      // Handle profile image properly
      if (profileInputRef.current?.files?.[0]) {
        formData.append('image', profileInputRef.current.files[0]);
      } else {
        formData.append('image', 'null');
      }

      // Handle credentials - append multiple files with same field name
      if (credentialInputRef.current?.files && credentialInputRef.current.files.length > 0) {
        Array.from(credentialInputRef.current.files).forEach(file => {
          formData.append('credentials', file);
        });
      }

      // Get token from cookie
      // const token = getCookie('MindMateToken');

      // Send request with proper headers
      const response = await api.post('/api/auth/mentor/alt-signup', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          // ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        withCredentials: true,
      });

      console.log('Mentor signup successful:', response.data);
      setShowStatusPopup(true);
    } catch (error: any) {
      console.error('Mentor signup error:', error);
      
      // Enhanced error handling
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.validOptions) {
          alert(`Error: ${errorData.message}\nValid options: ${errorData.validOptions.join(', ')}`);
        } else {
          alert(`Error: ${errorData.message || 'Unknown error occurred'}`);
        }
      } else {
        alert('There was an error submitting your information. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
      setIsButtonActive(false);
    }
  };
  
  const proceedToHome = () => {
    // Clear cookies and localStorage
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.split('=');
      document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
    
    localStorage.clear();
    
    // Redirect to home or login
    router.push('/auth/login');
  };

  // JSX Return
  return (
    <div className={styles.root}>
      <Head>
        <title>Mentor Information</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />
      </Head>
      
      <button 
        ref={backButtonRef}
        onClick={() => router.push('/auth/signup')} 
        className={styles.backBtn}
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

      <header className={styles.pageHeader}>
        <h1>MENTOR INFO</h1>
        <p>Complete your profile to start mentoring.</p>
      </header>

      <div className={`${styles.formContainer} ${styles.scrollableContent}`}>
        {/* Step 1 Content */}
        {currentStep === 1 && (
          <div>
            <h2 className={styles.title}>I. PERSONAL INFORMATION</h2>

            <div className={styles.personalField}>
              <label className={`${styles.personalLabel} ${styles.required}`} htmlFor="address">ADDRESS</label>
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
                className={`${styles.personalInput} ${validationErrors.address ? styles.error : ''}`}
                tabIndex={0}
              />
              {validationErrors.address && (
                <span className={styles.validationMessage}>
                  {validationErrors.address}
                </span>
              )}
            </div>

            <div className={styles.personalField}>
              <label className={`${styles.personalLabel} ${styles.required}`} htmlFor="contact-number">
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
                className={`${styles.personalInput} ${validationErrors.contactNumber ? styles.error : ''}`}
                maxLength={11}
                tabIndex={0}
              />
              {validationErrors.contactNumber && (
                <span className={styles.validationMessage}>
                  {validationErrors.contactNumber}
                </span>
              )}
            </div>

            <div className={styles.personalField}>
              <label className={`${styles.personalLabel} ${styles.required}`} htmlFor="gender">
                SEX AT BIRTH
              </label>
              <div 
                ref={genderRef}
                className={styles.genderDropdown}
                tabIndex={0}
                onKeyDown={(e) => handleDropdownKeyNavigation(e, 'gender')}
              >
                <div className={styles.dropdownContainer} onClick={() => toggleDropdown('gender')}>
                  <input
                    type="text"
                    value={gender}
                    placeholder="Select your sex"
                    disabled={isSubmitting}
                    className={styles.personalInput}
                    readOnly
                    tabIndex={-1}
                  />
                  <i className={`fas fa-chevron-down ${styles.dropdownIcon}`}></i>
                </div>
                {dropdownOpen.gender && (
                  <div className={styles.dropdownOptions}>
                    <div 
                      className={styles.dropdownOption} 
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
                      className={styles.dropdownOption} 
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
                  <span className={styles.validationMessage}>
                    {validationErrors.gender}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.personalField}>
               <label className={`${styles.personalLabel} ${styles.required}`} htmlFor="year-level">YEAR LEVEL</label>
              <div 
                ref={yearLevelRef}
                className={styles.yearDropdown}
                tabIndex={0}
                onKeyDown={(e) => handleDropdownKeyNavigation(e, 'yearLevel')}
              >
                <div className={styles.dropdownContainer} onClick={() => toggleDropdown('yearLevel')}>
                  <input
                    type="text"
                    value={yearLevel}
                    placeholder="Select your year level"
                    disabled={isSubmitting}
                    className={styles.personalInput}
                    readOnly
                    tabIndex={-1}
                  />
                  <i className={`fas fa-chevron-down ${styles.dropdownIcon}`}></i>
                </div>
                {dropdownOpen.yearLevel && (
                  <div className={styles.dropdownOptions}>
                    <div 
                      className={styles.dropdownOption} 
                      onClick={() => {
                        setYearLevel('1st Year');
                        setDropdownOpen({ ...dropdownOpen, yearLevel: false });
                      }}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setYearLevel('1st Year');
                          setDropdownOpen({ ...dropdownOpen, yearLevel: false });
                        }
                      }}
                    >
                      1st Year
                    </div>
                    <div 
                      className={styles.dropdownOption} 
                      onClick={() => {
                        setYearLevel('2nd Year');
                        setDropdownOpen({ ...dropdownOpen, yearLevel: false });
                      }}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setYearLevel('2nd Year');
                          setDropdownOpen({ ...dropdownOpen, yearLevel: false });
                        }
                      }}
                    >
                      2nd Year
                    </div>
                    <div 
                      className={styles.dropdownOption} 
                      onClick={() => {
                        setYearLevel('3rd Year');
                        setDropdownOpen({ ...dropdownOpen, yearLevel: false });
                      }}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setYearLevel('3rd Year');
                          setDropdownOpen({ ...dropdownOpen, yearLevel: false });
                        }
                      }}
                    >
                      3rd Year
                    </div>
                    <div 
                      className={styles.dropdownOption} 
                      onClick={() => {
                        setYearLevel('4th Year');
                        setDropdownOpen({ ...dropdownOpen, yearLevel: false });
                      }}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setYearLevel('4th Year');
                          setDropdownOpen({ ...dropdownOpen, yearLevel: false });
                        }
                      }}
                    >
                      4th Year
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className={styles.personalField}>
               <label className={`${styles.personalLabel} ${styles.required}`} htmlFor="program">PROGRAM</label>
              <div 
                ref={programRef}
                className={styles.programDropdown}
                tabIndex={0}
                onKeyDown={(e) => handleDropdownKeyNavigation(e, 'program')}
              >
                <div className={styles.dropdownContainer} onClick={() => toggleDropdown('program')}>
                  <input
                    type="text"
                    value={program}
                    placeholder="Select your program"
                    className={styles.personalInput}
                    disabled={isSubmitting}
                    readOnly
                    tabIndex={-1}
                  />
                  <i className={`fas fa-chevron-down ${styles.dropdownIcon}`}></i>
                </div>
                {dropdownOpen.program && (
                  <div className={styles.dropdownOptions}>
                    {programs.map(programOption => (
                      <div
                        key={programOption}
                        className={styles.dropdownOption}
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

        {/* Step 2 Content */}
        {currentStep === 2 && (
          <div>
            <h2 className={styles.title}>II. PROFILE INFORMATION</h2>

            {/* Profile Picture and Credentials Upload */}
            <div className={styles.uploadContainer}>
              <div className={styles.profilePictureUpload}>
                <label className={styles.profileLabel}>PROFILE PICTURE</label>
                <div 
                  ref={profileUploadRef}
                  className={styles.uploadControls} 
                  onClick={uploadProfilePicture}
                  tabIndex={0}
                  onKeyDown={(e) => handleUploadKeyNavigation(e, 'profile')}
                >
                  <div className={styles.profilePreviewContainer}>
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Profile Preview"
                        className={styles.profilePreview}
                      />
                    ) : (
                      <i className={`fas fa-user-circle ${styles.defaultIcon}`}></i>
                    )}
                  </div>
                  <div className={styles.uploadText}>
                    <div className={styles.chooseFileContainer}>
                      <i className="fas fa-upload"></i>
                      <span>Choose File</span>
                    </div>
                    <input
                      type="file"
                      aria-label="Upload profile picture"
                      ref={profileInputRef}
                      accept="image/*"
                      disabled={isSubmitting}
                      style={{ display: 'none' }}
                      onChange={handleProfileUpload}
                    />
                    <span className={styles.fileName}>
                      {profilePictureName || 'No file chosen'}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.credentialsUpload}>
                <label className={styles.profileLabel}>CREDENTIALS</label>
                <div 
                  ref={credentialsUploadRef}
                  className={styles.uploadControls}
                  tabIndex={0}
                  onKeyDown={(e) => handleUploadKeyNavigation(e, 'credentials')}
                >
                  <i className={`fas fa-file-upload ${styles.uploadIcon}`}></i>
                  <div className={styles.chooseFileContainer} onClick={uploadCredentials}>
                    <i className="fas fa-upload"></i>
                    <span>Upload Credentials</span>
                  </div>
                  <input
                    type="file"
                    aria-label="Upload credentials"
                    ref={credentialInputRef}
                    multiple
                    disabled={isSubmitting}
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    style={{ display: 'none' }}
                    onChange={handleCredentialUpload}
                  />
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); toggleFileList(); }} 
                    className={styles.fileLink}
                    tabIndex={0}
                    onKeyDown={handleFileListKeyNavigation}
                  >
                    View Uploaded Files ({credentials.length})
                  </a>
                </div>
              </div>
            </div>

            <div className={styles.divider}></div>

            <div className={styles.profileField}>
              <label className={`${styles.profileLabel} ${styles.required}`} htmlFor="availability-days">
                DAYS OF AVAILABILITY
              </label>
              <div 
                ref={availabilityRef}
                className={styles.availabilityDropdown}
                tabIndex={0}
                onKeyDown={(e) => handleDropdownKeyNavigation(e, 'availability')}
              >
                <div className={styles.dropdownContainer} onClick={() => toggleDropdown('availability')}>
                  <input
                    type="text"
                    id="availability-days"
                    value={availabilityDaysDisplay}
                    placeholder="Select available days"
                    disabled={isSubmitting}
                    className={styles.profileInput}
                    readOnly
                    tabIndex={-1}
                  />
                  <i className={`fas fa-chevron-down ${styles.dropdownIcon}`}></i>
                </div>
                {dropdownOpen.availability && (
                  <div
                    id={availabilityListboxId}
                    className={`${styles.dropdownOptions} ${styles.availabilityOptions}`}
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
                          aria-selected={isSelected}
                          tabIndex={-1}
                          className={`${styles.dropdownOption} ${styles.availabilityOption}`}
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

            {/* Updated Subjects Dropdown - Direct Checkboxes without Category Selection */}
            <div className={styles.profileField}>
              <label className={`${styles.profileLabel} ${styles.required}`}>SPECIALIZATION</label>
              <div 
                ref={subjectsRef}
                className={styles.dropdownWrapper}
                tabIndex={0}
                onKeyDown={handleSubjectsKeyNavigation}
              >
                <div className={styles.dropdownTrigger} onClick={toggleSubjectDropdown}>
                  <input
                    type="text"
                    placeholder={
                      selectedSubjects.length
                        ? `${selectedSubjects.length} subjects selected`
                        : 'Select subjects'
                    }
                    readOnly
                    disabled={isSubmitting}
                    className={`${styles.profileInput} ${validationErrors.selectedSubjects ? styles.error : ''}`}
                    tabIndex={-1}
                  />
                  <i className={`fas fa-chevron-down ${styles.dropdownIcon}`}></i>
                </div>

                {showSubjectsDropdown && (
                  <div className={`${styles.dropdownMenu} ${styles.subjects}`}>
                    {availableSubjects.length > 0 ? (
                      availableSubjects.map(subject => (
                        <div key={subject} className={`${styles.dropdownItem} ${styles.subjectItem}`}>
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
                      <div className={`${styles.dropdownItem} ${styles.noSubjects}`}>
                        {program ? 'No subjects available for selected program' : 'Please select a program first'}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {validationErrors.selectedSubjects && (
                <span className={styles.validationMessage}>
                  {validationErrors.selectedSubjects}
                </span>
              )}
            </div>

            <div className={styles.profileField}>
                <label className={`${styles.profileLabel} ${styles.required}`} htmlFor="teaching-style">
                TEACHING STYLE
              </label>
              <div 
                ref={teachingStyleRef}
                className={styles.teachingStyleDropdown}
                tabIndex={0}
                onKeyDown={(e) => handleDropdownKeyNavigation(e, 'learningStyle')}
              >
                <div className={styles.dropdownContainer} onClick={() => toggleDropdown('learningStyle')}>
                  <input
                    type="text"
                    id="teaching-style"
                    value={learningStyleDisplay}
                    disabled={isSubmitting}
                    placeholder="Select teaching style(s)"
                    className={styles.profileInput}
                    readOnly
                    tabIndex={-1}
                  />
                  <i className={`fas fa-chevron-down ${styles.dropdownIcon}`}></i>
                </div>
                {dropdownOpen.learningStyle && (
                  <div className={`${styles.dropdownOptions} ${styles.teachingStyleOptions}`}>
                    {sessionStyles.map(style => (
                      <div key={style} className={`${styles.dropdownOption} ${styles.teachingStyleOption}`}>
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

            <div className={styles.profileField}>
              <label className={`${styles.profileLabel} ${styles.required}`} htmlFor="modality">
                TEACHING MODALITY
              </label>
              <div 
                ref={modalityRef}
                className={styles.subjmodalityDropdown}
                tabIndex={0}
                onKeyDown={(e) => handleDropdownKeyNavigation(e, 'modality')}
              >
                <div className={styles.dropdownContainer} onClick={() => toggleDropdown('modality')}>
                  <input
                    type="text"
                    value={modality}
                    disabled={isSubmitting}
                    placeholder="Select teaching modality"
                    className={`${styles.profileInput} ${validationErrors.modality ? styles.error : ''}`}
                    readOnly
                    tabIndex={-1}
                  />
                  <i className={`fas fa-chevron-down ${styles.dropdownIcon}`}></i>
                </div>
                {dropdownOpen.modality && (
                  <div className={styles.dropdownOptions}>
                    <div 
                      className={styles.dropdownOption} 
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
                      className={styles.dropdownOption} 
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
                      className={styles.dropdownOption} 
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
                {validationErrors.modality && (
                  <span className={styles.validationMessage}>
                    {validationErrors.modality}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.profileField}>
               <label className={`${styles.profileLabel} ${styles.required}`} htmlFor="session-duration">PREFERRED SESSION DURATION</label>
              <div 
                ref={sessionDurationRef}
                className={styles.sessionDurationDropdown}
                tabIndex={0}
                onKeyDown={(e) => handleDropdownKeyNavigation(e, 'sessionDuration')}
              >
                <div className={styles.dropdownContainer} onClick={() => toggleDropdown('sessionDuration')}>
                  <input
                    type="text"
                    value={sessionDuration}
                    disabled={isSubmitting}
                    placeholder="Select duration"
                    className={`${styles.profileInput} ${validationErrors.sessionDuration ? styles.error : ''}`}
                    readOnly
                    tabIndex={-1}
                  />
                  <i className={`fas fa-chevron-down ${styles.dropdownIcon}`}></i>
                </div>
                {dropdownOpen.sessionDuration && (
                  <div className={styles.dropdownOptions}>
                    <div 
                      className={styles.dropdownOption} 
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
                      className={styles.dropdownOption} 
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
                      className={styles.dropdownOption} 
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
                {validationErrors.sessionDuration && (
                  <span className={styles.validationMessage}>
                    {validationErrors.sessionDuration}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.profileField}>
               <label className={`${styles.profileLabel} ${styles.required}`} htmlFor="proficiency">PROFICIENCY LEVEL</label>
              <div 
                ref={proficiencyRef}
                className={styles.proficiencyDropdown}
                tabIndex={0}
                onKeyDown={(e) => handleDropdownKeyNavigation(e, 'proficiency')}
              >
                <div className={styles.dropdownContainer} onClick={() => toggleDropdown('proficiency')}>
                  <input
                    type="text"
                    value={proficiency}
                    disabled={isSubmitting}
                    placeholder="Select proficiency level"
                    className={`${styles.profileInput} ${validationErrors.proficiency ? styles.error : ''}`}
                    readOnly
                    tabIndex={-1}
                  />
                  <i className={`fas fa-chevron-down ${styles.dropdownIcon}`}></i>
                </div>
                {dropdownOpen.proficiency && (
                  <div className={styles.dropdownOptions}>
                    <div 
                      className={styles.dropdownOption} 
                      onClick={() => {
                        setProficiency('Beginner');
                        setDropdownOpen({ ...dropdownOpen, proficiency: false });
                      }}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setProficiency('Beginner');
                          setDropdownOpen({ ...dropdownOpen, proficiency: false });
                        }
                      }}
                    >
                      Beginner
                    </div>
                    <div 
                      className={styles.dropdownOption} 
                      onClick={() => {
                        setProficiency('Intermediate');
                        setDropdownOpen({ ...dropdownOpen, proficiency: false });
                      }}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setProficiency('Intermediate');
                          setDropdownOpen({ ...dropdownOpen, proficiency: false });
                        }
                      }}
                    >
                      Intermediate
                    </div>
                    <div 
                      className={styles.dropdownOption} 
                      onClick={() => {
                        setProficiency('Advanced');
                        setDropdownOpen({ ...dropdownOpen, proficiency: false });
                      }}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setProficiency('Advanced');
                          setDropdownOpen({ ...dropdownOpen, proficiency: false });
                        }
                      }}
                    >
                      Advanced
                    </div>
                  </div>
                )}
                {validationErrors.proficiency && (
                  <span className={styles.validationMessage}>
                    {validationErrors.proficiency}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.profileField}>
              <label className={`${styles.profileLabel} ${styles.required}`} htmlFor="bio">SHORT BIO</label>
              <textarea
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
                className={`${styles.profileTextarea} ${validationErrors.bio ? styles.error : ''}`}
                tabIndex={0}
              ></textarea>
              {validationErrors.bio && (
                <span className={styles.validationMessage}>
                  {validationErrors.bio}
                </span>
              )}
            </div>

            <div className={styles.profileField}>
              <label className={`${styles.profileLabel} ${styles.required}`} htmlFor="experience">
                TUTORING EXPERIENCE
              </label>
              <textarea
                ref={experienceRef}
                id="experience"
                value={experience}
                onChange={(e) => {
                  setExperience(e.target.value);
                  validateField('experience', e.target.value);
                }}
                onBlur={() => validateField('experience', experience)}
                disabled={isSubmitting}
                placeholder="Describe your tutoring experience (50-500 characters)"
                rows={4}
                className={`${styles.profileTextarea} ${validationErrors.experience ? styles.error : ''}`}
                tabIndex={0}
              ></textarea>
              {validationErrors.experience && (
                <span className={styles.validationMessage}>
                  {validationErrors.experience}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Buttons Container */}
      <div className={styles.nextButtonContainer}>
        {currentStep === 2 && (
          <button
            ref={prevStepButtonRef}
            className={styles.prevStepButton}
            onClick={prevStep}
            disabled={isSubmitting}
            tabIndex={0}
          >
            PREVIOUS
          </button>
        )}
        <button
          ref={nextButtonRef}
          className={`${styles.nextButton} ${isSubmitting ? styles.loading : ''} ${isButtonActive ? styles.active : ''}`}
          onClick={nextStep}
          onMouseDown={() => !isSubmitting && setIsButtonActive(true)}
          onMouseUp={() => setIsButtonActive(false)}
          onMouseLeave={() => setIsButtonActive(false)}
          disabled={isSubmitting}
          tabIndex={0}
        >
          {isSubmitting ? (
            <span className={styles.loadingSpinner}></span>
          ) : currentStep === totalSteps ? (
            'SUBMIT'
          ) : (
            'NEXT'
          )}
        </button>
      </div>

      {/* File List Modal */}
      {showFileList && (
        <div className={styles.credModalOverlay} onClick={closeFileList}>
          <div className={styles.credModalContent} onClick={(e) => e.stopPropagation()}>
            <h3>Uploaded Files</h3>
            <ul className={styles.fileList}>
              {credentials.map((file, index) => (
                <li key={index}>
                  <span className={styles.fileInfo}>
                    <i className="fas fa-file-alt"></i>
                    {file.name}
                  </span>
                  <button onClick={() => deleteCredential(index)} aria-label="Delete file">
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <button className={styles.closeButton} onClick={closeFileList}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Application Status Popup */}
      {showStatusPopup && (
        <div className={styles.statusPopupOverlay}>
          <div className={styles.statusPopupContent}>
            <h3>APPLICATION STATUS</h3>
            <p className={styles.statusText}>
              Your mentor application is under review. You will receive an email once
              it&apos;s approved. Thank you!
            </p>
            <button className={styles.proceedButton} onClick={proceedToHome}>
              PROCEED TO HOME
            </button>
          </div>
        </div>
      )}
    </div>
  );
}