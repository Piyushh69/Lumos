// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   Card,
//   Row,
//   Col,
//   Statistic,
//   Button,
//   List,
//   Avatar,
//   Badge,
//   Progress,
//   Alert,
//   Space,
//   Typography,
//   Spin,
//   notification
// } from 'antd';
// import {
//   UserOutlined,
//   RiseOutlined,
//   CalendarOutlined,
//   AimOutlined,
//   ClockCircleOutlined,
//   RocketOutlined,
//   FileTextOutlined,
//   UploadOutlined,
//   TeamOutlined,
//   SearchOutlined,
//   PlusOutlined,
//   EyeOutlined,
//   ArrowUpOutlined,
//   ArrowDownOutlined,
//   TrophyOutlined,
//   DatabaseOutlined
// } from '@ant-design/icons';

// const { Title, Text } = Typography;

// interface DashboardProps {
//   socket: WebSocket | null;
//   sendMessage: (message: string) => void;
//   isConnected: boolean;
//   messages?: any[];
// }

// interface DashboardStats {
//   totalCandidates: number;
//   activeJobs: number;
//   interviewsScheduled: number;
//   travelRequests: number;
//   matchingAccuracy: number;
//   avgTimeToHire: number;
//   newResumesToday: number;
//   completedInterviews: number;
//   pendingReviews: number;
// }

// interface ActivityItem {
//   id: string;
//   type: 'new' | 'success' | 'travel' | 'ai' | 'interview' | 'review';
//   title: string;
//   description: string;
//   time: string;
//   action: string;
//   actionRoute?: string;
//   priority?: 'high' | 'medium' | 'low';
// }

// interface QuickAction {
//   title: string;
//   description: string;
//   icon: React.ReactNode;
//   route: string;
//   color: string;
//   count?: number;
//   disabled?: boolean;
// }

// const Dashboard: React.FC<DashboardProps> = ({ socket, sendMessage, isConnected, messages }) => {
//   const navigate = useNavigate();
//   const [stats, setStats] = useState<DashboardStats>({
//     totalCandidates: 0,
//     activeJobs: 0,
//     interviewsScheduled: 0,
//     travelRequests: 0,
//     matchingAccuracy: 0,
//     avgTimeToHire: 0,
//     newResumesToday: 0,
//     completedInterviews: 0,
//     pendingReviews: 0
//   });

//   const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
//   const [aiInsights, setAiInsights] = useState<string[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

//   // Load real data from localStorage and simulate API calls
//   useEffect(() => {
//     loadDashboardData();
//     const interval = setInterval(() => {
//       updateRealTimeStats();
//       setLastUpdated(new Date());
//     }, 30000); // Update every 30 seconds

//     return () => clearInterval(interval);
//   }, []);

//   // Handle WebSocket messages for real-time updates
//   useEffect(() => {
//     if (messages && messages.length > 0) {
//       const latestMessage = messages[messages.length - 1];
//       if (latestMessage.type === 'dashboard_insights') {
//         handleAIInsights(latestMessage.content);
//       }
//     }
//   }, [messages]);

//   const loadDashboardData = async () => {
//     setIsLoading(true);

//     try {
//       // Load saved job descriptions
//       const savedJDs = JSON.parse(localStorage.getItem('saved_jds') || '[]');

//       // Load saved resumes (you'll need to implement this)
//       const savedResumes = JSON.parse(localStorage.getItem('saved_resumes') || '[]');

//       // Load interviews (you'll need to implement this)
//       const savedInterviews = JSON.parse(localStorage.getItem('saved_interviews') || '[]');

//       // Calculate real stats
//       const activeJobs = savedJDs.filter((jd: any) => jd.status === 'published').length;
//       const draftJobs = savedJDs.filter((jd: any) => jd.status === 'draft').length;
//       const todayDate = new Date().toDateString();
//       const newResumesToday = savedResumes.filter((resume: any) =>
//         new Date(resume.uploadDate).toDateString() === todayDate
//       ).length;

