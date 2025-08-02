import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import ResumeUpload from "./components/ResumeUpload";
import FlightSearch from "./components/FlightSearch";
import JobGenerator from "./components/tools/JDGenerator/JobGenerator";
import CandidateMatching from "./components/CandidateMatching";
import CandidateDatabase from "./components/CandidateDatabase";
import InterviewScheduler from "./components/InterviewScheduler";
import TravelDashboard from "./components/TravelDashboard";
import { useWebSocket } from "./hooks/useWebSocket";
import ConnectionStatus from "./components/common/ConnectionStatus";
import TestScheduler from "./components/TestScheduler";
import EmailAutomation from "./components/EmailAutomation";
import HRMetrics from "./components/analytics/HRMetrics";
import ROIAnalytics from "./components/analytics/ROIAnalytics";
import TravelMetrics from "./components/analytics/TravelMetrics";
import Login from "./components/auth/Login";
import Header from "./components/common/Header/Header";
import HelpChatBot from "./components/common/HelpChatBot";
import MaxChatbot from "./components/MaxChatbot"; // Import Max
import Footer from "./components/common/Footer/Footer";
import EmailScheduler from "./components/EmailScheduler";
import TemplateDatabase from "./components/TemplateDatabase";
import JDDatabase from "./components/JDDatabase";
import MailTemplateGenerator from "./components/MailTemplateGenerator";
import "./index.css"; // Import the CSS file
import { RobotFilled, RobotOutlined } from "@ant-design/icons";

interface User {
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('navihire_token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

// Magic Sparkle Effect Component
const MagicSparkles: React.FC<{ children: React.ReactNode; isActive?: boolean }> = ({
  children,
  isActive = false
}) => {
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    // Generate random sparkles
    const generateSparkles = () => {
      const newSparkles = Array.from({ length: 6 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2
      }));
      setSparkles(newSparkles);
    };

    generateSparkles();
    const interval = setInterval(generateSparkles, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`magic-sparkle-container ${isActive ? 'active' : ''}`}>
      {children}
      <div className="sparkles-overlay">
        {sparkles.map((sparkle) => (
          <div
            key={sparkle.id}
            className="sparkle"
            style={{
              left: `${sparkle.x}%`,
              top: `${sparkle.y}%`,
              animationDelay: `${sparkle.delay}s`
            }}
          >
            ✨
          </div>
        ))}
      </div>
    </div>
  );
};

