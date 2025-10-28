'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import './learnmore.css';

interface FAQ {
  question: string;
  answer: string;
  open: boolean;
}

export default function LearnMore() {
  const router = useRouter();
  const [activeIcon, setActiveIcon] = useState(0);
  const [faqs, setFaqs] = useState<FAQ[]>([
    { question: "Who can use MindMates?", answer: "MindMates is exclusively available to College of Computer Studies students of Gordon College. It is designed to help students connect with peers for tutoring and educational support.", open: false },
    { question: "How do I become a mentor or learner?", answer: "To become a mentor or learner, you need to create two separate accounts using the same email and password — one for each role. This allows you to switch between mentoring and learning as needed.", open: false },
    { question: "Is there a fee to use MindMates?", answer: "No, MindMates is completely free to use.", open: false },
    { question: "How do I book a session?", answer: "Once you find a mentor, you can schedule a session as long as they are available on your preferred day and time. Simply choose a suitable slot and you're good to go.", open: false },
    { question: "Can I cancel or reschedule a session?", answer: "Yes, you can cancel or reschedule a session through the session details page. However, we encourage timely communication to avoid inconveniencing mentors or learners.", open: false },
    { question: "How does the rating system work?", answer: "After each session, learners can leave a rating and feedback based on their experience. Ratings help maintain quality and allow mentors to improve their tutoring approach.", open: false },
    { question: "Is there a messaging feature?", answer: "Yes, MindMates allows users to send messages within the platform. However, instead of a chat system, messages are delivered via email to the recipient, ensuring important details are not missed.", open: false },
    { question: "What types of subjects can I find on MindMates?", answer: "MindMates covers the subjects offered by the different programs in the Department of College of Computer Studies - Gordon College.", open: false },
    { question: "How secure is MindMates?", answer: "MindMates uses secure protocols to protect user data. We continuously implement measures to keep your information secure.", open: false },
    { question: "What if I encounter an issue or need help?", answer: "If you face any issues or need assistance, you can reach out through our support feature. We're here to ensure you have a smooth experience.", open: false },
  ]);

  // Keyboard navigation state
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [currentSection, setCurrentSection] = useState<string>('main');
  const faqRefs = useRef<Array<HTMLDivElement | null>>([]);
  const iconRefs = useRef<Array<HTMLDivElement | null>>([]);
  const backButtonRef = useRef<HTMLButtonElement | null>(null);

  const focusableElements = [
    { type: 'backButton', index: -1 },
    ...faqs.map((_, index) => ({ type: 'faq', index })),
    ...[0, 1, 2, 3].map(index => ({ type: 'icon', index })),
  ];

  const toggleFaq = (index: number) => {
    const updatedFaqs = [...faqs];
    updatedFaqs[index].open = !updatedFaqs[index].open;
    setFaqs(updatedFaqs);
  };

  const goBack = () => {
    router.push('/');
  };

  // Handle keyboard navigation
  useEffect(() => {
    const scrollToElement = (index: number) => {
      const element = focusableElements[index];
      let targetElement: HTMLElement | null = null;

      if (element.type === 'backButton' && backButtonRef.current) {
        targetElement = backButtonRef.current;
      } else if (element.type === 'faq' && faqRefs.current[element.index]) {
        targetElement = faqRefs.current[element.index]!;
      } else if (element.type === 'icon' && iconRefs.current[element.index]) {
        targetElement = iconRefs.current[element.index]!;
      }

      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => {
            const nextIndex = prev < focusableElements.length - 1 ? prev + 1 : 0;
            scrollToElement(nextIndex);
            return nextIndex;
          });
          break;

        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => {
            const nextIndex = prev > 0 ? prev - 1 : focusableElements.length - 1;
            scrollToElement(nextIndex);
            return nextIndex;
          });
          break;

        case ' ':
        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0) {
            const element = focusableElements[focusedIndex];
            if (element.type === 'faq') toggleFaq(element.index);
            else if (element.type === 'backButton') goBack();
            else if (element.type === 'icon') {
              setActiveIcon(element.index + 1);
              const iconElement = iconRefs.current[element.index];
              if (iconElement) iconElement.focus();
            }
          }
          break;

        case 'Escape':
          e.preventDefault();
          if (currentSection !== 'main') {
            setCurrentSection('main');
            setFocusedIndex(0);
          } else if (backButtonRef.current) {
            backButtonRef.current.focus();
            setFocusedIndex(0);
          }
          break;

        case 'Tab':
          setTimeout(() => {
            const activeElement = document.activeElement;
            const index = focusableElements.findIndex(elem => {
              if (elem.type === 'backButton' && activeElement === backButtonRef.current) return true;
              if (elem.type === 'faq' && activeElement === faqRefs.current[elem.index]) return true;
              if (elem.type === 'icon' && activeElement === iconRefs.current[elem.index]) return true;
              return false;
            });
            if (index !== -1) setFocusedIndex(index);
          }, 0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, focusableElements, currentSection, faqs]);

  // Reset focus when component mounts
  useEffect(() => setFocusedIndex(0), []);

  return (
    <div className="learnmore-container">
      <Navbar />

      <div className="system-explanation">
        <button
          ref={backButtonRef}
          className={`back-button ${focusedIndex === 0 ? 'focused' : ''}`}
          onClick={goBack}
          onFocus={() => setFocusedIndex(0)}
          aria-label="Go back"
        >
          <i className="fas fa-arrow-left back-icon"></i>
        </button>

        <h1 className="title animated-title">HOW OUR SYSTEM WORKS</h1>
        <div className="divider animated-divider"></div>

        <div className="intro-container">
          <Image src="/logo_gccoed.png" alt="MindMates Logo" width={280} height={100} className="logo animated-logo" />
          <p className="intro animated-description">
            MindMates is a web-based platform proposed to make the process of finding and scheduling peer-to-peer tutoring sessions efficient within our school community...
          </p>
        </div>

        <div className="divider tight-divider animated-divider"></div>

        {/* Features */}
        <div className="content-wrapper">
          {[
            { src: '/icon1.png', title: 'Find the Right Mentor or Learner', desc: 'Students looking for guidance can search for mentors based on subjects, expertise, and availability...' },
            { src: '/icon3.png', title: 'Connect and Learn', desc: 'Once a student finds a potential mentor, they can view their profile to learn more about their experience...' },
            { src: '/icon4.png', title: 'Schedule and Begin Sessions', desc: 'After finalizing the details, students and mentors can arrange tutoring sessions at convenient times...' }
          ].map((feature, idx) => (
            <div key={idx} className="feature-row">
              <div className="icon-container">
                <Image src={feature.src} alt={feature.title} width={130} height={100} className="feature-icon animated-icon" />
              </div>
              <div className="feature-section">
                <h3 className="feature-title animated-text">{feature.title}</h3>
                <p className="feature-description animated-text">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="divider animated-divider"></div>

        {/* Unique features */}
        <div className="unique-features">
          <h2 className="section-title">What Makes MindMates Different?</h2>
          <p className="section-description">
            MindMates is more than just a tutoring platform—it's a student-driven learning space designed specifically for our school community...
          </p>

          <div className="numbered-icons">
            {["Peer-to-Peer Learning", "School-Specific Platform", "Flexible Learning", "Comfortable Learning"].map((text, i) => (
              <div
                key={i}
                ref={el => (iconRefs.current[i] = el!)}
                className={`icon-wrapper ${focusedIndex === i + faqs.length + 1 ? 'focused' : ''}`}
                onMouseEnter={() => setActiveIcon(i + 1)}
                onMouseLeave={() => setActiveIcon(0)}
                onClick={() => setActiveIcon(i + 1)}
                onFocus={() => setFocusedIndex(i + faqs.length + 1)}
                tabIndex={0}
                aria-label={text}
              >
                <div className="icon-circle">{i + 1}</div>
                <div className={`icon-text ${activeIcon === i + 1 ? 'active' : ''}`}>{text}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="divider animated-divider"></div>

        {/* FAQs */}
        <div className="faq-section">
          <h2 className="section-title">FAQs</h2>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div
                key={index}
                ref={el => (faqRefs.current[index] = el!)}
                className={`faq-item ${focusedIndex === index + 1 ? 'focused' : ''}`}
                onClick={() => toggleFaq(index)}
                onFocus={() => setFocusedIndex(index + 1)}
                tabIndex={0}
              >
                <div className="faq-question">
                  {faq.question}
                  <i className={`fas ${faq.open ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                </div>
                <div className={`faq-answer ${faq.open ? 'open' : ''}`}>{faq.answer}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
