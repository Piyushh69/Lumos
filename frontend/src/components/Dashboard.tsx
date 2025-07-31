// import React, { useState, useEffect } from 'react';

// interface DashboardProps {
//   socket: WebSocket | null;
//   sendMessage: (message: string) => void;
//   isConnected: boolean;
// }

// interface DashboardStats {
//   totalCandidates: number;
//   activeJobs: number;
//   interviewsScheduled: number;
//   travelRequests: number;
//   matchingAccuracy: number;
//   avgTimeToHire: number;
// }

// interface ActivityItem {
//   id: number;
//   type: 'new' | 'success' | 'travel' | 'ai';
//   title: string;
//   description: string;
//   time: string;
//   action: string;
// }

// const Dashboard: React.FC<DashboardProps> = ({ socket, sendMessage, isConnected }) => {
//   const [stats, setStats] = useState<DashboardStats>({
//     totalCandidates: 0,
//     activeJobs: 0,
//     interviewsScheduled: 0,
//     travelRequests: 0,
//     matchingAccuracy: 0,
//     avgTimeToHire: 0
//   });

//   const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
//   const [aiInsights, setAiInsights] = useState('');

//   useEffect(() => {
//     // Simulate real-time data updates
//     const interval = setInterval(() => {
//       setStats(prev => ({
//         ...prev,
//         totalCandidates: 247 + Math.floor(Math.random() * 10),
//         activeJobs: 12,
//         interviewsScheduled: 8 + Math.floor(Math.random() * 3),
//         travelRequests: 3,
//         matchingAccuracy: 92 + Math.floor(Math.random() * 5),
//         avgTimeToHire: 14 + Math.floor(Math.random() * 7)
//       }));
//     }, 5000);

//     // Set initial activity data
//     setRecentActivity([
//       {
//         id: 1,
//         type: 'new',
//         title: 'New Resume Uploaded',
//         description: 'Sarah Johnson - Senior React Developer',
//         time: '2 minutes ago',
//         action: 'Review'
//       },
//       {
//         id: 2,
//         type: 'success',
//         title: 'Interview Scheduled',
//         description: 'John Smith - Product Manager position',
//         time: '15 minutes ago',
//         action: 'View'
//       },
//       // {
//       //   id: 3,
//       //   type: 'travel',
//       //   title: 'Travel Request Approved',
//       //   description: 'Mumbai to Delhi - Candidate Interview',
//       //   time: '1 hour ago',
//       //   action: 'Details'
//       // },
//       {
//         id: 4,
//         type: 'ai',
//         title: 'AI Match Found',
//         description: '3 candidates matched for DevOps Engineer role',
//         time: '2 hours ago',
//         action: 'Review Matches'
//       }
//     ]);

//     // Get AI insights
//     if (isConnected) {
//       sendMessage("Give me today's HR insights and recommendations");
//     }

//     return () => clearInterval(interval);
//   }, [isConnected, sendMessage]);

//   const quickActions = [
//     {
//       title: 'Generate Job Description',
//       description: 'Create AI-powered job descriptions',
//       icon: '✨',
//       action: 'job-generator',
//       color: 'blue'
//     },
//     {
//       title: 'Upload Resumes',
//       description: 'Bulk upload and analyze resumes',
//       icon: '📄',
//       action: 'resume-upload',
//       color: 'green'
//     },
//     {
//       title: 'Smart Candidate Matching',
//       description: 'AI-powered candidate ranking',
//       icon: '🎯',
//       action: 'candidate-matching',
//       color: 'purple'
//     },
//     {
//       title: 'Schedule Interviews',
//       description: 'Automated interview scheduling',
//       icon: '📅',
//       action: 'interview-scheduler',
//       color: 'orange'
//     },
//     // {
//     //   title: 'Search Flights',
//     //   description: 'Find best travel options',
//     //   icon: '✈️',
//     //   action: 'flight-search',
//     //   color: 'cyan'
//     // },
//     // {
//     //   title: 'Candidate Database',
//     //   description: 'Browse talent pool',
//     //   icon: '👥',
//     //   action: 'candidate-database',
//     //   color: 'pink'
//     // }
//   ];

//   return (
//     <div className="dashboard">
//       <div className="dashboard-header">
//         <h1>Welcome back! Here's your HR overview</h1>
//         <p>Real-time insights powered by AI</p>
//       </div>

//       {/* Key Metrics */}
//       <div className="metrics-grid">
//         <div className="metric-card primary">
//           <div className="metric-icon">👥</div>
//           <div className="metric-content">
//             <h3>{stats.totalCandidates}</h3>
//             <p>Total Candidates</p>
//             <span className="metric-change positive">+12 this week</span>
//           </div>
//         </div>