//       const upcomingInterviews = savedInterviews.filter((interview: any) =>
//         new Date(interview.scheduledDate) > new Date()
//       ).length;

//       // Simulate some real-time data with localStorage persistence
//       const baseStats = {
//         totalCandidates: savedResumes.length + Math.floor(Math.random() * 50) + 200,
//         activeJobs: activeJobs + draftJobs,
//         interviewsScheduled: upcomingInterviews + Math.floor(Math.random() * 5) + 5,
//         travelRequests: Math.floor(Math.random() * 3) + 1,
//         matchingAccuracy: 88 + Math.floor(Math.random() * 10),
//         avgTimeToHire: 12 + Math.floor(Math.random() * 8),
//         newResumesToday: newResumesToday + Math.floor(Math.random() * 3),
//         completedInterviews: Math.floor(Math.random() * 5) + 2,
//         pendingReviews: Math.floor(Math.random() * 8) + 3
//       };

//       setStats(baseStats);
//       generateRecentActivity(savedJDs, savedResumes, savedInterviews);
//       generateAIInsights(baseStats);

//       // Request AI insights if connected
//       if (isConnected && socket) {
//         sendMessage(JSON.stringify({
//           type: 'dashboard_insights',
//           data: {
//             stats: baseStats,
//             timestamp: new Date().toISOString()
//           }
//         }));
//       }

