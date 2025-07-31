// import React, { useState, useEffect } from 'react';
// import {
//   Card, Table, Tag, Space, Button, Input, Select, Statistic, Row, Col, Modal, Drawer, Tooltip, Divider, Badge, Spin, message, Avatar, Typography, Switch, Progress
// } from 'antd';
// import {
//   UserOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined, DownloadOutlined, EyeOutlined, DeleteOutlined, EditOutlined,
//   TrophyOutlined, TeamOutlined, SearchOutlined, CalendarOutlined, FileTextOutlined, GlobalOutlined, LinkedinOutlined,
//   CheckCircleOutlined, ExclamationCircleOutlined, ClockCircleOutlined, StarOutlined, BookOutlined, SafetyCertificateOutlined
// } from '@ant-design/icons';
// import api from '../services/api';
// import type { ColumnType } from 'antd/es/table';

// const { Option } = Select;
// const { Text } = Typography;

// // Enhanced interface matching your Candidate model
// export interface Candidate {
//   candidate_id: string | number;
//   full_name: string;
//   email: string;
//   phone?: string;
//   location?: string;
//   resume_filename?: string;
//   resume_url?: string;
//   resume_text?: string;
//   skills: string[];
//   experience_years: number;
//   education: any[];
//   certifications: any[];
//   overall_score: number;
//   technical_score: number;
//   experience_score: number;
//   status: string;
//   is_available: boolean;
//   source?: string;
//   source_details?: any;
//   created_at?: string;
//   updated_at?: string;
//   last_contacted?: string;
// }

// const STATUS_COLORS: { [k: string]: string } = {
//   success: 'green',
//   reviewed: 'blue',
//   shortlisted: 'geekblue',
//   rejected: 'volcano',
//   hired: 'purple',
//   available: 'gold',
//   interviewing: 'orange',
//   new: 'default'
// };

// function getScoreColor(score: number) {
//   if (score >= 80) return '#10b981';
//   if (score >= 60) return '#f59e0b';
//   if (score >= 40) return '#ef4444';
//   return '#6b7280';
// }

// function getScoreIcon(score: number) {
//   if (score >= 80) return <CheckCircleOutlined style={{ color: '#10b981' }} />;
//   if (score >= 60) return <ExclamationCircleOutlined style={{ color: '#f59e0b' }} />;
//   return <ExclamationCircleOutlined style={{ color: '#ef4444' }} />;
// }

// const CandidateDatabase: React.FC = () => {
//   const [candidates, setCandidates] = useState<Candidate[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [search, setSearch] = useState('');
//   const [filterStatus, setFilterStatus] = useState('all');
//   const [filterAvailable, setFilterAvailable] = useState('all');
//   const [selected, setSelected] = useState<Candidate | null>(null);
//   const [drawerOpen, setDrawerOpen] = useState(false);
//   const [editModalVisible, setEditModalVisible] = useState(false);

//   // Fetch candidates from PostgreSQL
//   const fetchCandidates = async () => {
//     setLoading(true);
//     try {
//       console.log('📋 Fetching candidates from database...');
//       const response = await api.get('/api/v1/candidates');

//       if (response.data.success) {
//         // Map the response to match our interface
//         const mappedCandidates = response.data.candidates.map((c: any) => ({
//           candidate_id: c.candidate_id,
//           full_name: c.candidate_name || c.full_name,
//           email: c.email,
//           phone: c.phone,
//           location: c.location,
//           resume_filename: c.filename || c.resume_filename,
//           resume_url: c.resume_url,
//           resume_text: c.resume_text,
//           skills: c.skills || [],
//           experience_years: c.experience_years || 0,
//           education: c.education || [],
//           certifications: c.certifications || [],
//           overall_score: c.score || c.overall_score || 0,
//           technical_score: c.technical_score || 0,
//           experience_score: c.experience_score || 0,
//           status: c.status || 'new',
//           is_available: c.is_available !== undefined ? c.is_available : true,
//           source: c.source,
//           source_details: c.source_details,
//           created_at: c.created_at,
//           updated_at: c.updated_at,
//           last_contacted: c.last_contacted
//         }));

//         setCandidates(mappedCandidates);
//         console.log(`✅ Loaded ${mappedCandidates.length} candidates`);
//       } else {
//         console.error('Failed to fetch candidates:', response.data);
//         setCandidates([]);
//         message.error('Failed to load candidates');
//       }
//     } catch (error: any) {
//       console.error('Failed to fetch candidates:', error);
//       message.error('Failed to load candidates from database');
//       setCandidates([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchCandidates();
//   }, []);

//   // Enhanced stats calculation
//   const stats = {
//     count: candidates.length,
//     avgScore: candidates.length ? Number((candidates.reduce((sum, c) => sum + (c.overall_score || 0), 0) / candidates.length).toFixed(1)) : 0,
//     shortlisted: candidates.filter(c => (c.status || '').toLowerCase() === 'shortlisted').length,
//     hired: candidates.filter(c => (c.status || '').toLowerCase() === 'hired').length,
//     available: candidates.filter(c => c.is_available).length,
//     avgExp: candidates.length ? Number((candidates.reduce((sum, c) => sum + (c.experience_years || 0), 0) / candidates.length).toFixed(1)) : 0,
//     skillPool: new Set(candidates.flatMap(c => c.skills || [])).size,
//     avgTechnicalScore: candidates.length ? Number((candidates.reduce((sum, c) => sum + (c.technical_score || 0), 0) / candidates.length).toFixed(1)) : 0,
//     withEducation: candidates.filter(c => c.education && c.education.length > 0).length,
//     withCertifications: candidates.filter(c => c.certifications && c.certifications.length > 0).length,
//     recentlyAdded: candidates.filter(c => {
//       if (!c.created_at) return false;
//       const createdDate = new Date(c.created_at);
//       const weekAgo = new Date();
//       weekAgo.setDate(weekAgo.getDate() - 7);
//       return createdDate > weekAgo;
//     }).length
//   };

//   // Enhanced filtering
//   const candidateFilter = (c: Candidate) => {
//     const statusMatch = filterStatus === 'all' || (c.status || '').toLowerCase() === filterStatus;
//     const availableMatch = filterAvailable === 'all' ||
//       (filterAvailable === 'available' && c.is_available) ||
//       (filterAvailable === 'unavailable' && !c.is_available);
//     const searchMatch = !search ||
//       c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
//       c.email?.toLowerCase().includes(search.toLowerCase()) ||
//       c.phone?.toLowerCase().includes(search.toLowerCase()) ||
//       c.location?.toLowerCase().includes(search.toLowerCase()) ||
//       c.resume_filename?.toLowerCase().includes(search.toLowerCase()) ||
//       c.skills?.some(skill => skill.toLowerCase().includes(search.toLowerCase()));

