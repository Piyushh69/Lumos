// import React, { useState, useEffect } from 'react';
// import {
//     Card, Table, Button, Space, Tag, Modal, Form, Input, Select, DatePicker,
//     TimePicker, Switch, Row, Col, Tabs, Statistic, Progress, Badge, Tooltip,
//     message, notification, Alert, List, Typography, Divider, Popconfirm,
//     Checkbox, InputNumber, Radio, Steps, Spin, Empty
// } from 'antd';
// import {
//     ScheduleOutlined, SendOutlined, ClockCircleOutlined, MailOutlined,
//     UserOutlined, TeamOutlined, CalendarOutlined, DeleteOutlined,
//     EyeOutlined, PlusOutlined, ReloadOutlined, ExclamationCircleOutlined,
//     CheckCircleOutlined, WarningOutlined, StopOutlined, PlayCircleOutlined,
//     BarChartOutlined, FileTextOutlined, BellOutlined
// } from '@ant-design/icons';
// import { format, parseISO } from 'date-fns';
// import { startOfDay, isBefore } from 'date-fns';
// import api from '../services/api';

// const { Option } = Select;
// const { TextArea } = Input;
// const { Title, Text, Paragraph } = Typography;
// const { TabPane } = Tabs;
// const { RangePicker } = DatePicker;
// const { Step } = Steps;

// interface EmailSchedulerProps {
//     socket?: WebSocket | null;
//     sendMessage?: (message: string) => void;
//     isConnected?: boolean;
// }

// interface ScheduledEmail {
//     id: number;
//     name: string;
//     category: string;
//     template_name: string;
//     scheduled_at: string;
//     status: string;
//     priority: string;
//     recipient_count: number;
//     sent_count: number;
//     failed_count: number;
//     is_recurring: boolean;
//     created_at: string;
//     sent_at?: string;
// }

// interface EmailTemplate {
//     id: number;
//     name: string;
//     category: string;
//     subject: string;
//     variables: string[];
// }

// interface DeliveryLog {
//     id: number;
//     recipient_email: string;
//     recipient_name: string;
//     status: string;
//     sent_at?: string;
//     opened_at?: string;
//     clicked_at?: string;
//     error_message?: string;
// }

// const EmailScheduler: React.FC<EmailSchedulerProps> = ({ socket, sendMessage, isConnected }) => {
//     // State Management
//     const [loading, setLoading] = useState(false);
//     const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
//     const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
//     const [candidates, setCandidates] = useState<any[]>([]);
//     const [jobs, setJobs] = useState<any[]>([]);
//     const [statistics, setStatistics] = useState<any>({});

//     // Modal States
//     const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
//     const [logsModalVisible, setLogsModalVisible] = useState(false);
//     const [selectedSchedule, setSelectedSchedule] = useState<ScheduledEmail | null>(null);
//     const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>([]);

//     // Form and UI States
//     const [form] = Form.useForm();
//     const [currentStep, setCurrentStep] = useState(0);
//     const [selectedCategory, setSelectedCategory] = useState<string>('');
//     const [selectedRecipients, setSelectedRecipients] = useState<any[]>([]);
//     const [activeTab, setActiveTab] = useState('scheduled');

//     // Filters
//     const [categoryFilter, setCategoryFilter] = useState<string>('');
//     const [statusFilter, setStatusFilter] = useState<string>('');

//     useEffect(() => {
//         loadData();
//     }, []);

//     useEffect(() => {
//         if (categoryFilter || statusFilter) {
//             loadScheduledEmails();
//         }
//     }, [categoryFilter, statusFilter]);

//     const loadData = async () => {
//         setLoading(true);
//         try {
//             await Promise.all([
//                 loadScheduledEmails(),
//                 loadEmailTemplates(),
//                 loadCandidates(),
//                 loadJobs(),
//                 loadStatistics()
//             ]);
//         } catch (error) {
//             message.error('Failed to load data');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const loadScheduledEmails = async () => {
//         try {
//             const response = await api.get('/api/v1/email-scheduler/schedules', {
//                 params: {
//                     category: categoryFilter || undefined,
//                     status: statusFilter || undefined
//                 }
//             });
//             if (response.data.success) {
//                 setScheduledEmails(response.data.schedules || []);
//             }
//         } catch (error) {
//             console.error('Failed to load scheduled emails:', error);
//         }
//     };

//     const loadEmailTemplates = async () => {
//         try {
//             const response = await api.get('/api/v1/emails/templates');
//             if (response.data.success) {
//                 setEmailTemplates(response.data.templates || []);
//             }
//         } catch (error) {
//             console.error('Failed to load email templates:', error);
//         }
//     };

//     const loadCandidates = async () => {
//         try {
//             const response = await api.get('/api/v1/candidates');
//             if (response.data.success) {
//                 setCandidates(response.data.candidates || []);
//             }
//         } catch (error) {
//             console.error('Failed to load candidates:', error);
//         }
//     };

//     const loadJobs = async () => {
//         try {
//             const response = await api.get('/api/v1/jobs');
//             if (response.data.success) {
//                 setJobs(response.data.jobs || []);
//             }
//         } catch (error) {
//             console.error('Failed to load jobs:', error);
//         }
//     };

//     const loadStatistics = async () => {
//         try {
//             const response = await api.get('/api/v1/email-scheduler/stats');
//             if (response.data.success) {
//                 setStatistics(response.data.stats || {});
//             }
//         } catch (error) {
//             console.error('Failed to load statistics:', error);
//         }
//     };

//     const handleScheduleEmail = async (values: any) => {
//         try {
//             setLoading(true);

//             // Prepare schedule data
//             const scheduleData = {
//                 name: values.name,
//                 template_id: values.template_id,
//                 category: values.category,
//                 scheduled_at: values.scheduled_datetime.toISOString(),
//                 priority: values.priority || 'medium',
//                 recipients: selectedRecipients,
//                 subject_override: values.subject_override,
//                 variables: values.variables || {},
//                 is_recurring: values.is_recurring || false,
//                 recurrence_pattern: values.is_recurring ? {
//                     hour: values.recurrence_time?.hour() || 9,
//                     minute: values.recurrence_time?.minute() || 0,
//                     day_of_week: values.recurrence_days,
//                     day: values.recurrence_day
//                 } : null,
//                 timezone: values.timezone || 'Asia/Kolkata',
//                 created_by: 1
//             };

//             const response = await api.post('/api/v1/email-scheduler/schedule', scheduleData);

//             if (response.data.success) {
//                 notification.success({
//                     message: 'Email Scheduled',
//                     description: response.data.message,
//                     placement: 'topRight'
//                 });

//                 setScheduleModalVisible(false);
//                 form.resetFields();
//                 setCurrentStep(0);
//                 setSelectedRecipients([]);
//                 await loadScheduledEmails();
//             } else {
//                 message.error(response.data.error || 'Failed to schedule email');
//             }

//         } catch (error) {
//             console.error('Schedule email error:', error);
//             message.error('Failed to schedule email');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleCancelSchedule = async (scheduleId: number) => {
//         try {
//             const response = await api.delete(`/api/v1/email-scheduler/schedules/${scheduleId}`);

//             if (response.data.success) {
//                 message.success('Email schedule cancelled');
//                 await loadScheduledEmails();
//             } else {
//                 message.error(response.data.error || 'Failed to cancel schedule');
//             }
//         } catch (error) {
//             message.error('Failed to cancel schedule');
//         }
//     };

