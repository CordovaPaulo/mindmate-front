'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './information.module.css';

interface User {
  id: number | null;
  name: string;
  email: string;
  role: string;
}

interface Mentor {
  address: string;
  proficiency: string;
  year: string;
  course: string;
  availability: string[];
  prefSessDur: string;
  bio: string;
  subjects: string[];
  image: string;
  phoneNum: string;
  teach_sty: string[];
  credentials: string[];
  exp: string;
  rating_ave: number;
  gender?: string;
  learn_modality?: string;
}

interface UserData {
  user: User;
  ment: Mentor;
  image_url: string | null;
}

interface EditInformationComponentProps {
  userData: UserData;
  onSave: (updatedData: UserData) => void;
  onCancel: () => void;
}

export default function EditInformationComponent({ userData, onSave, onCancel }: EditInformationComponentProps) {
  const [personalData, setPersonalData] = useState({
    gender: '',
    otherGender: '',
    yearLevel: '',
    program: '',
    address: '',
    contactNumber: '',
  });
  
  const [profileData, setProfileData] = useState({
    courseOffered: [] as string[],
    shortBio: '',
    tutoringExperience: '',
    teachingModality: '',
    daysOfAvailability: [] as string[],
    proficiencyLevel: '',
    teachingStyle: [] as string[],
    preferredSessionDuration: '',
  });
  
  const [dropdownOpen, setDropdownOpen] = useState<Record<string, boolean>>({});
  const [availableSubjects, setAvailableSubjects] = useState({
    coreSubjects: [] as string[],
    gecSubjects: [] as string[],
    peNstpSubjects: [] as string[],
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [dropdownFocusedIndex, setDropdownFocusedIndex] = useState<number>(-1);
  const [currentDropdown, setCurrentDropdown] = useState<string>('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<(HTMLInputElement | HTMLTextAreaElement | HTMLDivElement | null)[]>([]);
  const dropdownOptionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Options
  const yearLevelOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const programOptions = [
    'Bachelor of Science in Information Technology (BSIT)',
    'Bachelor of Science in Computer Science (BSCS)',
    'Bachelor of Science in Entertainment and Multimedia Computing (BSEMC)',
  ];
  const genderOptions = ['Male', 'Female'];
  const teachingModalityOptions = ['Online', 'In-person', 'Hybrid'];
  const proficiencyOptions = ['Beginner', 'Intermediate', 'Advanced'];
  const durationOptions = ['1 hour', '2 hours', '3 hours'];
  
  const daysOptions = [
    { label: 'Monday', value: 'Monday' },
    { label: 'Tuesday', value: 'Tuesday' },
    { label: 'Wednesday', value: 'Wednesday' },
    { label: 'Thursday', value: 'Thursday' },
    { label: 'Friday', value: 'Friday' },
    { label: 'Saturday', value: 'Saturday' },
    { label: 'Sunday', value: 'Sunday' },
  ];
  
  const teachingStyleOptions = [
    { label: 'Lecture-Based', value: 'Lecture-Based' },
    { label: 'Interactive Discussion', value: 'Interactive Discussion' },
    { label: 'Q&A Session', value: 'Q&A Session' },
    { label: 'Demonstration', value: 'Demonstration' },
    { label: 'Project-based', value: 'Project-based' },
    { label: 'Step-by-step process', value: 'Step-by-step process' },
  ];

  const inputFieldPersonalInformation = [
    { field: 'Year Level', type: 'select', options: yearLevelOptions },
    { field: 'Program', type: 'select', options: programOptions },
    { field: 'Address', type: 'text' },
    { field: 'Contact Number', type: 'text' },
  ];

  const inputFieldProfileInformation = [
    { field: 'Teaching Modality', type: 'select', options: teachingModalityOptions },
    { field: 'Days of Availability', type: 'checkbox', options: daysOptions },
    { field: 'Proficiency Level', type: 'select', options: proficiencyOptions },
    { field: 'Teaching Style', type: 'checkbox', options: teachingStyleOptions },
    { field: 'Preferred Session Duration', type: 'select', options: durationOptions },
    { field: 'Course Offered', type: 'select' },
  ];

  const bioAndExperienceFields = [
    { field: 'Short Bio', column: 1 },
    { field: 'Tutoring Experience', column: 2 },
  ];

  // Calculate total number of focusable elements
  const totalFocusableElements = inputFieldPersonalInformation.length + 1 + // +1 for gender
                                inputFieldProfileInformation.length + 
                                bioAndExperienceFields.length + 
                                1; // +1 for save button

  // Helper functions
  const capitalizeFirstLetter = (str: string) => {
    if (!str) return 'Not specified';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const toCamelCase = (str: string) => {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      })
      .replace(/\s+/g, '');
  };

  const getPlaceholder = (field: string, section: 'personal' | 'profile') => {
    const mappings = {
      personal: {
        'Full Name': userData.user.name,
        'Year Level': userData.ment.year,
        'Program': userData.ment.course,
        'Address': userData.ment.address,
        'Contact Number': userData.ment.phoneNum,
        'Sex at Birth': capitalizeFirstLetter(userData.ment.gender || ''),
      },
      profile: {
        'Teaching Modality': userData.ment.learn_modality,
        'Days of Availability': userData.ment.availability?.join(', '),
        'Proficiency Level': userData.ment.proficiency,
        'Teaching Style': userData.ment.teach_sty?.join(', ') || '',
        'Preferred Session Duration': userData.ment.prefSessDur,
        'Course Offered': userData.ment.subjects?.join(', '),
        'Short Bio': userData.ment.bio,
        'Tutoring Experience': userData.ment.exp,
      },
    };

    return mappings[section][field];
  };

  const updateAvailableSubjects = (program: string) => {
    const selectedProgram = program || userData.ment.course;

    switch (selectedProgram) {
      case 'Bachelor of Science in Information Technology (BSIT)':
        setAvailableSubjects({
          coreSubjects: [
            'Application Development and Emerging Technologies',
            'Business Analytics',
            'Computer Programming 1',
            'Computer Programming 2',
            'Data Structures and Algorithms',
            'Digital Design with Multimedia Systems',
            'Discrete Structures 1',
            'Event Driven Programming',
            'Fundamentals of Database Systems',
            'Information Assurance and Security 1',
            'Information Assurance and Security 2',
            'Information Management 1',
            'Integrative Programming and Technologies',
            'Introduction to Computing',
            'Introduction to Human-Computer Interaction',
            'IT Elective 1',
            'IT Elective 2',
            'IT Elective 3',
            'IT Elective 4',
            'IT Elective 5',
            'IT Research Methods',
            'IT Seminars and Educational Trips',
            'Networking 1',
            'Networking 2',
            'Object-Oriented Programming',
            'PC Troubleshooting with Basic Electronics',
            'Platform Technologies',
            'Quantitative Methods (Inc. Modelling & Simulation)',
            'Social Issues and Professional Practice in Computing',
            'System Administration and Maintenance',
            'Systems Integration and Architecture 1',
          ],
          gecSubjects: [
            'Art Appreciation',
            'Ethics',
            'Mathematics in the Modern World',
            'People and Earth\'s Ecosystem',
            'Purposive Communication',
            'Reading Visual Arts',
            'Readings in Philippine History with Indigenous People Studies',
            'Science, Technology and Society',
            'The Contemporary World with Peace Studies',
            'The Entrepreneurial Mind',
            'The Life and Works of Rizal',
            'Understanding the Self',
          ],
          peNstpSubjects: [
            'National Service Training Program with Anti-Smoking and Environmental Education',
            'National Service Training Program with GAD and Peace Education',
            'Physical Activities Toward Health and Fitness 1 (PATHFit 1): Movement Competency',
            'Physical Activities Toward Health and Fitness 2 (PATHFit 2): Exercise-Based Fitness Activities',
            'Physical Activities Toward Health and Fitness 3 (PATHFit 3)',
            'Physical Activities Toward Health and Fitness 4 (PATHFit 4)',
          ],
        });
        break;

      case 'Bachelor of Science in Computer Science (BSCS)':
        setAvailableSubjects({
          coreSubjects: [
            'Computer Programming 1',
            'Computer Programming 2',
            'Introduction to Computing',
            'PC Troubleshooting with Basic Electronics',
            'Data Structures and Algorithms',
            'Algorithms and Complexity 1',
            'Software Engineering 1',
            'Software Engineering 2',
            'Operating Systems',
            'Object-Oriented Programming',
            'Information Management 1',
            'Discrete Structures 1',
            'Discrete Structures 2',
            'Principles of Statistics and Probability',
            'Graphics and Visual Computing',
            'Automata Theory',
            'Intelligent Systems',
            'Programming Languages',
            'Parallel and Distributed Computing',
            'Architecture and Organization',
            'Information Assurance and Security',
            'CS Thesis Writing 1',
            'CS Thesis Writing 2',
            'CS Elective 1',
            'CS Elective 2',
            'CS Elective 3',
            'CS Elective 4',
            'CS Elective 5',
            'CS Seminars and Educational Trips',
          ],
          gecSubjects: [
            'Art Appreciation',
            'Ethics',
            'Mathematics in the Modern World',
            'People and Earth\'s Ecosystem',
            'Purposive Communication',
            'Reading Visual Arts',
            'Readings in Philippine History with Indigenous People Studies',
            'Science, Technology and Society',
            'The Contemporary World with Peace Studies',
            'The Entrepreneurial Mind',
            'The Life and Works of Rizal',
            'Understanding the Self',
          ],
          peNstpSubjects: [
            'National Service Training Program 1',
            'National Service Training Program 2',
            'Physical Activities Toward Health and Fitness 1 (PATHFit 1): Movement Competency',
            'Physical Activities Toward Health and Fitness 2 (PATHFit 2): Exercise-Based Fitness Activities',
            'Physical Activities Toward Health and Fitness 3 (PATHFit 3)',
            'Physical Activities Toward Health and Fitness 4 (PATHFit 4)',
          ],
        });
        break;

      case 'Bachelor of Science in Entertainment and Multimedia Computing (BSEMC)':
        setAvailableSubjects({
          coreSubjects: [
            'Introduction to EM Computing',
            'Computer Programming 1',
            'PC Troubleshooting with Basic Electronics',
            'Computer Programming 2',
            'Usability, HCI, UI Design',
            'Free Hand and Digital Drawing',
            'Data Structures and Algorithms',
            'Information Management 1',
            'Introduction to Game Design and Development',
            'Computer Graphics Programming',
            'Image and Video Processing',
            'Script Writing and Storyboard Design',
            'Applications Development and Emerging Technologies',
            'Principles of 2D Animation',
            'Audio Design and Sound Engineering Modelling and Rigging',
            'Texture and Mapping',
            'Social Issues and Professional Practice in Computing',
            'Lighting and Effects',
            'Principles of 3D Animation',
            'Design and Production Process',
            'Advanced Sound Production',
            'Advanced 2D Animation',
            'EMC Professional Elective 1',
            'Research Methods',
            'Advanced 3D Animation and Scripting',
            'Compositing and Rendering',
            'EMC Professional Elective 2',
            'Animation Design and Production',
            'EMC Professional Elective 3',
            'Computing Seminars and Educational Trips',
          ],
          gecSubjects: [
            'Art Appreciation',
            'Ethics',
            'Mathematics in the Modern World',
            'People and Earth\'s Ecosystem',
            'Purposive Communication',
            'Reading Visual Arts',
            'Readings in Philippine History with Indigenous People Studies',
            'Science, Technology and Society',
            'The Contemporary World with Peace Studies',
            'The Entrepreneurial Mind',
            'The Life and Works of Rizal',
            'Understanding the Self',
          ],
          peNstpSubjects: [
            'National Service Training Program with Anti-Smoking and Environmental Education',
            'National Service Training Program with GAD and Peace Education',
            'Physical Activities Toward Health and Fitness 1 (PATHFit 1): Movement Competency',
            'Physical Activities Toward Health and Fitness 2 (PATHFit 2): Exercise-Based Fitness Activities',
            'Physical Activities Toward Health and Fitness 3 (PATHFit 3)',
            'Physical Activities Toward Health and Fitness 4 (PATHFit 4)',
          ],
        });
        break;

      default:
        setAvailableSubjects({
          coreSubjects: [],
          gecSubjects: [],
          peNstpSubjects: [],
        });
    }
  };

  // Initialize data
  useEffect(() => {
    updateAvailableSubjects(userData.ment.course);
    
    // Set personal data from props
    setPersonalData({
      gender: userData.ment.gender || '',
      otherGender: '',
      yearLevel: userData.ment.year || '',
      program: userData.ment.course || '',
      address: userData.ment.address || '',
      contactNumber: userData.ment.phoneNum || '',
    });
    
    // Set profile data from props
    setProfileData(prev => ({
      ...prev,
      courseOffered: userData.ment.subjects || [],
      daysOfAvailability: userData.ment.availability || [],
      teachingStyle: userData.ment.teach_sty || [],
      teachingModality: userData.ment.learn_modality || '',
      proficiencyLevel: userData.ment.proficiency || '',
      preferredSessionDuration: userData.ment.prefSessDur || '',
      shortBio: userData.ment.bio || '',
      tutoringExperience: userData.ment.exp || '',
    }));
  }, [userData]);

  // Watch for program changes
  useEffect(() => {
    if (personalData.program) {
      updateAvailableSubjects(personalData.program);
    }
  }, [personalData.program]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeAllDropdowns();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get dropdown options for a specific field
  const getDropdownOptions = (field: string) => {
    if (field === 'gender') {
      return genderOptions;
    }
    
    const personalField = inputFieldPersonalInformation.find(f => toCamelCase(f.field) === field);
    if (personalField && personalField.options) {
      return personalField.options;
    }
    
    const profileField = inputFieldProfileInformation.find(f => toCamelCase(f.field) === field);
    if (profileField && profileField.options) {
      return profileField.options;
    }
    
    return [];
  };

  // Get checkbox options for a specific field
  const getCheckboxOptions = (field: string) => {
    const profileField = inputFieldProfileInformation.find(f => toCamelCase(f.field) === field);
    return profileField?.options || [];
  };

  const closeAllDropdowns = () => {
    setDropdownOpen({});
    setCurrentDropdown('');
    setDropdownFocusedIndex(-1);
  };

  const toggleDropdown = (field: string) => {
    setDropdownOpen(prev => {
      const newState: Record<string, boolean> = {};
      Object.keys(prev).forEach(key => {
        if (key !== field) newState[key] = false;
      });
      newState[field] = !prev[field];
      
      if (newState[field]) {
        setCurrentDropdown(field);
        setDropdownFocusedIndex(0);
      } else {
        setCurrentDropdown('');
        setDropdownFocusedIndex(-1);
      }
      
      return newState;
    });
  };

  const selectOption = (field: string, value: string, section: 'personal' | 'profile' = 'profile') => {
    if (section === 'personal') {
      setPersonalData(prev => ({ ...prev, [field]: value }));
    } else {
      if (Array.isArray(profileData[field as keyof typeof profileData])) {
        const currentArray = profileData[field as keyof typeof profileData] as string[];
        const index = currentArray.indexOf(value);
        let newArray;
        
        if (index === -1) {
          newArray = [...currentArray, value];
        } else {
          newArray = currentArray.filter(item => item !== value);
        }
        
        setProfileData(prev => ({ ...prev, [field]: newArray }));
      } else {
        setProfileData(prev => ({ ...prev, [field]: value }));
      }
    }
    closeAllDropdowns();
  };

  const selectGender = (gender: string) => {
    setPersonalData(prev => ({ ...prev, gender }));
    closeAllDropdowns();
  };

  const handleCourseOfferedChange = (subject: string) => {
    setProfileData(prev => {
      const currentSubjects = prev.courseOffered;
      const index = currentSubjects.indexOf(subject);
      let newSubjects;
      
      if (index === -1) {
        newSubjects = [...currentSubjects, subject];
      } else {
        newSubjects = currentSubjects.filter(item => item !== subject);
      }
      
      return { ...prev, courseOffered: newSubjects };
    });
  };

  const handleCheckboxSelection = (field: string, value: string) => {
    setProfileData(prev => {
      const currentArray = prev[field as keyof typeof profileData] as string[];
      const index = currentArray.indexOf(value);
      let newArray;
      
      if (index === -1) {
        newArray = [...currentArray, value];
      } else {
        newArray = currentArray.filter(item => item !== value);
      }
      
      return { ...prev, [field]: newArray };
    });
  };

  const getDisplayValue = (field: string) => {
    const value = profileData[field as keyof typeof profileData];
    
    if (Array.isArray(value)) {
      if (value.length === 0) {
        if (field === 'daysOfAvailability') {
          return userData.ment.availability?.join(', ') || '';
        }
        if (field === 'teachingStyle') {
          return userData.ment.teach_sty?.join(', ') || '';
        }
      }
      return value.join(', ');
    }
    return value || '';
  };

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // If a dropdown is open, handle dropdown navigation
      if (currentDropdown && dropdownOpen[currentDropdown]) {
        const dropdownOptions = getDropdownOptions(currentDropdown);
        const checkboxOptions = getCheckboxOptions(currentDropdown);
        const optionsCount = dropdownOptions.length || checkboxOptions.length;

        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault();
            setDropdownFocusedIndex(prev => {
              const nextIndex = (prev + 1) % optionsCount;
              dropdownOptionRefs.current[nextIndex]?.focus();
              return nextIndex;
            });
            break;
          
          case 'ArrowUp':
            event.preventDefault();
            setDropdownFocusedIndex(prev => {
              const nextIndex = prev <= 0 ? optionsCount - 1 : prev - 1;
              dropdownOptionRefs.current[nextIndex]?.focus();
              return nextIndex;
            });
            break;
          
          case 'Enter':
            event.preventDefault();
            if (dropdownFocusedIndex >= 0) {
              if (currentDropdown === 'gender') {
                selectGender(genderOptions[dropdownFocusedIndex]);
              } else if (dropdownOptions.length > 0) {
                selectOption(currentDropdown, dropdownOptions[dropdownFocusedIndex], 
                  inputFieldPersonalInformation.some(f => toCamelCase(f.field) === currentDropdown) ? 'personal' : 'profile');
              } else if (checkboxOptions.length > 0) {
                handleCheckboxSelection(currentDropdown, checkboxOptions[dropdownFocusedIndex].value);
              }
            }
            break;
          
          case 'Escape':
            event.preventDefault();
            closeAllDropdowns();
            // Refocus on the field that opened the dropdown
            if (focusedIndex >= 0) {
              inputRefs.current[focusedIndex]?.focus();
            }
            break;
          
          case 'Tab':
            closeAllDropdowns();
            break;
          
          default:
            break;
        }
        return;
      }

      // Navigation with arrow keys and Enter only when no dropdown is open
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex(prev => {
            const nextIndex = (prev + 1) % totalFocusableElements;
            inputRefs.current[nextIndex]?.focus();
            return nextIndex;
          });
          break;
        
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex(prev => {
            const nextIndex = prev <= 0 ? totalFocusableElements - 1 : prev - 1;
            inputRefs.current[nextIndex]?.focus();
            return nextIndex;
          });
          break;
        
        case 'Enter':
          if (focusedIndex >= 0 && focusedIndex < totalFocusableElements - 1) {
            event.preventDefault();
            // Find which field is focused and open its dropdown if it's a select
            const fieldIndex = focusedIndex;
            if (fieldIndex < inputFieldPersonalInformation.length) {
              // Personal information fields (except gender)
              const field = inputFieldPersonalInformation[fieldIndex];
              if (field.type === 'select') {
                toggleDropdown(toCamelCase(field.field));
              }
            } else if (fieldIndex === inputFieldPersonalInformation.length) {
              // Gender field
              toggleDropdown('gender');
            } else if (fieldIndex < inputFieldPersonalInformation.length + 1 + inputFieldProfileInformation.length) {
              // Profile information fields
              const profileIndex = fieldIndex - inputFieldPersonalInformation.length - 1;
              const field = inputFieldProfileInformation[profileIndex];
              if (field.type === 'select' || field.type === 'checkbox') {
                toggleDropdown(toCamelCase(field.field));
              }
            }
          } else if (focusedIndex === totalFocusableElements - 1) {
            // Save button
            event.preventDefault();
            saveChanges();
          }
          break;

        case 'Escape':
          closeEditInformation();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dropdownOpen, focusedIndex, dropdownFocusedIndex, currentDropdown, totalFocusableElements]);

  const validateField = (field: string, value: string) => {
    const trimmedValue = value.trim();

    if (trimmedValue === '') {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
      return;
    }

    let error = '';
    switch (field) {
      case 'shortBio':
        if (trimmedValue.length < 20) {
          error = 'Short Bio should be at least 20 characters.';
        }
        break;
      case 'tutoringExperience':
        if (trimmedValue.length < 10) {
          error = 'Tutoring Experience should be at least 10 characters.';
        }
        break;
      case 'contactNumber':
        if (trimmedValue.length !== 11) {
          error = 'Contact Number should be 11 digits.';
        } else if (!/^\d+$/.test(trimmedValue)) {
          error = 'Contact Number should contain only digits.';
        }
        break;
      case 'address':
        if (trimmedValue.length < 10) {
          error = 'Address should be at least 10 characters.';
        }
        break;
      default:
        break;
    }

    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  const saveChanges = async () => {
    // Validate all fields
    Object.keys(personalData).forEach(key => {
      validateField(key, personalData[key as keyof typeof personalData]);
    });
    Object.keys(profileData).forEach(key => {
      if (typeof profileData[key as keyof typeof profileData] === 'string') {
        validateField(key, profileData[key as keyof typeof profileData] as string);
      }
    });

    // Check if there are any validation errors
    if (Object.values(validationErrors).some(error => error)) {
      alert('Please fix validation errors before saving.');
      return;
    }

    try {
      const response = await fetch('/api/mentor/edit', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: userData.user.name,
          gender: capitalizeFirstLetter(personalData.gender || userData.ment.gender || ''),
          phoneNum: personalData.contactNumber || userData.ment.phoneNum,
          address: personalData.address || userData.ment.address,
          course: personalData.program || userData.ment.course,
          department: 'College of Computer Studies',
          year: personalData.yearLevel || userData.ment.year,
          subjects: JSON.stringify(profileData.courseOffered.length ? profileData.courseOffered : userData.ment.subjects || []),
          proficiency: profileData.proficiencyLevel || userData.ment.proficiency,
          learn_modality: profileData.teachingModality || userData.ment.learn_modality,
          teach_sty: JSON.stringify((profileData.teachingStyle?.length ? profileData.teachingStyle : userData.ment.teach_sty || []).filter(Boolean)),
          availability: JSON.stringify((profileData.daysOfAvailability?.length ? profileData.daysOfAvailability : userData.ment.availability || []).filter(Boolean)),
          prefSessDur: profileData.preferredSessionDuration || userData.ment.prefSessDur,
          bio: profileData.shortBio || userData.ment.bio,
          exp: profileData.tutoringExperience || userData.ment.exp,
        }),
      });

      if (response.ok) {
        alert('Changes saved successfully!');
        
        // Update the user data with new values
        const updatedUserData: UserData = {
          ...userData,
          user: {
            ...userData.user,
            name: userData.user.name, // Name remains the same
          },
          ment: {
            ...userData.ment,
            gender: capitalizeFirstLetter(personalData.gender || userData.ment.gender || ''),
            phoneNum: personalData.contactNumber || userData.ment.phoneNum,
            address: personalData.address || userData.ment.address,
            course: personalData.program || userData.ment.course,
            year: personalData.yearLevel || userData.ment.year,
            subjects: profileData.courseOffered.length ? profileData.courseOffered : userData.ment.subjects || [],
            proficiency: profileData.proficiencyLevel || userData.ment.proficiency,
            learn_modality: profileData.teachingModality || userData.ment.learn_modality,
            teach_sty: profileData.teachingStyle?.length ? profileData.teachingStyle : userData.ment.teach_sty || [],
            availability: profileData.daysOfAvailability?.length ? profileData.daysOfAvailability : userData.ment.availability || [],
            prefSessDur: profileData.preferredSessionDuration || userData.ment.prefSessDur,
            bio: profileData.shortBio || userData.ment.bio,
            exp: profileData.tutoringExperience || userData.ment.exp,
          },
        };
        
        onSave(updatedUserData);
      } else {
        alert('An error occurred while saving changes.');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('An error occurred while saving changes.');
    }
  };

  const closeEditInformation = () => {
    onCancel();
  };

  // Reset dropdown refs when dropdown changes
  useEffect(() => {
    dropdownOptionRefs.current = dropdownOptionRefs.current.slice(0, 
      getDropdownOptions(currentDropdown).length || getCheckboxOptions(currentDropdown).length
    );
  }, [currentDropdown, dropdownOpen]);

  return (
    <>
      {/* Background Overlay */}
      <div className={styles.editInformationOverlay} onClick={closeEditInformation} />
      
      {/* Edit Information Modal */}
      <div className={styles.editInformationModal} ref={dropdownRef}>
        <div className={styles.editInformation}>
          <div className={styles.upperElement}>
            <h1>Edit Information</h1>
            <img 
              src="/exit.svg" 
              alt="exit" 
              className={styles.exitIcon}
              onClick={closeEditInformation}
            />
          </div>
          <div className={styles.lowerElement}>
            <div className={styles.personalInformation}>
              <h1>I. PERSONAL INFORMATION</h1>
              <div className={styles.inputWrapper}>
                {inputFieldPersonalInformation.map((item, index) => (
                  <div key={index} className={styles.inputFields}>
                    <label>{item.field}</label>

                    {item.type === 'text' ? (
                      <>
                        <input
                          ref={el => inputRefs.current[index] = el}
                          type="text"
                          value={personalData[toCamelCase(item.field) as keyof typeof personalData] as string}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setPersonalData(prev => ({ ...prev, [toCamelCase(item.field)]: newValue }));
                            validateField(toCamelCase(item.field), newValue);
                          }}
                          onFocus={() => setFocusedIndex(index)}
                          className={`${styles.standardInput} ${validationErrors[toCamelCase(item.field)] ? styles.inputError : ''}`}
                          placeholder={getPlaceholder(item.field, 'personal') || `Enter your ${item.field.toLowerCase()}`}
                        />
                        {validationErrors[toCamelCase(item.field)] && (
                          <span className={styles.errorMessage}>
                            {validationErrors[toCamelCase(item.field)]}
                          </span>
                        )}
                      </>
                    ) : item.type === 'select' && item.field !== 'Gender' ? (
                      <div className={styles.customDropdown}>
                        <div
                          ref={el => inputRefs.current[index] = el}
                          className={styles.dropdownContainer}
                          onClick={() => toggleDropdown(toCamelCase(item.field))}
                          onFocus={() => setFocusedIndex(index)}
                          tabIndex={0}
                        >
                          <input
                            type="text"
                            value={personalData[toCamelCase(item.field) as keyof typeof personalData] as string}
                            placeholder={getPlaceholder(item.field, 'personal') || `Select ${item.field.toLowerCase()}`}
                            readOnly
                            className={styles.standardInput}
                          />
                          <i className={`${styles.dropdownIcon} ${dropdownOpen[toCamelCase(item.field)] ? styles.open : ''}`}>▼</i>
                        </div>
                        {dropdownOpen[toCamelCase(item.field)] && (
                          <div className={styles.dropdownOptions}>
                            {item.options.map((option, i) => (
                              <div
                                key={i}
                                ref={el => dropdownOptionRefs.current[i] = el}
                                className={`${styles.dropdownOption} ${dropdownFocusedIndex === i ? styles.dropdownFocused : ''}`}
                                onClick={() => selectOption(toCamelCase(item.field), option, 'personal')}
                                tabIndex={-1}
                              >
                                {option}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}

                {/* Gender Dropdown */}
                <div className={styles.inputFields}>
                  <label>Sex at Birth</label>
                  <div className={styles.genderSection}>
                    <div className={styles.genderDropdown}>
                      <div
                        ref={el => inputRefs.current[inputFieldPersonalInformation.length] = el}
                        className={styles.dropdownContainer}
                        onClick={() => toggleDropdown('gender')}
                        onFocus={() => setFocusedIndex(inputFieldPersonalInformation.length)}
                        tabIndex={0}
                      >
                        <input
                          type="text"
                          value={personalData.gender}
                          placeholder={capitalizeFirstLetter(userData.ment.gender || '') || 'Select your sex at birth'}
                          className={styles.standardInput}
                          readOnly
                        />
                        <i className={`${styles.dropdownIcon} ${dropdownOpen.gender ? styles.open : ''}`}>▼</i>
                      </div>
                      {dropdownOpen.gender && (
                        <div className={`${styles.dropdownOptions} ${styles.genderOptions}`}>
                          {genderOptions.map((option, i) => (
                            <div
                              key={i}
                              ref={el => dropdownOptionRefs.current[i] = el}
                              className={`${styles.dropdownOption} ${dropdownFocusedIndex === i ? styles.dropdownFocused : ''}`}
                              onClick={() => selectGender(option)}
                              tabIndex={-1}
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.profileInformation}>
              <h1>II. PROFILE INFORMATION</h1>
              <div className={styles.inputWrapper}>
                {inputFieldProfileInformation.map((item, index) => {
                  const globalIndex = inputFieldPersonalInformation.length + 1 + index;
                  return (
                    <div key={index} className={styles.inputFields}>
                      <label>{item.field}</label>

                      {item.type === 'select' && item.field !== 'Course Offered' ? (
                        <div className={styles.customDropdown}>
                          <div
                            ref={el => inputRefs.current[globalIndex] = el}
                            className={styles.dropdownContainer}
                            onClick={() => toggleDropdown(toCamelCase(item.field))}
                            onFocus={() => setFocusedIndex(globalIndex)}
                            tabIndex={0}
                          >
                            <input
                              type="text"
                              value={profileData[toCamelCase(item.field) as keyof typeof profileData] as string}
                              placeholder={getPlaceholder(item.field, 'profile') || `Select ${item.field.toLowerCase()}`}
                              readOnly
                              className={styles.standardInput}
                            />
                            <i className={`${styles.dropdownIcon} ${dropdownOpen[toCamelCase(item.field)] ? styles.open : ''}`}>▼</i>
                          </div>
                          {dropdownOpen[toCamelCase(item.field)] && (
                            <div className={styles.dropdownOptions}>
                              {item.options.map((option, i) => (
                                <div
                                  key={i}
                                  ref={el => dropdownOptionRefs.current[i] = el}
                                  className={`${styles.dropdownOption} ${dropdownFocusedIndex === i ? styles.dropdownFocused : ''}`}
                                  onClick={() => selectOption(toCamelCase(item.field), option)}
                                  tabIndex={-1}
                                >
                                  {option}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : item.field === 'Course Offered' ? (
                        <div className={styles.customDropdown}>
                          <div
                            ref={el => inputRefs.current[globalIndex] = el}
                            className={styles.dropdownContainer}
                            onClick={() => toggleDropdown(toCamelCase(item.field))}
                            onFocus={() => setFocusedIndex(globalIndex)}
                            tabIndex={0}
                          >
                            <input
                              type="text"
                              value={getDisplayValue('courseOffered')}
                              placeholder={getPlaceholder(item.field, 'profile')}
                              readOnly
                              className={styles.standardInput}
                            />
                            <i className={`${styles.dropdownIcon} ${dropdownOpen[toCamelCase(item.field)] ? styles.open : ''}`}>▼</i>
                          </div>
                          {dropdownOpen[toCamelCase(item.field)] && (
                            <div className={`${styles.dropdownOptions} ${styles.checkboxOptions}`}>
                              {availableSubjects.coreSubjects.length > 0 && (
                                <div className={styles.categorySection}>
                                  <h4>Core Subjects</h4>
                                  {availableSubjects.coreSubjects.map((option, i) => (
                                    <div key={`core-${i}`} className={styles.checkboxOption}>
                                      <input
                                        type="checkbox"
                                        id={`core-${i}`}
                                        value={option}
                                        checked={profileData.courseOffered.includes(option)}
                                        onChange={() => handleCourseOfferedChange(option)}
                                      />
                                      <label htmlFor={`core-${i}`}>{option}</label>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {availableSubjects.gecSubjects.length > 0 && (
                                <div className={styles.categorySection}>
                                  <h4>GEC Subjects</h4>
                                  {availableSubjects.gecSubjects.map((option, i) => (
                                    <div key={`gec-${i}`} className={styles.checkboxOption}>
                                      <input
                                        type="checkbox"
                                        id={`gec-${i}`}
                                        value={option}
                                        checked={profileData.courseOffered.includes(option)}
                                        onChange={() => handleCourseOfferedChange(option)}
                                      />
                                      <label htmlFor={`gec-${i}`}>{option}</label>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {availableSubjects.peNstpSubjects.length > 0 && (
                                <div className={styles.categorySection}>
                                  <h4>NSTP & PE Subjects</h4>
                                  {availableSubjects.peNstpSubjects.map((option, i) => (
                                    <div key={`pe-${i}`} className={styles.checkboxOption}>
                                      <input
                                        type="checkbox"
                                        id={`pe-${i}`}
                                        value={option}
                                        checked={profileData.courseOffered.includes(option)}
                                        onChange={() => handleCourseOfferedChange(option)}
                                      />
                                      <label htmlFor={`pe-${i}`}>{option}</label>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : item.type === 'checkbox' ? (
                        <div className={styles.customDropdown}>
                          <div
                            ref={el => inputRefs.current[globalIndex] = el}
                            className={styles.dropdownContainer}
                            onClick={() => toggleDropdown(toCamelCase(item.field))}
                            onFocus={() => setFocusedIndex(globalIndex)}
                            tabIndex={0}
                          >
                            <input
                              type="text"
                              value={getDisplayValue(toCamelCase(item.field))}
                              placeholder={getPlaceholder(item.field, 'profile')}
                              readOnly
                              className={styles.standardInput}
                            />
                            <i className={`${styles.dropdownIcon} ${dropdownOpen[toCamelCase(item.field)] ? styles.open : ''}`}>▼</i>
                          </div>
                          {dropdownOpen[toCamelCase(item.field)] && (
                            <div className={`${styles.dropdownOptions} ${styles.checkboxOptions}`}>
                              {item.options.map((option, i) => (
                                <div 
                                  key={i} 
                                  ref={el => dropdownOptionRefs.current[i] = el}
                                  className={`${styles.checkboxOption} ${dropdownFocusedIndex === i ? styles.dropdownFocused : ''}`}
                                  tabIndex={-1}
                                >
                                  <input
                                    type="checkbox"
                                    id={`${toCamelCase(item.field)}-${i}`}
                                    value={option.value}
                                    checked={profileData[toCamelCase(item.field) as keyof typeof profileData].includes(option.value)}
                                    onChange={() => selectOption(toCamelCase(item.field), option.value)}
                                  />
                                  <label htmlFor={`${toCamelCase(item.field)}-${i}`}>
                                    {option.label}
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.bioExperienceWrapper}>
              <div className={styles.bioExperienceGrid}>
                {bioAndExperienceFields.map((item, index) => {
                  const globalIndex = inputFieldPersonalInformation.length + 1 + inputFieldProfileInformation.length + index;
                  return (
                    <div key={`bio-${index}`} className={styles.inputFields}>
                      <label>{item.field}</label>
                      <textarea
                        ref={el => inputRefs.current[globalIndex] = el}
                        value={profileData[toCamelCase(item.field) as keyof typeof profileData] as string}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setProfileData(prev => ({ ...prev, [toCamelCase(item.field)]: newValue }));
                          validateField(toCamelCase(item.field), newValue);
                        }}
                        onFocus={() => setFocusedIndex(globalIndex)}
                        className={`${styles.fixedTextarea} ${validationErrors[toCamelCase(item.field)] ? styles.inputError : ''}`}
                        placeholder={getPlaceholder(item.field, 'profile') || 
                          (item.field === 'Short Bio' ? 'Tell us about yourself' : 'Describe your tutoring experience')}
                      />
                      {validationErrors[toCamelCase(item.field)] && (
                        <span className={styles.errorMessage}>
                          {validationErrors[toCamelCase(item.field)]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className={styles.save}>
            <button 
              ref={el => inputRefs.current[totalFocusableElements - 1] = el}
              className={styles.saveButton} 
              onClick={saveChanges}
              onFocus={() => setFocusedIndex(totalFocusableElements - 1)}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
}