//     return statusMatch && availableMatch && searchMatch;
//   };

//   // Update candidate status
//   const updateCandidateStatus = async (candidateId: string | number, newStatus: string) => {
//     try {
//       await api.put(`/api/v1/candidates/${candidateId}`, { status: newStatus });
//       message.success('Status updated successfully');
//       fetchCandidates(); // Refresh the list
//     } catch (error) {
//       message.error('Failed to update status');
//     }
//   };

//   // Toggle availability
//   const toggleAvailability = async (candidateId: string | number, isAvailable: boolean) => {
//     try {
//       await api.put(`/api/v1/candidates/${candidateId}`, { is_available: isAvailable });
//       message.success(`Candidate marked as ${isAvailable ? 'available' : 'unavailable'}`);
//       fetchCandidates();
//     } catch (error) {
//       message.error('Failed to update availability');
//     }
//   };

//   // Delete candidate
//   const deleteCandidate = (candidateId: string | number) => {
//     Modal.confirm({
//       title: 'Delete Candidate',
//       content: 'Are you sure you want to delete this candidate? This action cannot be undone.',
//       okText: 'Yes, Delete',
//       okType: 'danger',
//       cancelText: 'Cancel',
//       onOk: async () => {
//         try {
//           await api.delete(`/api/v1/candidates/${candidateId}`);
//           message.success('Candidate deleted successfully');
//           fetchCandidates();
//         } catch (error) {
//           message.error('Failed to delete candidate');
//         }
//       }
//     });
//   };

//   const columns: ColumnType<Candidate>[] = [
//     {
//       title: "Candidate",
//       key: "candidate_info",
//       render: (record: Candidate) => (
//         <div style={{ display: 'flex', alignItems: 'center' }}>
//           <Avatar
//             style={{ backgroundColor: getScoreColor(record.overall_score), marginRight: 12 }}
//             icon={<UserOutlined />}
//           >
//             {record.full_name?.charAt(0)?.toUpperCase()}
//           </Avatar>
//           <div>
//             <div style={{ fontWeight: 'bold' }}>{record.full_name}</div>
//             <div style={{ fontSize: '12px', color: '#666' }}>
//               {record.email}
//               {record.location && (
//                 <span style={{ marginLeft: 8 }}>
//                   <EnvironmentOutlined /> {record.location}
//                 </span>
//               )}
//             </div>
//           </div>
//         </div>
//       ),
//       sorter: (a: Candidate, b: Candidate) => (a.full_name || '').localeCompare(b.full_name || ''),
//       width: 250
//     },
//     {
//       title: "Scores",
//       key: "scores",
//       render: (record: Candidate) => (
//         <div>
//           <div style={{ marginBottom: 4 }}>
//             {getScoreIcon(record.overall_score)}
//             <span style={{ marginLeft: 4, fontWeight: 'bold' }}>
//               {record.overall_score}%
//             </span>
//           </div>
//           <div style={{ fontSize: '11px', color: '#666' }}>
//             Tech: {record.technical_score}% | Exp: {record.experience_score}%
//           </div>
//         </div>
//       ),
//       sorter: (a: Candidate, b: Candidate) => (a.overall_score || 0) - (b.overall_score || 0),
//       width: 120
//     },
//     {
//       title: "Status",
//       dataIndex: "status",
//       key: "status",
//       render: (status: string, record: Candidate) => (
//         <div>
//           <Tag color={STATUS_COLORS[status?.toLowerCase()] || STATUS_COLORS['new']}>
//             {status}
//           </Tag>
//           <div style={{ marginTop: 4 }}>
//             <Tag color={record.is_available ? 'green' : 'red'}>
//               {record.is_available ? 'Available' : 'Unavailable'}
//             </Tag>
//           </div>
//         </div>
//       ),
//       filters: [
//         { text: 'New', value: 'new' },
//         { text: 'Reviewed', value: 'reviewed' },
//         { text: 'Shortlisted', value: 'shortlisted' },
//         { text: 'Hired', value: 'hired' },
//         { text: 'Rejected', value: 'rejected' }
//       ],
//       onFilter: (value: any, record: Candidate) => record.status === value,
//       width: 120
//     },
//     {
//       title: "Skills & Experience",
//       key: "skills_exp",
//       render: (record: Candidate) => (
//         <div>
//           <div style={{ marginBottom: 4 }}>
//             <BookOutlined style={{ marginRight: 4 }} />
//             {record.skills?.length || 0} skills
//           </div>
//           <div style={{ fontSize: '11px', color: '#666' }}>
//             <CalendarOutlined style={{ marginRight: 4 }} />
//             {record.experience_years} years exp
//           </div>
//           {record.certifications && record.certifications.length > 0 && (
//             <div style={{ fontSize: '11px', color: '#666' }}>
//               <SafetyCertificateOutlined style={{ marginRight: 4 }} />
//               {record.certifications.length} certs
//             </div>
//           )}
//         </div>
//       ),
//       sorter: (a: Candidate, b: Candidate) => (a.experience_years || 0) - (b.experience_years || 0),
//       width: 150
//     },
//     {
//       title: "Source",
//       key: "source",
//       render: (record: Candidate) => (
//         <div>
//           <div style={{ fontSize: '12px' }}>
//             {record.source || 'Unknown'}
//           </div>
//           {record.created_at && (
//             <div style={{ fontSize: '11px', color: '#666' }}>
//               Added: {new Date(record.created_at).toLocaleDateString()}
//             </div>
//           )}
//         </div>
//       ),
//       width: 120
//     },
//     {
//       title: "Actions",
//       key: "actions",
//       render: (record: Candidate) => (
//         <Space size="small">
//           <Tooltip title="View Details">
//             <Button
//               icon={<EyeOutlined />}
//               size="small"
//               onClick={() => { setSelected(record); setDrawerOpen(true); }}
//             />
//           </Tooltip>
//           <Tooltip title="Edit">
//             <Button
//               icon={<EditOutlined />}
//               size="small"
//               onClick={() => { setSelected(record); setEditModalVisible(true); }}
//             />
//           </Tooltip>
//           <Tooltip title="Delete">
//             <Button
//               icon={<DeleteOutlined />}
//               size="small"
//               danger
//               onClick={() => deleteCandidate(record.candidate_id)}
//             />
//           </Tooltip>
//         </Space>
//       ),
//       width: 120,
//       fixed: 'right' as const
//     }
//   ];