//         <div className="metric-card success">
//           <div className="metric-icon">💼</div>
//           <div className="metric-content">
//             <h3>{stats.activeJobs}</h3>
//             <p>Active Job Postings</p>
//             <span className="metric-change positive">+3 new</span>
//           </div>
//         </div>

//         <div className="metric-card warning">
//           <div className="metric-icon">📅</div>
//           <div className="metric-content">
//             <h3>{stats.interviewsScheduled}</h3>
//             <p>Interviews This Week</p>
//             <span className="metric-change positive">+5 scheduled</span>
//           </div>
//         </div>

//         <div className="metric-card info">
//           <div className="metric-icon">🎯</div>
//           <div className="metric-content">
//             <h3>{stats.matchingAccuracy}%</h3>
//             <p>AI Matching Accuracy</p>
//             <span className="metric-change positive">+2% improvement</span>
//           </div>
//         </div>

//         <div className="metric-card secondary">
//           <div className="metric-icon">⏱️</div>
//           <div className="metric-content">
//             <h3>{stats.avgTimeToHire}</h3>
//             <p>Avg. Time to Hire (days)</p>
//             <span className="metric-change negative">-3 days faster</span>
//           </div>
//         </div>

//         {/* <div className="metric-card travel">
//           <div className="metric-icon">✈️</div>
//           <div className="metric-content">
//             <h3>{stats.travelRequests}</h3>
//             <p>Pending Travel Requests</p>
//             <span className="metric-change neutral">2 approved</span>
//           </div>
//         </div> */}
//       </div>

//       {/* AI Insights Panel */}
//       <div className="insights-panel">
//         <h2>🤖 AI Insights & Recommendations</h2>
//         <div className="insight-card">
//           <h3>Today's Recommendations</h3>
//           <ul>
//             <li>📈 <strong>High-priority:</strong> Review 5 new candidates for Senior Developer role</li>
//             <li>⚡ <strong>Quick win:</strong> 3 candidates from talent pool match new Marketing position</li>
//             <li>📞 <strong>Follow-up:</strong> Schedule interviews for 2 pre-screened candidates</li>
//             <li>✈️ <strong>Travel:</strong> Book flights for candidate interviews - save 15% with advance booking</li>
//           </ul>
//         </div>
//       </div>