//     const viewDeliveryLogs = async (schedule: ScheduledEmail) => {
//         try {
//             setSelectedSchedule(schedule);
//             setLoading(true);

//             const response = await api.get(`/api/v1/email-scheduler/schedules/${schedule.id}/logs`);

//             if (response.data.success) {
//                 setDeliveryLogs(response.data.logs || []);
//                 setLogsModalVisible(true);
//             } else {
//                 message.error('Failed to load delivery logs');
//             }
//         } catch (error) {
//             message.error('Failed to load delivery logs');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const getRecipientsByCategory = (category: string, additionalFilters: any = {}) => {
//         let recipients: any[] = [];

//         switch (category) {
//             case 'interview':
//             case 'test':
//                 recipients = candidates
//                     .filter(candidate => {
//                         if (additionalFilters.job_id) {
//                             // Filter by job applications if needed
//                             return true; // Implement job filtering logic
//                         }
//                         if (additionalFilters.status) {
//                             return additionalFilters.status.includes(candidate.status);
//                         }
//                         return candidate.email && candidate.status === 'shortlisted';
//                     })
//                     .map(candidate => ({
//                         email: candidate.email,
//                         name: candidate.candidate_name,
//                         candidate_id: candidate.candidate_id,
//                         phone: candidate.phone
//                     }));
//                 break;

//             case 'bulk':
//                 recipients = candidates
//                     .filter(candidate => candidate.email)
//                     .map(candidate => ({
//                         email: candidate.email,
//                         name: candidate.candidate_name,
//                         candidate_id: candidate.candidate_id
//                     }));
//                 break;

//             default:
//                 recipients = [];
//         }

//         return recipients;
//     };

//     // Table columns
//     const columns = [
//         {
//             title: 'Schedule Name',
//             dataIndex: 'name',
//             key: 'name',
//             render: (text: string, record: ScheduledEmail) => (
//                 <div>
//                     <Text strong>{text}</Text>
//                     <div style={{ fontSize: '12px', color: '#666' }}>
//                         Template: {record.template_name}
//                     </div>
//                 </div>
//             )
//         },
//         {
//             title: 'Category',
//             dataIndex: 'category',
//             key: 'category',
//             render: (category: string) => {
//                 const colors = {
//                     interview: 'blue',
//                     test: 'green',
//                     bulk: 'purple',
//                     follow_up: 'orange',
//                     onboarding: 'cyan'
//                 };
//                 return <Tag color={colors[category as keyof typeof colors] || 'default'}>{category}</Tag>;
//             }
//         },
//         {
//             title: 'Scheduled Time',
//             dataIndex: 'scheduled_at',
//             key: 'scheduled_at',
//             render: (time: string, record: ScheduledEmail) => (
//                 <div>
//                     {/* <div>{moment(time).format('MMM DD, YYYY')}</div> */}
//                     <div>{format(new Date(time), 'MMM dd, yyyy')}</div>
//                     <div style={{ fontSize: '12px', color: '#666' }}>
//                         {format(new Date(time), 'HH:mm')}
//                         {record.is_recurring && <Tag color="blue">Recurring</Tag>}
//                     </div>
//                 </div>
//             )
//         },
//         {
//             title: 'Status',
//             dataIndex: 'status',
//             key: 'status',
//             render: (status: string) => {
//                 const statusConfig = {
//                     scheduled: { color: 'blue', icon: <ClockCircleOutlined /> },
//                     sending: { color: 'orange', icon: <SendOutlined /> },
//                     sent: { color: 'green', icon: <CheckCircleOutlined /> },
//                     partial: { color: 'yellow', icon: <WarningOutlined /> },
//                     failed: { color: 'red', icon: <ExclamationCircleOutlined /> },
//                     cancelled: { color: 'default', icon: <StopOutlined /> }
//                 };

//                 const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;

//                 return (
//                     <Tag color={config.color} icon={config.icon}>
//                         {status.toUpperCase()}
//                     </Tag>
//                 );
//             }
//         },
//         {
//             title: 'Recipients',
//             key: 'recipients',
//             render: (record: ScheduledEmail) => (
//                 <div>
//                     <div>Total: {record.recipient_count}</div>
//                     {record.sent_count > 0 && (
//                         <div style={{ fontSize: '12px', color: '#52c41a' }}>
//                             Sent: {record.sent_count}
//                         </div>
//                     )}
//                     {record.failed_count > 0 && (
//                         <div style={{ fontSize: '12px', color: '#ff4d4f' }}>
//                             Failed: {record.failed_count}
//                         </div>
//                     )}
//                 </div>
//             )
//         },
//         {
//             title: 'Priority',
//             dataIndex: 'priority',
//             key: 'priority',
//             render: (priority: string) => {
//                 const colors = {
//                     low: 'default',
//                     medium: 'blue',
//                     high: 'orange',
//                     urgent: 'red'
//                 };
//                 return <Tag color={colors[priority as keyof typeof colors]}>{priority}</Tag>;
//             }
//         },
//         {
//             title: 'Actions',
//             key: 'actions',
//             render: (record: ScheduledEmail) => (
//                 <Space>
//                     <Tooltip title="View Delivery Logs">
//                         <Button
//                             size="small"
//                             icon={<EyeOutlined />}
//                             onClick={() => viewDeliveryLogs(record)}
//                         />
//                     </Tooltip>

//                     {record.status === 'scheduled' && (
//                         <Popconfirm
//                             title="Are you sure you want to cancel this schedule?"
//                             onConfirm={() => handleCancelSchedule(record.id)}
//                             okText="Yes"
//                             cancelText="No"
//                         >
//                             <Tooltip title="Cancel Schedule">
//                                 <Button
//                                     size="small"
//                                     icon={<StopOutlined />}
//                                     danger
//                                 />
//                             </Tooltip>
//                         </Popconfirm>
//                     )}
//                 </Space>
//             )
//         }
//     ];

//     // Schedule Email Modal Steps
//     const renderStepContent = () => {
//         switch (currentStep) {
//             case 0:
//                 return (
//                     <div>
//                         <Row gutter={16}>
//                             <Col span={12}>
//                                 <Form.Item
//                                     name="name"
//                                     label="Schedule Name"
//                                     rules={[{ required: true, message: 'Please enter schedule name' }]}
//                                 >
//                                     <Input placeholder="e.g., Weekly Interview Invitations" />
//                                 </Form.Item>
//                             </Col>
//                             <Col span={12}>
//                                 <Form.Item
//                                     name="category"
//                                     label="Category"
//                                     rules={[{ required: true, message: 'Please select category' }]}
//                                 >
//                                     <Select
//                                         placeholder="Select category"
//                                         onChange={(value) => setSelectedCategory(value)}
//                                     >
//                                         <Option value="interview">Interview Scheduler</Option>
//                                         <Option value="test">Test Scheduler</Option>
//                                         <Option value="bulk">Bulk Send</Option>
//                                         <Option value="follow_up">Follow-up</Option>
//                                         <Option value="onboarding">Onboarding</Option>
//                                     </Select>
//                                 </Form.Item>
//                             </Col>
//                         </Row>

