import React, { useState, useEffect } from 'react';

interface DashboardProps {
  socket: WebSocket | null;
  sendMessage: (message: string) => void;
  isConnected: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ socket, sendMessage, isConnected }) => {
  const [stats, setStats] = useState({
    totalCandidates: 0,
    activeJobs: 0,
    interviewsScheduled: 0,
    travelRequests: 0,
    matchingAccuracy: 0,
    avgTimeToHire: 0
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [aiInsights, setAiInsights] = useState('');

  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        totalCandidates: 247 + Math.floor(Math.random() * 10),
        activeJobs: 12,
        interviewsScheduled: 8 + Math.floor(Math.random() * 3),
        travelRequests: 3,
        matchingAccuracy: 92 + Math.floor(Math.random() * 5),
        avgTimeToHire: 14 + Math.floor(Math.random() * 7)
      }));
    }, 5000);

    // Get AI insights
    if (isConnected) {
      sendMessage("Give me today's HR insights and recommendations");
    }

    return () => clearInterval(interval);
  }, [isConnected, sendMessage]);

  const quickActions = [
    {
      title: 'Generate Job Description',
      description: 'Create AI-powered job descriptions',
      icon: '✨',
      action: 'job-generator',
      color: 'blue'
    },
    {
      title: 'Upload Resumes',
      description: 'Bulk upload and analyze resumes',
      icon: '📄',
      action: 'resume-upload',
      color: 'green'
    },
    {
      title: 'Smart Candidate Matching',
      description: 'AI-powered candidate ranking',
      icon: '🎯',
      action: 'candidate-matching',
      color: 'purple'
    },
    {
      title: 'Schedule Interviews',
      description: 'Automated interview scheduling',
      icon: '📅',
      action: 'interview-scheduler',
      color: 'orange'
    },
    {
      title: 'Search Flights',
      description: 'Find best travel options',
      icon: '✈️',
      action: 'flight-search',
      color: 'cyan'
    },
    {
      title: 'Candidate Database',
      description: 'Browse talent pool',
      icon: '👥',
      action: 'candidate-database',
      color: 'pink'
    }
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back! Here's your HR overview</h1>
        <p>Real-time insights powered by AI</p>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <h3>{stats.totalCandidates}</h3>
            <p>Total Candidates</p>
            <span className="metric-change positive">+12 this week</span>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">💼</div>
          <div className="metric-content">
            <h3>{stats.activeJobs}</h3>
            <p>Active Job Postings</p>
            <span className="metric-change positive">+3 new</span>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon">📅</div>
          <div className="metric-content">
            <h3>{stats.interviewsScheduled}</h3>
            <p>Interviews This Week</p>
            <span className="metric-change positive">+5 scheduled</span>
          </div>
        </div>

        <div className="metric-card info">
          <div className="metric-icon">🎯</div>
          <div className="metric-content">
            <h3>{stats.matchingAccuracy}%</h3>
            <p>AI Matching Accuracy</p>
            <span className="metric-change positive">+2% improvement</span>
          </div>
        </div>

        <div className="metric-card secondary">
          <div className="metric-icon">⏱️</div>
          <div className="metric-content">
            <h3>{stats.avgTimeToHire}</h3>
            <p>Avg. Time to Hire (days)</p>
            <span className="metric-change negative">-3 days faster</span>
          </div>
        </div>

        <div className="metric-card travel">
          <div className="metric-icon">✈️</div>
          <div className="metric-content">
            <h3>{stats.travelRequests}</h3>
            <p>Pending Travel Requests</p>
            <span className="metric-change neutral">2 approved</span>
          </div>
        </div>
      </div>

      {/* AI Insights Panel */}
      <div className="insights-panel">
        <h2>🤖 AI Insights & Recommendations</h2>
        <div className="insight-card">
          <h3>Today's Recommendations</h3>
          <ul>
            <li>📈 <strong>High-priority:</strong> Review 5 new candidates for Senior Developer role</li>
            <li>⚡ <strong>Quick win:</strong> 3 candidates from talent pool match new Marketing position</li>
            <li>📞 <strong>Follow-up:</strong> Schedule interviews for 2 pre-screened candidates</li>
            <li>✈️ <strong>Travel:</strong> Book flights for candidate interviews - save 15% with advance booking</li>
          </ul>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          {quickActions.map((action, index) => (
            <div key={index} className={`action-card ${action.color}`}>
              <div className="action-icon">{action.icon}</div>
              <div className="action-content">
                <h3>{action.title}</h3>
                <p>{action.description}</p>
                <button className="action-button">
                  Get Started →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="activity-section">
        <h2>Recent Activity</h2>
        <div className="activity-feed">
          <div className="activity-item">
            <div className="activity-icon new">📄</div>
            <div className="activity-content">
              <h4>New Resume Uploaded</h4>
              <p>Sarah Johnson - Senior React Developer</p>
              <span className="activity-time">2 minutes ago</span>
            </div>
            <button className="activity-action">Review</button>
          </div>

          <div className="activity-item">
            <div className="activity-icon success">✅</div>
            <div className="activity-content">
              <h4>Interview Scheduled</h4>
              <p>John Smith - Product Manager position</p>
              <span className="activity-time">15 minutes ago</span>
            </div>
            <button className="activity-action">View</button>
          </div>

          <div className="activity-item">
            <div className="activity-icon travel">✈️</div>
            <div className="activity-content">
              <h4>Travel Request Approved</h4>
              <p>Mumbai to Delhi - Candidate Interview</p>
              <span className="activity-time">1 hour ago</span>
            </div>
            <button className="activity-action">Details</button>
          </div>

          <div className="activity-item">
            <div className="activity-icon ai">🤖</div>
            <div className="activity-content">
              <h4>AI Match Found</h4>
              <p>3 candidates matched for DevOps Engineer role</p>
              <span className="activity-time">2 hours ago</span>
            </div>
            <button className="activity-action">Review Matches</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;