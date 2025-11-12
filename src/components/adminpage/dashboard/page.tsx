"use client";

import { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faUserTie, 
  faFileAlt,
  faChartPie,
  faGraduationCap,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  DoughnutController,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import styles from "./page.module.css";

// Register required controllers/elements/plugins once
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  DoughnutController,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Interfaces
interface Stats {
  activeLearners: number;
  approvedMentors: number;
  pendingMentors: number;
}

interface ChartData {
  userCounts: any | null;
  courseBreakdown: any | null;
  yearBreakdown: any | null;
}

interface DashboardProps {
  stats: Stats;
  chartData: ChartData;
}

// Constants
// Soft pastel color palette
const pastelColors = {
  blue: '#93c5fd',
  lightBlue: '#bfdbfe',
  purple: '#d8b4fe',
  lightPurple: '#e9d5ff',
  pink: '#fbcfe8',
  lightPink: '#fce7f3',
  green: '#a7f3d0',
  lightGreen: '#d1fae5',
  teal: '#99f6e4',
  lightTeal: '#ccfbf1'
};

// Sample data for demonstration - ensuring charts show properly
const sampleChartData = {
  userCounts: {
    learners: 156,
    approved_mentors: 28,
    pending_mentors: 14
  },
  courseBreakdown: {
    data: {
      "BSIT": 67,
      "BSCS": 45,
      "BSEMC": 32,
      "BSIS": 12
    }
  },
  yearBreakdown: {
    data: {
      "1st Year": 42,
      "2nd Year": 38,
      "3rd Year": 48,
      "4th Year": 26
    }
  }
};

const Dashboard: React.FC<DashboardProps> = ({ stats, chartData }) => {
  // Chart refs
  const userDistributionChartRef = useRef<HTMLCanvasElement>(null);
  const courseChartRef = useRef<HTMLCanvasElement>(null);
  const yearChartRef = useRef<HTMLCanvasElement>(null);

  // Chart instances
  // Use relaxed typing for Chart instances to avoid generic mismatch errors during build
  // These are actual Chart.js instances at runtime; using `any` prevents TS generic incompatibilities.
  const userDistributionChartInstance = useRef<any>(null);
  const courseChartInstance = useRef<any>(null);
  const yearChartInstance = useRef<any>(null);

  // Use sample data if no chartData is provided
  const effectiveChartData = chartData && Object.values(chartData).some(data => data !== null) 
    ? chartData 
    : sampleChartData;

  // Effective stats
  const effectiveStats = {
    learners: stats.activeLearners,
    mentors: stats.approvedMentors,
    applicants: stats.pendingMentors
  };

  // Chart creation functions
  const createUserDistributionChart = () => {
    if (!userDistributionChartRef.current) return;

    // Destroy existing chart if it exists
    if (userDistributionChartInstance.current) {
      userDistributionChartInstance.current.destroy();
    }

    const ctx = userDistributionChartRef.current.getContext('2d');
    if (!ctx) return;

    const counts = effectiveChartData.userCounts;

    console.log('Creating user distribution chart with data:', counts);

    userDistributionChartInstance.current = new ChartJS(ctx, {
      type: "doughnut",
      data: {
        labels: ["Active Learners", "Approved Mentors", "Pending Applications"],
        datasets: [
          {
            data: [counts.activeLearners, counts.approvedMentors, counts.pendingMentors],
            backgroundColor: [pastelColors.blue, pastelColors.purple, pastelColors.pink],
            borderColor: ['#ffffff', '#ffffff', '#ffffff'],
            borderWidth: 2,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "65%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              padding: 12,
              usePointStyle: true,
              font: {
                size: 11,
                family: "Inter, sans-serif",
              },
              color: '#64748b'
            },
          },
          tooltip: {
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            titleColor: "#1e293b",
            bodyColor: "#475569",
            borderColor: "#e2e8f0",
            borderWidth: 1,
            cornerRadius: 8,
            padding: 10,
          },
        },
      },
    });
  };

  // ensure you destroy previous instance before creating new
  const createCourseChart = (courseData: any): void => {
     const canvas = courseChartRef.current;
     if (!canvas) return;
     const ctx = canvas.getContext('2d');
     if (!ctx) return;

     if (courseChartInstance.current) {
       try { courseChartInstance.current.destroy(); } catch (e) { /* ignore */ }
     }

     // Normalize breakdown shape: support { data: {...} } or plain {...}
     const breakdown = (courseData && (courseData.data || courseData)) || {};
     const labels = Object.keys(breakdown);
     const values = Object.values(breakdown);

     // fallback to sample if nothing available
     const finalLabels = labels.length ? labels : Object.keys(effectiveChartData.courseBreakdown?.data || {});
     const finalValues = values.length ? values : Object.values(effectiveChartData.courseBreakdown?.data || {});
    // Ensure numeric dataset for Chart.js typing/runtime
    const numericValues: number[] = finalValues.map(v => (typeof v === 'number' ? v : Number(v) || 0));
 
     courseChartInstance.current = new ChartJS(ctx, {
       type: 'bar',
       data: {
         labels: finalLabels,
         datasets: [
           {
             label: 'Users',
             data: numericValues,
             backgroundColor: 'rgba(67,97,238,0.8)',
           },
         ],
       },
       options: {
        responsive: true,
        plugins: { title: { display: true, text: 'Course breakdown' }, legend: { display: false } },
        scales: { x: { beginAtZero: true }, y: { beginAtZero: true } },
      },
    });
  };

  const createYearChart = () => {
    if (!yearChartRef.current) return;

    // Determine year data safely (support both shapes)
    const rawYear = effectiveChartData.yearBreakdown;
    const yearData = rawYear ? (rawYear.data || rawYear) : null;

    if (!yearData || typeof yearData !== 'object' || Object.keys(yearData).length === 0) {
      // nothing to render — destroy existing and return
      if (yearChartInstance.current) {
        try { yearChartInstance.current.destroy(); } catch (e) { /* ignore */ }
        yearChartInstance.current = null;
      }
      return;
    }

    // Destroy existing chart if it exists
    if (yearChartInstance.current) {
      yearChartInstance.current.destroy();
    }

    const ctx = yearChartRef.current.getContext('2d');
    if (!ctx) return;

    const labels = Object.keys(yearData);
    const data = Object.values(yearData);

    console.log('Creating year chart with data:', yearData);

    yearChartInstance.current = new ChartJS(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: [pastelColors.blue, pastelColors.purple, pastelColors.pink, pastelColors.teal],
            borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
            borderWidth: 2,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "60%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              padding: 12,
              usePointStyle: true,
              font: {
                size: 11,
                family: "Inter, sans-serif",
              },
              color: '#64748b'
            },
          },
          tooltip: {
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            titleColor: "#1e293b",
            bodyColor: "#475569",
            borderColor: "#e2e8f0",
            borderWidth: 1,
            cornerRadius: 8,
            padding: 10,
          },
        },
      },
    });
  };

  const createCharts = () => {
    console.log('Creating all charts with data:', effectiveChartData);
    createUserDistributionChart();
    createCourseChart(effectiveChartData.courseBreakdown);
    createYearChart();
  };

  // Cleanup function
  const destroyCharts = () => {
    [userDistributionChartInstance, courseChartInstance, yearChartInstance].forEach(instance => {
      if (instance.current) {
        instance.current.destroy();
        instance.current = null;
      }
    });
  };

  // Effects
  // Initialize charts
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      createCharts();
    }, 100);

    return () => {
      clearTimeout(timer);
      destroyCharts();
    };
  }, [chartData]);

  return (
    <>
      <div className={styles['dashboard-container']}>
        {/* Header Section */}
        <div className={styles['dashboard-header']}>
          <h1>Dashboard Overview</h1>
        </div>

        {/* Stats Cards Section */}
        <div className={styles['stats-section']}>
          <div className={styles['stats-grid']}>
            <div className={styles['stat-card']}>
              <div className={styles['stat-content']}>
                <h3>{effectiveStats.learners}</h3>
                <p>Active Learners</p>
              </div>
              <div className={`${styles['stat-icon']} ${styles.learners}`}>
                <FontAwesomeIcon icon={faUsers} />
              </div>
            </div>

            <div className={styles['stat-card']}>
              <div className={styles['stat-content']}>
                <h3>{effectiveStats.mentors}</h3>
                <p>Approved Mentors</p>
              </div>
              <div className={`${styles['stat-icon']} ${styles.mentors}`}>
                <FontAwesomeIcon icon={faUserTie} />
              </div>
            </div>

            <div className={styles['stat-card']}>
              <div className={styles['stat-content']}>
                <h3>{effectiveStats.applicants}</h3>
                <p>Pending Applications</p>
              </div>
              <div className={`${styles['stat-icon']} ${styles.applicants}`}>
                <FontAwesomeIcon icon={faFileAlt} />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className={styles['charts-section']}>
          <div className={styles['charts-grid']}>
            <div className={styles['chart-card']}>
              <div className={styles['chart-header']}>
                <div className={styles['chart-title']}>
                  <FontAwesomeIcon icon={faChartPie} className={styles['chart-icon']} />
                  <div>
                    <h3>User Distribution</h3>
                    <p>Breakdown of platform users by role</p>
                  </div>
                </div>
              </div>
              <div className={styles['chart-wrapper']}>
                <canvas 
                  ref={userDistributionChartRef}
                  width="400" 
                  height="200"
                ></canvas>
              </div>
            </div>

            <div className={styles['chart-card']}>
              <div className={styles['chart-header']}>
                <div className={styles['chart-title']}>
                  <FontAwesomeIcon icon={faGraduationCap} className={styles['chart-icon']} />
                  <div>
                    <h3>Program Distribution</h3>
                    <p>Student distribution across programs</p>
                  </div>
                </div>
              </div>
              <div className={styles['chart-wrapper']}>
                <canvas 
                  ref={courseChartRef}
                  width="400" 
                  height="200"
                ></canvas>
              </div>
            </div>

            <div className={styles['chart-card']}>
              <div className={styles['chart-header']}>
                <div className={styles['chart-title']}>
                  <FontAwesomeIcon icon={faCalendarAlt} className={styles['chart-icon']} />
                  <div>
                    <h3>Year Level Distribution</h3>
                    <p>Students by academic year level</p>
                  </div>
                </div>
              </div>
              <div className={styles['chart-wrapper']}>
                <canvas 
                  ref={yearChartRef}
                  width="400" 
                  height="200"
                ></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;