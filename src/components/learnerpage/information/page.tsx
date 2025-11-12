'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './information.module.css';

interface IUserData {
  _id: string;
  userId: string;
  name: string;
  email: string;
  address: string;
  yearLevel: string;
  program: string;
  availability: string[];
  sessionDur: string;
  bio: string;
  subjects: string[];
  image: string;
  phoneNumber: string;
  style: string[];
  goals: string;
  sex: string;
  status: string;
  modality: string;
  createdAt: string;
  __v: number;
  // added to match usage in component (server returns nested learn object)
  learn?: any;
}

interface EditInformationProps {
  userData: IUserData;
  onClose: () => void;
  onUpdateUserData: (updatedData: Partial<IUserData>) => void;
}

interface InputField {
  field: string;
  type: string;
  options?: string[] | { label: string; value: string }[];
}

interface AvailableSubjects {
  coreSubjects: string[];
  gecSubjects: string[];
  peNstpSubjects: string[];
}

interface PersonalData {
  [key: string]: string;
}

interface ProfileData {
  [key: string]: string | string[] | undefined; // allow undefined for indexed properties
  courseOffered: string[];
  shortBio: string;
  learningGoals: string;
  modality?: string;
  availability?: string[];
  style?: string[];
  sessionDur?: string;
}

interface ValidationErrors {
  [key: string]: string;
}