//                         <Row gutter={16}>
//                             <Col span={12}>
//                                 <Form.Item
//                                     name="template_id"
//                                     label="Email Template"
//                                     rules={[{ required: true, message: 'Please select template' }]}
//                                 >
//                                     <Select placeholder="Select email template">
//                                         {emailTemplates
//                                             .filter(template => !selectedCategory || template.category === selectedCategory)
//                                             .map(template => (
//                                                 <Option key={template.id} value={template.id}>
//                                                     {template.name}
//                                                 </Option>
//                                             ))}
//                                     </Select>
//                                 </Form.Item>
//                             </Col>
//                             <Col span={12}>
//                                 <Form.Item
//                                     name="priority"
//                                     label="Priority"
//                                     initialValue="medium"
//                                 >
//                                     <Select>
//                                         <Option value="low">Low</Option>
//                                         <Option value="medium">Medium</Option>
//                                         <Option value="high">High</Option>
//                                         <Option value="urgent">Urgent</Option>
//                                     </Select>
//                                 </Form.Item>
//                             </Col>
//                         </Row>
//                     </div>
//                 );

//             case 1:
//                 return (
//                     <div>
//                         <Title level={5}>Select Recipients</Title>

//                         {selectedCategory === 'interview' && (
//                             <div>
//                                 <Form.Item name="job_filter" label="Filter by Job">
//                                     <Select placeholder="Select job (optional)">
//                                         {jobs.map(job => (
//                                             <Option key={job.id} value={job.id}>{job.title}</Option>
//                                         ))}
//                                     </Select>
//                                 </Form.Item>

//                                 <Form.Item name="status_filter" label="Candidate Status">
//                                     <Select
//                                         mode="multiple"
//                                         placeholder="Select candidate status"
//                                         defaultValue={['shortlisted']}
//                                     >
//                                         <Option value="new">New</Option>
//                                         <Option value="screening">Screening</Option>
//                                         <Option value="shortlisted">Shortlisted</Option>
//                                         <Option value="interviewed">Interviewed</Option>
//                                     </Select>
//                                 </Form.Item>
//                             </div>
//                         )}

//                         {selectedCategory === 'bulk' && (
//                             <div>
//                                 <Radio.Group onChange={(e) => {
//                                     const recipients = e.target.value === 'all'
//                                         ? getRecipientsByCategory('bulk')
//                                         : [];
//                                     setSelectedRecipients(recipients);
//                                 }}>
//                                     <Radio value="all">All Candidates</Radio>
//                                     <Radio value="custom">Custom Selection</Radio>
//                                 </Radio.Group>
//                             </div>
//                         )}

//                         <Divider />

//                         <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
//                             <Text strong>Recipients Preview ({selectedRecipients.length} selected)</Text>
//                             <List
//                                 size="small"
//                                 dataSource={selectedRecipients.slice(0, 10)}
//                                 renderItem={recipient => (
//                                     <List.Item>
//                                         <Space>
//                                             <UserOutlined />
//                                             <div>
//                                                 <div>{recipient.name || 'No Name'}</div>
//                                                 <Text type="secondary" style={{ fontSize: '12px' }}>
//                                                     {recipient.email}
//                                                 </Text>
//                                             </div>
//                                         </Space>
//                                     </List.Item>
//                                 )}
//                             />
//                             {selectedRecipients.length > 10 && (
//                                 <Text type="secondary">... and {selectedRecipients.length - 10} more</Text>
//                             )}
//                         </div>
//                     </div>
//                 );

//             case 2:
//                 return (
//                     <div>
//                         <Row gutter={16}>
//                             <Col span={12}>
//                                 <Form.Item
//                                     name="scheduled_datetime"
//                                     label="Schedule Date & Time"
//                                     rules={[{ required: true, message: 'Please select date and time' }]}
//                                 >
//                                     <DatePicker
//                                         showTime
//                                         style={{ width: '100%' }}
//                                         format="YYYY-MM-DD HH:mm"
//                                         disabledDate={(current) =>
//                                             current && isBefore(current.toDate(), startOfDay(new Date()))
//                                         }

//                                     />
//                                 </Form.Item>
//                             </Col>
//                             <Col span={12}>
//                                 <Form.Item name="timezone" label="Timezone" initialValue="Asia/Kolkata">
//                                     <Select>
//                                         <Option value="Asia/Kolkata">Asia/Kolkata (IST)</Option>
//                                         <Option value="UTC">UTC</Option>
//                                         <Option value="America/New_York">America/New_York (EST)</Option>
//                                     </Select>
//                                 </Form.Item>
//                             </Col>
//                         </Row>

//                         <Form.Item name="is_recurring" valuePropName="checked">
//                             <Checkbox>Make this a recurring email</Checkbox>
//                         </Form.Item>

//                         <Form.Item name="subject_override" label="Subject Override (Optional)">
//                             <Input placeholder="Override template subject" />
//                         </Form.Item>

//                         <Form.Item name="variables" label="Template Variables (JSON)">
//                             <TextArea
//                                 rows={4}
//                                 placeholder='{"company_name": "Navikenz", "event_date": "Aug 5th"}'
//                             />
//                         </Form.Item>
//                     </div>
//                 );

//             default:
//                 return null;
//         }
//     };

//     return (
//         <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
//             {/* Header */}
//             <div style={{ marginBottom: 24 }}>
//                 <Title level={2}>
//                     <ScheduleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
//                     Email Scheduler
//                 </Title>
//                 <Paragraph>
//                     Schedule and manage automated email campaigns for interviews, tests, and bulk communications.
//                 </Paragraph>
//             </div>

//             {/* Statistics Cards */}
//             <Row gutter={16} style={{ marginBottom: 24 }}>
//                 <Col xs={24} sm={6}>
//                     <Card>
//                         <Statistic
//                             title="Total Scheduled"
//                             value={statistics.total_scheduled || 0}
//                             prefix={<ScheduleOutlined style={{ color: '#1890ff' }} />}
//                         />
//                     </Card>
//                 </Col>
//                 <Col xs={24} sm={6}>
//                     <Card>
//                         <Statistic
//                             title="Pending Schedules"
//                             value={statistics.pending_schedules || 0}
//                             prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
//                         />
//                     </Card>
//                 </Col>
//                 <Col xs={24} sm={6}>
//                     <Card>
//                         <Statistic
//                             title="Sent Today"
//                             value={statistics.sent_today || 0}
//                             prefix={<SendOutlined style={{ color: '#52c41a' }} />}
//                         />
//                     </Card>
//                 </Col>
//                 <Col xs={24} sm={6}>
//                     <Card>
//                         <Statistic
//                             title="Total Emails Sent"
//                             value={statistics.total_emails_sent || 0}
//                             prefix={<MailOutlined style={{ color: '#722ed1' }} />}
//                         />
//                     </Card>
//                 </Col>
//             </Row>

//             {/* Main Content */}
//             <Card>
//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
//                     <Space>
//                         <Select
//                             placeholder="Filter by Category"
//                             allowClear
//                             style={{ width: 160 }}
//                             value={categoryFilter}
//                             onChange={setCategoryFilter}
//                         >
//                             <Option value="interview">Interview</Option>
//                             <Option value="test">Test</Option>
//                             <Option value="bulk">Bulk</Option>
//                             <Option value="follow_up">Follow-up</Option>
//                             <Option value="onboarding">Onboarding</Option>
//                         </Select>

//                         <Select
//                             placeholder="Filter by Status"
//                             allowClear
//                             style={{ width: 140 }}
//                             value={statusFilter}
//                             onChange={setStatusFilter}
//                         >
//                             <Option value="scheduled">Scheduled</Option>
//                             <Option value="sending">Sending</Option>
//                             <Option value="sent">Sent</Option>
//                             <Option value="failed">Failed</Option>
//                             <Option value="cancelled">Cancelled</Option>
//                         </Select>

//                         <Button icon={<ReloadOutlined />} onClick={loadData}>
//                             Refresh
//                         </Button>
//                     </Space>