//   const exportCandidates = () => {
//     const dataStr = JSON.stringify(candidates, null, 2);
//     const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
//     const file = `candidates_export_${new Date().toISOString().split('T')[0]}.json`;
//     const link = document.createElement('a');
//     link.setAttribute('href', dataUri);
//     link.setAttribute('download', file);
//     link.click();
//     message.success('Candidates exported successfully');
//   };

//   return (
//     <div style={{ padding: 24 }}>
//       {/* Enhanced Stats Dashboard */}
//       <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
//         <Col xs={12} sm={8} md={6} lg={4}>
//           <Card size="small">
//             <Statistic
//               title="Total Candidates"
//               value={stats.count}
//               prefix={<TeamOutlined />}
//               valueStyle={{ color: '#1890ff' }}
//             />
//           </Card>
//         </Col>
//         <Col xs={12} sm={8} md={6} lg={4}>
//           <Card size="small">
//             <Statistic
//               title="Avg Score"
//               value={stats.avgScore}
//               suffix="%"
//               prefix={<TrophyOutlined />}
//               valueStyle={{ color: getScoreColor(stats.avgScore) }}
//             />
//           </Card>
//         </Col>
//         <Col xs={12} sm={8} md={6} lg={4}>
//           <Card size="small">
//             <Statistic
//               title="Available"
//               value={stats.available}
//               prefix={<CheckCircleOutlined />}
//               valueStyle={{ color: '#52c41a' }}
//             />
//           </Card>
//         </Col>
//         <Col xs={12} sm={8} md={6} lg={4}>
//           <Card size="small">
//             <Statistic
//               title="Shortlisted"
//               value={stats.shortlisted}
//               prefix={<StarOutlined />}
//               valueStyle={{ color: '#1890ff' }}
//             />
//           </Card>
//         </Col>
//         <Col xs={12} sm={8} md={6} lg={4}>
//           <Card size="small">
//             <Statistic
//               title="Hired"
//               value={stats.hired}
//               prefix={<TrophyOutlined />}
//               valueStyle={{ color: '#52c41a' }}
//             />
//           </Card>
//         </Col>
//         <Col xs={12} sm={8} md={6} lg={4}>
//           <Card size="small">
//             <Statistic
//               title="Unique Skills"
//               value={stats.skillPool}
//               prefix={<BookOutlined />}
//               valueStyle={{ color: '#722ed1' }}
//             />
//           </Card>
//         </Col>
//       </Row>

//       {/* Secondary Stats */}
//       <Row gutter={[16, 8]} style={{ marginBottom: 16 }}>
//         <Col xs={12} sm={6}>
//           <Text type="secondary">Avg Experience: <strong>{stats.avgExp} years</strong></Text>
//         </Col>
//         <Col xs={12} sm={6}>
//           <Text type="secondary">Avg Tech Score: <strong>{stats.avgTechnicalScore}%</strong></Text>
//         </Col>
//         <Col xs={12} sm={6}>
//           <Text type="secondary">With Education: <strong>{stats.withEducation}</strong></Text>
//         </Col>
//         <Col xs={12} sm={6}>
//           <Text type="secondary">Recently Added: <strong>{stats.recentlyAdded}</strong></Text>
//         </Col>
//       </Row>

//       <Divider />

//       {/* Enhanced Filters */}
//       <Row gutter={[16, 8]} style={{ marginBottom: 16 }}>
//         <Col xs={24} sm={12} md={8} lg={6}>
//           <Input
//             allowClear
//             placeholder="Search candidates, skills, location..."
//             value={search}
//             onChange={e => setSearch(e.target.value)}
//             prefix={<SearchOutlined />}
//           />
//         </Col>
//         <Col xs={24} sm={12} md={8} lg={6}>
//           <Select
//             value={filterStatus}
//             style={{ width: "100%" }}
//             onChange={v => setFilterStatus(v)}
//             placeholder="Filter by Status"
//           >
//             <Option value="all">All Status</Option>
//             <Option value="new">New</Option>
//             <Option value="success">Success</Option>
//             <Option value="reviewed">Reviewed</Option>
//             <Option value="shortlisted">Shortlisted</Option>
//             <Option value="hired">Hired</Option>
//             <Option value="rejected">Rejected</Option>
//             <Option value="interviewing">Interviewing</Option>
//           </Select>
//         </Col>
//         <Col xs={24} sm={12} md={8} lg={6}>
//           <Select
//             value={filterAvailable}
//             style={{ width: "100%" }}
//             onChange={v => setFilterAvailable(v)}
//             placeholder="Filter by Availability"
//           >
//             <Option value="all">All Candidates</Option>
//             <Option value="available">Available Only</Option>
//             <Option value="unavailable">Unavailable Only</Option>
//           </Select>
//         </Col>
//         <Col xs={24} sm={12} md={8} lg={6}>
//           <Space>
//             <Button
//               icon={<DownloadOutlined />}
//               onClick={exportCandidates}
//               disabled={!candidates.length}
//             >
//               Export ({candidates.length})
//             </Button>
//             <Button onClick={fetchCandidates} loading={loading}>
//               Refresh
//             </Button>
//           </Space>
//         </Col>
//       </Row>

//       {/* Enhanced Table */}
//       <Card>
//         <Table
//           loading={loading}
//           bordered
//           size="middle"
//           columns={columns}
//           dataSource={candidates.filter(candidateFilter)}
//           rowKey="candidate_id"
//           pagination={{
//             pageSize: 10,
//             showSizeChanger: true,
//             showQuickJumper: true,
//             showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} candidates`
//           }}
//           scroll={{ x: 1200 }}
//           rowClassName={(record) => record.is_available ? '' : 'unavailable-candidate'}
//         />
//       </Card>

