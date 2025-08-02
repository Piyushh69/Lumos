import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, Select, 
  Row, Col, Typography, message, notification, Popconfirm, Tooltip,
  Drawer, Radio, Checkbox, Switch, Badge, Tabs, List, Avatar,
  Divider, Progress, Rate, Timeline, Collapse, InputNumber
} from 'antd';
import {
  FolderOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  CopyOutlined, EyeOutlined, DownloadOutlined, ShareAltOutlined,
  StarOutlined, TagsOutlined, UserOutlined, ClockCircleOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined, FileTextOutlined,
  TeamOutlined, DollarOutlined, EnvironmentOutlined, CalendarOutlined
} from '@ant-design/icons';
import api from '../services/api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Option } = Select;
const { Panel } = Collapse;

interface JobDescription {
  id: number;
  title: string;
  department: string;
  level: string;
  location: string;
  employment_type: string;
  salary_range: {
    min: number;
    max: number;
    currency: string;
  };
  description: string;
  responsibilities: string[];
  requirements: string[];
  nice_to_have: string[];
  benefits: string[];
  skills: string[];
  experience_years: {
    min: number;
    max: number;
  };
  status: 'draft' | 'active' | 'closed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  applications_count: number;
  views_count: number;
  is_featured: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  deadline?: string;
  tags: string[];
}