export default function EditInformation({ userData, onClose, onUpdateUserData }: EditInformationProps) {
  const [personalData, setPersonalData] = useState<PersonalData>({});
  const [profileData, setProfileData] = useState<ProfileData>({
    courseOffered: [],
    shortBio: userData?.learn?.bio || '',
    learningGoals: userData?.learn?.goals || '',
    modality: '',
    availability: [],
    style: [],
    sessionDur: '',
  });
  const [dropdownOpen, setDropdownOpen] = useState<{ [key: string]: boolean }>({});
  const [availableSubjects, setAvailableSubjects] = useState<AvailableSubjects>({
    coreSubjects: [],
    gecSubjects: [],
    peNstpSubjects: [],
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const dropdownRef = useRef<HTMLDivElement>(null);

  const yearLevelOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const programOptions = [
    'Bachelor of Science in Information Technology (BSIT)',
    'Bachelor of Science in Computer Science (BSCS)',
    'Bachelor of Science in Entertainment and Multimedia Computing (BSEMC)',
  ];
  const learningModalityOptions = ['Online', 'In-person', 'Hybrid'];
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

  const learningStyleOptions = [
    { label: 'Lecture-Based', value: 'Lecture-Based' },
    { label: 'Interactive Discussion', value: 'Interactive Discussion' },
    { label: 'Q&A Session', value: 'Q&A Session' },
    { label: 'Demonstration', value: 'Demonstration' },
    { label: 'Project-based', value: 'Project-based' },
    { label: 'Step-by-step process', value: 'Step-by-step process' },
  ];

  const inputFieldPersonalInformation: InputField[] = [
    { field: 'Year Level', type: 'select', options: yearLevelOptions },
    { field: 'Program', type: 'select', options: programOptions },
    { field: 'Address', type: 'text' },
    { field: 'Contact Number', type: 'text' },
  ];

  const inputFieldProfileInformation: InputField[] = [
    {
      field: 'Learning Modality',
      type: 'select',
      options: learningModalityOptions,
    },
    { field: 'Days of Availability', type: 'checkbox', options: daysOptions },
    { field: 'Learning Style', type: 'checkbox', options: learningStyleOptions },
    {
      field: 'Preferred Session Duration',
      type: 'select',
      options: durationOptions,
    },
    { field: 'Subject of Interest', type: 'select' },
  ];

  const toCamelCase = (str: string): string => {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      })
      .replace(/\s+/g, '');
  };

  const updateAvailableSubjects = (program: string) => {
    switch (program) {
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

  const getCSubjectInterestDisplay = (): string => {
    if (!profileData.courseOffered || profileData.courseOffered.length === 0) {
      return '';
    }
    return profileData.courseOffered.join(', ');
  };

  const toggleDropdown = (field: string) => {
    const dropdownKey = field === 'Subject of Interest' ? 'subjectOfInterest' : toCamelCase(field);
    const newDropdownOpen = { ...dropdownOpen };
    Object.keys(newDropdownOpen).forEach((key) => {
      if (key !== dropdownKey) newDropdownOpen[key] = false;
    });
    newDropdownOpen[dropdownKey] = !newDropdownOpen[dropdownKey];
    setDropdownOpen(newDropdownOpen);
  };

  const selectOption = (field: string, value: string, section: string = 'profile') => {
    if (section === 'personal') {
      setPersonalData(prev => ({ ...prev, [field]: value }));
      setDropdownOpen(prev => ({ ...prev, [field]: false }));
      
      if (field === 'program') {
        updateAvailableSubjects(value);
        setProfileData(prev => ({ ...prev, courseOffered: [] }));
      }
    } else {
      if (Array.isArray(profileData[field])) {
        const currentArray = profileData[field] as string[];
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
        setDropdownOpen(prev => ({ ...prev, [field]: false }));
      }
    }
  };

  const getDisplayValue = (field: string): string => {
    if (Array.isArray(profileData[field])) {
      if (profileData[field].length === 0) {
        if (field === 'availability') {
          return userData?.learn?.availability?.join(', ') || '';
        }
        if (field === 'style') {
          return userData?.learn?.style?.join(', ') || '';
        }
      }
      return (profileData[field] as string[]).join(', ');
    }
    return (profileData[field] as string) || '';
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setDropdownOpen({});
    }
  };

  const validateField = (field: string, value: string) => {
    const trimmedValue = value?.trim() || '';

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

      case 'learningGoals':
        if (trimmedValue.length < 10) {
          error = 'Learning Goals should be at least 10 characters.';
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
    Object.keys(personalData).forEach(field => {
      validateField(field, personalData[field]);
    });
    Object.keys(profileData).forEach(field => {
      if (typeof profileData[field] === 'string') {
        validateField(field, profileData[field] as string);
      }
    });

    if (Object.keys(validationErrors).length > 0) {
      alert('Please fix validation errors before saving.');
      return;
    }

    const learn = userData?.learn || {};

    const combinedData = {
      phoneNum: personalData.contactNumber?.trim() || learn.phoneNum,
      address: personalData.address?.trim() || learn.address,
      course: personalData.program || learn.course,
      department: 'College of Computer Studies',
      year: personalData.yearLevel || learn.year,
      subjects: profileData.courseOffered?.length ? profileData.courseOffered : learn.subjects || [],
      learn_modality: profileData.learningModality as string || learn.learn_modality,
      learn_sty: (profileData.learningStyle as string[] || learn.learn_sty || []).filter(Boolean),
      availability: (profileData.daysOfAvailability as string[] || learn.availability || []).filter(Boolean),
      prefSessDur: profileData.preferredSessionDuration as string || learn.prefSessDur,
      bio: profileData.shortBio?.trim() || learn.bio || '',
      goals: profileData.learningGoals?.trim() || learn.goals || '',
    };

    try {
      onUpdateUserData({
        // allow updating nested learn object
        learn: {
          ...learn,
          ...combinedData
        }
      } as Partial<IUserData>);

      alert('Changes saved successfully!');
      onClose();
    } catch (error) {
      alert('An error occurred while saving changes.');
    }
  };

  const getPlaceholder = (field: string, section: string = 'personal'): string => {
    const learn = userData?.learn || {};

    const mappings: any = {
      personal: {
        'Contact Number': learn.phoneNum || 'Enter contact number',
        'Year Level': learn.year || 'Select year level',
        'Program': learn.course || 'Select program',
        'Address': learn.address || 'Enter address',
      },
      profile: {
        'Learning Modality': learn.learn_modality || 'Select learning modality',
        'Days of Availability': learn.availability?.join(', ') || 'Select days',
        'Learning Style': learn.learn_sty?.join(', ') || 'Select learning style',
        'Preferred Session Duration': learn.prefSessDur || 'Select duration',
        'Subject of Interest': learn.subjects?.join(', ') || 'Select subjects',
        'Short Bio': learn.bio || 'Tell us about yourself',
        'Learning Goals': learn.goals || 'Tell us your learning goals',
      },
    };

    return mappings[section][field];
  };

  const handleSubjectCheckboxChange = (subject: string, isChecked: boolean) => {
    setProfileData(prev => {
      const currentSubjects = prev.courseOffered || [];
      let newSubjects;
      
      if (isChecked) {
        newSubjects = [...currentSubjects, subject];
      } else {
        newSubjects = currentSubjects.filter(s => s !== subject);
      }
      
      return { ...prev, courseOffered: newSubjects };
    });
  };

  const handleCheckboxChange = (field: string, value: string, isChecked: boolean) => {
    setProfileData(prev => {
      const currentArray = (prev[field] as string[]) || [];
      let newArray;
      
      if (isChecked) {
        newArray = [...currentArray, value];
      } else {
        newArray = currentArray.filter(item => item !== value);
      }
      
      return { ...prev, [field]: newArray };
    });
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    
    const initialPersonalData: PersonalData = {};
    inputFieldPersonalInformation.forEach((item) => {
      const fieldName = toCamelCase(item.field);
      initialPersonalData[fieldName] = '';
    });
    setPersonalData(initialPersonalData);

    updateAvailableSubjects(userData?.learn?.course);
    
    setProfileData({
      courseOffered: userData?.learn?.subjects || [],
      shortBio: userData?.learn?.bio || '',
      learningGoals: userData?.learn?.goals || '',
      learningModality: userData?.learn?.modality || '',
      daysOfAvailability: userData?.learn?.availability || [],
      learningStyle: userData?.learn?.style || [],
      preferredSessionDuration: userData?.learn?.sessionDur || '',
    });
    
    setPersonalData({
      contactNumber: userData?.learn?.phoneNum || '',
      address: userData?.learn?.address || '',
      program: userData?.learn?.course || '',
      yearLevel: userData?.learn?.year || '',
    });

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [userData]);

  return (
    <div className={styles.editInformation} ref={dropdownRef}>
      <div className={styles.upperElement}>
        <h1 className={styles.upperElementH1}>Edit Information</h1>
        <img 
          src="/exit.svg" 
          alt="exit" 
          onClick={onClose}
          className={styles.exitIcon}
        />
      </div>
      <div className={styles.lowerElement}>
        <div className={styles.personalInformation}>
          <h1 className={styles.sectionH1}>PERSONAL INFORMATION</h1>
          <div className={styles.inputWrapper}>
            {inputFieldPersonalInformation.map((item, index) => (
              <div key={index} className={styles.inputFields}>
                <label className={styles.label}>{item.field}</label>

                {item.type === 'text' && (
                  <input
                    type="text"
                    value={personalData[toCamelCase(item.field)] || ''}
                    onChange={(e) => {
                      const fieldName = toCamelCase(item.field);
                      setPersonalData(prev => ({ ...prev, [fieldName]: e.target.value }));
                      validateField(fieldName, e.target.value);
                    }}
                    placeholder={getPlaceholder(item.field, 'personal')}
                    className={styles.standardInput}
                  />
                )}

                {item.type === 'select' && (
                  <div className={styles.customDropdown}>
                    <div
                      className={styles.dropdownContainer}
                      onClick={() => toggleDropdown(toCamelCase(item.field))}
                    >
                      <input
                        type="text"
                        value={personalData[toCamelCase(item.field)] || ''}
                        placeholder={
                          personalData[toCamelCase(item.field)] ||
                          `Select ${item.field.toLowerCase()}`
                        }
                        readOnly
                        className={styles.standardInput}
                      />
                      <i
                        className={`${styles.dropdownIcon} ${dropdownOpen[toCamelCase(item.field)] ? styles.dropdownIconOpen : ''}`}
                      >▼</i>
                    </div>
                    {dropdownOpen[toCamelCase(item.field)] && (
                      <div className={styles.dropdownOptions}>
                        {(item.options as string[])?.map((option, i) => (
                          <div
                            key={i}
                            className={styles.dropdownOption}
                            onClick={() => selectOption(toCamelCase(item.field), option, 'personal')}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {validationErrors[toCamelCase(item.field)] && (
                  <div className={styles.errorMessage}>
                    {validationErrors[toCamelCase(item.field)]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.profileInformation}>
          <h1 className={styles.sectionH1}>PROFILE INFORMATION</h1>
          <div className={styles.inputWrapper}>
            {inputFieldProfileInformation.map((item, index) => (
              <div key={index} className={styles.inputFields}>
                <label className={styles.label}>{item.field}</label>

                {item.type === 'select' && item.field !== 'Subject of Interest' && (
                  <div className={styles.customDropdown}>
                    <div
                      className={styles.dropdownContainer}
                      onClick={() => toggleDropdown(toCamelCase(item.field))}
                    >
                      <input
                        type="text"
                        value={profileData[toCamelCase(item.field)] as string || ''}
                        placeholder={
                          (profileData[toCamelCase(item.field)] as string) ||
                          `Select ${item.field.toLowerCase()}`
                        }
                        readOnly
                        className={styles.standardInput}
                      />
                      <i
                        className={`${styles.dropdownIcon} ${dropdownOpen[toCamelCase(item.field)] ? styles.dropdownIconOpen : ''}`}
                      >▼</i>
                    </div>
                    {dropdownOpen[toCamelCase(item.field)] && (
                      <div className={styles.dropdownOptions}>
                        {(item.options as string[])?.map((option, i) => (
                          <div
                            key={i}
                            className={styles.dropdownOption}
                            onClick={() => selectOption(toCamelCase(item.field), option)}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {item.field === 'Subject of Interest' && (
                  <div className={styles.customDropdown}>
                    <div
                      className={styles.dropdownContainer}
                      onClick={() => toggleDropdown('Subject of Interest')}
                    >
                      <input
                        type="text"
                        value={getCSubjectInterestDisplay()}
                        placeholder={getCSubjectInterestDisplay() || 'Select courses'}
                        readOnly
                        className={styles.standardInput}
                      />
                      <i
                        className={`${styles.dropdownIcon} ${dropdownOpen['subjectOfInterest'] ? styles.dropdownIconOpen : ''}`}
                      >▼</i>
                    </div>
                    {dropdownOpen['subjectOfInterest'] && (
                      <div className={`${styles.dropdownOptions} ${styles.checkboxOptions}`}>
                        {availableSubjects.coreSubjects.length > 0 && (
                          <div className={styles.categorySection}>
                            <h4 className={styles.categoryH4}>Core Subjects</h4>
                            {availableSubjects.coreSubjects.map((option, i) => (
                              <div key={`core-${i}`} className={styles.checkboxOption}>
                                <input
                                  type="checkbox"
                                  id={`core-${i}`}
                                  checked={profileData.courseOffered.includes(option)}
                                  onChange={(e) => handleSubjectCheckboxChange(option, e.target.checked)}
                                  className={styles.checkboxInput}
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
                                  checked={profileData.courseOffered.includes(option)}
                                  onChange={(e) => handleSubjectCheckboxChange(option, e.target.checked)}
                                  className={styles.checkboxInput}
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
                                  checked={profileData.courseOffered.includes(option)}
                                  onChange={(e) => handleSubjectCheckboxChange(option, e.target.checked)}
                                  className={styles.checkboxInput}
                                />
                                <label htmlFor={`pe-${i}`} className={styles.checkboxLabel}>{option}</label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {item.type === 'checkbox' && (
                  <div className={styles.customDropdown}>
                    <div
                      className={styles.dropdownContainer}
                      onClick={() => toggleDropdown(toCamelCase(item.field))}
                    >
                      <input
                        type="text"
                        value={getDisplayValue(toCamelCase(item.field))}
                        readOnly
                        className={styles.standardInput}
                      />
                      <i
                        className={`${styles.dropdownIcon} ${dropdownOpen[toCamelCase(item.field)] ? styles.dropdownIconOpen : ''}`}
                      >▼</i>
                    </div>
                    {dropdownOpen[toCamelCase(item.field)] && (
                      <div className={`${styles.dropdownOptions} ${styles.checkboxOptions}`}>
                        {(item.options as { label: string; value: string }[])?.map((option, i) => (
                          <div key={i} className={styles.checkboxOption}>
                            <input
                              type="checkbox"
                              id={`${toCamelCase(item.field)}-${i}`}
                              checked={(profileData[toCamelCase(item.field)] as string[])?.includes(option.value) || false}
                              onChange={(e) => handleCheckboxChange(toCamelCase(item.field), option.value, e.target.checked)}
                              className={styles.checkboxInput}
                            />
                            <label htmlFor={`${toCamelCase(item.field)}-${i}`} className={styles.checkboxLabel}>
                              {option.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {validationErrors[toCamelCase(item.field)] && (
                  <div className={styles.errorMessage}>
                    {validationErrors[toCamelCase(item.field)]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.bioGoalsWrapper}>
          <div className={styles.bioGoalsGrid}>
            <div className={styles.inputFields}>
              <label className={styles.label}>Short Bio</label>
              <textarea
                value={profileData.shortBio as string}
                onChange={(e) => {
                  setProfileData(prev => ({ ...prev, shortBio: e.target.value }));
                  validateField('shortBio', e.target.value);
                }}
                className={styles.fixedTextarea}
                placeholder="Tell us about yourself"
              />
              {validationErrors.shortBio && (
                <div className={styles.errorMessage}>
                  {validationErrors.shortBio}
                </div>
              )}
            </div>
            <div className={styles.inputFields}>
              <label className={styles.label}>Learning Goals</label>
              <textarea
                value={profileData.learningGoals as string}
                onChange={(e) => {
                  setProfileData(prev => ({ ...prev, learningGoals: e.target.value }));
                  validateField('learningGoals', e.target.value);
                }}
                className={styles.fixedTextarea}
                placeholder="Tell us your learning goals"
              />
              {validationErrors.learningGoals && (
                <div className={styles.errorMessage}>
                  {validationErrors.learningGoals}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className={styles.save}>
        <button onClick={saveChanges} className={styles.saveButton}>Save Changes</button>
      </div>
    </div>
  );
}