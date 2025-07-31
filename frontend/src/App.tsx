// // import React, { useState, useEffect } from "react";
// // import Dashboard from "./components/Dashboard";
// // import ResumeUpload from "./components/ResumeUpload";
// // import FlightSearch from "./components/FlightSearch";
// // import JobGenerator from "./components/JobGenerator";
// // import CandidateMatching from "./components/CandidateMatching";
// // import CandidateDatabase from "./components/CandidateDatabase";
// // import InterviewScheduler from "./components/InterviewScheduler";
// // import TravelDashboard from "./components/TravelDashboard";
// // import { useWebSocket } from "./hooks/useWebSocket";
// // import ConnectionStatus from "./components/common/ConnectionStatus";
// // import TestScheduler from "./components/TestScheduler";
// // import EmailAutomation from "./components/EmailAutomation";
// // import HRMetrics from "./components/analytics/HRMetrics";
// // import ROIAnalytics from "./components/analytics/ROIAnalytics";
// // import TravelMetrics from "./components/analytics/TravelMetrics";

// // const App: React.FC = () => {
// //   const [currentPage, setCurrentPage] = useState("dashboard");
// //   const [user, setUser] = useState({ name: "HR Manager", role: "hr_manager" });
// //   // const { socket, isConnected, sendMessage } = useWebSocket('ws://localhost:8000/ws/chat/hr_user');
// //   const [userId] = useState(() => `user_${Date.now()}`);

// //   const {
// //     socket,
// //     isConnected,
// //     connectionStatus,
// //     sendMessage,
// //     messages,
// //     reconnect,
// //     lastActivity,
// //   } = useWebSocket(userId);

// //   const menuItems = [
// //     { id: "dashboard", label: "📊 Dashboard", category: "main" },
// //     { id: "job-generator", label: "✨ JD Generator", category: "talent" },
// //     { id: "resume-upload", label: "📄 Resume Upload", category: "talent" },
// //     {
// //       id: "candidate-matching",
// //       label: "🎯 Smart Matching",
// //       category: "talent",
// //     },
// //     {
// //       id: "candidate-database",
// //       label: "👥 Candidate Database",
// //       category: "talent",
// //     },
// //     {
// //       id: "test-scheduler",
// //       label: "📄 Test Scheduler",
// //       category: "talent",
// //     },
// //     {
// //       id: "interview-scheduler",
// //       label: "📅 Interview Scheduler",
// //       category: "talent",
// //     },
// //     {
// //       id: "email-automation",
// //       label: "📧 Email Automation",
// //       category: "talent",
// //     },
// //     { id: "flight-search", label: "✈️ Flight Search", category: "travel" },
// //     {
// //       id: "travel-dashboard",
// //       label: "🗺️ Travel Dashboard",
// //       category: "travel",
// //     },
// //   ];

// //   const renderPage = () => {
// //     const pageProps = { socket, sendMessage, isConnected, messages };
// // switch (currentPage) {
// //       case 'dashboard':
// //         return <Dashboard {...pageProps} />;
// //       case 'resume-upload':
// //         return <ResumeUpload {...pageProps} />;
// //       case 'candidate-database':
// //         return <CandidateDatabase {...pageProps} />;
// //       case 'candidate-matching':
// //         return <CandidateMatching {...pageProps} />;
// //       case 'interview-scheduler':
// //         return <InterviewScheduler {...pageProps} />;
// //       case 'flight-search':
// //         return <FlightSearch {...pageProps} />;
// //       case 'travel-dashboard':
// //         return <TravelDashboard {...pageProps} />;
// //       case 'job-generator':
// //         return <JobGenerator {...pageProps} />;
// //       case 'test-scheduler':
// //         return <TestScheduler {...pageProps} />;
// //       case 'email-automation':
// //         return <EmailAutomation {...pageProps} />;
// //       case 'hr-metrics':
// //         return <HRMetrics {...pageProps} />;
// //       case 'roi-analytics':
// //         return <ROIAnalytics {...pageProps} />;
// //       case 'travel-metrics':
// //         return <TravelMetrics {...pageProps} />;
// //       default:
// //         console.warn(`Unknown page: ${currentPage}`);
// //         return <Dashboard {...pageProps} />;
// //     }
// //   };