//                     <Button
//                         type="primary"
//                         icon={<PlusOutlined />}
//                         onClick={() => {
//                             setScheduleModalVisible(true);
//                             setCurrentStep(0);
//                             setSelectedRecipients([]);
//                         }}
//                     >
//                         Schedule Email
//                     </Button>
//                 </div>

//                 <Table
//                     columns={columns}
//                     dataSource={scheduledEmails}
//                     loading={loading}
//                     rowKey="id"
//                     pagination={{
//                         pageSize: 10,
//                         showSizeChanger: true,
//                         showQuickJumper: true,
//                         showTotal: (total) => `Total ${total} schedules`
//                     }}
//                 />
//             </Card>

//             {/* Schedule Email Modal */}
//             <Modal
//                 title="Schedule Email"
//                 visible={scheduleModalVisible}
//                 onCancel={() => {
//                     setScheduleModalVisible(false);
//                     form.resetFields();
//                     setCurrentStep(0);
//                     setSelectedRecipients([]);
//                 }}
//                 footer={null}
//                 width={800}
//                 destroyOnClose
//             >
//                 <Form form={form} layout="vertical" onFinish={handleScheduleEmail}>
//                     <Steps current={currentStep} style={{ marginBottom: 24 }}>
//                         <Step title="Email Details" icon={<FileTextOutlined />} />
//                         <Step title="Recipients" icon={<TeamOutlined />} />
//                         <Step title="Schedule" icon={<CalendarOutlined />} />
//                     </Steps>

//                     {renderStepContent()}

//                     <div style={{ textAlign: 'right', marginTop: 24 }}>
//                         <Space>
//                             {currentStep > 0 && (
//                                 <Button onClick={() => setCurrentStep(currentStep - 1)}>
//                                     Previous
//                                 </Button>
//                             )}

//                             {currentStep < 2 ? (
//                                 <Button
//                                     type="primary"
//                                     onClick={() => {
//                                         form.validateFields().then(() => {
//                                             if (currentStep === 0 && selectedCategory) {
//                                                 // Auto-populate recipients based on category
//                                                 const recipients = getRecipientsByCategory(selectedCategory);
//                                                 setSelectedRecipients(recipients);
//                                             }
//                                             setCurrentStep(currentStep + 1);
//                                         });
//                                     }}
//                                 >
//                                     Next
//                                 </Button>
//                             ) : (
//                                 <Button
//                                     type="primary"
//                                     htmlType="submit"
//                                     loading={loading}
//                                     disabled={selectedRecipients.length === 0}
//                                 >
//                                     Schedule Email
//                                 </Button>
//                             )}
//                         </Space>
//                     </div>
//                 </Form>
//             </Modal>

//             {/* Delivery Logs Modal */}
//             <Modal
//                 title={`Delivery Logs - ${selectedSchedule?.name}`}
//                 visible={logsModalVisible}
//                 onCancel={() => setLogsModalVisible(false)}
//                 width={1000}
//                 footer={[
//                     <Button key="close" onClick={() => setLogsModalVisible(false)}>
//                         Close
//                     </Button>
//                 ]}
//             >
//                 <Table
//                     dataSource={deliveryLogs}
//                     loading={loading}
//                     size="small"
//                     columns={[
//                         {
//                             title: 'Recipient',
//                             key: 'recipient',
//                             render: (record: DeliveryLog) => (
//                                 <div>
//                                     <div>{record.recipient_name || 'No Name'}</div>
//                                     <Text type="secondary" style={{ fontSize: '12px' }}>
//                                         {record.recipient_email}
//                                     </Text>
//                                 </div>
//                             )
//                         },
//                         {
//                             title: 'Status',
//                             dataIndex: 'status',
//                             render: (status: string) => {
//                                 const colors = {
//                                     pending: 'blue',
//                                     sent: 'green',
//                                     failed: 'red',
//                                     bounced: 'orange'
//                                 };
//                                 return <Tag color={colors[status as keyof typeof colors]}>{status}</Tag>;
//                             }
//                         },
//                         {
//                             title: 'Sent At',
//                             dataIndex: 'sent_at',
//                             render: (time: string) => time ? format(new Date(time), 'MMM dd, HH:mm') : '-'
//                         },
//                         {
//                             title: 'Opened',
//                             dataIndex: 'opened_at',
//                             render: (time: string) => time ? format(new Date(time), 'MMM dd, HH:mm') : '-'
//                         },
//                         {
//                             title: 'Error',
//                             dataIndex: 'error_message',
//                             render: (error: string) => error ? (
//                                 <Tooltip title={error}>
//                                     <Text type="danger" ellipsis style={{ maxWidth: 150 }}>
//                                         {error}
//                                     </Text>
//                                 </Tooltip>
//                             ) : '-'
//                         }
//                     ]}
//                     pagination={{ pageSize: 20 }}
//                 />
//             </Modal>
//         </div>
//     );
// };

// export default EmailScheduler;

import React, { useState, useEffect } from 'react';
import {
    Card, Table, Button, Space, Tag, Modal, Form, Input, Select, DatePicker,
    Switch, Row, Col, Tabs, Statistic, Progress, Badge, Tooltip,
    message, notification, Alert, List, Typography, Divider, Popconfirm,
    Checkbox, InputNumber, Radio, Steps, Spin, Empty, Transfer, AutoComplete
} from 'antd';
import {
    ScheduleOutlined, SendOutlined, ClockCircleOutlined, MailOutlined,
    UserOutlined, TeamOutlined, CalendarOutlined, DeleteOutlined,
    EyeOutlined, PlusOutlined, ReloadOutlined, ExclamationCircleOutlined,
    CheckCircleOutlined, WarningOutlined, StopOutlined, PlayCircleOutlined,
    BarChartOutlined, FileTextOutlined, BellOutlined
} from '@ant-design/icons';
import { format, parseISO } from 'date-fns';
import { startOfDay, isBefore } from 'date-fns';
import api from '../services/api';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Step } = Steps;

interface EmailSchedulerProps {
    socket?: WebSocket | null;
    sendMessage?: (message: string) => void;
    isConnected?: boolean;
}

interface ScheduledEmail {
    id: number;
    name: string;
    category: string;
    template_name: string;
    scheduled_at: string;
    status: string;
    priority: string;
    recipient_count: number;
    sent_count: number;
    failed_count: number;
    is_recurring: boolean;
    created_at: string;
    sent_at?: string;
}

interface EmailTemplate {
    id: number;
    name: string;
    category: string;
    subject: string;
    variables: string[];
    body_html?: string;
}

interface DeliveryLog {
    id: number;
    recipient_email: string;
    recipient_name: string;
    status: string;
    sent_at?: string;
    opened_at?: string;
    clicked_at?: string;
    error_message?: string;
}

interface Candidate {
    candidate_id: number;
    candidate_name: string;
    email: string;
    phone?: string;
    status: string;
    skills?: string[];
    experience_years?: number;
    location?: string;
}

