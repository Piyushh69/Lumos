import React, { useState, useEffect } from 'react';
import {
    Card, Table, Button, Space, Tag, Modal, Form, Input, Select,
    Row, Col, Typography, message, notification, Popconfirm, Tooltip,
    Upload, Divider, Switch, Badge, Tabs, List, Avatar, Empty,
    Drawer, Radio, Checkbox, DatePicker, Progress, Timeline
} from 'antd';
import {
    DatabaseOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
    CopyOutlined, EyeOutlined, DownloadOutlined, UploadOutlined,
    FileTextOutlined, MailOutlined, SearchOutlined, FilterOutlined,
    StarOutlined, TagsOutlined, BulbOutlined, ThunderboltOutlined,
    ClockCircleOutlined, UserOutlined, CheckCircleOutlined
} from '@ant-design/icons';
// import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import api from '../services/api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Option } = Select;

interface TemplateDatabase {
    id: number;
    name: string;
    category: string;
    type: 'email' | 'document' | 'contract' | 'report';
    content: string;
    variables: string[];
    tags: string[];
    usage_count: number;
    is_favorite: boolean;
    is_active: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
    version: string;
    description: string;
}

const TemplateDatabase: React.FC = () => {
    const [templates, setTemplates] = useState<TemplateDatabase[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateDatabase | null>(null);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/v1/template-database');
            if (response.data.success) {
                setTemplates(response.data.templates || []);
            }
        } catch (error) {
            console.error('Failed to load templates:', error);
            // Mock data for demo
            setTemplates(generateMockTemplates());
        } finally {
            setLoading(false);
        }
    };

    const generateMockTemplates = () => [
        {
            id: 1,
            name: 'Interview Invitation Email',
            category: 'recruitment',
            type: 'email' as const,
            content: 'Dear {{candidate_name}}, We are pleased to invite you for an interview...',
            variables: ['candidate_name', 'position', 'interview_date', 'interview_time'],
            tags: ['interview', 'invitation', 'recruitment'],
            usage_count: 45,
            is_favorite: true,
            is_active: true,
            created_by: 'HR Team',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-03-20T14:30:00Z',
            version: '2.1',
            description: 'Standard template for inviting candidates to interviews'
        },
        {
            id: 2,
            name: 'Offer Letter Template',
            category: 'recruitment',
            type: 'document' as const,
            content: 'We are delighted to extend this offer of employment to {{candidate_name}}...',
            variables: ['candidate_name', 'position', 'salary', 'start_date', 'reporting_manager'],
            tags: ['offer', 'employment', 'contract'],
            usage_count: 23,
            is_favorite: false,
            is_active: true,
            created_by: 'Legal Team',
            created_at: '2024-02-10T09:15:00Z',
            updated_at: '2024-03-15T11:45:00Z',
            version: '1.5',
            description: 'Official offer letter template with all legal clauses'
        }
    ];

    const handleSave = async (values: any) => {
        try {
            setLoading(true);
            const templateData = {
                ...values,
                variables: extractVariables(values.content),
                tags: values.tags || [],
                is_active: true,
                version: '1.0'
            };

            if (selectedTemplate) {
                // Update existing template
                await api.put(`/api/v1/template-database/${selectedTemplate.id}`, templateData);
                notification.success({
                    message: 'Template Updated',
                    description: 'Template has been updated successfully!'
                });
            } else {
                // Create new template
                await api.post('/api/v1/template-database', templateData);
                notification.success({
                    message: 'Template Created',
                    description: 'New template has been created successfully!'
                });
            }

            setModalVisible(false);
            form.resetFields();
            setSelectedTemplate(null);
            await loadTemplates();
        } catch (error) {
            message.error('Failed to save template');
        } finally {
            setLoading(false);
        }
    };

    const extractVariables = (content: string): string[] => {
        const regex = /\{\{([^}]+)\}\}/g;
        const variables = [];
        let match;
        while ((match = regex.exec(content)) !== null) {
            variables.push(match[1].trim());
        }
        return Array.from(new Set(variables));
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/api/v1/template-database/${id}`);
            message.success('Template deleted successfully');
            await loadTemplates();
        } catch (error) {
            message.error('Failed to delete template');
        }
    };

    const toggleFavorite = async (template: TemplateDatabase) => {
        try {
            await api.patch(`/api/v1/template-database/${template.id}/favorite`, {
                is_favorite: !template.is_favorite
            });
            await loadTemplates();
        } catch (error) {
            message.error('Failed to update favorite status');
        }
    };

    const duplicateTemplate = (template: TemplateDatabase) => {
        form.setFieldsValue({
            name: `${template.name} (Copy)`,
            category: template.category,
            type: template.type,
            content: template.content,
            description: template.description,
            tags: template.tags
        });
        setSelectedTemplate(null);
        setModalVisible(true);
    };

    const filteredTemplates = templates.filter(template => {
        const matchesSearch = !searchText ||
            template.name.toLowerCase().includes(searchText.toLowerCase()) ||
            template.description.toLowerCase().includes(searchText.toLowerCase());

        const matchesCategory = !categoryFilter || template.category === categoryFilter;
        const matchesType = !typeFilter || template.type === typeFilter;

        const matchesTab = activeTab === 'all' ||
            (activeTab === 'favorites' && template.is_favorite) ||
            (activeTab === 'recent' && new Date(template.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

        return matchesSearch && matchesCategory && matchesType && matchesTab;
    });

    const columns = [
        {
            title: 'Template',
            key: 'template',
            render: (record: TemplateDatabase) => (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text strong>{record.name}</Text>
                        {record.is_favorite && <StarOutlined style={{ color: '#faad14' }} />}
                        <Tag color={record.type === 'email' ? 'blue' : 'green'}>{record.type}</Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {record.description}
                    </Text>
                    <div style={{ marginTop: 4 }}>
                        {record.tags.map(tag => (
                            <Tag key={tag}>{tag}</Tag>
                        ))}
                    </div>
                </div>
            )
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            render: (category: string) => (
                <Tag color="purple">{category}</Tag>
            )
        },
        {
            title: 'Variables',
            dataIndex: 'variables',
            key: 'variables',
            render: (variables: string[]) => (
                <Tooltip title={variables.join(', ')}>
                    <Badge count={variables.length} style={{ backgroundColor: '#52c41a' }}>
                        <TagsOutlined style={{ fontSize: 16 }} />
                    </Badge>
                </Tooltip>
            )
        },
        {
            title: 'Usage',
            dataIndex: 'usage_count',
            key: 'usage_count',
            render: (count: number) => (
                <div>
                    <Text>{count} times</Text>
                    <Progress
                        percent={Math.min(count * 2, 100)}
                        size="small"
                        showInfo={false}
                        strokeColor="#1890ff"
                    />
                </div>
            )
        },
        {
            title: 'Version',
            dataIndex: 'version',
            key: 'version',
            render: (version: string) => <Tag color="default">v{version}</Tag>
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (record: TemplateDatabase) => (
                <Space>
                    <Tooltip title="Preview">
                        <Button
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => {
                                setSelectedTemplate(record);
                                setPreviewVisible(true);
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => {
                                setSelectedTemplate(record);
                                form.setFieldsValue(record);
                                setModalVisible(true);
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Duplicate">
                        <Button
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => duplicateTemplate(record)}
                        />
                    </Tooltip>
                    <Tooltip title={record.is_favorite ? "Remove from favorites" : "Add to favorites"}>
                        <Button
                            size="small"
                            icon={<StarOutlined />}
                            type={record.is_favorite ? "primary" : "default"}
                            onClick={() => toggleFavorite(record)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Are you sure you want to delete this template?"
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

    return (
        <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
            <div style={{ marginBottom: 24 }}>
                <Title level={2}>
                    <DatabaseOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                    Template Database
                </Title>
                <Paragraph>
                    Centralized repository for all your templates - emails, documents, contracts, and reports.
                </Paragraph>
            </div>

            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={6}>
                    <Card>
                        <div style={{ textAlign: 'center' }}>
                            <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                            <div style={{ marginTop: 8 }}>
                                <Title level={4} style={{ margin: 0 }}>{templates.length}</Title>
                                <Text type="secondary">Total Templates</Text>
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
                                    {templates.filter(t => t.is_favorite).length}
                                </Title>
                                <Text type="secondary">Favorites</Text>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card>
                        <div style={{ textAlign: 'center' }}>
                            <ThunderboltOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                            <div style={{ marginTop: 8 }}>
                                <Title level={4} style={{ margin: 0 }}>
                                    {templates.reduce((sum, t) => sum + t.usage_count, 0)}
                                </Title>
                                <Text type="secondary">Total Usage</Text>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card>
                        <div style={{ textAlign: 'center' }}>
                            <TagsOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                            <div style={{ marginTop: 8 }}>
                                <Title level={4} style={{ margin: 0 }}>
                                    {Array.from(new Set(templates.flatMap(t => t.tags))).length}
                                </Title>
                                <Text type="secondary">Unique Tags</Text>
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Card>
                <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
                    <TabPane tab="All Templates" key="all" />
                    <TabPane tab="Favorites" key="favorites" />
                    <TabPane tab="Recent" key="recent" />
                </Tabs>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <Space>
                        <Input.Search
                            placeholder="Search templates..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: 250 }}
                            prefix={<SearchOutlined />}
                        />
                        <Select
                            placeholder="Filter by Category"
                            allowClear
                            style={{ width: 150 }}
                            value={categoryFilter}
                            onChange={setCategoryFilter}
                        >
                            <Option value="recruitment">Recruitment</Option>
                            <Option value="legal">Legal</Option>
                            <Option value="marketing">Marketing</Option>
                            <Option value="sales">Sales</Option>
                        </Select>
                        <Select
                            placeholder="Filter by Type"
                            allowClear
                            style={{ width: 130 }}
                            value={typeFilter}
                            onChange={setTypeFilter}
                        >
                            <Option value="email">Email</Option>
                            <Option value="document">Document</Option>
                            <Option value="contract">Contract</Option>
                            <Option value="report">Report</Option>
                        </Select>
                    </Space>

                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setSelectedTemplate(null);
                            form.resetFields();
                            setModalVisible(true);
                        }}
                    >
                        Create Template
                    </Button>
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredTemplates}
                    loading={loading}
                    rowKey="id"
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} templates`
                    }}
                />
            </Card>

            {/* Create/Edit Modal */}
            <Modal
                title={selectedTemplate ? 'Edit Template' : 'Create Template'}
                visible={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    setSelectedTemplate(null);
                    form.resetFields();
                }}
                width={800}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="name"
                                label="Template Name"
                                rules={[{ required: true, message: 'Please enter template name' }]}
                            >
                                <Input placeholder="Enter template name" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="category"
                                label="Category"
                                rules={[{ required: true, message: 'Please select category' }]}
                            >
                                <Select placeholder="Select category">
                                    <Option value="recruitment">Recruitment</Option>
                                    <Option value="legal">Legal</Option>
                                    <Option value="marketing">Marketing</Option>
                                    <Option value="sales">Sales</Option>
                                    <Option value="hr">HR</Option>
                                    <Option value="finance">Finance</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="type"
                                label="Template Type"
                                rules={[{ required: true, message: 'Please select type' }]}
                            >
                                <Select placeholder="Select type">
                                    <Option value="email">Email Template</Option>
                                    <Option value="document">Document Template</Option>
                                    <Option value="contract">Contract Template</Option>
                                    <Option value="report">Report Template</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="tags"
                                label="Tags"
                            >
                                <Select
                                    mode="tags"
                                    placeholder="Add tags"
                                    style={{ width: '100%' }}
                                >
                                    <Option value="urgent">Urgent</Option>
                                    <Option value="standard">Standard</Option>
                                    <Option value="formal">Formal</Option>
                                    <Option value="casual">Casual</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="description"
                        label="Description"
                        rules={[{ required: true, message: 'Please enter description' }]}
                    >
                        <Input placeholder="Brief description of the template" />
                    </Form.Item>

                    <Form.Item
                        name="content"
                        label="Template Content"
                        rules={[{ required: true, message: 'Please enter template content' }]}
                    >
                        <TextArea
                            rows={12}
                            placeholder="Enter your template content. Use {{variable_name}} for dynamic content."
                        />
                    </Form.Item>

                    <div style={{ textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => setModalVisible(false)}>Cancel</Button>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                {selectedTemplate ? 'Update Template' : 'Create Template'}
                            </Button>
                        </Space>
                    </div>
                </Form>
            </Modal>

            {/* Preview Modal */}
            <Modal
                title={`Preview: ${selectedTemplate?.name}`}
                visible={previewVisible}
                onCancel={() => setPreviewVisible(false)}
                width={800}
                footer={[
                    <Button key="close" onClick={() => setPreviewVisible(false)}>
                        Close
                    </Button>
                ]}
            >
                {selectedTemplate && (
                    <div>
                        <div style={{ marginBottom: 16 }}>
                            <Space>
                                <Tag color="blue">{selectedTemplate.type}</Tag>
                                <Tag color="purple">{selectedTemplate.category}</Tag>
                                <Text type="secondary">Version {selectedTemplate.version}</Text>
                            </Space>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <Text strong>Description:</Text>
                            <Paragraph>{selectedTemplate.description}</Paragraph>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <Text strong>Variables:</Text>
                            <div style={{ marginTop: 8 }}>
                                {selectedTemplate.variables.map(variable => (
                                    <Tag key={variable} color="green">{`{{${variable}}}`}</Tag>
                                ))}
                            </div>
                        </div>

                        <div>
                            <Text strong>Content Preview:</Text>
                            <div style={{ marginTop: 8, padding: 16, background: '#f5f5f5', borderRadius: 6 }}>
                                <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                                    {selectedTemplate.content}
                                </pre>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default TemplateDatabase;