// //   return (
// //     <div className="app-container">
// //       {/* Header */}
// //       <header className="app-header">
// //         <div className="header-content">
// //           <div className="logo-section">
// //             <h1>NaviHire</h1>
// //             <span className="tagline">
// //               AI-Powered Talent & Travel Intelligence
// //             </span>
// //           </div>
// //           <div className="user-section">
// //             {/* <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
// //               <span className="status-dot"></span>
// //               {isConnected ? 'AI Connected' : 'Connecting...'}
// //             </div> */}
// //             <ConnectionStatus
// //               status={connectionStatus}
// //               onReconnect={reconnect}
// //               lastActivity={lastActivity}
// //             />
// //             <div className="user-info">
// //               <span>👤 {user.name}</span>
// //               {/* <div className="user-avatar">👤</div> */}
// //             </div>
// //           </div>
// //         </div>
// //       </header>

// //       <div className="main-layout">
// //         {/* Sidebar Navigation */}
// //         <nav className="sidebar">
// //           <div className="nav-section">
// //             <h3>Main</h3>
// //             {menuItems
// //               .filter((item) => item.category === "main")
// //               .map((item) => (
// //                 <button
// //                   key={item.id}
// //                   className={`nav-item ${
// //                     currentPage === item.id ? "active" : ""
// //                   }`}
// //                   onClick={() => setCurrentPage(item.id)}
// //                 >
// //                   {item.label}
// //                 </button>
// //               ))}
// //           </div>

// //           <div className="nav-section">
// //             <h3>Talent Acquisition</h3>
// //             {menuItems
// //               .filter((item) => item.category === "talent")
// //               .map((item) => (
// //                 <button
// //                   key={item.id}
// //                   className={`nav-item ${
// //                     currentPage === item.id ? "active" : ""
// //                   }`}
// //                   onClick={() => setCurrentPage(item.id)}
// //                 >
// //                   {item.label}
// //                 </button>
// //               ))}
// //           </div>

// //           <div className="nav-section">
// //             <h3>Travel Intelligence</h3>
// //             {menuItems
// //               .filter((item) => item.category === "travel")
// //               .map((item) => (
// //                 <button
// //                   key={item.id}
// //                   className={`nav-item ${
// //                     currentPage === item.id ? "active" : ""
// //                   }`}
// //                   onClick={() => setCurrentPage(item.id)}
// //                 >
// //                   {item.label}
// //                 </button>
// //               ))}
// //           </div>
// //         </nav>

// //         {/* Main Content */}
// //         <main className="main-content">{renderPage()}</main>
// //       </div>
// //     </div>
// //   );
// // };

// // export default App;

// import React, { useState, useEffect } from "react";
// import Dashboard from "./components/Dashboard";
// import ResumeUpload from "./components/ResumeUpload";
// import FlightSearch from "./components/FlightSearch";
// import JobGenerator from "./components/JobGenerator";
// import CandidateMatching from "./components/CandidateMatching";
// import CandidateDatabase from "./components/CandidateDatabase";
// import InterviewScheduler from "./components/InterviewScheduler";
// import TravelDashboard from "./components/TravelDashboard";
// import { useWebSocket } from "./hooks/useWebSocket";
// import ConnectionStatus from "./components/common/ConnectionStatus";
// import TestScheduler from "./components/TestScheduler";
// import EmailAutomation from "./components/EmailAutomation";
// import HRMetrics from "./components/analytics/HRMetrics";
// import ROIAnalytics from "./components/analytics/ROIAnalytics";
// import TravelMetrics from "./components/analytics/TravelMetrics";
// import Login from "./components/auth/Login";
// import HelpChatBot from "./components/common/HelpChatBot";
// // import './App.css'; // Import the main CSS file for styling
// const App: React.FC = () => {
//   // const [currentPage, setCurrentPage] = useState("dashboard");
//   // const [user, setUser] = useState({ name: "HR Manager", role: "hr_manager" });
//   // // const { socket, isConnected, sendMessage } = useWebSocket('ws://localhost:8000/ws/chat/hr_user');
//   const [userId] = useState(() => `user_${Date.now()}`);
//   const [user, setUser] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [currentPage, setCurrentPage] = useState("dashboard");