const EmailScheduler: React.FC<EmailSchedulerProps> = ({ socket, sendMessage, isConnected }) => {
    // State Management
    const [loading, setLoading] = useState(false);
    const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
    const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [jobs, setJobs] = useState<any[]>([]);
    const [statistics, setStatistics] = useState<any>({});

    // Modal States
    const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
    const [logsModalVisible, setLogsModalVisible] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<ScheduledEmail | null>(null);
    const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>([]);

    // Form and UI States
    const [form] = Form.useForm();
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
    const [selectedRecipients, setSelectedRecipients] = useState<any[]>([]);
    const [recipientMode, setRecipientMode] = useState<'database' | 'manual'>('database');
    const [manualRecipients, setManualRecipients] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState('scheduled');

    // Filters
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (categoryFilter || statusFilter) {
            loadScheduledEmails();
        }
    }, [categoryFilter, statusFilter]);

    useEffect(() => {
        // Load templates when category changes
        if (selectedCategory) {
            loadEmailTemplates();
        }
    }, [selectedCategory]);

    useEffect(() => {
        // Persist form values when navigating between steps
        const currentValues = form.getFieldsValue();
        console.log('Current form values:', currentValues);
    }, [currentStep]);

    const loadData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadScheduledEmails(),
                loadEmailTemplates(),
                loadCandidates(),
                loadJobs(),
                loadStatistics()
            ]);
        } catch (error) {
            console.error('Failed to load data:', error);
            message.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const loadScheduledEmails = async () => {
        try {
            const response = await api.get('/api/v1/email-scheduler/schedules', {
                params: {
                    category: categoryFilter || undefined,
                    status: statusFilter || undefined
                }
            });
            if (response.data.success) {
                setScheduledEmails(response.data.schedules || []);
            }
        } catch (error) {
            console.error('Failed to load scheduled emails:', error);
        }
    };

    const loadEmailTemplates = async () => {
        try {
            const response = await api.get('/api/v1/emails/templates');
            if (response.data.success) {
                const templates = response.data.templates || [];
                setEmailTemplates(templates);
                console.log('Loaded templates:', templates); // Debug log
            }
        } catch (error) {
            console.error('Failed to load email templates:', error);
            setEmailTemplates([]); // Set empty array on error
        }
    };

    const loadCandidates = async () => {
        try {
            const response = await api.get('/api/v1/candidates');
            if (response.data.success) {
                const candidateData = response.data.candidates || [];
                setCandidates(candidateData);
                console.log('Loaded candidates:', candidateData.length); // Debug log
            }
        } catch (error) {
            console.error('Failed to load candidates:', error);
            setCandidates([]);
        }
    };

    const loadJobs = async () => {
        try {
            const response = await api.get('/api/v1/jobs');
            if (response.data.success) {
                setJobs(response.data.jobs || []);
            }
        } catch (error) {
            console.error('Failed to load jobs:', error);
            setJobs([]);
        }
    };

    const loadStatistics = async () => {
        try {
            const response = await api.get('/api/v1/email-scheduler/stats');
            if (response.data.success) {
                setStatistics(response.data.stats || {});
            }
        } catch (error) {
            console.error('Failed to load statistics:', error);
            setStatistics({});
        }
    };

    const handleTemplateSelect = (templateId: number) => {
        const template = emailTemplates.find(t => t.id === templateId);
        setSelectedTemplate(template || null);

        if (template) {
            // Initialize form fields for template variables
            const initialValues: any = {};
            if (template.variables && template.variables.length > 0) {
                template.variables.forEach(variable => {
                    initialValues[`var_${variable}`] = '';
                });
            }
            form.setFieldsValue(initialValues);
        }
    };

    const getFilteredCandidates = (filters: any = {}) => {
        let filteredCandidates = [...candidates];

        if (filters.job_id) {
            // Filter by job - you might need to implement job application relationship
            // For now, we'll include all candidates
        }

        if (filters.status && filters.status.length > 0) {
            filteredCandidates = filteredCandidates.filter(candidate =>
                filters.status.includes(candidate.status)
            );
        }

        if (filters.skills && filters.skills.length > 0) {
            filteredCandidates = filteredCandidates.filter(candidate =>
                candidate.skills && candidate.skills.some(skill =>
                    filters.skills.some((filterSkill: string) =>
                        skill.toLowerCase().includes(filterSkill.toLowerCase())
                    )
                )
            );
        }

        if (filters.experience_min) {
            filteredCandidates = filteredCandidates.filter(candidate =>
                candidate.experience_years && candidate.experience_years >= filters.experience_min
            );
        }

        return filteredCandidates.filter(candidate => candidate.email); // Only candidates with emails
    };

    const handleScheduleEmail = async (values: any) => {
        console.log('Form Values Received:', values); // Debug log
        console.log('Selected Template:', selectedTemplate); // Debug log
        console.log('Selected Category:', selectedCategory); // Debug log

        try {
            setLoading(true);

            // Get ALL form values, not just the ones passed
            const allFormValues = values || form.getFieldsValue();
            console.log('All Form Values:', allFormValues); // Debug log

            // Validate required fields manually
            // if (!allFormValues.name || allFormValues.name.trim() === '') {
            //     message.error('Schedule name is required');
            //     return;
            // }

            // if (!allFormValues.template_id) {
            //     message.error('Please select an email template');
            //     return;
            // }

            // if (!allFormValues.category) {
            //     message.error('Please select a category');
            //     return;
            // }

            // if (!allFormValues.scheduled_datetime) {
            //     message.error('Please select schedule date and time');
            //     return;
            // }

            // Prepare template variables
            const templateVariables: any = {};
            if (selectedTemplate && selectedTemplate.variables) {
                selectedTemplate.variables.forEach(variable => {
                    if (allFormValues[`var_${variable}`]) {
                        templateVariables[variable] = allFormValues[`var_${variable}`];
                    }
                });
            }

            // Prepare recipients based on mode
            let recipients: any[] = [];
            if (recipientMode === 'database') {
                recipients = selectedRecipients;
            } else {
                recipients = manualRecipients.map(email => ({
                    email: email.trim(),
                    name: '',
                    type: 'manual'
                }));
            }

            if (recipients.length === 0) {
                message.error('Please select at least one recipient');
                return;
            }

            // Prepare schedule data with ALL required fields
            const scheduleData = {
                name: allFormValues.name,                    // ✅ Now included
                template_id: allFormValues.template_id,      // ✅ Now included  
                category: allFormValues.category,            // ✅ Now included
                scheduled_at: allFormValues.scheduled_datetime.toISOString(),
                priority: allFormValues.priority || 'medium',
                recipients: recipients,
                subject_override: allFormValues.subject_override,
                variables: templateVariables,
                is_recurring: allFormValues.is_recurring || false,
                recurrence_pattern: allFormValues.is_recurring ? {
                    hour: allFormValues.recurrence_time?.hour() || 9,
                    minute: allFormValues.recurrence_time?.minute() || 0,
                    day_of_week: allFormValues.recurrence_days,
                    day: allFormValues.recurrence_day
                } : null,
                timezone: allFormValues.timezone || 'Asia/Kolkata',
                created_by: 1
            };

            console.log('Schedule Data to Send:', scheduleData); // Debug log

            const response = await api.post('/api/v1/email-scheduler/schedule', scheduleData);

            if (response.data.success) {
                notification.success({
                    message: 'Email Scheduled Successfully',
                    description: response.data.message,
                    placement: 'topRight'
                });

                resetScheduleModal();
                await loadScheduledEmails();
            } else {
                message.error(response.data.error || 'Failed to schedule email');
            }

        } catch (error) {
            console.error('Schedule email error:', error);
            message.error('Failed to schedule email');
        } finally {
            setLoading(false);
        }
    };


    const resetScheduleModal = () => {
        setScheduleModalVisible(false);
        form.resetFields();
        setCurrentStep(0);
        setSelectedRecipients([]);
        setManualRecipients([]);
        setSelectedCategory('');
        setSelectedTemplate(null);
        setRecipientMode('database');
    };

    const handleCancelSchedule = async (scheduleId: number) => {
        try {
            const response = await api.delete(`/api/v1/email-scheduler/schedules/${scheduleId}`);

            if (response.data.success) {
                message.success('Email schedule cancelled');
                await loadScheduledEmails();
            } else {
                message.error(response.data.error || 'Failed to cancel schedule');
            }
        } catch (error) {
            message.error('Failed to cancel schedule');
        }
    };

    const viewDeliveryLogs = async (schedule: ScheduledEmail) => {
        try {
            setSelectedSchedule(schedule);
            setLoading(true);

            const response = await api.get(`/api/v1/email-scheduler/schedules/${schedule.id}/logs`);

            if (response.data.success) {
                setDeliveryLogs(response.data.logs || []);
                setLogsModalVisible(true);
            } else {
                message.error('Failed to load delivery logs');
            }
        } catch (error) {
            message.error('Failed to load delivery logs');
        } finally {
            setLoading(false);
        }
    };

    // Render dynamic form fields for template variables
    const renderTemplateVariableFields = () => {
        if (!selectedTemplate || !selectedTemplate.variables || selectedTemplate.variables.length === 0) {
            return (
                <Alert
                    message="No Template Variables"
                    description="This template doesn't require any custom variables."
                    type="info"
                    style={{ marginBottom: 16 }}
                />
            );
        }

        return (
            <div>
                <Title level={5}>Template Variables</Title>
                <Paragraph type="secondary">
                    Fill in the values for template variables. These will be used to personalize emails.
                </Paragraph>

                <Row gutter={16}>
                    {selectedTemplate.variables.map((variable, index) => (
                        <Col span={12} key={variable}>
                            <Form.Item
                                name={`var_${variable}`}
                                label={variable.charAt(0).toUpperCase() + variable.slice(1).replace(/_/g, ' ')}
                                rules={[
                                    { required: true, message: `Please enter ${variable}` }
                                ]}
                            >
                                {variable.toLowerCase().includes('date') ? (
                                    <DatePicker style={{ width: '100%' }} />
                                ) : variable.toLowerCase().includes('time') ? (
                                    <Input placeholder={`Enter ${variable}`} />
                                ) : variable.toLowerCase().includes('email') ? (
                                    <Input type="email" placeholder={`Enter ${variable}`} />
                                ) : variable.toLowerCase().includes('phone') ? (
                                    <Input placeholder={`Enter ${variable}`} />
                                ) : (
                                    <Input placeholder={`Enter ${variable}`} />
                                )}
                            </Form.Item>
                        </Col>
                    ))}
                </Row>
            </div>
        );
    };

    // Enhanced recipient selection
    const renderRecipientSelection = () => {
        return (
            <div>
                <Title level={5}>Select Recipients</Title>

                <Radio.Group
                    value={recipientMode}
                    onChange={(e) => setRecipientMode(e.target.value)}
                    style={{ marginBottom: 16 }}
                >
                    <Radio value="database">From Candidate Database</Radio>
                    <Radio value="manual">Add Recipients Manually</Radio>
                </Radio.Group>

                {recipientMode === 'database' ? (
                    <div>
                        {/* Filters for database recipients */}
                        <Row gutter={16} style={{ marginBottom: 16 }}>
                            <Col span={8}>
                                <Form.Item name="job_filter" label="Filter by Job">
                                    <Select placeholder="Select job (optional)" allowClear>
                                        {jobs.map(job => (
                                            <Option key={job.id} value={job.id}>{job.title}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>

                            <Col span={8}>
                                <Form.Item name="status_filter" label="Candidate Status">
                                    <Select
                                        mode="multiple"
                                        placeholder="Select status"
                                        allowClear
                                        onChange={(statuses) => {
                                            const filteredCandidates = getFilteredCandidates({ status: statuses });
                                            setSelectedRecipients(filteredCandidates.map(candidate => ({
                                                email: candidate.email,
                                                name: candidate.candidate_name,
                                                candidate_id: candidate.candidate_id,
                                                phone: candidate.phone
                                            })));
                                        }}
                                    >
                                        <Option value="new">New</Option>
                                        <Option value="screening">Screening</Option>
                                        <Option value="shortlisted">Shortlisted</Option>
                                        <Option value="interviewed">Interviewed</Option>
                                        <Option value="selected">Selected</Option>
                                        <Option value="rejected">Rejected</Option>
                                    </Select>
                                </Form.Item>
                            </Col>

                            <Col span={8}>
                                <Form.Item name="experience_filter" label="Min Experience">
                                    <InputNumber
                                        placeholder="Years"
                                        min={0}
                                        max={50}
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Button
                            onClick={() => {
                                const filters = form.getFieldsValue(['status_filter', 'job_filter', 'experience_filter']);
                                const filteredCandidates = getFilteredCandidates({
                                    status: filters.status_filter,
                                    job_id: filters.job_filter,
                                    experience_min: filters.experience_filter
                                });
                                setSelectedRecipients(filteredCandidates.map(candidate => ({
                                    email: candidate.email,
                                    name: candidate.candidate_name,
                                    candidate_id: candidate.candidate_id,
                                    phone: candidate.phone
                                })));
                            }}
                            style={{ marginBottom: 16 }}
                        >
                            Apply Filters
                        </Button>

                        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #d9d9d9', padding: '8px', borderRadius: '6px' }}>
                            <div style={{ marginBottom: 8 }}>
                                <Text strong>Selected Recipients: {selectedRecipients.length}</Text>
                                <Button
                                    size="small"
                                    style={{ float: 'right' }}
                                    onClick={() => setSelectedRecipients([])}
                                >
                                    Clear All
                                </Button>
                            </div>

                            <List
                                size="small"
                                dataSource={selectedRecipients}
                                renderItem={(recipient, index) => (
                                    <List.Item
                                        actions={[
                                            <Button
                                                size="small"
                                                danger
                                                onClick={() => {
                                                    const newRecipients = selectedRecipients.filter((_, i) => i !== index);
                                                    setSelectedRecipients(newRecipients);
                                                }}
                                            >
                                                Remove
                                            </Button>
                                        ]}
                                    >
                                        <List.Item.Meta
                                            avatar={<UserOutlined />}
                                            title={recipient.name || 'No Name'}
                                            description={recipient.email}
                                        />
                                    </List.Item>
                                )}
                            />
                        </div>
                    </div>
                ) : (
                    <div>
                        <Form.Item
                            name="manual_recipients"
                            label="Email Addresses"
                            rules={[{ required: true, message: 'Please enter at least one email address' }]}
                        >
                            <Select
                                mode="tags"
                                placeholder="Enter email addresses and press Enter"
                                style={{ width: '100%' }}
                                tokenSeparators={[',', ' ']}
                                onChange={(emails) => setManualRecipients(emails)}
                            >
                            </Select>
                        </Form.Item>
                        <Text type="secondary">
                            You can paste multiple email addresses separated by commas or spaces.
                        </Text>
                    </div>
                )}
            </div>
        );
    };

    // Table columns (same as before)
    const columns = [
        {
            title: 'Schedule Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: ScheduledEmail) => (
                <div>
                    <Text strong>{text}</Text>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        Template: {record.template_name}
                    </div>
                </div>
            )
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            render: (category: string) => {
                const colors = {
                    interview: 'blue',
                    test: 'green',
                    bulk: 'purple',
                    follow_up: 'orange',
                    onboarding: 'cyan'
                };
                return <Tag color={colors[category as keyof typeof colors] || 'default'}>{category}</Tag>;
            }
        },
        {
            title: 'Scheduled Time',
            dataIndex: 'scheduled_at',
            key: 'scheduled_at',
            render: (time: string, record: ScheduledEmail) => (
                <div>
                    <div>{format(new Date(time), 'MMM dd, yyyy')}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        {format(new Date(time), 'HH:mm')}
                        {record.is_recurring && <Tag color="blue">Recurring</Tag>}
                    </div>
                </div>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const statusConfig = {
                    scheduled: { color: 'blue', icon: <ClockCircleOutlined /> },
                    sending: { color: 'orange', icon: <SendOutlined /> },
                    sent: { color: 'green', icon: <CheckCircleOutlined /> },
                    partial: { color: 'yellow', icon: <WarningOutlined /> },
                    failed: { color: 'red', icon: <ExclamationCircleOutlined /> },
                    cancelled: { color: 'default', icon: <StopOutlined /> }
                };

                const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;

                return (
                    <Tag color={config.color} icon={config.icon}>
                        {status.toUpperCase()}
                    </Tag>
                );
            }
        },
        {
            title: 'Recipients',
            key: 'recipients',
            render: (record: ScheduledEmail) => (
                <div>
                    <div>Total: {record.recipient_count}</div>
                    {record.sent_count > 0 && (
                        <div style={{ fontSize: '12px', color: '#52c41a' }}>
                            Sent: {record.sent_count}
                        </div>
                    )}
                    {record.failed_count > 0 && (
                        <div style={{ fontSize: '12px', color: '#ff4d4f' }}>
                            Failed: {record.failed_count}
                        </div>
                    )}
                </div>
            )
        },
        {
            title: 'Priority',
            dataIndex: 'priority',
            key: 'priority',
            render: (priority: string) => {
                const colors = {
                    low: 'default',
                    medium: 'blue',
                    high: 'orange',
                    urgent: 'red'
                };
                return <Tag color={colors[priority as keyof typeof colors]}>{priority}</Tag>;
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (record: ScheduledEmail) => (
                <Space>
                    <Tooltip title="View Delivery Logs">
                        <Button
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => viewDeliveryLogs(record)}
                        />
                    </Tooltip>

                    {record.status === 'scheduled' && (
                        <Popconfirm
                            title="Are you sure you want to cancel this schedule?"
                            onConfirm={() => handleCancelSchedule(record.id)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Tooltip title="Cancel Schedule">
                                <Button
                                    size="small"
                                    icon={<StopOutlined />}
                                    danger
                                />
                            </Tooltip>
                        </Popconfirm>
                    )}
                </Space>
            )
        }
    ];

    // Add this function before the return statement in your component
    const getCurrentStepFields = () => {
        switch (currentStep) {
            case 0:
                // Step 0: Email Details - validate basic fields
                const step0Fields = ['name', 'category', 'template_id', 'priority'];

                // Add template variable fields if they exist
                if (selectedTemplate && selectedTemplate.variables && selectedTemplate.variables.length > 0) {
                    selectedTemplate.variables.forEach(variable => {
                        step0Fields.push(`var_${variable}`);
                    });
                }

                return step0Fields;

            case 1:
                // Step 1: Recipients - validate recipient selection
                if (recipientMode === 'manual') {
                    return ['manual_recipients'];
                }
                return []; // Database mode doesn't have form fields to validate

            case 2:
                // Step 2: Schedule - validate scheduling fields
                return ['scheduled_datetime', 'timezone'];

            default:
                return [];
        }
    };


    // Schedule Email Modal Steps
    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="name"
                                    label="Schedule Name"
                                    rules={[
                                        { required: true, message: 'Please enter schedule name' }, // ✅ Fixed
                                        { min: 3, message: 'Schedule name must be at least 3 characters' }
                                    ]}
                                >
                                    <Input
                                        placeholder="e.g., Weekly Interview Invitations"
                                        maxLength={100}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="category"
                                    label="Category"
                                    rules={[{ required: true, message: 'Please select category' }]}
                                >
                                    <Select
                                        placeholder="Select category"
                                        onChange={(value) => {
                                            setSelectedCategory(value);
                                            form.setFieldsValue({
                                                category: value, // ✅ Ensure form value is set
                                                template_id: undefined
                                            });
                                            setSelectedTemplate(null);
                                        }}
                                    >
                                        <Option value="interview">Interview Scheduler</Option>
                                        <Option value="test">Test Scheduler</Option>
                                        <Option value="bulk">Bulk Send</Option>
                                        <Option value="follow_up">Follow-up</Option>
                                        <Option value="onboarding">Onboarding</Option>
                                        <Option value="other">Other</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="template_id"
                                    label="Email Template"
                                    rules={[{ required: true, message: 'Please select template' }]}
                                >
                                    <Select
                                        placeholder="Select email template"
                                        onChange={handleTemplateSelect}
                                        loading={loading}
                                        notFoundContent={selectedCategory ? "No templates found for this category" : "Please select a category first"}
                                    >
                                        {emailTemplates
                                            .filter(template =>
                                                !selectedCategory || selectedCategory === 'other' || template.category === selectedCategory
                                            )
                                            .map(template => (
                                                <Option key={template.id} value={template.id}>
                                                    {template.name}
                                                </Option>
                                            ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="priority"
                                    label="Priority"
                                    initialValue="medium"
                                >
                                    <Select>
                                        <Option value="low">Low</Option>
                                        <Option value="medium">Medium</Option>
                                        <Option value="high">High</Option>
                                        <Option value="urgent">Urgent</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* Template preview and variables */}
                        {selectedTemplate && (
                            <div style={{ marginTop: 16 }}>
                                <Alert
                                    message={`Template: ${selectedTemplate.name}`}
                                    description={`Subject: ${selectedTemplate.subject}`}
                                    type="info"
                                    style={{ marginBottom: 16 }}
                                />

                                {renderTemplateVariableFields()}
                            </div>
                        )}
                    </div>
                );

            case 1:
                return renderRecipientSelection();

            case 2:
                return (
                    <div>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="scheduled_datetime"
                                    label="Schedule Date & Time"
                                    rules={[{ required: true, message: 'Please select date and time' }]}
                                >
                                    <DatePicker
                                        showTime
                                        style={{ width: '100%' }}
                                        format="YYYY-MM-DD HH:mm"
                                        disabledDate={(current) =>
                                            current && isBefore(current.toDate(), startOfDay(new Date()))
                                        } />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="timezone" label="Timezone" initialValue="Asia/Kolkata">
                                    <Select>
                                        <Option value="Asia/Kolkata">Asia/Kolkata (IST)</Option>
                                        <Option value="UTC">UTC</Option>
                                        <Option value="America/New_York">America/New_York (EST)</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item name="is_recurring" valuePropName="checked">
                            <Checkbox>Make this a recurring email</Checkbox>
                        </Form.Item>

                        <Form.Item name="subject_override" label="Subject Override (Optional)">
                            <Input placeholder="Override template subject if needed" />
                        </Form.Item>

                        {/* Summary */}
                        <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 6, marginTop: 16 }}>
                            <Title level={5}>Schedule Summary</Title>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Text strong>Recipients:</Text> {recipientMode === 'database' ? selectedRecipients.length : manualRecipients.length}
                                </Col>
                                <Col span={12}>
                                    <Text strong>Template:</Text> {selectedTemplate?.name || 'Not selected'}
                                </Col>
                            </Row>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <Title level={2}>
                    <ScheduleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                    Email Scheduler
                </Title>
                <Paragraph>
                    Schedule and manage automated email campaigns for interviews, tests, and bulk communications.
                </Paragraph>
            </div>

            {/* Statistics Cards */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={6}>
                    <Card>
                        <Statistic
                            title="Total Scheduled"
                            value={statistics.total_scheduled || 0}
                            prefix={<ScheduleOutlined style={{ color: '#1890ff' }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card>
                        <Statistic
                            title="Pending Schedules"
                            value={statistics.pending_schedules || 0}
                            prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card>
                        <Statistic
                            title="Sent Today"
                            value={statistics.sent_today || 0}
                            prefix={<SendOutlined style={{ color: '#52c41a' }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card>
                        <Statistic
                            title="Total Emails Sent"
                            value={statistics.total_emails_sent || 0}
                            prefix={<MailOutlined style={{ color: '#722ed1' }} />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Main Content */}
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Space>
                        <Select
                            placeholder="Filter by Category"
                            allowClear
                            style={{ width: 160 }}
                            value={categoryFilter}
                            onChange={setCategoryFilter}
                        >
                            <Option value="interview">Interview</Option>
                            <Option value="test">Test</Option>
                            <Option value="bulk">Bulk</Option>
                            <Option value="follow_up">Follow-up</Option>
                            <Option value="onboarding">Onboarding</Option>
                        </Select>

                        <Select
                            placeholder="Filter by Status"
                            allowClear
                            style={{ width: 140 }}
                            value={statusFilter}
                            onChange={setStatusFilter}
                        >
                            <Option value="scheduled">Scheduled</Option>
                            <Option value="sending">Sending</Option>
                            <Option value="sent">Sent</Option>
                            <Option value="failed">Failed</Option>
                            <Option value="cancelled">Cancelled</Option>
                        </Select>

                        <Button icon={<ReloadOutlined />} onClick={loadData}>
                            Refresh
                        </Button>
                    </Space>

                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setScheduleModalVisible(true);
                            setCurrentStep(0);
                            setSelectedRecipients([]);
                            setManualRecipients([]);
                            setSelectedCategory('');
                            setSelectedTemplate(null);
                        }}
                    >
                        Schedule Email
                    </Button>
                </div>

                <Table
                    columns={columns}
                    dataSource={scheduledEmails}
                    loading={loading}
                    rowKey="id"
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total) => `Total ${total} schedules`
                    }}
                />
            </Card>

            {/* Schedule Email Modal */}
            <Modal
                title="Schedule Email"
                visible={scheduleModalVisible}
                onCancel={resetScheduleModal}
                footer={null}
                width={900}
                destroyOnClose={false}
            >
                <Form form={form} layout="vertical" onFinish={handleScheduleEmail}>
                    <Steps current={currentStep} style={{ marginBottom: 24 }}>
                        <Step title="Email Details" icon={<FileTextOutlined />} />
                        <Step title="Recipients" icon={<TeamOutlined />} />
                        <Step title="Schedule" icon={<CalendarOutlined />} />
                    </Steps>

                    {renderStepContent()}

                    <div style={{ textAlign: 'right', marginTop: 24 }}>
                        <Space>
                            {currentStep > 0 && (
                                <Button onClick={() => setCurrentStep(currentStep - 1)}>
                                    Previous
                                </Button>
                            )}

                            {currentStep < 2 ? (
                                <Button
                                    type="primary"
                                    onClick={async () => {
                                        try {
                                            // Use the getCurrentStepFields function
                                            const fieldsToValidate = getCurrentStepFields();
                                            await form.validateFields(fieldsToValidate);

                                            // Step-specific additional validation
                                            if (currentStep === 0) {
                                                if (!selectedTemplate) {
                                                    message.error('Please select an email template');
                                                    return;
                                                }
                                            } else if (currentStep === 1) {
                                                // Recipients validation...
                                                if (recipientMode === 'manual') {
                                                    if (manualRecipients.length === 0) {
                                                        message.error('Please enter at least one email address');
                                                        return;
                                                    }
                                                } else {
                                                    if (selectedRecipients.length === 0) {
                                                        message.error('Please select at least one recipient from the database');
                                                        return;
                                                    }
                                                }
                                            }

                                            setCurrentStep(currentStep + 1);

                                        } catch (error) {
                                            console.log('Validation failed:', error);
                                        }
                                    }}
                                >
                                    Next
                                </Button>

                            ) : (
                                <Button
                                    type="primary"
                                    onClick={async () => {
                                        try {
                                            // Final validation before submit
                                            // For final submit, validate all key fields
                                            const finalFields = ['name', 'category', 'template_id', 'priority', 'scheduled_datetime'];
                                            // and add template variables if exist:
                                            if (selectedTemplate && selectedTemplate.variables) {
                                                selectedTemplate.variables.forEach(variable => {
                                                    finalFields.push(`var_${variable}`);
                                                });
                                            }
                                            await form.validateFields(finalFields);

                                            // Check recipients one more time
                                            const totalRecipients = recipientMode === 'database'
                                                ? selectedRecipients.length
                                                : manualRecipients.length;

                                            if (totalRecipients === 0) {
                                                message.error('No recipients selected');
                                                return;
                                            }

                                            // Get all form values and submit
                                            const allFormValues = form.getFieldsValue(true);
                                            console.log('Submitting with values:', allFormValues);
                                            await handleScheduleEmail(allFormValues);

                                        } catch (error) {
                                            console.log('Final validation failed:', error);
                                            message.error('Please fill in all required scheduling details');
                                        }
                                    }}
                                    loading={loading}
                                >
                                    Schedule Email
                                </Button>
                            )}

                        </Space>
                    </div>
                </Form>
            </Modal>

            {/* Delivery Logs Modal */}
            <Modal
                title={`Delivery Logs - ${selectedSchedule?.name}`}
                visible={logsModalVisible}
                onCancel={() => setLogsModalVisible(false)}
                width={1000}
                footer={[
                    <Button key="close" onClick={() => setLogsModalVisible(false)}>
                        Close
                    </Button>
                ]}
            >
                <Table
                    dataSource={deliveryLogs}
                    loading={loading}
                    size="small"
                    columns={[
                        {
                            title: 'Recipient',
                            key: 'recipient',
                            render: (record: DeliveryLog) => (
                                <div>
                                    <div>{record.recipient_name || 'No Name'}</div>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                        {record.recipient_email}
                                    </Text>
                                </div>
                            )
                        },
                        {
                            title: 'Status',
                            dataIndex: 'status',
                            render: (status: string) => {
                                const colors = {
                                    pending: 'blue',
                                    sent: 'green',
                                    failed: 'red',
                                    bounced: 'orange'
                                };
                                return <Tag color={colors[status as keyof typeof colors]}>{status}</Tag>;
                            }
                        },
                        {
                            title: 'Sent At',
                            dataIndex: 'sent_at',
                            render: (time: string) => time ? format(new Date(time), 'MMM DD, HH:mm') : '-'
                        },
                        {
                            title: 'Opened',
                            dataIndex: 'opened_at',
                            render: (time: string) => time ? format(new Date(time), 'MMM DD, HH:mm') : '-'
                        },
                        {
                            title: 'Error',
                            dataIndex: 'error_message',
                            render: (error: string) => error ? (
                                <Tooltip title={error}>
                                    <Text type="danger" ellipsis style={{ maxWidth: 150 }}>
                                        {error}
                                    </Text>
                                </Tooltip>
                            ) : '-'
                        }
                    ]}
                    pagination={{ pageSize: 20 }}
                />
            </Modal>
        </div>
    );
};

export default EmailScheduler;