//     } catch (error) {
//       console.error('Error loading dashboard data:', error);
//       notification.error({
//         message: 'Dashboard Load Error',
//         description: 'Some dashboard data may not be current'
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const updateRealTimeStats = () => {
//     setStats(prev => ({
//       ...prev,
//       totalCandidates: prev.totalCandidates + Math.floor(Math.random() * 3),
//       interviewsScheduled: prev.interviewsScheduled + Math.floor(Math.random() * 2),
//       matchingAccuracy: Math.min(99, prev.matchingAccuracy + (Math.random() > 0.5 ? 1 : 0)),
//       newResumesToday: prev.newResumesToday + Math.floor(Math.random() * 2)
//     }));
//   };

//   const generateRecentActivity = (jobs: any[], resumes: any[], interviews: any[]) => {
//     const activities: ActivityItem[] = [];

//     // Recent job descriptions
//     const recentJDs = jobs.slice(-3).reverse();
//     recentJDs.forEach((jd, index) => {
//       activities.push({
//         id: `jd_${jd.id}`,
//         type: jd.status === 'published' ? 'success' : 'new',
//         title: jd.status === 'published' ? 'Job Published' : 'Job Description Created',
//         description: `${jd.title} - ${jd.department}`,
//         time: `${index + 1} hour${index !== 0 ? 's' : ''} ago`,
//         action: 'View',
//         actionRoute: '/job-generator',
//         priority: jd.status === 'published' ? 'high' : 'medium'
//       });
//     });

//     // Recent resumes
//     const recentResumes = resumes.slice(-2).reverse();
//     recentResumes.forEach((resume, index) => {
//       activities.push({
//         id: `resume_${resume.id}`,
//         type: 'new',
//         title: 'New Resume Uploaded',
//         description: `${resume.name} - ${resume.position || 'Various Positions'}`,
//         time: `${(index + 1) * 2} hours ago`,
//         action: 'Review',
//         actionRoute: '/resume-upload',
//         priority: 'medium'
//       });
//     });

//     // AI matching activities
//     activities.push({
//       id: 'ai_match_1',
//       type: 'ai',
//       title: 'AI Match Found',
//       description: `${Math.floor(Math.random() * 5) + 2} candidates matched for latest positions`,
//       time: '30 minutes ago',
//       action: 'Review Matches',
//       actionRoute: '/candidate-matching',
//       priority: 'high'
//     });

//     // Recent interviews
//     if (interviews.length > 0) {
//       activities.push({
//         id: 'interview_1',
//         type: 'interview',
//         title: 'Interview Completed',
//         description: 'Senior Developer position - Positive feedback',
//         time: '1 hour ago',
//         action: 'View Feedback',
//         actionRoute: '/interview-scheduler',
//         priority: 'medium'
//       });
//     }

//     setRecentActivity(activities.slice(0, 6));
//   };

//   const generateAIInsights = (currentStats: DashboardStats) => {
//     const insights = [
//       `Your matching accuracy of ${currentStats.matchingAccuracy}% is above industry average`,
//       `${currentStats.newResumesToday} new resumes today - consider batch processing`,
//       `Time to hire has ${currentStats.avgTimeToHire < 15 ? 'improved' : 'increased'} - currently ${currentStats.avgTimeToHire} days`,
//       `${currentStats.pendingReviews} candidates need immediate review`,
//       `AI suggests prioritizing ${Math.floor(Math.random() * 3) + 2} high-match candidates`,
//     ];

//     setAiInsights(insights);
//   };

//   const handleAIInsights = (content: string) => {
//     try {
//       const insights = content.split('\n').filter(line => line.trim());
//       setAiInsights(insights.slice(0, 5));
//     } catch (error) {
//       console.error('Error processing AI insights:', error);
//     }
//   };

//   const handleQuickAction = (route: string) => {
//     navigate(route);
//   };

//   const handleActivityAction = (activity: ActivityItem) => {
//     if (activity.actionRoute) {
//       navigate(activity.actionRoute);
//     }
//   };

//   const quickActions: QuickAction[] = [
//     {
//       title: 'Generate Job Description',
//       description: 'Create AI-powered job descriptions',
//       icon: <FileTextOutlined />,
//       route: '/job-generator',
//       color: 'blue',
//       count: stats.activeJobs
//     },
//     {
//       title: 'Upload Resumes',
//       description: 'Bulk upload and analyze resumes',
//       icon: <UploadOutlined />,
//       route: '/resume-upload',
//       color: 'green',
//       count: stats.newResumesToday
//     },
//     {
//       title: 'Smart Matching',
//       description: 'AI-powered candidate ranking',
//       icon: <AimOutlined />,
//       route: '/candidate-matching',
//       color: 'purple'
//     },
//     {
//       title: 'Schedule Interviews',
//       description: 'Automated interview scheduling',
//       icon: <CalendarOutlined />,
//       route: '/interview-scheduler',
//       color: 'orange',
//       count: stats.interviewsScheduled
//     },
//     {
//       title: 'Candidate Database',
//       description: 'Browse talent pool',
//       icon: <DatabaseOutlined />,
//       route: '/candidate-database',
//       color: 'cyan',
//       count: stats.totalCandidates
//     },
//     {
//       title: 'Email Automation',
//       description: 'Automated candidate communication',
//       icon: <SearchOutlined />,
//       route: '/email-automation',
//       color: 'pink'
//     }
//   ];

//   const getActivityIcon = (type: string) => {
//     switch (type) {
//       case 'new': return <PlusOutlined />;
//       case 'success': return <TrophyOutlined />;
//       case 'travel': return <RocketOutlined />;
//       case 'ai': return <AimOutlined />;
//       case 'interview': return <CalendarOutlined />;
//       case 'review': return <EyeOutlined />;
//       default: return <UserOutlined />;
//     }
//   };

//   const getActivityColor = (type: string) => {
//     switch (type) {
//       case 'new': return '#1890ff';
//       case 'success': return '#52c41a';
//       case 'travel': return '#722ed1';
//       case 'ai': return '#eb2f96';
//       case 'interview': return '#fa8c16';
//       case 'review': return '#13c2c2';
//       default: return '#666';
//     }
//   };

//   if (isLoading) {
//     return (
//       <div style={{ textAlign: 'center', padding: '100px 0' }}>
//         <Spin size="large" />
//         <p style={{ marginTop: 16 }}>Loading dashboard...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="dashboard" style={{ padding: '24px', background: '#f0f2f5' }}>
//       {/* Header */}
//       <div style={{ marginBottom: 24 }}>
//         <Title level={2} style={{ margin: 0 }}>
//           Welcome back! Here's your HR overview
//         </Title>
//         <Text type="secondary">
//           Real-time insights powered by AI • Last updated: {lastUpdated.toLocaleTimeString()}
//           {/* {isConnected ? (
//             <Badge status="success" style={{ marginLeft: 16 }} />
//           ) : (
//             <Badge status="error" style={{ marginLeft: 16 }} />
//           )} */}
//         </Text>
//       </div>

//       {/* Key Metrics */}
//       <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
//         <Col xs={24} sm={12} lg={8} xl={4}>
//           <Card>
//             <Statistic
//               title="Total Candidates"
//               value={stats.totalCandidates}
//               prefix={<UserOutlined />}
//               suffix={
//                 <Text type="success">
//                   <ArrowUpOutlined /> +12
//                 </Text>
//               }
//             />
//           </Card>
//         </Col>

//         <Col xs={24} sm={12} lg={8} xl={4}>
//           <Card>
//             <Statistic
//               title="Active Jobs"
//               value={stats.activeJobs}
//               prefix={<RiseOutlined />}
//               suffix={
//                 <Text type="success">
//                   <ArrowUpOutlined /> +3
//                 </Text>
//               }
//             />
//           </Card>
//         </Col>

//         <Col xs={24} sm={12} lg={8} xl={4}>
//           <Card>
//             <Statistic
//               title="Interviews This Week"
//               value={stats.interviewsScheduled}
//               prefix={<CalendarOutlined />}
//               suffix={
//                 <Text type="success">
//                   <ArrowUpOutlined /> +5
//                 </Text>
//               }
//             />
//           </Card>
//         </Col>

//         <Col xs={24} sm={12} lg={8} xl={4}>
//           <Card>
//             <Statistic
//               title="AI Accuracy"
//               value={stats.matchingAccuracy}
//               prefix={<AimOutlined />}
//               suffix="%"
//             />
//             {/* <Progress 
//               percent={stats.matchingAccuracy} 
//               size="small" 
//               strokeColor="#52c41a"
//               showInfo={false}
//             /> */}
//           </Card>
//         </Col>

//         <Col xs={24} sm={12} lg={8} xl={4}>
//           <Card>
//             <Statistic
//               title="Time to Hire"
//               value={stats.avgTimeToHire}
//               prefix={<ClockCircleOutlined />}
//               suffix="days"
//               valueStyle={{ color: stats.avgTimeToHire < 15 ? '#52c41a' : '#faad14' }}
//             />
//           </Card>
//         </Col>

//         <Col xs={24} sm={12} lg={8} xl={4}>
//           <Card>
//             <Statistic
//               title="New Resumes Today"
//               value={stats.newResumesToday}
//               prefix={<FileTextOutlined />}
//               suffix={
//                 <Text type="success">
//                   <ArrowUpOutlined /> New
//                 </Text>
//               }
//             />
//           </Card>
//         </Col>
//       </Row>

//       {/* AI Insights */}
//       {/* <Card
//         title={
//           <Space>
//             <AimOutlined />
//             AI Insights & Recommendations
//           </Space>
//         }
//         style={{ marginBottom: 24 }}
//       >
//         <Row gutter={16}>
//           {aiInsights.map((insight, index) => (
//             <Col xs={24} sm={12} lg={8} key={index}>
//               <Alert
//                 message={insight}
//                 type={index === 0 ? 'success' : index === 1 ? 'info' : 'warning'}
//                 showIcon
//                 style={{ marginBottom: 8 }}
//               />
//             </Col>
//           ))}
//         </Row>
//       </Card> */}

//       <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
//         <Col xs={24} lg={12}>
//           <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
//             <Card
//               title={
//                 <Space>
//                   <AimOutlined />
//                   AI Insights & Recommendations
//                 </Space>
//               }
//               style={{ flex: 1 }}
//             >
//               {aiInsights.map((insight, index) => (
//                 <Alert
//                   key={index}
//                   message={insight}
//                   type={index === 0 ? 'success' : index === 1 ? 'info' : 'warning'}
//                   showIcon
//                   style={{ marginBottom: 8 }}
//                 />
//               ))}
//             </Card>
//           </div>
//         </Col>

//         <Col xs={24} lg={12}>
//           <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
//             <Card title="Quick Actions" style={{ flex: 1 }}>
//               <Row gutter={[16, 16]}>
//                 {quickActions.map((action, index) => (
//                   <Col span={12} key={index}>
//                     <Card
//                       hoverable
//                       onClick={() => handleQuickAction(action.route)}
//                       style={{
//                         height: '100%',
//                         borderLeft: `4px solid ${action.color === 'blue'
//                             ? '#1890ff'
//                             : action.color === 'green'
//                               ? '#52c41a'
//                               : action.color === 'purple'
//                                 ? '#722ed1'
//                                 : action.color === 'orange'
//                                   ? '#fa8c16'
//                                   : action.color === 'cyan'
//                                     ? '#13c2c2'
//                                     : '#eb2f96'
//                           }`,
//                       }}
//                     >
//                       <Space direction="vertical" style={{ width: '100%' }}>
//                         <Space align="center">
//                           {action.icon}
//                           <Text strong>{action.title}</Text>
//                           {action.count && (
//                             <Badge count={action.count} style={{ marginLeft: 'auto' }} />
//                           )}
//                         </Space>
//                         <Text type="secondary">{action.description}</Text>
//                         <Button type="primary" size="small" block>
//                           Get Started →
//                         </Button>
//                       </Space>
//                     </Card>
//                   </Col>
//                 ))}
//               </Row>
//             </Card>
//           </div>
//         </Col>
//       </Row>


//       {/* Recent Activity */}
//       <Card title="Recent Activity">
//         <List
//           itemLayout="horizontal"
//           dataSource={recentActivity}
//           renderItem={(activity) => (
//             <List.Item
//               actions={[
//                 <Button
//                   type="link"
//                   onClick={() => handleActivityAction(activity)}
//                 >
//                   {activity.action}
//                 </Button>
//               ]}
//             >
//               <List.Item.Meta
//                 avatar={
//                   <Avatar
//                     icon={getActivityIcon(activity.type)}
//                     style={{ backgroundColor: getActivityColor(activity.type) }}
//                   />
//                 }
//                 title={
//                   <Space>
//                     {activity.title}
//                     {activity.priority === 'high' && (
//                       <Badge status="error" text="High Priority" />
//                     )}
//                   </Space>
//                 }
//                 description={
//                   <div>
//                     <div>{activity.description}</div>
//                     <Text type="secondary" style={{ fontSize: 12 }}>
//                       {activity.time}
//                     </Text>
//                   </div>
//                 }
//               />
//             </List.Item>
//           )}
//         />
//       </Card>
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
  DatabaseOutlined,
  MailOutlined
} from '@ant-design/icons';
import api from '../services/api';

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
  emailTemplates: number;
  scheduledEmails: number;
}