//   const {
//     socket,
//     isConnected,
//     connectionStatus,
//     sendMessage,
//     messages,
//     reconnect,
//     lastActivity,
//   } = useWebSocket(userId);

//   const menuItems = [
//     { id: "dashboard", label: "Dashboard", category: "main" },
//     { id: "job-generator", label: "JD Generator", category: "talent" },
//     { id: "resume-upload", label: "Resume Upload", category: "talent" },
//     {
//       id: "candidate-matching",
//       label: "Smart Matching",
//       category: "talent",
//     },
//     {
//       id: "candidate-database",
//       label: "Candidate Database",
//       category: "talent",
//     },
//     {
//       id: "test-scheduler",
//       label: "Test Scheduler",
//       category: "talent",
//     },
//     {
//       id: "interview-scheduler",
//       label: "Interview Scheduler",
//       category: "talent",
//     },
//     {
//       id: "email-automation",
//       label: "Email Automation",
//       category: "talent",
//     },
//     // { id: "flight-search", label: "Flight Search", category: "travel" },
//     // {
//     //   id: "travel-dashboard",
//     //   label: "Travel Dashboard",
//     //   category: "travel",
//     // },
//   ];

//   const renderPage = () => {
//     const pageProps = { socket, sendMessage, isConnected, messages };
//     switch (currentPage) {
//       case "dashboard":
//         return <Dashboard {...pageProps} />;
//       case "resume-upload":
//         return <ResumeUpload {...pageProps} />;
//       case "candidate-database":
//         return <CandidateDatabase {...pageProps} />;
//       case "candidate-matching":
//         return <CandidateMatching {...pageProps} />;
//       case "interview-scheduler":
//         return <InterviewScheduler {...pageProps} />;
//       case "flight-search":
//         return <FlightSearch {...pageProps} />;
//       case "travel-dashboard":
//         return <TravelDashboard {...pageProps} />;
//       case "job-generator":
//         return <JobGenerator {...pageProps} />;
//       case "test-scheduler":
//         return <TestScheduler {...pageProps} />;
//       case "email-automation":
//         return <EmailAutomation {...pageProps} />;
//       case "hr-metrics":
//         return <HRMetrics {...pageProps} />;
//       case "roi-analytics":
//         return <ROIAnalytics {...pageProps} />;
//       case "travel-metrics":
//         return <TravelMetrics {...pageProps} />;
//       default:
//         console.warn(`Unknown page: ${currentPage}`);
//         return <Dashboard {...pageProps} />;
//     }
//   };

//    useEffect(() => {
//     // Check for existing authentication
//     const token = localStorage.getItem('navihire_token');
//     const userData = localStorage.getItem('navihire_user');
    
//     if (token && userData) {
//       try {
//         setUser(JSON.parse(userData));
//       } catch (error) {
//         localStorage.removeItem('navihire_token');
//         localStorage.removeItem('navihire_user');
//       }
//     }
    
//     setLoading(false);
//   }, []);

//   const handleLogin = (userData: any) => {
//     setUser(userData);
//   };

//   const handleLogout = () => {
//     localStorage.removeItem('navihire_token');
//     localStorage.removeItem('navihire_user');
//     setUser(null);
//     setCurrentPage('dashboard');
//   };

//   if (loading) {
//     return (
//       <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
//         <div>Loading NaviHire...</div>
//       </div>
//     );
//   }

//   if (!user) {
//     return <Login onLogin={handleLogin} />;
//   }

//   return (
//     <div className="app-container">
//       {/* Header */}
//       <header className="app-header">
//         <div className="header-content">
//           <div className="logo-section">
//             <img
//               className="logo"
//               src="/images/navihire-logo.svg"
//               alt="logo"
//               style={{ width: '200px', height: 'auto' }}
//             />
//             <span className="tagline">
//               AI-Powered Talent & Travel Intelligence
//             </span>
//           </div>
//           <div className="user-section">
//             {/* <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
//               <span className="status-dot"></span>
//               {isConnected ? 'AI Connected' : 'Connecting...'}
//             </div> */}
//             <ConnectionStatus
//               status={connectionStatus}
//               onReconnect={reconnect}
//               lastActivity={lastActivity}
//             />
//             <div className="user-info">
//               <span>👤 {user.name}</span>
//               {/* <div className="user-avatar">👤</div> */}
//             </div>
//           </div>
//         </div>
//       </header>

