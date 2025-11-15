'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './information.module.css';
import api from '@/lib/axios';
import { toast } from 'react-toastify';

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

type EditInformationComponentProps = {
  userData: any;
  onSave: (updatedData: any) => void;
  onCancel?: () => void;
  onUpdateUserData?: (updatedData: Partial<any>) => void;
};

type OptionItem = string | { label: string; value: string };

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
  { field: 'Year Level', type: 'select', options: yearLevelOptions, placeholder: 'Select your current year level' },
  { field: 'Program', type: 'select', options: programOptions, placeholder: 'Choose your degree program' },
  { field: 'Address', type: 'text', placeholder: 'Enter your complete residential address' },
  { field: 'Contact Number', type: 'text', placeholder: 'Enter your 11-digit phone number' },
];

const inputFieldProfileInformation = [
  { field: 'Teaching Modality', type: 'select', options: teachingModalityOptions, placeholder: 'Select preferred teaching method' },
  { field: 'Days of Availability', type: 'checkbox', options: daysOptions, placeholder: 'Choose days you are available' },
  { field: 'Proficiency Level', type: 'select', options: proficiencyOptions, placeholder: 'Select your expertise level' },
  { field: 'Teaching Style', type: 'checkbox', options: teachingStyleOptions, placeholder: 'Choose your teaching approaches' },
  { field: 'Preferred Session Duration', type: 'select', options: durationOptions, placeholder: 'Select session length preference' },
  { field: 'Course Offered', type: 'select', placeholder: 'Select subjects you can teach' },
];

const bioAndExperienceFields = [
  { field: 'Short Bio', column: 1, placeholder: 'Tell us about yourself, your background, and teaching philosophy...' },
  { field: 'Tutoring Experience', column: 2, placeholder: 'Describe your previous tutoring or teaching experiences...' },
];

function normalizeOptionValue(opt: OptionItem): string {
  return typeof opt === 'string' ? opt : (opt as { value: string }).value;
}

function normalizeOptionLabel(opt: OptionItem): string {
  return typeof opt === 'string' ? opt : (opt as { label: string }).label;
}

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