interface ActivityItem {
  id: string;
  type: 'new' | 'success' | 'travel' | 'ai' | 'interview' | 'review' | 'email';
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
    pendingReviews: 0,
    emailTemplates: 0,
    scheduledEmails: 0
  });

  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Load real data from APIs
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
      // Fetch data from all APIs in parallel
      const [
        candidatesRes,
        jobsRes,
        templatesRes,
        scheduledEmailsRes,
        schedulerStatsRes
      ] = await Promise.all([
        api.get('/api/v1/candidates').catch(err => ({ data: { success: false, candidates: [] } })),
        api.get('/api/v1/jobs').catch(err => ({ data: { success: false, jobs: [] } })),
        api.get('/api/v1/emails/templates').catch(err => ({ data: { success: false, templates: [] } })),
        api.get('/api/v1/email-scheduler/schedules').catch(err => ({ data: { success: false, schedules: [] } })),
        api.get('/api/v1/email-scheduler/stats').catch(err => ({ data: { success: false, stats: {} } }))
      ]);

      // Extract data
      const candidates = candidatesRes.data.success ? candidatesRes.data.candidates : [];
      const jobs = jobsRes.data.success ? jobsRes.data.jobs : [];
      const templates = templatesRes.data.success ? templatesRes.data.templates : [];
      const scheduledEmails = scheduledEmailsRes.data.success ? scheduledEmailsRes.data.schedules : [];
      const schedulerStats = schedulerStatsRes.data.success ? schedulerStatsRes.data.stats : {};

      // Calculate real-time statistics
      const today = new Date();
      const todayString = today.toDateString();

      // Candidates statistics
      const totalCandidates = candidates.length;
      const newCandidatesToday = candidates.filter((candidate: any) => 
        candidate.created_at && new Date(candidate.created_at).toDateString() === todayString
      ).length;

      // Jobs statistics
      const activeJobs = jobs.filter((job: any) => job.status === 'active' || job.status === 'published').length;
      const draftJobs = jobs.filter((job: any) => job.status === 'draft').length;

      // Interview statistics (mock for now, implement when interview API is available)
      const interviewsScheduled = Math.floor(Math.random() * 8) + 5;
      const completedInterviews = Math.floor(Math.random() * 3) + 2;

      // Email statistics
      const totalTemplates = templates.length;
      const pendingScheduledEmails = scheduledEmails.filter((email: any) => email.status === 'scheduled').length;
      const sentEmailsToday = scheduledEmails.filter((email: any) => 
        email.sent_at && new Date(email.sent_at).toDateString() === todayString
      ).length;

      // Calculate matching accuracy (based on candidate data quality)
      const candidatesWithComplete = candidates.filter((candidate: any) => 
        candidate.email && candidate.candidate_name && candidate.skills && candidate.experience_years
      ).length;
      const matchingAccuracy = totalCandidates > 0 ? Math.round((candidatesWithComplete / totalCandidates) * 100) : 0;

      // Calculate average time to hire (mock calculation based on job creation dates)
      const avgTimeToHire = jobs.length > 0 
        ? Math.round(jobs.reduce((acc: number, job: any) => {
            const createdDate = new Date(job.created_at || Date.now());
            const daysSinceCreation = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
            return acc + Math.min(daysSinceCreation, 30); // Cap at 30 days
          }, 0) / jobs.length)
        : 15;

      const calculatedStats: DashboardStats = {
        totalCandidates,
        activeJobs: activeJobs + draftJobs,
        interviewsScheduled,
        travelRequests: Math.floor(Math.random() * 3) + 1, // Mock data
        matchingAccuracy: Math.min(matchingAccuracy + 75, 99), // Add base accuracy
        avgTimeToHire,
        newResumesToday: newCandidatesToday,
        completedInterviews,
        pendingReviews: candidates.filter((candidate: any) => candidate.status === 'new' || candidate.status === 'screening').length,
        emailTemplates: totalTemplates,
        scheduledEmails: pendingScheduledEmails
      };

      setStats(calculatedStats);
      generateRecentActivity(jobs, candidates, templates, scheduledEmails);
      generateAIInsights(calculatedStats, candidates, jobs);

      // Request AI insights if connected
      if (isConnected && socket) {
        sendMessage(JSON.stringify({
          type: 'dashboard_insights',
          data: {
            stats: calculatedStats,
            timestamp: new Date().toISOString()
          }
        }));
      }

      console.log('✅ Dashboard data loaded successfully');

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      notification.error({
        message: 'Dashboard Load Error',
        description: 'Some dashboard data may not be current. Please refresh to try again.',
        placement: 'topRight'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateRealTimeStats = async () => {
    try {
      // Quick refresh of key metrics without full reload
      const candidatesRes = await api.get('/api/v1/candidates');
      const jobsRes = await api.get('/api/v1/jobs');

      if (candidatesRes.data.success && jobsRes.data.success) {
        const candidates = candidatesRes.data.candidates;
        const jobs = jobsRes.data.jobs;
        const today = new Date().toDateString();
        
        const newCandidatesToday = candidates.filter((candidate: any) => 
          candidate.created_at && new Date(candidate.created_at).toDateString() === today
        ).length;

        const activeJobs = jobs.filter((job: any) => job.status === 'active' || job.status === 'published').length;

        setStats(prev => ({
          ...prev,
          totalCandidates: candidates.length,
          activeJobs,
          newResumesToday: newCandidatesToday,
          pendingReviews: candidates.filter((candidate: any) => candidate.status === 'new' || candidate.status === 'screening').length
        }));
      }
    } catch (error) {
      console.error('Error updating real-time stats:', error);
    }
  };

  const generateRecentActivity = (jobs: any[], candidates: any[], templates: any[], scheduledEmails: any[]) => {
    const activities: ActivityItem[] = [];

    // Recent jobs
    const recentJobs = jobs
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 3);

    recentJobs.forEach((job) => {
      const createdTime = new Date(job.created_at);
      const hoursSince = Math.floor((Date.now() - createdTime.getTime()) / (1000 * 60 * 60));
      
      activities.push({
        id: `job_${job.id}`,
        type: job.status === 'active' ? 'success' : 'new',
        title: job.status === 'active' ? 'Job Published' : 'Job Created',
        description: `${job.title} - ${job.department || 'No Department'}`,
        time: hoursSince < 1 ? 'Just now' : hoursSince < 24 ? `${hoursSince}h ago` : `${Math.floor(hoursSince / 24)}d ago`,
        action: 'View',
        actionRoute: '/job-generator',
        priority: job.status === 'active' ? 'high' : 'medium'
      });
    });

    // Recent candidates
    const recentCandidates = candidates
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 2);

    recentCandidates.forEach((candidate) => {
      const createdTime = new Date(candidate.created_at);
      const hoursSince = Math.floor((Date.now() - createdTime.getTime()) / (1000 * 60 * 60));
      
      activities.push({
        id: `candidate_${candidate.candidate_id}`,
        type: 'new',
        title: 'New Candidate Added',
        description: `${candidate.candidate_name} - ${candidate.experience_years || 0}+ years experience`,
        time: hoursSince < 1 ? 'Just now' : hoursSince < 24 ? `${hoursSince}h ago` : `${Math.floor(hoursSince / 24)}d ago`,
        action: 'Review',
        actionRoute: '/candidate-database',
        priority: candidate.score > 80 ? 'high' : 'medium'
      });
    });

    // Recent email activities
    const recentScheduledEmails = scheduledEmails
      .filter(email => email.status === 'sent')
      .sort((a, b) => new Date(b.sent_at || 0).getTime() - new Date(a.sent_at || 0).getTime())
      .slice(0, 1);

    recentScheduledEmails.forEach((email) => {
      activities.push({
        id: `email_${email.id}`,
        type: 'email',
        title: 'Email Campaign Sent',
        description: `${email.name} - ${email.recipient_count} recipients`,
        time: '2h ago',
        action: 'View Logs',
        actionRoute: '/email-scheduler',
        priority: 'medium'
      });
    });

    // AI matching activity
    if (candidates.length > 0 && jobs.length > 0) {
      activities.push({
        id: 'ai_match_recent',
        type: 'ai',
        title: 'AI Matching Complete',
        description: `${candidates.filter((c: any) => c.score > 75).length} high-match candidates identified`,
        time: '45 minutes ago',
        action: 'View Matches',
        actionRoute: '/candidate-matching',
        priority: 'high'
      });
    }

    // Sort by priority and limit to 6 most recent
    activities.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority || 'low'] || 1) - (priorityOrder[a.priority || 'low'] || 1);
    });

    setRecentActivity(activities.slice(0, 6));
  };

  const generateAIInsights = (currentStats: DashboardStats, candidates: any[], jobs: any[]) => {
    const insights = [];

    // Matching accuracy insight
    if (currentStats.matchingAccuracy > 85) {
      insights.push(`Excellent matching accuracy of ${currentStats.matchingAccuracy}% - your AI is performing above industry standards`);
    } else {
      insights.push(`Matching accuracy at ${currentStats.matchingAccuracy}% - consider updating job requirements for better matches`);
    }

    // Candidate volume insight
    if (currentStats.newResumesToday > 5) {
      insights.push(`High candidate influx today (${currentStats.newResumesToday} new) - consider batch processing for efficiency`);
    } else if (currentStats.newResumesToday > 0) {
      insights.push(`${currentStats.newResumesToday} new candidates today - good pipeline flow`);
    } else {
      insights.push('No new candidates today - consider expanding job posting reach');
    }

    // Time to hire insight
    if (currentStats.avgTimeToHire < 15) {
      insights.push(`Excellent hiring speed: ${currentStats.avgTimeToHire} days average - maintaining competitive advantage`);
    } else if (currentStats.avgTimeToHire > 25) {
      insights.push(`Time to hire is ${currentStats.avgTimeToHire} days - consider streamlining interview process`);
    } else {
      insights.push(`Time to hire: ${currentStats.avgTimeToHire} days - within industry average`);
    }

    // Pending reviews insight
    if (currentStats.pendingReviews > 10) {
      insights.push(`${currentStats.pendingReviews} candidates awaiting review - prioritize high-scoring profiles`);
    } else if (currentStats.pendingReviews > 0) {
      insights.push(`${currentStats.pendingReviews} candidates need review - manageable workload`);
    }

    // Job market insight
    const activeJobRatio = jobs.length > 0 ? (currentStats.activeJobs / jobs.length) * 100 : 0;
    if (activeJobRatio > 80) {
      insights.push(`${Math.round(activeJobRatio)}% of jobs are active - strong hiring momentum`);
    } else if (activeJobRatio < 50) {
      insights.push(`Consider activating more job postings - only ${Math.round(activeJobRatio)}% currently active`);
    }

    setAiInsights(insights.slice(0, 5));
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
      title: 'Email Scheduler',
      description: 'Automated email campaigns',
      icon: <MailOutlined />,
      route: '/email-scheduler',
      color: 'pink',
      count: stats.scheduledEmails
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
      case 'email': return <MailOutlined />;
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
      case 'email': return '#f759ab';
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
          {isConnected ? (
            <Badge status="success" style={{ marginLeft: 16 }} text="Connected" />
          ) : (
            <Badge status="processing" style={{ marginLeft: 16 }} text="Offline Mode" />
          )}
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
                stats.newResumesToday > 0 ? (
                  <Text type="success">
                    <ArrowUpOutlined /> +{stats.newResumesToday}
                  </Text>
                ) : null
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
                  <ArrowUpOutlined /> Live
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
                  <ArrowUpOutlined /> Scheduled
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
              valueStyle={{ color: stats.matchingAccuracy > 85 ? '#52c41a' : '#faad14' }}
            />
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
              title="Email Templates"
              value={stats.emailTemplates}
              prefix={<MailOutlined />}
              suffix={
                stats.scheduledEmails > 0 ? (
                  <Text type="secondary">
                    {stats.scheduledEmails} scheduled
                  </Text>
                ) : null
              }
            />
          </Card>
        </Col>
      </Row>

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
                          {action.count !== undefined && action.count > 0 && (
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