//       <div className="main-layout">
//         {/* Sidebar Navigation */}
//         <nav className="sidebar">
//           <div className="nav-section">
//             <h3>Main</h3>
//             {menuItems
//               .filter((item) => item.category === "main")
//               .map((item) => (
//                 <button
//                   key={item.id}
//                   className={`nav-item ${
//                     currentPage === item.id ? "active" : ""
//                   }`}
//                   onClick={() => setCurrentPage(item.id)}
//                 >
//                   {item.label}
//                 </button>
//               ))}
//           </div>

//           <div className="nav-section">
//             <h3>Talent Acquisition</h3>
//             {menuItems
//               .filter((item) => item.category === "talent")
//               .map((item) => (
//                 <button
//                   key={item.id}
//                   className={`nav-item ${
//                     currentPage === item.id ? "active" : ""
//                   }`}
//                   onClick={() => setCurrentPage(item.id)}
//                 >
//                   {item.label}
//                 </button>
//               ))}
//           </div>

//           {/* <div className="nav-section">
//             <h3>Travel Intelligence</h3>
//             {menuItems
//               .filter((item) => item.category === "travel")
//               .map((item) => (
//                 <button
//                   key={item.id}
//                   className={`nav-item ${
//                     currentPage === item.id ? "active" : ""
//                   }`}
//                   onClick={() => setCurrentPage(item.id)}
//                 >
//                   {item.label}
//                 </button>
//               ))}
//           </div> */}
//         </nav>

//         {/* Main Content */}
//         <main className="main-content">{renderPage()}</main>
//         <HelpChatBot 
//         currentPage={currentPage}
//         userRole={user.role}
//       />
//       </div>
//     </div>
//   );
// };

// export default App;


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
import Footer from "./components/common/Footer/Footer";
import "./index.css"; // Import the CSS file

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
    { id: "candidate-database", label: "Candidate Database", category: "talent", path: "/candidate-database" },
    { id: "test-scheduler", label: "Test Scheduler", category: "talent", path: "/test-scheduler" },
    { id: "interview-scheduler", label: "Interview Scheduler", category: "talent", path: "/interview-scheduler" },
    { id: "email-automation", label: "Email Automation", category: "talent", path: "/email-automation" },
    { id: "hr-metrics", label: "HR Metrics", category: "analytics", path: "/hr-metrics" },
    { id: "roi-analytics", label: "ROI Analytics", category: "analytics", path: "/roi-analytics" },
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
                    className={`nav-button ${
                      location.pathname === item.path ? "active" : ""
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
                    className={`nav-button ${
                      location.pathname === item.path ? "active" : ""
                    }`}
                    onClick={() => navigate(item.path)}
                  >
                    {item.label}
                  </button>
                ))}
            </div>

            <div className="nav-section">
              <h3>Analytics</h3>
              {menuItems
                .filter((item) => item.category === "analytics")
                .map((item) => (
                  <button
                    key={item.id}
                    className={`nav-button ${
                      location.pathname === item.path ? "active" : ""
                    }`}
                    onClick={() => navigate(item.path)}
                  >
                    {item.label}
                  </button>
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
            {/* <Route path="/candidate-database" element={<CandidateDatabase {...pageProps} />} /> */}
            <Route path="/candidate-database" element={<CandidateDatabase />} />
            <Route path="/test-scheduler" element={<TestScheduler {...pageProps} />} />
            <Route path="/interview-scheduler" element={<InterviewScheduler {...pageProps} />} />
            <Route path="/email-automation" element={<EmailAutomation {...pageProps} />} />
            <Route path="/hr-metrics" element={<HRMetrics {...pageProps} />} />
            <Route path="/roi-analytics" element={<ROIAnalytics {...pageProps} />} />
            <Route path="/travel-metrics" element={<TravelMetrics {...pageProps} />} />
            <Route path="/flight-search" element={<FlightSearch {...pageProps} />} />
            <Route path="/travel-dashboard" element={<TravelDashboard {...pageProps} />} />
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
    <Footer/>
    </>
  );
};

export default App;