//       {/* Enhanced Details Drawer */}
//       <Drawer
//         title={
//           <div style={{ display: 'flex', alignItems: 'center' }}>
//             <Avatar
//               style={{ backgroundColor: getScoreColor(selected?.overall_score || 0), marginRight: 12 }}
//               icon={<UserOutlined />}
//             >
//               {selected?.full_name?.charAt(0)?.toUpperCase()}
//             </Avatar>
//             <div>
//               <div>{selected?.full_name}</div>
//               <div style={{ fontSize: '12px', color: '#666' }}>
//                 {selected?.email}
//               </div>
//             </div>
//           </div>
//         }
//         width={500}
//         open={drawerOpen}
//         onClose={() => setDrawerOpen(false)}
//         extra={
//           <Space>
//             <Button
//               type="primary"
//               size="small"
//               onClick={() => { setEditModalVisible(true); }}
//             >
//               Edit
//             </Button>
//           </Space>
//         }
//       >
//         {selected && (
//           <div>
//             <Row gutter={[16, 16]}>
//               {/* Contact Information */}
//               <Col span={24}>
//                 <Card size="small" title="Contact Information">
//                   <Space direction="vertical" style={{ width: '100%' }}>
//                     <div><MailOutlined /> <strong>Email:</strong> {selected.email || 'Not provided'}</div>
//                     {selected.phone && (
//                       <div><PhoneOutlined /> <strong>Phone:</strong> {selected.phone}</div>
//                     )}
//                     {selected.location && (
//                       <div><EnvironmentOutlined /> <strong>Location:</strong> {selected.location}</div>
//                     )}
//                     <div>
//                       <strong>Availability:</strong>
//                       <Switch
//                         size="small"
//                         checked={selected.is_available}
//                         onChange={(checked) => toggleAvailability(selected.candidate_id, checked)}
//                         style={{ marginLeft: 8 }}
//                       />
//                       <span style={{ marginLeft: 8 }}>
//                         {selected.is_available ? 'Available' : 'Unavailable'}
//                       </span>
//                     </div>
//                   </Space>
//                 </Card>
//               </Col>

//               {/* Scoring Information */}
//               <Col span={24}>
//                 <Card size="small" title="AI Scoring & Analysis">
//                   <Row gutter={16}>
//                     <Col span={8}>
//                       <div style={{ textAlign: 'center' }}>
//                         <div style={{ fontSize: '24px', fontWeight: 'bold', color: getScoreColor(selected.overall_score) }}>
//                           {selected.overall_score}%
//                         </div>
//                         <div style={{ fontSize: '12px', color: '#666' }}>Overall Score</div>
//                       </div>
//                     </Col>
//                     <Col span={8}>
//                       <div style={{ textAlign: 'center' }}>
//                         <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
//                           {selected.technical_score}%
//                         </div>
//                         <div style={{ fontSize: '12px', color: '#666' }}>Technical</div>
//                       </div>
//                     </Col>
//                     <Col span={8}>
//                       <div style={{ textAlign: 'center' }}>
//                         <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
//                           {selected.experience_score}%
//                         </div>
//                         <div style={{ fontSize: '12px', color: '#666' }}>Experience</div>
//                       </div>
//                     </Col>
//                   </Row>
//                   <Divider style={{ margin: '12px 0' }} />
//                   <div>
//                     <div style={{ marginBottom: 8 }}>
//                       <strong>Status:</strong>
//                       <Select
//                         size="small"
//                         value={selected.status}
//                         style={{ marginLeft: 8, minWidth: 120 }}
//                         onChange={(value) => updateCandidateStatus(selected.candidate_id, value)}
//                       >
//                         <Option value="new">New</Option>
//                         <Option value="reviewed">Reviewed</Option>
//                         <Option value="shortlisted">Shortlisted</Option>
//                         <Option value="interviewing">Interviewing</Option>
//                         <Option value="hired">Hired</Option>
//                         <Option value="rejected">Rejected</Option>
//                       </Select>
//                     </div>
//                     <div><strong>Experience:</strong> {selected.experience_years} years</div>
//                   </div>
//                 </Card>
//               </Col>

//               {/* Skills & Qualifications */}
//               <Col span={24}>
//                 <Card size="small" title="Skills & Qualifications">
//                   <div style={{ marginBottom: 12 }}>
//                     <strong>Skills ({selected.skills?.length || 0}):</strong>
//                     <div style={{ marginTop: 8 }}>
//                       {selected.skills && selected.skills.length > 0 ? (
//                         selected.skills.map((skill, index) => (
//                           <Tag key={index} style={{ marginBottom: 4 }}>
//                             {skill}
//                           </Tag>
//                         ))
//                       ) : (
//                         <Text type="secondary">No skills listed</Text>
//                       )}
//                     </div>
//                   </div>

//                   {selected.education && selected.education.length > 0 && (
//                     <div style={{ marginBottom: 12 }}>
//                       <strong>Education:</strong>
//                       <div style={{ marginTop: 4 }}>
//                         {selected.education.map((edu: any, index: number) => (
//                           <div key={index} style={{ fontSize: '12px', marginBottom: 2 }}>
//                             • {typeof edu === 'string' ? edu : JSON.stringify(edu)}
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   {selected.certifications && selected.certifications.length > 0 && (
//                     <div>
//                       <strong>Certifications:</strong>
//                       <div style={{ marginTop: 4 }}>
//                         {selected.certifications.map((cert: any, index: number) => (
//                           <Tag key={index} color="blue" style={{ marginBottom: 4 }}>
//                             {typeof cert === 'string' ? cert : JSON.stringify(cert)}
//                           </Tag>
//                         ))}
//                       </div>
//                     </div>
//                   )}
//                 </Card>
//               </Col>

//               {/* Source & Timeline */}
//               <Col span={24}>
//                 <Card size="small" title="Source & Timeline">
//                   <Space direction="vertical" style={{ width: '100%' }}>
//                     <div><strong>Source:</strong> {selected.source || 'Unknown'}</div>
//                     {selected.resume_filename && (
//                       <div><FileTextOutlined /> <strong>Resume:</strong> {selected.resume_filename}</div>
//                     )}
//                     {selected.created_at && (
//                       <div><strong>Added:</strong> {new Date(selected.created_at).toLocaleString()}</div>
//                     )}
//                     {selected.last_contacted && (
//                       <div><strong>Last Contacted:</strong> {new Date(selected.last_contacted).toLocaleString()}</div>
//                     )}
//                   </Space>
//                 </Card>
//               </Col>
//             </Row>
//           </div>
//         )}
//       </Drawer>

//       {/* Quick Edit Modal */}
//       <Modal
//         title="Quick Edit Candidate"
//         open={editModalVisible}
//         onCancel={() => setEditModalVisible(false)}
//         footer={null}
//       >
//         {selected && (
//           <div>
//             <p>Status:
//               <Select
//                 value={selected.status}
//                 style={{ marginLeft: 8, minWidth: 120 }}
//                 onChange={(value) => updateCandidateStatus(selected.candidate_id, value)}
//               >
//                 <Option value="new">New</Option>
//                 <Option value="reviewed">Reviewed</Option>
//                 <Option value="shortlisted">Shortlisted</Option>
//                 <Option value="interviewing">Interviewing</Option>
//                 <Option value="hired">Hired</Option>
//                 <Option value="rejected">Rejected</Option>
//               </Select>
//             </p>
//             <p>Availability:
//               <Switch
//                 checked={selected.is_available}
//                 onChange={(checked) => toggleAvailability(selected.candidate_id, checked)}
//                 style={{ marginLeft: 8 }}
//               />
//               {selected.is_available ? ' Available' : ' Unavailable'}
//             </p>
//           </div>
//         )}
//       </Modal>

//       <style>
//         {`
//           .unavailable-candidate {
//             background-color: #f5f5f5;
//             opacity: 0.8;
//           }
//         `}
//       </style>
//     </div>
//   );
// };

// export default CandidateDatabase;

import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Space, Button, Input, Select, Statistic, Row, Col, Modal, Drawer, Tooltip, Divider, Badge, Spin, message, Avatar, Typography, Switch, Progress
} from 'antd';
import { 
  UserOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined, DownloadOutlined, EyeOutlined, DeleteOutlined, EditOutlined,
  TrophyOutlined, TeamOutlined, SearchOutlined, CalendarOutlined, FileTextOutlined, GlobalOutlined, LinkedinOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined, ClockCircleOutlined, StarOutlined, BookOutlined, SafetyCertificateOutlined
} from '@ant-design/icons';
import api from '../services/api';
import type { ColumnType } from 'antd/es/table';

const { Option } = Select;
const { Text, Paragraph } = Typography;

// Enhanced interface matching your Candidate model with detailed info
export interface Candidate {
  candidate_id: string | number;
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  resume_filename?: string;
  resume_url?: string;
  resume_text?: string;
  skills: string[];
  experience_years: number;
  education: any[];
  certifications: any[];
  overall_score: number;
  technical_score: number;
  experience_score: number;
  status: string;
  is_available: boolean;
  source?: string;
  source_details?: any;
  created_at?: string;
  updated_at?: string;
  last_contacted?: string;
  skills_count?: number;
}

const STATUS_COLORS: { [k: string]: string } = {
  success: 'green',
  reviewed: 'blue',
  shortlisted: 'geekblue',
  rejected: 'volcano',
  hired: 'purple',
  available: 'gold',
  interviewing: 'orange',
  new: 'default'
};

function getScoreColor(score: number) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#ef4444';
  return '#6b7280';
}