//       {/* Quick Actions Grid */}
//       <div className="quick-actions">
//         <h2 style={{marginBottom: '12px'}}>Quick Actions</h2>
//         <div className="actions-grid">
//           {quickActions.map((action, index) => (
//             <div key={index} className={`action-card ${action.color}`}>
//               <div className="action-icon">{action.icon}</div>
//               <div className="action-content">
//                 <h3>{action.title}</h3>
//                 <p>{action.description}</p>
//                 <button className="action-button">
//                   Get Started →
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Recent Activity */}
//       <div style = {{marginTop :'24px'}} className="activity-section">
//         <h2>Recent Activity</h2>
//         <div className="activity-feed">
//           {recentActivity.map((activity) => (
//             <div key={activity.id} className="activity-item">
//               <div className={`activity-icon ${activity.type}`}>
//                 {activity.type === 'new' && '📄'}
//                 {activity.type === 'success' && '✅'}
//                 {activity.type === 'travel' && '✈️'}
//                 {activity.type === 'ai' && '🤖'}
//               </div>
//               <div className="activity-content">
//                 <h4>{activity.title}</h4>
//                 <p>{activity.description}</p>
//                 <span className="activity-time">{activity.time}</span>
//               </div>
//               <button className="activity-action">{activity.action}</button>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  List,
  Avatar,
  Badge,
  Progress,
  Alert,
  Space,
  Typography,
  Spin,
  notification
} from 'antd';
import {
  UserOutlined,
  RiseOutlined,
  CalendarOutlined,
  AimOutlined,
  ClockCircleOutlined,
  RocketOutlined,
  FileTextOutlined,
  UploadOutlined,
  TeamOutlined,
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  TrophyOutlined,
  DatabaseOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface DashboardProps {
  socket: WebSocket | null;
  sendMessage: (message: string) => void;
  isConnected: boolean;
  messages?: any[];
}

interface DashboardStats {
  totalCandidates: number;
  activeJobs: number;
  interviewsScheduled: number;
  travelRequests: number;
  matchingAccuracy: number;
  avgTimeToHire: number;
  newResumesToday: number;
  completedInterviews: number;
  pendingReviews: number;
}

interface ActivityItem {
  id: string;
  type: 'new' | 'success' | 'travel' | 'ai' | 'interview' | 'review';
  title: string;
  description: string;
  time: string;
  action: string;
  actionRoute?: string;
  priority?: 'high' | 'medium' | 'low';
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  color: string;
  count?: number;
  disabled?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ socket, sendMessage, isConnected, messages }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalCandidates: 0,
    activeJobs: 0,
    interviewsScheduled: 0,
    travelRequests: 0,
    matchingAccuracy: 0,
    avgTimeToHire: 0,
    newResumesToday: 0,
    completedInterviews: 0,
    pendingReviews: 0
  });

  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Load real data from localStorage and simulate API calls
  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(() => {
      updateRealTimeStats();
      setLastUpdated(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Handle WebSocket messages for real-time updates
  useEffect(() => {
    if (messages && messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage.type === 'dashboard_insights') {
        handleAIInsights(latestMessage.content);
      }
    }
  }, [messages]);

  const loadDashboardData = async () => {
    setIsLoading(true);

    try {
      // Load saved job descriptions
      const savedJDs = JSON.parse(localStorage.getItem('saved_jds') || '[]');

      // Load saved resumes (you'll need to implement this)
      const savedResumes = JSON.parse(localStorage.getItem('saved_resumes') || '[]');

      // Load interviews (you'll need to implement this)
      const savedInterviews = JSON.parse(localStorage.getItem('saved_interviews') || '[]');

      // Calculate real stats
      const activeJobs = savedJDs.filter((jd: any) => jd.status === 'published').length;
      const draftJobs = savedJDs.filter((jd: any) => jd.status === 'draft').length;
      const todayDate = new Date().toDateString();
      const newResumesToday = savedResumes.filter((resume: any) =>
        new Date(resume.uploadDate).toDateString() === todayDate
      ).length;

      const upcomingInterviews = savedInterviews.filter((interview: any) =>
        new Date(interview.scheduledDate) > new Date()
      ).length;

      // Simulate some real-time data with localStorage persistence
      const baseStats = {
        totalCandidates: savedResumes.length + Math.floor(Math.random() * 50) + 200,
        activeJobs: activeJobs + draftJobs,
        interviewsScheduled: upcomingInterviews + Math.floor(Math.random() * 5) + 5,
        travelRequests: Math.floor(Math.random() * 3) + 1,
        matchingAccuracy: 88 + Math.floor(Math.random() * 10),
        avgTimeToHire: 12 + Math.floor(Math.random() * 8),
        newResumesToday: newResumesToday + Math.floor(Math.random() * 3),
        completedInterviews: Math.floor(Math.random() * 5) + 2,
        pendingReviews: Math.floor(Math.random() * 8) + 3
      };

      setStats(baseStats);
      generateRecentActivity(savedJDs, savedResumes, savedInterviews);
      generateAIInsights(baseStats);

      // Request AI insights if connected
      if (isConnected && socket) {
        sendMessage(JSON.stringify({
          type: 'dashboard_insights',
          data: {
            stats: baseStats,
            timestamp: new Date().toISOString()
          }
        }));
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      notification.error({
        message: 'Dashboard Load Error',
        description: 'Some dashboard data may not be current'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateRealTimeStats = () => {
    setStats(prev => ({
      ...prev,
      totalCandidates: prev.totalCandidates + Math.floor(Math.random() * 3),
      interviewsScheduled: prev.interviewsScheduled + Math.floor(Math.random() * 2),
      matchingAccuracy: Math.min(99, prev.matchingAccuracy + (Math.random() > 0.5 ? 1 : 0)),
      newResumesToday: prev.newResumesToday + Math.floor(Math.random() * 2)
    }));
  };

  const generateRecentActivity = (jobs: any[], resumes: any[], interviews: any[]) => {
    const activities: ActivityItem[] = [];

    // Recent job descriptions
    const recentJDs = jobs.slice(-3).reverse();
    recentJDs.forEach((jd, index) => {
      activities.push({
        id: `jd_${jd.id}`,
        type: jd.status === 'published' ? 'success' : 'new',
        title: jd.status === 'published' ? 'Job Published' : 'Job Description Created',
        description: `${jd.title} - ${jd.department}`,
        time: `${index + 1} hour${index !== 0 ? 's' : ''} ago`,
        action: 'View',
        actionRoute: '/job-generator',
        priority: jd.status === 'published' ? 'high' : 'medium'
      });
    });

    // Recent resumes
    const recentResumes = resumes.slice(-2).reverse();
    recentResumes.forEach((resume, index) => {
      activities.push({
        id: `resume_${resume.id}`,
        type: 'new',
        title: 'New Resume Uploaded',
        description: `${resume.name} - ${resume.position || 'Various Positions'}`,
        time: `${(index + 1) * 2} hours ago`,
        action: 'Review',
        actionRoute: '/resume-upload',
        priority: 'medium'
      });
    });

    // AI matching activities
    activities.push({
      id: 'ai_match_1',
      type: 'ai',
      title: 'AI Match Found',
      description: `${Math.floor(Math.random() * 5) + 2} candidates matched for latest positions`,
      time: '30 minutes ago',
      action: 'Review Matches',
      actionRoute: '/candidate-matching',
      priority: 'high'
    });

    // Recent interviews
    if (interviews.length > 0) {
      activities.push({
        id: 'interview_1',
        type: 'interview',
        title: 'Interview Completed',
        description: 'Senior Developer position - Positive feedback',
        time: '1 hour ago',
        action: 'View Feedback',
        actionRoute: '/interview-scheduler',
        priority: 'medium'
      });
    }

    setRecentActivity(activities.slice(0, 6));
  };

  const generateAIInsights = (currentStats: DashboardStats) => {
    const insights = [
      `Your matching accuracy of ${currentStats.matchingAccuracy}% is above industry average`,
      `${currentStats.newResumesToday} new resumes today - consider batch processing`,
      `Time to hire has ${currentStats.avgTimeToHire < 15 ? 'improved' : 'increased'} - currently ${currentStats.avgTimeToHire} days`,
      `${currentStats.pendingReviews} candidates need immediate review`,
      `AI suggests prioritizing ${Math.floor(Math.random() * 3) + 2} high-match candidates`,
    ];

    setAiInsights(insights);
  };

  const handleAIInsights = (content: string) => {
    try {
      const insights = content.split('\n').filter(line => line.trim());
      setAiInsights(insights.slice(0, 5));
    } catch (error) {
      console.error('Error processing AI insights:', error);
    }
  };

  const handleQuickAction = (route: string) => {
    navigate(route);
  };

  const handleActivityAction = (activity: ActivityItem) => {
    if (activity.actionRoute) {
      navigate(activity.actionRoute);
    }
  };

  const quickActions: QuickAction[] = [
    {
      title: 'Generate Job Description',
      description: 'Create AI-powered job descriptions',
      icon: <FileTextOutlined />,
      route: '/job-generator',
      color: 'blue',
      count: stats.activeJobs
    },
    {
      title: 'Upload Resumes',
      description: 'Bulk upload and analyze resumes',
      icon: <UploadOutlined />,
      route: '/resume-upload',
      color: 'green',
      count: stats.newResumesToday
    },
    {
      title: 'Smart Matching',
      description: 'AI-powered candidate ranking',
      icon: <AimOutlined />,
      route: '/candidate-matching',
      color: 'purple'
    },
    {
      title: 'Schedule Interviews',
      description: 'Automated interview scheduling',
      icon: <CalendarOutlined />,
      route: '/interview-scheduler',
      color: 'orange',
      count: stats.interviewsScheduled
    },
    {
      title: 'Candidate Database',
      description: 'Browse talent pool',
      icon: <DatabaseOutlined />,
      route: '/candidate-database',
      color: 'cyan',
      count: stats.totalCandidates
    },
    {
      title: 'Email Automation',
      description: 'Automated candidate communication',
      icon: <SearchOutlined />,
      route: '/email-automation',
      color: 'pink'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'new': return <PlusOutlined />;
      case 'success': return <TrophyOutlined />;
      case 'travel': return <RocketOutlined />;
      case 'ai': return <AimOutlined />;
      case 'interview': return <CalendarOutlined />;
      case 'review': return <EyeOutlined />;
      default: return <UserOutlined />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'new': return '#1890ff';
      case 'success': return '#52c41a';
      case 'travel': return '#722ed1';
      case 'ai': return '#eb2f96';
      case 'interview': return '#fa8c16';
      case 'review': return '#13c2c2';
      default: return '#666';
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard" style={{ padding: '24px', background: '#f0f2f5' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          Welcome back! Here's your HR overview
        </Title>
        <Text type="secondary">
          Real-time insights powered by AI • Last updated: {lastUpdated.toLocaleTimeString()}
          {/* {isConnected ? (
            <Badge status="success" style={{ marginLeft: 16 }} />
          ) : (
            <Badge status="error" style={{ marginLeft: 16 }} />
          )} */}
        </Text>
      </div>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <Card>
            <Statistic
              title="Total Candidates"
              value={stats.totalCandidates}
              prefix={<UserOutlined />}
              suffix={
                <Text type="success">
                  <ArrowUpOutlined /> +12
                </Text>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8} xl={4}>
          <Card>
            <Statistic
              title="Active Jobs"
              value={stats.activeJobs}
              prefix={<RiseOutlined />}
              suffix={
                <Text type="success">
                  <ArrowUpOutlined /> +3
                </Text>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8} xl={4}>
          <Card>
            <Statistic
              title="Interviews This Week"
              value={stats.interviewsScheduled}
              prefix={<CalendarOutlined />}
              suffix={
                <Text type="success">
                  <ArrowUpOutlined /> +5
                </Text>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8} xl={4}>
          <Card>
            <Statistic
              title="AI Accuracy"
              value={stats.matchingAccuracy}
              prefix={<AimOutlined />}
              suffix="%"
            />
            {/* <Progress 
              percent={stats.matchingAccuracy} 
              size="small" 
              strokeColor="#52c41a"
              showInfo={false}
            /> */}
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8} xl={4}>
          <Card>
            <Statistic
              title="Time to Hire"
              value={stats.avgTimeToHire}
              prefix={<ClockCircleOutlined />}
              suffix="days"
              valueStyle={{ color: stats.avgTimeToHire < 15 ? '#52c41a' : '#faad14' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8} xl={4}>
          <Card>
            <Statistic
              title="New Resumes Today"
              value={stats.newResumesToday}
              prefix={<FileTextOutlined />}
              suffix={
                <Text type="success">
                  <ArrowUpOutlined /> New
                </Text>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* AI Insights */}
      {/* <Card
        title={
          <Space>
            <AimOutlined />
            AI Insights & Recommendations
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Row gutter={16}>
          {aiInsights.map((insight, index) => (
            <Col xs={24} sm={12} lg={8} key={index}>
              <Alert
                message={insight}
                type={index === 0 ? 'success' : index === 1 ? 'info' : 'warning'}
                showIcon
                style={{ marginBottom: 8 }}
              />
            </Col>
          ))}
        </Row>
      </Card> */}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Card
              title={
                <Space>
                  <AimOutlined />
                  AI Insights & Recommendations
                </Space>
              }
              style={{ flex: 1 }}
            >
              {aiInsights.map((insight, index) => (
                <Alert
                  key={index}
                  message={insight}
                  type={index === 0 ? 'success' : index === 1 ? 'info' : 'warning'}
                  showIcon
                  style={{ marginBottom: 8 }}
                />
              ))}
            </Card>
          </div>
        </Col>

        <Col xs={24} lg={12}>
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Card title="Quick Actions" style={{ flex: 1 }}>
              <Row gutter={[16, 16]}>
                {quickActions.map((action, index) => (
                  <Col span={12} key={index}>
                    <Card
                      hoverable
                      onClick={() => handleQuickAction(action.route)}
                      style={{
                        height: '100%',
                        borderLeft: `4px solid ${action.color === 'blue'
                            ? '#1890ff'
                            : action.color === 'green'
                              ? '#52c41a'
                              : action.color === 'purple'
                                ? '#722ed1'
                                : action.color === 'orange'
                                  ? '#fa8c16'
                                  : action.color === 'cyan'
                                    ? '#13c2c2'
                                    : '#eb2f96'
                          }`,
                      }}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Space align="center">
                          {action.icon}
                          <Text strong>{action.title}</Text>
                          {action.count && (
                            <Badge count={action.count} style={{ marginLeft: 'auto' }} />
                          )}
                        </Space>
                        <Text type="secondary">{action.description}</Text>
                        <Button type="primary" size="small" block>
                          Get Started →
                        </Button>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </div>
        </Col>
      </Row>


      {/* Recent Activity */}
      <Card title="Recent Activity">
        <List
          itemLayout="horizontal"
          dataSource={recentActivity}
          renderItem={(activity) => (
            <List.Item
              actions={[
                <Button
                  type="link"
                  onClick={() => handleActivityAction(activity)}
                >
                  {activity.action}
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={getActivityIcon(activity.type)}
                    style={{ backgroundColor: getActivityColor(activity.type) }}
                  />
                }
                title={
                  <Space>
                    {activity.title}
                    {activity.priority === 'high' && (
                      <Badge status="error" text="High Priority" />
                    )}
                  </Space>
                }
                description={
                  <div>
                    <div>{activity.description}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {activity.time}
                    </Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