export default function EditInformationComponent({
  userData,
  onSave,
  onCancel = () => {},
  onUpdateUserData,
}: EditInformationComponentProps) {
  const [personalData, setPersonalData] = useState({
    gender: userData?.sex || '',
    otherGender: '',
    yearLevel: userData?.yearLevel || '',
    program: userData?.program || '',
    address: userData?.address || '',
    contactNumber: userData?.phoneNumber || '',
  });
  
  const [profileData, setProfileData] = useState({
    courseOffered: userData?.subjects || [] as string[],
    shortBio: userData?.bio || '',
    tutoringExperience: userData?.goals || '',
    teachingModality: userData?.modality || '',
    daysOfAvailability: userData?.availability || [] as string[],
    proficiencyLevel: '',
    teachingStyle: userData?.style || [] as string[],
    preferredSessionDuration: userData?.sessionDur || '',
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

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRefs = useRef<(HTMLInputElement | HTMLTextAreaElement | HTMLDivElement | HTMLButtonElement | null)[]>([]);
  const dropdownOptionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const totalFocusableElements = inputFieldPersonalInformation.length + 1 +
                                inputFieldProfileInformation.length + 
                                bioAndExperienceFields.length + 
                                1;

  const getPlaceholder = (field: string, section: 'personal' | 'profile') => {
    const mappings: Record<string, Record<string, any>> = {
      personal: {
        'Full Name': userData?.name,
        'Year Level': userData?.yearLevel,
        'Program': userData?.program,
        'Address': userData?.address,
        'Contact Number': userData?.phoneNumber,
        'Sex at Birth': capitalizeFirstLetter(userData?.sex || ''),
      },
      profile: {
        'Teaching Modality': userData?.modality,
        'Days of Availability': userData?.availability?.join(', '),
        'Proficiency Level': '',
        'Teaching Style': userData?.style?.join(', ') || '',
        'Preferred Session Duration': userData?.sessionDur,
        'Course Offered': userData?.subjects?.join(', '),
        'Short Bio': userData?.bio,
        'Tutoring Experience': userData?.goals,
      },
    };

    return (mappings[section] as any)[field];
  };

  const updateAvailableSubjects = (program: string) => {
    const selectedProgram = program || userData?.program;

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

  const getCheckboxOptions = (field: string) => {
    const profileField = inputFieldProfileInformation.find(f => toCamelCase(f.field) === field);
    return profileField?.options || [];
  };

  const getDisplayValue = (field: string) => {
    const value = profileData[field as keyof typeof profileData];
    
    if (Array.isArray(value)) {
      if (value.length === 0) {
        if (field === 'daysOfAvailability') {
          return userData?.availability?.join(', ') || '';
        }
        if (field === 'teachingStyle') {
          return userData?.style?.join(', ') || '';
        }
      }
      return value.join(', ');
    }
    return value || '';
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
        newSubjects = currentSubjects.filter((item: string) => item !== subject);
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
    Object.keys(personalData).forEach(key => {
      validateField(key, personalData[key as keyof typeof personalData]);
    });
    Object.keys(profileData).forEach(key => {
      if (typeof profileData[key as keyof typeof profileData] === 'string') {
        validateField(key, profileData[key as keyof typeof profileData] as string);
      }
    });

    if (Object.values(validationErrors).some(error => error)) {
      toast.error('Please fix validation errors before saving.');
      return;
    }

    try {
      // Map frontend field names to backend field names
      const payload: any = {};
      
      // Only include fields that have been changed
      if (personalData.gender && personalData.gender !== userData?.sex) {
        payload.sex = personalData.gender.toLowerCase();
      }
      if (personalData.contactNumber && personalData.contactNumber !== userData?.phoneNumber) {
        payload.phoneNumber = personalData.contactNumber;
      }
      if (personalData.address && personalData.address !== userData?.address) {
        payload.address = personalData.address;
      }
      if (personalData.program && personalData.program !== userData?.program) {
        // Map full program name to abbreviated form
        if (personalData.program.includes('Information Technology')) {
          payload.program = 'BSIT';
        } else if (personalData.program.includes('Computer Science')) {
          payload.program = 'BSCS';
        } else if (personalData.program.includes('Entertainment and Multimedia')) {
          payload.program = 'BSEMC';
        }
      }
      if (personalData.yearLevel && personalData.yearLevel !== userData?.yearLevel) {
        // Map "1st Year" to "1st year" format
        payload.yearLevel = personalData.yearLevel.toLowerCase();
      }
      
      // Profile data mappings
      if (profileData.courseOffered.length && JSON.stringify(profileData.courseOffered) !== JSON.stringify(userData?.subjects)) {
        payload.subjects = profileData.courseOffered;
      }
      if (profileData.proficiencyLevel && profileData.proficiencyLevel !== '') {
        payload.proficiency = profileData.proficiencyLevel.toLowerCase();
      }
      if (profileData.teachingModality && profileData.teachingModality !== userData?.modality) {
        payload.modality = profileData.teachingModality.toLowerCase();
      }
      if (profileData.teachingStyle?.length && JSON.stringify(profileData.teachingStyle) !== JSON.stringify(userData?.style)) {
        // Map "Lecture-Based" to "lecture-based" format
        payload.style = profileData.teachingStyle.map((s: string) => s.toLowerCase().replace(/\s+/g, '-'));
      }
      if (profileData.daysOfAvailability?.length && JSON.stringify(profileData.daysOfAvailability) !== JSON.stringify(userData?.availability)) {
        payload.availability = profileData.daysOfAvailability.map((d: string) => d.toLowerCase());
      }
      if (profileData.preferredSessionDuration && profileData.preferredSessionDuration !== userData?.sessionDur) {
        // Map "1 hour" to "1hr" format
        if (profileData.preferredSessionDuration.includes('1')) {
          payload.sessionDur = '1hr';
        } else if (profileData.preferredSessionDuration.includes('2')) {
          payload.sessionDur = '2hrs';
        } else if (profileData.preferredSessionDuration.includes('3')) {
          payload.sessionDur = '3hrs';
        }
      }
      if (profileData.shortBio && profileData.shortBio !== userData?.bio) {
        payload.bio = profileData.shortBio;
      }
      if (profileData.tutoringExperience && profileData.tutoringExperience !== userData?.goals) {
        payload.goals = profileData.tutoringExperience;
      }

      // Only proceed if there are changes to save
      if (Object.keys(payload).length === 0) {
        toast.info('No changes detected to save.');
        return;
      }

      const response = await api.patch('/api/learner/profile/edit', payload);

      if (response.status === 200) {
        toast.success('Profile updated successfully.');
        
        // Map backend response back to frontend format
        const updatedData: any = {
          ...userData,
        };

        if (response.data.learner) {
          if (response.data.learner.sex) updatedData.sex = capitalizeFirstLetter(response.data.learner.sex);
          if (response.data.learner.phoneNumber) updatedData.phoneNumber = response.data.learner.phoneNumber;
          if (response.data.learner.address) updatedData.address = response.data.learner.address;
          if (response.data.learner.program) {
            updatedData.program = response.data.learner.program === 'BSIT' ? 'Bachelor of Science in Information Technology (BSIT)' :
                        response.data.learner.program === 'BSCS' ? 'Bachelor of Science in Computer Science (BSCS)' :
                        response.data.learner.program === 'BSEMC' ? 'Bachelor of Science in Entertainment and Multimedia Computing (BSEMC)' :
                        response.data.learner.program;
          }
          if (response.data.learner.yearLevel) updatedData.yearLevel = capitalizeFirstLetter(response.data.learner.yearLevel);
          if (response.data.learner.subjects) updatedData.subjects = response.data.learner.subjects;
          if (response.data.learner.modality) updatedData.modality = capitalizeFirstLetter(response.data.learner.modality);
          if (response.data.learner.style) {
            updatedData.style = response.data.learner.style.map((s: string) => 
              s.split('-').map((w: string) => capitalizeFirstLetter(w)).join(' ')
            );
          }
          if (response.data.learner.availability) {
            updatedData.availability = response.data.learner.availability.map((d: string) => capitalizeFirstLetter(d));
          }
          if (response.data.learner.sessionDur) {
            updatedData.sessionDur = response.data.learner.sessionDur.replace('1hr', '1 hour')
              .replace('2hrs', '2 hours').replace('3hrs', '3 hours');
          }
          if (response.data.learner.bio) updatedData.bio = response.data.learner.bio;
          if (response.data.learner.goals) updatedData.goals = response.data.learner.goals;
        }
        
        onSave(updatedData);
        try {
          onUpdateUserData?.(updatedData);
        } catch (e) {}
      }
    } catch (error: any) {
      console.error('Error saving changes:', error);
      
      // Handle validation errors from backend
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        toast.error(`Validation failed:\n${error.response.data.errors.join('\n')}`);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('An error occurred while saving changes.');
      }
    }
  };

  const closeEditInformation = () => {
    onCancel();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeEditInformation();
    }
  };

  useEffect(() => {
    if (userData?.program) {
      updateAvailableSubjects(userData.program);
    }
    
    setPersonalData({
      gender: userData?.sex || '',
      otherGender: '',
      yearLevel: userData?.yearLevel || '',
      program: userData?.program || '',
      address: userData?.address || '',
      contactNumber: userData?.phoneNumber || '',
    });
    
    setProfileData(prev => ({
      ...prev,
      courseOffered: userData?.subjects || [],
      daysOfAvailability: userData?.availability || [],
      teachingStyle: userData?.style || [],
      teachingModality: userData?.modality || '',
      proficiencyLevel: '',
      preferredSessionDuration: userData?.sessionDur || '',
      shortBio: userData?.bio || '',
      tutoringExperience: userData?.goals || '',
    }));
  }, [userData]);

  useEffect(() => {
    if (personalData.program) {
      updateAvailableSubjects(personalData.program);
    }
  }, [personalData.program]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeAllDropdowns();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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
                const opt = dropdownOptions[dropdownFocusedIndex];
                const optVal = normalizeOptionValue(opt as OptionItem);
                selectOption(
                  currentDropdown,
                  optVal,
                  inputFieldPersonalInformation.some(f => toCamelCase(f.field) === currentDropdown) ? 'personal' : 'profile'
                );
              } else if (checkboxOptions.length > 0) {
                const chk = checkboxOptions[dropdownFocusedIndex];
                const chkVal = normalizeOptionValue(chk as OptionItem);
                handleCheckboxSelection(currentDropdown, chkVal);
              }
            }
            break;
          
          case 'Escape':
            event.preventDefault();
            closeAllDropdowns();
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
            const fieldIndex = focusedIndex;
            if (fieldIndex < inputFieldPersonalInformation.length) {
              const field = inputFieldPersonalInformation[fieldIndex];
              if (field.type === 'select') {
                toggleDropdown(toCamelCase(field.field));
              }
            } else if (fieldIndex === inputFieldPersonalInformation.length) {
              toggleDropdown('gender');
            } else if (fieldIndex < inputFieldPersonalInformation.length + 1 + inputFieldProfileInformation.length) {
              const profileIndex = fieldIndex - inputFieldPersonalInformation.length - 1;
              const field = inputFieldProfileInformation[profileIndex];
              if (field.type === 'select' || field.type === 'checkbox') {
                toggleDropdown(toCamelCase(field.field));
              }
            }
          } else if (focusedIndex === totalFocusableElements - 1) {
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

  useEffect(() => {
    dropdownOptionRefs.current = dropdownOptionRefs.current.slice(0, 
      getDropdownOptions(currentDropdown).length || getCheckboxOptions(currentDropdown).length
    );
  }, [currentDropdown, dropdownOpen]);

  return (
    <>
      <div 
        className={styles.editInformationOverlay} 
        onClick={handleOverlayClick}
      />
      
      <div className={styles.editInformationModal} ref={dropdownRef}>
        <div className={styles.editInformation}>
          <div className={styles.upperElement}>
            <h1 className={styles.upperElementH1}>Edit Information</h1>
            <img 
              src="/exit.svg" 
              alt="exit" 
              className={styles.exitIcon}
              onClick={closeEditInformation}
            />
          </div>
          <div className={styles.lowerElement}>
            <div className={styles.personalInformation}>
              <h1 className={styles.sectionH1}>I. PERSONAL INFORMATION</h1>
              <div className={styles.inputWrapper}>
                {inputFieldPersonalInformation.map((item, index) => (
                  <div key={index} className={styles.inputFields}>
                    <label className={styles.label}>{item.field}</label>

                    {item.type === 'text' ? (
                      <>
                        <input
                          ref={el => { inputRefs.current[index] = el as HTMLInputElement | null; }}
                          type="text"
                          value={personalData[toCamelCase(item.field) as keyof typeof personalData] as string}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setPersonalData(prev => ({ ...prev, [toCamelCase(item.field)]: newValue }));
                            validateField(toCamelCase(item.field), newValue);
                          }}
                          onFocus={() => setFocusedIndex(index)}
                          className={styles.standardInput}
                          placeholder={String(getPlaceholder(item.field, 'personal') || item.placeholder)}
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
                          ref={el => { inputRefs.current[index] = el as HTMLDivElement | null; }}
                          className={styles.dropdownContainer}
                          onClick={() => toggleDropdown(toCamelCase(item.field))}
                          onFocus={() => setFocusedIndex(index)}
                          tabIndex={0}
                        >
                          <input
                            type="text"
                            value={personalData[toCamelCase(item.field) as keyof typeof personalData] as string}
                            placeholder={getPlaceholder(item.field, 'personal') || item.placeholder}
                            readOnly
                            className={styles.standardInput}
                          />
                          <i className={`${styles.dropdownIcon} ${dropdownOpen[toCamelCase(item.field)] ? styles.dropdownIconOpen : ''}`}>▼</i>
                        </div>
                        {dropdownOpen[toCamelCase(item.field)] && (
                          <div className={styles.dropdownOptions}>
                            {(item.options ?? []).map((op, i) => {
                              const val = normalizeOptionValue(op as OptionItem);
                              const label = normalizeOptionLabel(op as OptionItem);
                              return (
                                <div
                                  key={val + '-' + i}
                                  className={styles.dropdownOption}
                                  onClick={() => selectOption(toCamelCase(item.field), val, 'personal')}
                                  ref={el => { dropdownOptionRefs.current[i] = el; }}
                                  tabIndex={0}
                                >
                                  {label}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}

                <div className={styles.inputFields}>
                  <label className={styles.label}>Sex at Birth</label>
                  <div className={styles.customDropdown}>
                    <div
                      ref={el => { inputRefs.current[inputFieldPersonalInformation.length] = el as HTMLDivElement | null; }}
                      className={styles.dropdownContainer}
                      onClick={() => toggleDropdown('gender')}
                      onFocus={() => setFocusedIndex(inputFieldPersonalInformation.length)}
                      tabIndex={0}
                    >
                      <input
                        type="text"
                        value={personalData.gender}
                        placeholder={getPlaceholder('Sex at Birth', 'personal') || 'Select your gender'}
                        className={styles.standardInput}
                        readOnly
                      />
                      <i className={`${styles.dropdownIcon} ${dropdownOpen.gender ? styles.dropdownIconOpen : ''}`}>▼</i>
                    </div>
                    {dropdownOpen.gender && (
                      <div className={styles.dropdownOptions}>
                        {genderOptions.map((option, i) => (
                          <div
                            key={i}
                            ref={el => { dropdownOptionRefs.current[i] = el; }}
                            className={styles.dropdownOption}
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

            <div className={styles.profileInformation}>
              <h1 className={styles.sectionH1}>II. PROFILE INFORMATION</h1>
              <div className={styles.inputWrapper}>
                {inputFieldProfileInformation.map((item, index) => {
                  const globalIndex = inputFieldPersonalInformation.length + 1 + index;
                  return (
                    <div key={index} className={styles.inputFields}>
                      <label className={styles.label}>{item.field}</label>

                      {item.type === 'select' && item.field !== 'Course Offered' ? (
                        <div className={styles.customDropdown}>
                          <div
                            ref={el => { inputRefs.current[globalIndex] = el as HTMLDivElement | null; }}
                            className={styles.dropdownContainer}
                            onClick={() => toggleDropdown(toCamelCase(item.field))}
                            onFocus={() => setFocusedIndex(globalIndex)}
                            tabIndex={0}
                          >
                            <input
                              type="text"
                              value={profileData[toCamelCase(item.field) as keyof typeof profileData] as string}
                              placeholder={getPlaceholder(item.field, 'profile') || item.placeholder}
                              readOnly
                              className={styles.standardInput}
                            />
                            <i className={`${styles.dropdownIcon} ${dropdownOpen[toCamelCase(item.field)] ? styles.dropdownIconOpen : ''}`}>▼</i>
                          </div>
                          {dropdownOpen[toCamelCase(item.field)] && (
                            <div className={styles.dropdownOptions}>
                              {(item.options ?? []).map((op, i) => {
                                const val = normalizeOptionValue(op as OptionItem);
                                const label = normalizeOptionLabel(op as OptionItem);
                                return (
                                  <div
                                    key={val + '-' + i}
                                    className={styles.dropdownOption}
                                    onClick={() => selectOption(toCamelCase(item.field), val)}
                                    ref={el => { dropdownOptionRefs.current[i] = el; }}
                                    tabIndex={0}
                                  >
                                    {label}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : item.field === 'Course Offered' ? (
                        <div className={styles.customDropdown}>
                          <div
                            ref={el => { inputRefs.current[globalIndex] = el as HTMLDivElement | null; }}
                            className={styles.dropdownContainer}
                            onClick={() => toggleDropdown(toCamelCase(item.field))}
                            onFocus={() => setFocusedIndex(globalIndex)}
                            tabIndex={0}
                          >
                            <input
                              type="text"
                              value={getDisplayValue('courseOffered')}
                              placeholder={getPlaceholder(item.field, 'profile') || item.placeholder}
                              readOnly
                              className={styles.standardInput}
                            />
                            <i className={`${styles.dropdownIcon} ${dropdownOpen[toCamelCase(item.field)] ? styles.dropdownIconOpen : ''}`}>▼</i>
                          </div>
                          {dropdownOpen[toCamelCase(item.field)] && (
                            <div className={`${styles.dropdownOptions} ${styles.checkboxOptions}`}>
                              {availableSubjects.coreSubjects.length > 0 && (
                                <div className={styles.categorySection}>
                                  <h4 className={styles.categoryH4}>Core Subjects</h4>
                                  {availableSubjects.coreSubjects.map((option, i) => (
                                    <div key={`core-${i}`} className={styles.checkboxOption}>
                                      <input
                                        type="checkbox"
                                        id={`core-${i}`}
                                        className={styles.checkboxInput}
                                        value={option}
                                        checked={profileData.courseOffered.includes(option)}
                                        onChange={() => handleCourseOfferedChange(option)}
                                      />
                                      <label htmlFor={`core-${i}`} className={styles.checkboxLabel}>{option}</label>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {availableSubjects.gecSubjects.length > 0 && (
                                <div className={styles.categorySection}>
                                  <h4 className={styles.categoryH4}>GEC Subjects</h4>
                                  {availableSubjects.gecSubjects.map((option, i) => (
                                    <div key={`gec-${i}`} className={styles.checkboxOption}>
                                      <input
                                        type="checkbox"
                                        id={`gec-${i}`}
                                        className={styles.checkboxInput}
                                        value={option}
                                        checked={profileData.courseOffered.includes(option)}
                                        onChange={() => handleCourseOfferedChange(option)}
                                      />
                                      <label htmlFor={`gec-${i}`} className={styles.checkboxLabel}>{option}</label>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {availableSubjects.peNstpSubjects.length > 0 && (
                                <div className={styles.categorySection}>
                                  <h4 className={styles.categoryH4}>NSTP & PE Subjects</h4>
                                  {availableSubjects.peNstpSubjects.map((option, i) => (
                                    <div key={`pe-${i}`} className={styles.checkboxOption}>
                                      <input
                                        type="checkbox"
                                        id={`pe-${i}`}
                                        className={styles.checkboxInput}
                                        value={option}
                                        checked={profileData.courseOffered.includes(option)}
                                        onChange={() => handleCourseOfferedChange(option)}
                                      />
                                      <label htmlFor={`pe-${i}`} className={styles.checkboxLabel}>{option}</label>
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
                            ref={el => { inputRefs.current[globalIndex] = el as HTMLDivElement | null; }}
                            className={styles.dropdownContainer}
                            onClick={() => toggleDropdown(toCamelCase(item.field))}
                            onFocus={() => setFocusedIndex(globalIndex)}
                            tabIndex={0}
                          >
                            <input
                              type="text"
                              value={getDisplayValue(toCamelCase(item.field))}
                              placeholder={getPlaceholder(item.field, 'profile') || item.placeholder}
                              readOnly
                              className={styles.standardInput}
                            />
                            <i className={`${styles.dropdownIcon} ${dropdownOpen[toCamelCase(item.field)] ? styles.dropdownIconOpen : ''}`}>▼</i>
                          </div>
                          {dropdownOpen[toCamelCase(item.field)] && (
                            <div className={`${styles.dropdownOptions} ${styles.checkboxOptions}`}>
                              {(item.options ?? []).map((option, i) => {
                                const opt = option as OptionItem;
                                const val = normalizeOptionValue(opt);
                                const label = normalizeOptionLabel(opt);
                                return (
                                  <div 
                                    key={i} 
                                    className={styles.checkboxOption}
                                    ref={el => { dropdownOptionRefs.current[i] = el; }}
                                    tabIndex={-1}
                                  >
                                    <input
                                      type="checkbox"
                                      id={`${toCamelCase(item.field)}-${i}`}
                                      className={styles.checkboxInput}
                                      value={val}
                                      checked={(profileData[toCamelCase(item.field) as keyof typeof profileData] as string[]).includes(val)}
                                      onChange={() => selectOption(toCamelCase(item.field), val)}
                                    />
                                    <label htmlFor={`${toCamelCase(item.field)}-${i}`} className={styles.checkboxLabel}>
                                      {label}
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.bioGoalsWrapper}>
              <div className={styles.bioGoalsGrid}>
                {bioAndExperienceFields.map((item, index) => {
                  const globalIndex = inputFieldPersonalInformation.length + 1 + inputFieldProfileInformation.length + index;
                  return (
                    <div key={`bio-${index}`} className={styles.inputFields}>
                      <label className={styles.label}>{item.field}</label>
                      <textarea
                        ref={el => { inputRefs.current[globalIndex] = el as HTMLTextAreaElement | null; }}
                        value={profileData[toCamelCase(item.field) as keyof typeof profileData] as string}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setProfileData(prev => ({ ...prev, [toCamelCase(item.field)]: newValue }));
                          validateField(toCamelCase(item.field), newValue);
                        }}
                        onFocus={() => setFocusedIndex(globalIndex)}
                        className={styles.fixedTextarea}
                        placeholder={getPlaceholder(item.field, 'profile') || item.placeholder}
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
              ref={el => { inputRefs.current[totalFocusableElements - 1] = el as HTMLButtonElement | null; }}
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