const JDDatabase: React.FC = () => {
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedJD, setSelectedJD] = useState<JobDescription | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadJobDescriptions();
  }, []);

  const generateMockJDs = (): JobDescription[] => [
    {
      id: 1,
      title: 'Senior Software Engineer',
      department: 'Engineering',
      level: 'Senior',
      location: 'Bengaluru, India',
      employment_type: 'Full-time',
      salary_range: { min: 1800000, max: 2500000, currency: 'INR' },
      description: 'We are looking for a passionate Senior Software Engineer...',
      responsibilities: [
        'Design and develop scalable web applications',
        'Mentor junior developers',
        'Participate in code reviews',
        'Collaborate with cross-functional teams'
      ],
      requirements: [
        '5+ years of software development experience',
        'Strong knowledge of React, Node.js, and TypeScript',
        'Experience with cloud platforms (AWS/Azure)',
        'Excellent problem-solving skills'
      ],
      nice_to_have: [
        'Experience with microservices architecture',
        'Knowledge of DevOps practices',
        'Open source contributions'
      ],
      benefits: [
        'Competitive salary and equity',
        'Health insurance',
        'Flexible working hours',
        'Learning and development budget'
      ],
      skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'MongoDB'],
      experience_years: { min: 5, max: 8 },
      status: 'active',
      priority: 'high',
      applications_count: 67,
      views_count: 234,
      is_featured: true,
      created_by: 'HR Team',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-03-20T14:30:00Z',
      published_at: '2024-01-16T09:00:00Z',
      deadline: '2024-04-15T23:59:59Z',
      tags: ['engineering', 'senior', 'react', 'full-stack']
    },
    {
      id: 2,
      title: 'Product Manager',
      department: 'Product',
      level: 'Mid',
      location: 'Remote',
      employment_type: 'Full-time',
      salary_range: { min: 1500000, max: 2000000, currency: 'INR' },
      description: 'Join our product team to drive innovation and strategy...',
      responsibilities: [
        'Define product strategy and roadmap',
        'Work with engineering teams to deliver features',
        'Analyze market trends and user feedback',
        'Coordinate product launches'
      ],
      requirements: [
        '3+ years of product management experience',
        'Strong analytical skills',
        'Experience with agile methodologies',
        'Excellent communication skills'
      ],
      nice_to_have: [
        'Technical background',
        'Experience in B2B SaaS',
        'Data analysis skills'
      ],
      benefits: [
        'Stock options',
        'Health insurance',
        'Remote work flexibility',
        'Conference attendance budget'
      ],
      skills: ['Product Strategy', 'Analytics', 'Agile', 'User Research'],
      experience_years: { min: 3, max: 6 },
      status: 'active',
      priority: 'medium',
      applications_count: 43,
      views_count: 189,
      is_featured: false,
      created_by: 'Product Team',
      created_at: '2024-02-10T09:15:00Z',
      updated_at: '2024-03-18T16:20:00Z',
      published_at: '2024-02-11T10:00:00Z',
      tags: ['product', 'strategy', 'analytics', 'remote']
    }
  ];

  const loadJobDescriptions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/job-descriptions');
      if (response.data.success) {
        setJobDescriptions(response.data.jobs || []);
      } else {
        // Use mock data for demo
        setJobDescriptions(generateMockJDs());
      }
    } catch (error) {
      console.error('Failed to load job descriptions:', error);
      setJobDescriptions(generateMockJDs());
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: any) => {
    try {
      setLoading(true);
      
      const jdData = {
        ...values,
        salary_range: {
          min: values.salary_min,
          max: values.salary_max,
          currency: values.currency || 'INR'
        },
        experience_years: {
          min: values.experience_min,
          max: values.experience_max
        },
        responsibilities: values.responsibilities?.split('\n').filter(Boolean) || [],
        requirements: values.requirements?.split('\n').filter(Boolean) || [],
        nice_to_have: values.nice_to_have?.split('\n').filter(Boolean) || [],
        benefits: values.benefits?.split('\n').filter(Boolean) || [],
        skills: values.skills || [],
        tags: values.tags || []
      };

      if (selectedJD) {
        await api.put(`/api/v1/job-descriptions/${selectedJD.id}`, jdData);
        notification.success({
          message: 'Job Description Updated',
          description: 'Job description has been updated successfully!'
        });
      } else {
        await api.post('/api/v1/job-descriptions', jdData);
        notification.success({
          message: 'Job Description Created',
          description: 'New job description has been created successfully!'
        });
      }

      setModalVisible(false);
      form.resetFields();
      setSelectedJD(null);
      await loadJobDescriptions();
    } catch (error) {
      message.error('Failed to save job description');
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatured = async (jd: JobDescription) => {
    try {
      await api.patch(`/api/v1/job-descriptions/${jd.id}/featured`, {
        is_featured: !jd.is_featured
      });
      await loadJobDescriptions();
      message.success(`Job ${jd.is_featured ? 'removed from' : 'added to'} featured`);
    } catch (error) {
      message.error('Failed to update featured status');
    }
  };

  const duplicateJD = (jd: JobDescription) => {
    form.setFieldsValue({
      title: `${jd.title} (Copy)`,
      department: jd.department,
      level: jd.level,
      location: jd.location,
      employment_type: jd.employment_type,
      salary_min: jd.salary_range.min,
      salary_max: jd.salary_range.max,
      currency: jd.salary_range.currency,
      description: jd.description,
      responsibilities: jd.responsibilities.join('\n'),
      requirements: jd.requirements.join('\n'),
      nice_to_have: jd.nice_to_have.join('\n'),
      benefits: jd.benefits.join('\n'),
      skills: jd.skills,
      experience_min: jd.experience_years.min,
      experience_max: jd.experience_years.max,
      priority: jd.priority,
      tags: jd.tags
    });
    setSelectedJD(null);
    setModalVisible(true);
  };

  const filteredJDs = jobDescriptions.filter(jd => {
    const matchesSearch = !searchText || 
      jd.title.toLowerCase().includes(searchText.toLowerCase()) ||
      jd.description.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesDepartment = !departmentFilter || jd.department === departmentFilter;
    const matchesStatus = !statusFilter || jd.status === statusFilter;
    
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'active' && jd.status === 'active') ||
      (activeTab === 'featured' && jd.is_featured) ||
      (activeTab === 'draft' && jd.status === 'draft');
    
    return matchesSearch && matchesDepartment && matchesStatus && matchesTab;
  });

  const columns = [
    {
      title: 'Job Title',
      key: 'title',
      render: (record: JobDescription) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text strong>{record.title}</Text>
            {record.is_featured && <StarOutlined style={{ color: '#faad14' }} />}
            <Tag color={getStatusColor(record.status)}>{record.status}</Tag>
          </div>
          <div style={{ marginTop: 4 }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <EnvironmentOutlined /> {record.location} • <TeamOutlined /> {record.department}
            </Text>
          </div>
          <div style={{ marginTop: 4 }}>
            {record.tags.map(tag => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'Level & Type',
      key: 'level',
      render: (record: JobDescription) => (
        <div>
          <Tag color="blue">{record.level}</Tag>
          <div style={{ marginTop: 4 }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.employment_type}
            </Text>
          </div>
        </div>
      )
    },
    {
      title: 'Salary Range',
      key: 'salary',
      render: (record: JobDescription) => (
        <div>
          <Text strong>
            ₹{(record.salary_range.min / 100000).toFixed(1)}L - ₹{(record.salary_range.max / 100000).toFixed(1)}L
          </Text>
          <div style={{ marginTop: 4 }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.experience_years.min}-{record.experience_years.max} years exp
            </Text>
          </div>
        </div>
      )
    },
    {
      title: 'Applications',
      key: 'applications',
      render: (record: JobDescription) => (
        <div>
          <Badge count={record.applications_count} style={{ backgroundColor: '#52c41a' }}>
            <UserOutlined style={{ fontSize: 16 }} />
          </Badge>
          <div style={{ marginTop: 4 }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.views_count} views
            </Text>
          </div>
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
      render: (record: JobDescription) => (
        <Space>
          <Tooltip title="View Details">
            <Button 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedJD(record);
                setDetailsVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedJD(record);
                form.setFieldsValue({
                  ...record,
                  salary_min: record.salary_range.min,
                  salary_max: record.salary_range.max,
                  currency: record.salary_range.currency,
                  experience_min: record.experience_years.min,
                  experience_max: record.experience_years.max,
                  responsibilities: record.responsibilities.join('\n'),
                  requirements: record.requirements.join('\n'),
                  nice_to_have: record.nice_to_have.join('\n'),
                  benefits: record.benefits.join('\n')
                });
                setModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Duplicate">
            <Button 
              size="small" 
              icon={<CopyOutlined />}
              onClick={() => duplicateJD(record)}
            />
          </Tooltip>
          <Tooltip title={record.is_featured ? "Remove from featured" : "Mark as featured"}>
            <Button 
              size="small" 
              icon={<StarOutlined />}
              type={record.is_featured ? "primary" : "default"}
              onClick={() => toggleFeatured(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this job description?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Tooltip title="Delete">
              <Button 
                size="small" 
                icon={<DeleteOutlined />}
                danger
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/v1/job-descriptions/${id}`);
      message.success('Job description deleted successfully');
      await loadJobDescriptions();
    } catch (error) {
      message.error('Failed to delete job description');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'default',
      active: 'green',
      closed: 'red',
      archived: 'orange'
    };
    return colors[status as keyof typeof colors];
  };

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <FolderOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          JD Database
        </Title>
        <Paragraph>
          Comprehensive job description management system with templates, analytics, and collaboration features.
        </Paragraph>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <FolderOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              <div style={{ marginTop: 8 }}>
                <Title level={4} style={{ margin: 0 }}>{jobDescriptions.length}</Title>
                <Text type="secondary">Total JDs</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
              <div style={{ marginTop: 8 }}>
                <Title level={4} style={{ margin: 0 }}>
                  {jobDescriptions.filter(jd => jd.status === 'active').length}
                </Title>
                <Text type="secondary">Active Jobs</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <UserOutlined style={{ fontSize: 24, color: '#722ed1' }} />
              <div style={{ marginTop: 8 }}>
                <Title level={4} style={{ margin: 0 }}>
                  {jobDescriptions.reduce((sum, jd) => sum + jd.applications_count, 0)}
                </Title>
                <Text type="secondary">Total Applications</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <StarOutlined style={{ fontSize: 24, color: '#faad14' }} />
              <div style={{ marginTop: 8 }}>
                <Title level={4} style={{ margin: 0 }}>
                  {jobDescriptions.filter(jd => jd.is_featured).length}
                </Title>
                <Text type="secondary">Featured Jobs</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
          <TabPane tab="All Jobs" key="all" />
          <TabPane tab="Active" key="active" />
          <TabPane tab="Featured" key="featured" />
          <TabPane tab="Drafts" key="draft" />
        </Tabs>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Space>
            <Input.Search
              placeholder="Search job descriptions..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />
            <Select
              placeholder="Filter by Department"
              allowClear
              style={{ width: 150 }}
              value={departmentFilter}
              onChange={setDepartmentFilter}
            >
              <Option value="Engineering">Engineering</Option>
              <Option value="Product">Product</Option>
              <Option value="Design">Design</Option>
              <Option value="Sales">Sales</Option>
              <Option value="Marketing">Marketing</Option>
              <Option value="HR">HR</Option>
            </Select>
            <Select
              placeholder="Filter by Status"
              allowClear
              style={{ width: 130 }}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="active">Active</Option>
              <Option value="draft">Draft</Option>
              <Option value="closed">Closed</Option>
              <Option value="archived">Archived</Option>
            </Select>
          </Space>

          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedJD(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            Create Job Description
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredJDs}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} job descriptions`
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={selectedJD ? 'Edit Job Description' : 'Create Job Description'}
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedJD(null);
          form.resetFields();
        }}
        width={1000}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="Job Title"
                rules={[{ required: true, message: 'Please enter job title' }]}
              >
                <Input placeholder="e.g. Senior Software Engineer" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="department"
                label="Department"
                rules={[{ required: true, message: 'Please select department' }]}
              >
                <Select placeholder="Select department">
                  <Option value="Engineering">Engineering</Option>
                  <Option value="Product">Product</Option>
                  <Option value="Design">Design</Option>
                  <Option value="Sales">Sales</Option>
                  <Option value="Marketing">Marketing</Option>
                  <Option value="HR">HR</Option>
                  <Option value="Finance">Finance</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="level"
                label="Level"
                rules={[{ required: true, message: 'Please select level' }]}
              >
                <Select placeholder="Select level">
                  <Option value="Intern">Intern</Option>
                  <Option value="Junior">Junior</Option>
                  <Option value="Mid">Mid</Option>
                  <Option value="Senior">Senior</Option>
                  <Option value="Lead">Lead</Option>
                  <Option value="Manager">Manager</Option>
                  <Option value="Director">Director</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="employment_type"
                label="Employment Type"
                rules={[{ required: true, message: 'Please select employment type' }]}
              >
                <Select placeholder="Select type">
                  <Option value="Full-time">Full-time</Option>
                  <Option value="Part-time">Part-time</Option>
                  <Option value="Contract">Contract</Option>
                  <Option value="Freelance">Freelance</Option>
                  <Option value="Internship">Internship</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="location"
                label="Location"
                rules={[{ required: true, message: 'Please enter location' }]}
              >
                <Input placeholder="e.g. Bengaluru, India" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="salary_min"
                label="Min Salary (₹)"
                rules={[{ required: true, message: 'Please enter minimum salary' }]}
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  placeholder="1500000"
                  formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/₹\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="salary_max"
                label="Max Salary (₹)"
                rules={[{ required: true, message: 'Please enter maximum salary' }]}
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  placeholder="2500000"
                  formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/₹\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="experience_min"
                label="Min Experience (Years)"
                rules={[{ required: true, message: 'Please enter minimum experience' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="3" min={0} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="experience_max"
                label="Max Experience (Years)"
                rules={[{ required: true, message: 'Please enter maximum experience' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="8" min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
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
            <Col span={12}>
              <Form.Item
                name="skills"
                label="Required Skills"
              >
                <Select 
                  mode="tags" 
                  placeholder="Add skills"
                  style={{ width: '100%' }}
                >
                  <Option value="JavaScript">JavaScript</Option>
                  <Option value="React">React</Option>
                  <Option value="Node.js">Node.js</Option>
                  <Option value="Python">Python</Option>
                  <Option value="AWS">AWS</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Job Description"
            rules={[{ required: true, message: 'Please enter job description' }]}
          >
            <TextArea rows={4} placeholder="Brief overview of the role and company..." />
          </Form.Item>

          <Form.Item
            name="responsibilities"
            label="Key Responsibilities"
            rules={[{ required: true, message: 'Please enter responsibilities' }]}
          >
            <TextArea 
              rows={6} 
              placeholder="• Design and develop scalable web applications&#10;• Mentor junior developers&#10;• Participate in code reviews"
            />
          </Form.Item>

          <Form.Item
            name="requirements"
            label="Requirements"
            rules={[{ required: true, message: 'Please enter requirements' }]}
          >
            <TextArea 
              rows={6} 
              placeholder="• 5+ years of software development experience&#10;• Strong knowledge of React and Node.js&#10;• Experience with cloud platforms"
            />
          </Form.Item>

          <Form.Item
            name="nice_to_have"
            label="Nice to Have"
          >
            <TextArea 
              rows={4} 
              placeholder="• Experience with microservices architecture&#10;• Knowledge of DevOps practices&#10;• Open source contributions"
            />
          </Form.Item>

          <Form.Item
            name="benefits"
            label="Benefits & Perks"
          >
            <TextArea 
              rows={4} 
              placeholder="• Competitive salary and equity&#10;• Health insurance&#10;• Flexible working hours&#10;• Learning budget"
            />
          </Form.Item>

          <Form.Item
            name="tags"
            label="Tags"
          >
            <Select 
              mode="tags" 
              placeholder="Add tags for better searchability"
              style={{ width: '100%' }}
            >
              <Option value="remote">Remote</Option>
              <Option value="senior">Senior</Option>
              <Option value="engineering">Engineering</Option>
              <Option value="full-stack">Full-stack</Option>
            </Select>
          </Form.Item>

          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="default" htmlType="submit">Save as Draft</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {selectedJD ? 'Update & Publish' : 'Create & Publish'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Details Drawer */}
      <Drawer
        title={selectedJD?.title}
        placement="right"
        onClose={() => setDetailsVisible(false)}
        visible={detailsVisible}
        width={600}
      >
        {selectedJD && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Tag color="blue">{selectedJD.level}</Tag>
                <Tag color="green">{selectedJD.employment_type}</Tag>
                <Tag color={getStatusColor(selectedJD.status)}>{selectedJD.status}</Tag>
                {selectedJD.is_featured && <Tag color="gold">Featured</Tag>}
              </Space>
            </div>

            <Collapse defaultActiveKey={['1', '2', '3']} ghost>
              <Panel header="Job Overview" key="1">
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Department: </Text>
                  <Text>{selectedJD.department}</Text>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Location: </Text>
                  <Text><EnvironmentOutlined /> {selectedJD.location}</Text>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Salary: </Text>
                  <Text>₹{(selectedJD.salary_range.min / 100000).toFixed(1)}L - ₹{(selectedJD.salary_range.max / 100000).toFixed(1)}L</Text>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Experience: </Text>
                  <Text>{selectedJD.experience_years.min}-{selectedJD.experience_years.max} years</Text>
                </div>
                <Paragraph>{selectedJD.description}</Paragraph>
              </Panel>

              <Panel header="Responsibilities & Requirements" key="2">
                <div style={{ marginBottom: 16 }}>
                  <Title level={5}>Key Responsibilities:</Title>
                  <ul>
                    {selectedJD.responsibilities.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                
                <div style={{ marginBottom: 16 }}>
                  <Title level={5}>Requirements:</Title>
                  <ul>
                    {selectedJD.requirements.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>

                {selectedJD.nice_to_have.length > 0 && (
                  <div>
                    <Title level={5}>Nice to Have:</Title>
                    <ul>
                      {selectedJD.nice_to_have.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Panel>

              <Panel header="Skills & Benefits" key="3">
                <div style={{ marginBottom: 16 }}>
                  <Title level={5}>Required Skills:</Title>
                  <div>
                    {selectedJD.skills.map(skill => (
                      <Tag key={skill} color="blue">{skill}</Tag>
                    ))}
                  </div>
                </div>

                {selectedJD.benefits.length > 0 && (
                  <div>
                    <Title level={5}>Benefits:</Title>
                    <ul>
                      {selectedJD.benefits.map((benefit, index) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Panel>

              <Panel header="Analytics" key="4">
                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ textAlign: 'center', padding: 16, border: '1px solid #f0f0f0', borderRadius: 6 }}>
                      <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
                        {selectedJD.applications_count}
                      </Title>
                      <Text type="secondary">Applications</Text>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ textAlign: 'center', padding: 16, border: '1px solid #f0f0f0', borderRadius: 6 }}>
                      <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                        {selectedJD.views_count}
                      </Title>
                      <Text type="secondary">Views</Text>
                    </div>
                  </Col>
                </Row>

                <div style={{ marginTop: 16 }}>
                  <Text strong>Created: </Text>
                  <Text>{new Date(selectedJD.created_at).toLocaleDateString()}</Text>
                </div>
                {selectedJD.published_at && (
                  <div>
                    <Text strong>Published: </Text>
                    <Text>{new Date(selectedJD.published_at).toLocaleDateString()}</Text>
                  </div>
                )}
                {selectedJD.deadline && (
                  <div>
                    <Text strong>Deadline: </Text>
                    <Text>{new Date(selectedJD.deadline).toLocaleDateString()}</Text>
                  </div>
                )}
              </Panel>
            </Collapse>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default JDDatabase;