// Main App Layout Component
const AppLayout: React.FC = () => {
  const [userId] = useState(() => `user_${Date.now()}`);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const {
    socket,
    isConnected,
    connectionStatus,
    sendMessage,
    messages,
    reconnect,
    lastActivity,
  } = useWebSocket(userId);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", category: "main", path: "/" },
    { id: "job-generator", label: "JD Generator", category: "talent", path: "/job-generator" },
    { id: "resume-upload", label: "Resume Upload", category: "talent", path: "/resume-upload" },
    { id: "candidate-matching", label: "Smart Matching", category: "talent", path: "/candidate-matching" },
    // { id: "test-scheduler", label: "Test Scheduler", category: "talent", path: "/test-scheduler" },
    // { id: "interview-scheduler", label: "Interview Scheduler", category: "talent", path: "/interview-scheduler" },
    { id: "mail-generator", label: "Mail Template Generator", category: "talent", path: "/mail-generator" },
    { id: "email-automation", label: "Email Automation", category: "talent", path: "/email-automation" },
    // Add Email Scheduler here
    { id: "email-scheduler", label: "Email Scheduler", category: "talent", path: "/email-scheduler" },
    { id: "candidate-database", label: "Candidate Database", category: "talent", path: "/candidate-database" },
    { id: "template-database", label: "Template Database", category: "database", path: "/template-database" },
    { id: "jd-database", label: "JD Database", category: "database", path: "/jd-database" },
    // { id: "hr-metrics", label: "HR Metrics", category: "analytics", path: "/hr-metrics" },
    // { id: "roi-analytics", label: "ROI Analytics", category: "analytics", path: "/roi-analytics" },
    // Max AI Assistant
    { id: "max-ai-assistant", label: "Max - AI Assistant", category: "ai", path: "/max-assistant" },
  ];

  useEffect(() => {
    // Check for existing authentication
    const token = localStorage.getItem('navihire_token');
    const userData = localStorage.getItem('navihire_user');

    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        localStorage.removeItem('navihire_token');
        localStorage.removeItem('navihire_user');
      }
    }

    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('navihire_token');
    localStorage.removeItem('navihire_user');
    setUser(null);
    navigate('/login');
  };

  const getCurrentPageId = () => {
    const currentPath = location.pathname;
    const currentItem = menuItems.find(item => item.path === currentPath);
    return currentItem?.id || 'dashboard';
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading NaviHire...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const pageProps = { socket, sendMessage, isConnected, messages };

  return (
    <div className="app-container">
      <Header user={user} onLogout={handleLogout} />

      <div className="app-layout">
        {/* Sidebar Navigation */}
        <nav className="sidebar">
          <div className="sidebar-content">
            <div className="nav-section">
              <h3>Main</h3>
              {menuItems
                .filter((item) => item.category === "main")
                .map((item) => (
                  <button
                    key={item.id}
                    className={`nav-button ${location.pathname === item.path ? "active" : ""
                      }`}
                    onClick={() => navigate(item.path)}
                  >
                    {item.label}
                  </button>
                ))}
            </div>

            <div className="nav-section">
              <h3>Talent Acquisition</h3>
              {menuItems
                .filter((item) => item.category === "talent")
                .map((item) => (
                  <button
                    key={item.id}
                    className={`nav-button ${location.pathname === item.path ? "active" : ""
                      }`}
                    onClick={() => navigate(item.path)}
                  >
                    {item.label}
                  </button>
                ))}
            </div>

            {/* <div className="nav-section">
              <h3>Analytics</h3>
              {menuItems
                .filter((item) => item.category === "analytics")
                .map((item) => (
                  <button
                    key={item.id}
                    className={`nav-button ${location.pathname === item.path ? "active" : ""
                      }`}
                    onClick={() => navigate(item.path)}
                  >
                    {item.label}
                  </button>
                ))}
            </div> */}

            <div className="nav-section">
              <h3>Database & Storage</h3>
              {menuItems
                .filter((item) => item.category === "database")
                .map((item) => (
                  <button
                    key={item.id}
                    className={`nav-button ${location.pathname === item.path ? "active" : ""
                      }`}
                    onClick={() => navigate(item.path)}
                  >
                    {item.label}
                  </button>
                ))}
            </div>

            {/* AI Assistant Section with Magic Effects */}
            <div className="nav-section ai-section">
              {/* <h3 className="ai-section-title">
                AI Assistant
              </h3> */}
              {menuItems
                .filter((item) => item.category === "ai")
                .map((item) => (
                  <MagicSparkles
                    key={item.id}
                    isActive={location.pathname === item.path}
                  >
                    <button
                      className={`nav-button ai-button ${location.pathname === item.path ? "active" : ""
                        }`}
                      onClick={() => navigate(item.path)}
                    >
                      <span className="max-icon"><RobotFilled /></span>
                      <span className="max-label">{item.label}</span>
                      <span className="magic-glow"></span>
                    </button>
                  </MagicSparkles>
                ))}
            </div>

            {/* Connection Status in Sidebar */}
            {/* <div className="connection-status-container">
              <ConnectionStatus
                status={connectionStatus}
                onReconnect={reconnect}
                lastActivity={lastActivity}
              />
            </div> */}
          </div>
        </nav>

        {/* Main Content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard {...pageProps} />} />
            <Route path="/job-generator" element={<JobGenerator {...pageProps} />} />
            <Route path="/resume-upload" element={<ResumeUpload {...pageProps} />} />
            <Route path="/candidate-matching" element={<CandidateMatching {...pageProps} />} />
            <Route path="/candidate-database" element={<CandidateDatabase />} />
            {/* <Route path="/test-scheduler" element={<TestScheduler {...pageProps} />} />
          <Route path="/interview-scheduler" element={<InterviewScheduler {...pageProps} />} /> */}
            <Route path="/email-automation" element={<EmailAutomation {...pageProps} />} />
            <Route path="/email-scheduler" element={<EmailScheduler {...pageProps} />} />
            <Route path="/template-database" element={<TemplateDatabase />} />
            <Route path="/jd-database" element={<JDDatabase />} />
            <Route path="/mail-generator" element={<MailTemplateGenerator />} />
            {/* <Route path="/hr-metrics" element={<HRMetrics {...pageProps} />} />
            <Route path="/roi-analytics" element={<ROIAnalytics {...pageProps} />} /> */}
            <Route path="/travel-metrics" element={<TravelMetrics {...pageProps} />} />
            <Route path="/flight-search" element={<FlightSearch {...pageProps} />} />
            <Route path="/travel-dashboard" element={<TravelDashboard {...pageProps} />} />
            {/* Add Max AI Assistant Route */}
            <Route path="/max-assistant" element={<MaxChatbot {...pageProps} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <HelpChatBot
        currentPage={getCurrentPageId()}
        userRole={user.role}
      />
    </div>
  );
};

// Login Component Wrapper
const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = (userData: User) => {
    navigate('/');
  };

  return <Login onLogin={handleLogin} />;
};

// Main App Component with Router
const App: React.FC = () => {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
      <Footer />
    </>
  );
};

export default App;