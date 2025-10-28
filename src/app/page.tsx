'use client';

import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import styles from './page.module.css'; 

export default function Home() {
  const router = useRouter();

  const goToLearnMore = () => {
    router.push('/learnmore');
  };

  const goToSignup = () => {
    router.push('/auth/login');
  };

  return (
    <div className={styles.homeContainer}>
      <Navbar />
      <main className={styles.introSection} id="home">
        <div className={styles.introContent}>
          <Image 
            alt="Illustration" 
            src="/logo_gccoed.png" 
            className={styles.introLogo} 
            width={500}
            height={300}
            priority
          />
          <div className={styles.introText}>
            <h1>Mind<span className={styles.highlightEd}>Mates</span>:</h1>
            <p>A Peer-Assisted Educational Sessions</p>
          </div>
        </div>
      </main>

      <section id="learners" className={`${styles.contentSection} ${styles.learnersSection}`}>
        <div className={`${styles.contentBox} ${styles.learnersContentBox}`}>
          <h2 className={styles.learnersHeading}>LEARNERS</h2>
          <p className={styles.learnerText}>
            As a learner, you get the chance to boost your knowledge and sharpen
            your skills in subjects that matter to you. Whether you're prepping
            for exams, struggling with tricky topics, or just eager to learn more,
            our platform connects you with mentors who can help. It's all about
            learning at your own pace, with flexible and personalized support to
            help you reach your academic goals.
          </p>
        </div>
        <Image
          className={styles.learnersImage}
          src="/learners.png"
          alt="Learners Illustration"
          width={320}
          height={320}
        />
      </section>
      
      <section id="mentors" className={`${styles.contentSection} ${styles.mentorsSection}`}>
        <Image
          className={styles.mentorsImage}
          src="/mentors.png"
          alt="Mentors Illustration"
          width={290}
          height={290}
        />
        <div className={`${styles.contentBox} ${styles.mentorContentBox}`}>
          <h2 className={styles.mentorsHeading}>MENTORS</h2>
          <p>
            Being a mentor is more than just sharing what you know, it's about
            helping others grow. By guiding fellow students through their academic
            hurdles, you strengthen your own understanding while making a positive
            difference. It's a fulfilling way to develop leadership skills,
            improve communication, and contribute to a supportive student
            community.
          </p>
        </div>
      </section>
      
      <section id="how-it-works" className={styles.howItWorks}>
        <h2>HOW IT WORKS</h2>
        <div className={styles.howItWorksGrid}>
          <div className={styles.row}>
            <div className={styles.step}>
              <Image 
                src="/icon1.png" 
                alt="Find a Mentor or Learner" 
                width={85}
                height={85}
              />
              <h3>Find a Mentor or Learner</h3>
              <p>
                Search and filter peers based on subjects, expertise,
                availability, and ratings.
              </p>
            </div>
            <div className={styles.step}>
              <Image
                src="/icon2.png"
                alt="Check Profiles & Qualifications"
                width={85}
                height={85}
              />
              <h3>Check Profiles & Qualifications</h3>
              <p>
                View mentor and learner profiles, including expertise, experience,
                and session availability.
              </p>
            </div>
            <div className={styles.step}>
              <Image 
                src="/icon3.png" 
                alt="Learn & Teach" 
                width={85}
                height={85}
              />
              <h3>Learn & Teach</h3>
              <p>
                Expand your knowledge or share your expertise by joining
                peer-assisted sessions.
              </p>
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.step}>
              <Image 
                src="/icon4.png" 
                alt="Schedule Your Session" 
                width={85}
                height={85}
              />
              <h3>Schedule Your Session</h3>
              <p>
                Book a tutoring session at a time that works best for both you and
                your peer.
              </p>
            </div>
            <div className={styles.step}>
              <Image 
                src="/icon5.png" 
                alt="Get Notified" 
                width={85}
                height={85}
              />
              <h3>Get Notified</h3>
              <p>
                Receive email reminders for upcoming sessions, booking changes, or
                cancellations.
              </p>
            </div>
            <div className={styles.step}>
              <Image 
                src="/icon6.png" 
                alt="Rate & Review" 
                width={85}
                height={85}
              />
              <h3>Rate & Review</h3>
              <p>
                Provide feedback on completed sessions to help improve the
                learning experience for others.
              </p>
            </div>
          </div>
        </div>
        <button className={styles.learnMoreBtn} onClick={goToLearnMore}>LEARN MORE</button>
      </section>
      
      <section className={styles.joinSection} id="get-started">
        <div className={styles.getStartedCard}>
          <h2 className={styles.getStartedTitle}>Ready to Get Started?</h2>
          <div className={styles.getStartedContent}>
            <ul className={styles.benefitsList}>
              <li>
                <span className={styles.benefitIcon}>✓</span>
                Connect with mentors in various subjects
              </li>
              <li>
                <span className={styles.benefitIcon}>✓</span>
                Share your knowledge as a mentor
              </li>
              <li>
                <span className={styles.benefitIcon}>✓</span>
                Flexible scheduling for sessions
              </li>
              <li>
                <span className={styles.benefitIcon}>✓</span>
                Join our supportive learning community
              </li>
            </ul>
            <button className={styles.signupBtn} onClick={goToSignup}>JOIN NOW</button>
          </div>
        </div>
      </section>
    </div>
  );
}