function getScoreIcon(score: number) {
  if (score >= 80) return <CheckCircleOutlined style={{ color: '#10b981' }} />;
  if (score >= 60) return <ExclamationCircleOutlined style={{ color: '#f59e0b' }} />;
  return <ExclamationCircleOutlined style={{ color: '#ef4444' }} />;
}

const CandidateDatabase: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAvailable, setFilterAvailable] = useState('all');
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [updatingAvailability, setUpdatingAvailability] = useState<{ [key: string]: boolean }>({});
  const [loadingCandidateDetails, setLoadingCandidateDetails] = useState(false);

  // Fetch candidates from PostgreSQL (list view)
  const fetchCandidates = async () => {
    setLoading(true);
    try {
      console.log('📋 Fetching candidates from database...');
      const response = await api.get('/api/v1/candidates');
      
      if (response.data.success) {
        // Enhanced mapping to handle all fields properly
        const mappedCandidates = response.data.candidates.map((c: any) => {
          // Calculate skills count properly
          let skillsCount = 0;
          if (c.skills && Array.isArray(c.skills)) {
            skillsCount = c.skills.length;
          } else if (c.skills_count) {
            skillsCount = Number(c.skills_count);
          }

          return {
            candidate_id: c.candidate_id,
            full_name: c.candidate_name || c.full_name,
            email: c.email,
            phone: c.phone,
            location: c.location,
            resume_filename: c.filename || c.resume_filename,
            resume_url: c.resume_url,
            resume_text: c.resume_text,
            skills: Array.isArray(c.skills) ? c.skills : (Array.isArray(c.technical_skills) ? c.technical_skills : []),
            skills_count: skillsCount, // Computed field
            experience_years: Number(c.experience_years) || 0,
            education: Array.isArray(c.education) ? c.education : [],
            certifications: Array.isArray(c.certifications) ? c.certifications : [],
            overall_score: Number(c.score || c.overall_score) || 0,
            technical_score: Number(c.technical_score) || 0,
            experience_score: Number(c.experience_score) || 0,
            status: c.status || 'new',
            is_available: Boolean(c.is_available !== undefined ? c.is_available : true),
            source: c.source,
            source_details: c.source_details,
            created_at: c.created_at,
            updated_at: c.updated_at,
            last_contacted: c.last_contacted
          };
        });
        
        setCandidates(mappedCandidates);
        console.log(`✅ Loaded ${mappedCandidates.length} candidates`);
        
        // Log first candidate for debugging
        if (mappedCandidates.length > 0) {
          console.log('🔍 Sample candidate:', mappedCandidates[0]);
        }
      } else {
        console.error('Failed to fetch candidates:', response.data);
        setCandidates([]);
        message.error('Failed to load candidates');
      }
    } catch (error: any) {
      console.error('Failed to fetch candidates:', error);
      message.error('Failed to load candidates from database');
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  // New function to fetch detailed candidate information using the detailed endpoint
  const fetchCandidateDetails = async (candidateId: string | number) => {
    setLoadingCandidateDetails(true);
    try {
      console.log(`🔍 Fetching detailed info for candidate ${candidateId}`);
      const response = await api.get(`/api/v1/candidates/${candidateId}`);
      
      if (response.data.success) {
        const detailedCandidate: Candidate = {
          candidate_id: response.data.candidate.candidate_id,
          full_name: response.data.candidate.candidate_name,
          email: response.data.candidate.email,
          phone: response.data.candidate.phone,
          location: response.data.candidate.location,
          resume_filename: response.data.candidate.filename,
          resume_url: response.data.candidate.resume_url,
          resume_text: response.data.candidate.resume_text,
          status: response.data.candidate.status,
          overall_score: response.data.candidate.score,
          technical_score: response.data.candidate.technical_score,
          experience_score: response.data.candidate.experience_score,
          skills: response.data.candidate.skills || [],
          skills_count: response.data.candidate.skills_count,
          experience_years: response.data.candidate.experience_years,
          education: response.data.candidate.education || [],
          certifications: response.data.candidate.certifications || [],
          is_available: response.data.candidate.is_available,
          source: response.data.candidate.source,
          source_details: response.data.candidate.source_details,
          created_at: response.data.candidate.created_at,
          updated_at: response.data.candidate.updated_at,
          last_contacted: response.data.candidate.last_contacted
        };
        
        setSelected(detailedCandidate);
        console.log('✅ Detailed candidate info loaded:', detailedCandidate);
      } else {
        message.error('Failed to load candidate details');
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch candidate details:', error);
      message.error('Failed to load candidate details');
    } finally {
      setLoadingCandidateDetails(false);
    }
  };

  // Enhanced candidate viewing with detailed fetch
  const viewCandidateDetails = async (candidate: Candidate) => {
    setDrawerOpen(true);
    await fetchCandidateDetails(candidate.candidate_id);
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  // Enhanced stats calculation with proper skills counting
  const stats = {
    count: candidates.length,
    avgScore: candidates.length ? Number((candidates.reduce((sum, c) => sum + (c.overall_score || 0), 0) / candidates.length).toFixed(1)) : 0,
    shortlisted: candidates.filter(c => (c.status || '').toLowerCase() === 'shortlisted').length,
    hired: candidates.filter(c => (c.status || '').toLowerCase() === 'hired').length,
    available: candidates.filter(c => c.is_available).length,
    avgExp: candidates.length ? Number((candidates.reduce((sum, c) => sum + (c.experience_years || 0), 0) / candidates.length).toFixed(1)) : 0,
    skillPool: new Set(candidates.flatMap(c => c.skills || [])).size,
    avgTechnicalScore: candidates.length ? Number((candidates.reduce((sum, c) => sum + (c.technical_score || 0), 0) / candidates.length).toFixed(1)) : 0,
    withEducation: candidates.filter(c => c.education && c.education.length > 0).length,
    withCertifications: candidates.filter(c => c.certifications && c.certifications.length > 0).length,
    recentlyAdded: candidates.filter(c => {
      if (!c.created_at) return false;
      const createdDate = new Date(c.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdDate > weekAgo;
    }).length,
    totalSkillsCount: candidates.reduce((sum, c) => sum + (c.skills_count || 0), 0)
  };

  // Enhanced filtering
  const candidateFilter = (c: Candidate) => {
    const statusMatch = filterStatus === 'all' || (c.status || '').toLowerCase() === filterStatus;
    const availableMatch = filterAvailable === 'all' || 
      (filterAvailable === 'available' && c.is_available) ||
      (filterAvailable === 'unavailable' && !c.is_available);
    const searchMatch = !search || 
      c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.toLowerCase().includes(search.toLowerCase()) ||
      c.location?.toLowerCase().includes(search.toLowerCase()) ||
      c.resume_filename?.toLowerCase().includes(search.toLowerCase()) ||
      c.skills?.some(skill => skill.toLowerCase().includes(search.toLowerCase()));

    return statusMatch && availableMatch && searchMatch;
  };

  // Update candidate status
  const updateCandidateStatus = async (candidateId: string | number, newStatus: string) => {
    try {
      await api.put(`/api/v1/candidates/${candidateId}`, { status: newStatus });
      message.success('Status updated successfully');
      
      // Update local state immediately for better UX
      setCandidates(prev => prev.map(candidate => 
        candidate.candidate_id === candidateId 
          ? { ...candidate, status: newStatus }
          : candidate
      ));
      
      // Update selected candidate if it's the same one
      if (selected && selected.candidate_id === candidateId) {
        setSelected(prev => prev ? { ...prev, status: newStatus } : null);
      }
      
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  // Fixed toggle availability with proper UI state management
  const toggleAvailability = async (candidateId: string | number, isAvailable: boolean) => {
    const key = String(candidateId);
    setUpdatingAvailability(prev => ({ ...prev, [key]: true }));
    
    try {
      console.log(`🔄 Toggling availability for candidate ${candidateId}: ${isAvailable}`);
      
      await api.put(`/api/v1/candidates/${candidateId}`, { is_available: isAvailable });
      
      // Update local state immediately for better UX
      setCandidates(prev => prev.map(candidate => 
        candidate.candidate_id === candidateId 
          ? { ...candidate, is_available: isAvailable }
          : candidate
      ));
      
      // Update selected candidate if it's the same one
      if (selected && selected.candidate_id === candidateId) {
        setSelected(prev => prev ? { ...prev, is_available: isAvailable } : null);
      }
      
      message.success(`Candidate marked as ${isAvailable ? 'available' : 'unavailable'}`);
      
    } catch (error) {
      console.error('❌ Failed to update availability:', error);
      message.error('Failed to update availability');
    } finally {
      setUpdatingAvailability(prev => ({ ...prev, [key]: false }));
    }
  };

  // Delete candidate
  const deleteCandidate = (candidateId: string | number) => {
    Modal.confirm({
      title: 'Delete Candidate',
      content: 'Are you sure you want to delete this candidate? This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await api.delete(`/api/v1/candidates/${candidateId}`);
          message.success('Candidate deleted successfully');
          fetchCandidates();
          
          // Close drawer if deleted candidate was selected
          if (selected && selected.candidate_id === candidateId) {
            setDrawerOpen(false);
            setSelected(null);
          }
        } catch (error) {
          message.error('Failed to delete candidate');
        }
      }
    });
  };

  // Enhanced table columns with proper skills display
  const columns: ColumnType<Candidate>[] = [
    {
      title: "Candidate",
      key: "candidate_info",
      render: (record: Candidate) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            style={{ backgroundColor: getScoreColor(record.overall_score), marginRight: 12 }}
            icon={<UserOutlined />}
          >
            {record.full_name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.full_name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.email}
              {record.location && (
                <span style={{ marginLeft: 8 }}>
                  <EnvironmentOutlined /> {record.location}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
      sorter: (a: Candidate, b: Candidate) => (a.full_name || '').localeCompare(b.full_name || ''),
      width: 250
    },
    {
      title: "Scores",
      key: "scores",
      render: (record: Candidate) => (
        <div>
          <div style={{ marginBottom: 4 }}>
            {getScoreIcon(record.overall_score)}
            <span style={{ marginLeft: 4, fontWeight: 'bold' }}>
              {record.overall_score}%
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#666' }}>
            Tech: {record.technical_score}% | Exp: {record.experience_score}%
          </div>
        </div>
      ),
      sorter: (a: Candidate, b: Candidate) => (a.overall_score || 0) - (b.overall_score || 0),
      width: 120
    },
    {
      title: "Status & Availability",
      key: "status_availability",
      render: (record: Candidate) => {
        const isUpdating = updatingAvailability[String(record.candidate_id)];
        return (
          <div>
            <div style={{ marginBottom: 8 }}>
              <Tag color={STATUS_COLORS[record.status?.toLowerCase()] || STATUS_COLORS['new']}>
                {record.status}
              </Tag>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Switch 
                size="small"
                checked={record.is_available}
                loading={isUpdating}
                onChange={(checked) => toggleAvailability(record.candidate_id, checked)}
                style={{ marginRight: 8 }}
              />
              <Text type={record.is_available ? 'success' : 'secondary'} style={{ fontSize: '11px' }}>
                {record.is_available ? 'Available' : 'Unavailable'}
              </Text>
            </div>
          </div>
        );
      },
      filters: [
        { text: 'Available', value: 'available' },
        { text: 'Unavailable', value: 'unavailable' }
      ],
      onFilter: (value: any, record: Candidate) => 
        value === 'available' ? record.is_available : !record.is_available,
      width: 140
    },
    {
      title: "Skills & Experience",
      key: "skills_exp",
      render: (record: Candidate) => {
        const skillsCount = record.skills_count || record.skills?.length || 0;
        return (
          <div>
            <div style={{ marginBottom: 4 }}>
              <BookOutlined style={{ marginRight: 4, color: '#1890ff' }} />
              <strong>{skillsCount}</strong> skills
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: 2 }}>
              <CalendarOutlined style={{ marginRight: 4 }} />
              {record.experience_years} years exp
            </div>
            {record.certifications && record.certifications.length > 0 && (
              <div style={{ fontSize: '11px', color: '#666' }}>
                <SafetyCertificateOutlined style={{ marginRight: 4 }} />
                {record.certifications.length} certs
              </div>
            )}
            {/* Show top skills if available */}
            {record.skills && record.skills.length > 0 && (
              <div style={{ marginTop: 4 }}>
                {record.skills.slice(0, 3).map((skill, index) => (
                  <Tag key={index}style={{ fontSize: '10px', marginBottom: 2 }}>
                    {skill}
                  </Tag>
                ))}
                {record.skills.length > 3 && (
                  <Text type="secondary" style={{ fontSize: '10px' }}>
                    +{record.skills.length - 3} more
                  </Text>
                )}
              </div>
            )}
          </div>
        );
      },
      sorter: (a: any, b: any) => (a.experience_years || 0) - (b.experience_years || 0),
      width: 200
    },
    {
      title: "Source",
      key: "source",
      render: (record: Candidate) => (
        <div>
          <div style={{ fontSize: '12px' }}>
            {record.source || 'Unknown'}
          </div>
          {record.created_at && (
            <div style={{ fontSize: '11px', color: '#666' }}>
              Added: {new Date(record.created_at).toLocaleDateString()}
            </div>
          )}
        </div>
      ),
      width: 120
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: Candidate) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button 
              icon={<EyeOutlined />} 
              size="small" 
              onClick={() => viewCandidateDetails(record)} 
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button 
              icon={<EditOutlined />} 
              size="small" 
              onClick={() => { setSelected(record); setEditModalVisible(true); }} 
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button 
              icon={<DeleteOutlined />} 
              size="small" 
              danger 
              onClick={() => deleteCandidate(record.candidate_id)} 
            />
          </Tooltip>
        </Space>
      ),
      width: 120,
      fixed: 'right'
    }
  ];

  const exportCandidates = () => {
    const dataStr = JSON.stringify(candidates, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const file = `candidates_export_${new Date().toISOString().split('T')[0]}.json`;
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', file);
    link.click();
    message.success('Candidates exported successfully');
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Enhanced Stats Dashboard */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small">
            <Statistic 
              title="Total Candidates" 
              value={stats.count} 
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small">
            <Statistic 
              title="Avg Score" 
              value={stats.avgScore} 
              suffix="%" 
              prefix={<TrophyOutlined />}
              valueStyle={{ color: getScoreColor(stats.avgScore) }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small">
            <Statistic 
              title="Available" 
              value={stats.available} 
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small">
            <Statistic 
              title="Shortlisted" 
              value={stats.shortlisted}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small">
            <Statistic 
              title="Hired" 
              value={stats.hired}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small">
            <Statistic 
              title="Unique Skills" 
              value={stats.skillPool}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Secondary Stats */}
      <Row gutter={[16, 8]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Text type="secondary">Avg Experience: <strong>{stats.avgExp} years</strong></Text>
        </Col>
        <Col xs={12} sm={6}>
          <Text type="secondary">Total Skills: <strong>{stats.totalSkillsCount}</strong></Text>
        </Col>
        <Col xs={12} sm={6}>
          <Text type="secondary">With Education: <strong>{stats.withEducation}</strong></Text>
        </Col>
        <Col xs={12} sm={6}>
          <Text type="secondary">Recently Added: <strong>{stats.recentlyAdded}</strong></Text>
        </Col>
      </Row>

      <Divider />

      {/* Enhanced Filters */}
      <Row gutter={[16, 8]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Input 
            allowClear 
            placeholder="Search candidates, skills, location..."
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            prefix={<SearchOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Select 
            value={filterStatus} 
            style={{ width: "100%" }} 
            onChange={v => setFilterStatus(v)}
            placeholder="Filter by Status"
          >
            <Option value="all">All Status</Option>
            <Option value="new">New</Option>
            <Option value="success">Success</Option>
            <Option value="reviewed">Reviewed</Option>
            <Option value="shortlisted">Shortlisted</Option>
            <Option value="hired">Hired</Option>
            <Option value="rejected">Rejected</Option>
            <Option value="interviewing">Interviewing</Option>
          </Select>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Select 
            value={filterAvailable} 
            style={{ width: "100%" }} 
            onChange={v => setFilterAvailable(v)}
            placeholder="Filter by Availability"
          >
            <Option value="all">All Candidates</Option>
            <Option value="available">Available Only</Option>
            <Option value="unavailable">Unavailable Only</Option>
          </Select>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Space>
            <Button 
              icon={<DownloadOutlined />} 
              onClick={exportCandidates} 
              disabled={!candidates.length}
            >
              Export ({candidates.length})
            </Button>
            <Button onClick={fetchCandidates} loading={loading}>
              Refresh
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Enhanced Table */}
      <Card>
        <Table
          loading={loading}
          bordered 
          size="middle"
          columns={columns}
          dataSource={candidates.filter(candidateFilter)}
          rowKey="candidate_id"
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} candidates`
          }}
          scroll={{ x: 1200 }}
          rowClassName={(record) => record.is_available ? '' : 'unavailable-candidate'}
        />
      </Card>

      {/* Enhanced Details Drawer with Detailed Information */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              style={{ backgroundColor: getScoreColor(selected?.overall_score || 0), marginRight: 12 }}
              icon={<UserOutlined />}
            >
              {selected?.full_name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <div>
              <div>{selected?.full_name}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {selected?.email}
              </div>
            </div>
          </div>
        }
        width={600}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        loading={loadingCandidateDetails}
        extra={
          <Space>
            <Button 
              type="primary" 
              size="small"
              onClick={() => { setEditModalVisible(true); }}
            >
              Edit
            </Button>
          </Space>
        }
      >
        {selected && (
          <div>
            <Row gutter={[16, 16]}>
              {/* Contact Information */}
              <Col span={24}>
                <Card size="small" title="📞 Contact Information">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div><MailOutlined /> <strong>Email:</strong> {selected.email || 'Not provided'}</div>
                    {selected.phone && (
                      <div><PhoneOutlined /> <strong>Phone:</strong> {selected.phone}</div>
                    )}
                    {selected.location && (
                      <div><EnvironmentOutlined /> <strong>Location:</strong> {selected.location}</div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <strong>Availability:</strong> 
                      <Switch 
                        size="small" 
                        checked={selected.is_available} 
                        loading={updatingAvailability[String(selected.candidate_id)]}
                        onChange={(checked) => toggleAvailability(selected.candidate_id, checked)}
                        style={{ marginLeft: 8, marginRight: 8 }}
                      />
                      <span style={{ color: selected.is_available ? '#52c41a' : '#ff4d4f' }}>
                        {selected.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </Space>
                </Card>
              </Col>

              {/* Scoring Information */}
              <Col span={24}>
                <Card size="small" title="🎯 AI Scoring & Analysis">
                  <Row gutter={16}>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: getScoreColor(selected.overall_score) }}>
                          {selected.overall_score}%
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Overall Score</div>
                      </div>
                    </Col>
                    {selected.technical_score && (
                      <Col span={8}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
                            {selected.technical_score}%
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>Technical</div>
                        </div>
                      </Col>
                    )}
                    {selected.experience_score && (
                      <Col span={8}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                            {selected.experience_score}%
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>Experience</div>
                        </div>
                      </Col>
                    )}
                  </Row>
                  <Divider style={{ margin: '12px 0' }} />
                  <div>
                    <div style={{ marginBottom: 8 }}>
                      <strong>Status:</strong> 
                      <Select 
                        size="small"
                        value={selected.status}
                        style={{ marginLeft: 8, minWidth: 120 }}
                        onChange={(value) => updateCandidateStatus(selected.candidate_id, value)}
                      >
                        <Option value="new">New</Option>
                        <Option value="reviewed">Reviewed</Option>
                        <Option value="shortlisted">Shortlisted</Option>
                        <Option value="interviewing">Interviewing</Option>
                        <Option value="hired">Hired</Option>
                        <Option value="rejected">Rejected</Option>
                      </Select>
                    </div>
                    <div><strong>Experience:</strong> {selected.experience_years} years</div>
                  </div>
                </Card>
              </Col>

              {/* Skills & Qualifications */}
              <Col span={24}>
                <Card size="small" title="🛠️ Skills & Qualifications">
                  <div style={{ marginBottom: 12 }}>
                    <strong>Skills ({selected.skills_count || selected.skills?.length || 0}):</strong>
                    <div style={{ marginTop: 8 }}>
                      {selected.skills && selected.skills.length > 0 ? (
                        selected.skills.map((skill, index) => (
                          <Tag key={index} style={{ marginBottom: 4 }}>
                            {skill}
                          </Tag>
                        ))
                      ) : (
                        <Text type="secondary">No skills listed</Text>
                      )}
                    </div>
                  </div>
                  
                  {selected.education && selected.education.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <strong>🎓 Education:</strong>
                      <div style={{ marginTop: 4 }}>
                        {selected.education.map((edu: any, index: number) => (
                          <div key={index} style={{ fontSize: '12px', marginBottom: 2 }}>
                            • {typeof edu === 'string' ? edu : JSON.stringify(edu)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selected.certifications && selected.certifications.length > 0 && (
                    <div>
                      <strong>🏆 Certifications:</strong>
                      <div style={{ marginTop: 4 }}>
                        {selected.certifications.map((cert: any, index: number) => (
                          <Tag key={index} color="blue" style={{ marginBottom: 4 }}>
                            {typeof cert === 'string' ? cert : JSON.stringify(cert)}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </Col>

              {/* Resume Content */}
              {selected.resume_text && (
                <Col span={24}>
                  <Card size="small" title="📄 Resume Content">
                    <Paragraph 
                      ellipsis={{ rows: 6, expandable: true, symbol: 'Show more' }}
                      style={{ fontSize: '12px', marginBottom: 0 }}
                    >
                      {selected.resume_text}
                    </Paragraph>
                  </Card>
                </Col>
              )}

              {/* Source & Timeline */}
              <Col span={24}>
                <Card size="small" title="📊 Source & Timeline">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div><strong>Source:</strong> {selected.source || 'Unknown'}</div>
                    {selected.resume_filename && (
                      <div><FileTextOutlined /> <strong>Resume File:</strong> {selected.resume_filename}</div>
                    )}
                    {selected.resume_url && (
                      <div>
                        <GlobalOutlined /> <strong>Resume URL:</strong> 
                        <a href={selected.resume_url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8 }}>
                          View Resume
                        </a>
                      </div>
                    )}
                    {selected.created_at && (
                      <div><strong>Added:</strong> {new Date(selected.created_at).toLocaleString()}</div>
                    )}
                    {selected.last_contacted && (
                      <div><strong>Last Contacted:</strong> {new Date(selected.last_contacted).toLocaleString()}</div>
                    )}
                  </Space>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Drawer>

      {/* Quick Edit Modal */}
      <Modal
        title="Quick Edit Candidate"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        {selected && (
          <div>
            <p>Status: 
              <Select 
                value={selected.status}
                style={{ marginLeft: 8, minWidth: 120 }}
                onChange={(value) => updateCandidateStatus(selected.candidate_id, value)}
              >
                <Option value="new">New</Option>
                <Option value="reviewed">Reviewed</Option>
                <Option value="shortlisted">Shortlisted</Option>
                <Option value="interviewing">Interviewing</Option>
                <Option value="hired">Hired</Option>
                <Option value="rejected">Rejected</Option>
              </Select>
            </p>
            <p style={{ display: 'flex', alignItems: 'center' }}>
              Availability: 
              <Switch 
                checked={selected.is_available} 
                loading={updatingAvailability[String(selected.candidate_id)]}
                onChange={(checked) => toggleAvailability(selected.candidate_id, checked)}
                style={{ marginLeft: 8, marginRight: 8 }}
              />
              <span style={{ color: selected.is_available ? '#52c41a' : '#ff4d4f' }}>
                {selected.is_available ? 'Available' : 'Unavailable'}
              </span>
            </p>
          </div>
        )}
      </Modal>

      <style>{`
        .unavailable-candidate {
          background-color: #f5f5f5;
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
};

export default CandidateDatabase;
