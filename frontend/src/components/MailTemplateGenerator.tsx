import React, { useState, useEffect } from 'react';
import {
    Card, Button, Space, Form, Input, Select, Row, Col, Typography,
    message, notification, Steps, Radio, Checkbox, Switch, Slider,
    Tabs, Divider, Tag, Progress, Alert, Spin, Timeline, Badge,
    Collapse, List, Avatar, Tooltip, Modal, Drawer
} from 'antd';
import {
    MailOutlined, StarOutlined, SendOutlined, SaveOutlined,
    EyeOutlined, CopyOutlined, HistoryOutlined, SettingOutlined,
    BulbOutlined, ThunderboltOutlined, RobotOutlined,
    FileTextOutlined, PlusOutlined, EditOutlined, CheckCircleOutlined,
    ClockCircleOutlined, UserOutlined, TagsOutlined
} from '@ant-design/icons';
import api from '../services/api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Option } = Select;
const { Step } = Steps;
const { Panel } = Collapse;

interface TemplateVersion {
    id: number;
    version: string;
    subject: string;
    content: string;
    created_at: string;
    performance_score?: number;
}

interface GeneratedTemplate {
    id?: number;
    name: string;
    category: string;
    purpose: string;
    tone: string;
    length: string;
    subject: string;
    content: string;
    variables: string[];
    tags: string[];
    ai_generated: boolean;
    versions: TemplateVersion[];
    created_at?: string;
    usage_count: number;
    performance_metrics?: {
        open_rate: number;
        click_rate: number;
        response_rate: number;
    };
}

const MailTemplateGenerator: React.FC = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [generatedTemplate, setGeneratedTemplate] = useState<GeneratedTemplate | null>(null);
    const [savedTemplates, setSavedTemplates] = useState<GeneratedTemplate[]>([]);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [historyVisible, setHistoryVisible] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<GeneratedTemplate | null>(null);
    const [activeTab, setActiveTab] = useState('generator');

    useEffect(() => {
        loadSavedTemplates();
    }, []);

    const loadSavedTemplates = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/v1/mail-templates');
            if (response.data.success) {
                setSavedTemplates(response.data.templates || []);
                console.log('✅ Loaded templates from database:', response.data.templates.length);
            } else {
                console.error('❌ Failed to load templates:', response.data.error);
                message.error('Failed to load templates from database');
            }
        } catch (error) {
            console.error('❌ Error loading templates:', error);
            message.error('Failed to connect to database');
            // Only use mock data as absolute fallback
            setSavedTemplates([]);
        } finally {
            setLoading(false);
        }
    };

    const generateMockTemplates = (): GeneratedTemplate[] => [
        {
            id: 1,
            name: 'Interview Follow-up Email',
            category: 'recruitment',
            purpose: 'follow_up',
            tone: 'professional',
            length: 'medium',
            subject: 'Thank you for your interview - Next Steps',
            content: `Dear {{candidate_name}},

Thank you for taking the time to interview with us for the {{position}} role. It was a pleasure meeting you and learning more about your experience.

We were impressed by your background in {{key_skills}} and your passion for {{company_values}}. Your insights into {{discussion_topic}} were particularly valuable.

We are currently reviewing all candidates and will be in touch with you by {{follow_up_date}} regarding next steps. If you have any questions in the meantime, please don't hesitate to reach out.

Thank you again for your interest in joining our team.

Best regards,
{{interviewer_name}}
{{company_name}}`,
            variables: ['candidate_name', 'position', 'key_skills', 'company_values', 'discussion_topic', 'follow_up_date', 'interviewer_name', 'company_name'],
            tags: ['interview', 'follow-up', 'recruitment', 'professional'],
            ai_generated: true,
            versions: [
                {
                    id: 1,
                    version: '1.0',
                    subject: 'Thank you for your interview - Next Steps',
                    content: 'Original version...',
                    created_at: '2024-03-15T10:00:00Z',
                    performance_score: 85
                }
            ],
            created_at: '2024-03-15T10:00:00Z',
            usage_count: 23,
            performance_metrics: {
                open_rate: 87,
                click_rate: 34,
                response_rate: 12
            }
        }
    ];

    const generateTemplate = async (values: any) => {
        setGenerating(true);
        try {
            console.log('🚀 Generating template with parameters:', values);

            // Prepare the AI prompt
            const prompt = `Generate a ${values.tone} ${values.category} email template for ${values.purpose}. 
      
      Requirements:
      - Category: ${values.category}
      - Purpose: ${values.purpose}
      - Tone: ${values.tone}
      - Length: ${values.length}
      - Target Audience: ${values.audience}
      - Key Points: ${values.key_points || 'Standard professional communication'}
      - Special Requirements: ${values.special_requirements || 'None'}
      
      Please provide:
      1. A compelling subject line
      2. Professional email content with appropriate placeholders {{variable_name}}
      3. Proper email structure (greeting, body, closing)
      4. Personalization variables`;

            const response = await api.post('/api/v1/ai/generate-email-template', {
                prompt,
                parameters: values
            });

            console.log('🤖 AI Response:', response.data);

            if (response.data.success) {
                const template = response.data.template;
                const generatedTemplate: GeneratedTemplate = {
                    name: `${values.category.charAt(0).toUpperCase() + values.category.slice(1)} - ${values.purpose.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}`,
                    category: values.category,
                    purpose: values.purpose,
                    tone: values.tone,
                    length: values.length,
                    subject: template.subject,
                    content: template.content,
                    variables: template.variables || [],
                    tags: template.tags || [],
                    ai_generated: true,
                    versions: [],
                    usage_count: 0
                };

                setGeneratedTemplate(generatedTemplate);
                setCurrentStep(1);
                message.success('Template generated successfully!');
            } else {
                throw new Error(response.data.error || 'Failed to generate template');
            }
        } catch (error) {
            console.error('❌ Failed to generate template:', error);
            message.error('Failed to generate template. Please try again.');

            // Fallback to mock generation only if API fails
            const mockTemplate: GeneratedTemplate = {
                name: `${values.category} - ${values.purpose}`,
                category: values.category,
                purpose: values.purpose,
                tone: values.tone,
                length: values.length,
                subject: generateMockSubject(values),
                content: generateMockContent(values),
                variables: ['candidate_name', 'position', 'company_name', 'interviewer_name'],
                tags: [values.category, values.purpose, values.tone],
                ai_generated: true,
                versions: [],
                usage_count: 0
            };
            setGeneratedTemplate(mockTemplate);
            setCurrentStep(1);
        } finally {
            setGenerating(false);
        }
    };

    type Subjects = {
        recruitment: {
            interview_invitation: string;
            follow_up: string;
            offer: string;
            rejection: string;
        };
        marketing: {
            product_launch: string;
            newsletter: string;
            promotion: string;
        };
    };

    type Category = keyof Subjects;
    type Purpose<C extends Category> = keyof Subjects[C];

    interface EmailValues {
        category: Category;
        purpose: string;
    }

    const generateMockSubject = (values: EmailValues): string => {
        const subjects: Subjects = {
            recruitment: {
                interview_invitation: 'Interview Invitation - {{position}} Position',
                follow_up: 'Thank you for your interview - Next Steps',
                offer: 'Job Offer - {{position}} at {{company_name}}',
                rejection: 'Update on your application with {{company_name}}'
            },
            marketing: {
                product_launch: '🚀 Introducing {{product_name}} - You\'ll Love This!',
                newsletter: '📰 {{company_name}} Weekly Update',
                promotion: '🎉 Special Offer Just for You - Save {{discount}}%'
            }
        };

        const category = values.category as Category;
        const purpose = values.purpose;

        return subjects[category]?.[purpose as keyof typeof subjects[Category]] ||
            'Professional Email Template';
    };


    const generateMockContent = (values: any): string => {
        if (values.category === 'recruitment' && values.purpose === 'interview_invitation') {
            return `Dear {{candidate_name}},

We are pleased to invite you for an interview for the {{position}} position at {{company_name}}.

Interview Details:
- Date: {{interview_date}}
- Time: {{interview_time}}
- Location: {{interview_location}}
- Duration: Approximately {{duration}} minutes

Please confirm your availability by replying to this email. If you need to reschedule, please let us know as soon as possible.

We look forward to meeting you and discussing this exciting opportunity.

Best regards,
{{interviewer_name}}
{{company_name}}`;
        }

        return `Dear {{recipient_name}},

This is a professionally generated email template for ${values.purpose} in the ${values.category} category.

[Your main content goes here with a ${values.tone} tone]

Best regards,
{{sender_name}}
{{company_name}}`;
    };

    const saveTemplate = async () => {
        if (!generatedTemplate) {
            message.error('No template to save');
            return;
        }

        setLoading(true);
        try {
            console.log('💾 Saving template:', generatedTemplate);

            const response = await api.post('/api/v1/mail-templates', generatedTemplate);

            if (response.data.success) {
                notification.success({
                    message: 'Template Saved Successfully!',
                    description: 'Your email template has been saved to the database and is ready for use.',
                    placement: 'topRight'
                });

                // Reload templates to show the new one
                await loadSavedTemplates();
                setCurrentStep(2);
            } else {
                throw new Error(response.data.error || 'Failed to save template');
            }
        } catch (error) {
            console.error('❌ Failed to save template:', error);
            message.error('Failed to save template to database');
        } finally {
            setLoading(false);
        }
    };

    const refineTemplate = async (instructions: string) => {
        if (!generatedTemplate) return;

        setGenerating(true);
        try {
            console.log('🔄 Refining template with instructions:', instructions);

            const response = await api.post('/api/v1/ai/refine-template', {
                template: generatedTemplate,
                instructions
            });

            if (response.data.success) {
                const refined = response.data.template;
                setGeneratedTemplate({
                    ...generatedTemplate,
                    subject: refined.subject,
                    content: refined.content,
                    variables: refined.variables || generatedTemplate.variables
                });
                message.success('Template refined successfully!');
            } else {
                throw new Error(response.data.error || 'Failed to refine template');
            }
        } catch (error) {
            console.error('❌ Failed to refine template:', error);
            message.error('Failed to refine template');
        } finally {
            setGenerating(false);
        }
    };

    const steps = [
        {
            title: 'Configure',
            description: 'Set parameters',
            icon: <SettingOutlined />
        },
        {
            title: 'Generate',
            description: 'AI creates template',
            icon: <StarOutlined />
        },
        {
            title: 'Review & Save',
            description: 'Finalize template',
            icon: <SaveOutlined />
        }
    ];

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <Card title="Template Configuration" style={{ marginTop: 16 }}>
                        <Form form={form} layout="vertical" onFinish={generateTemplate}>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="category"
                                        label="Email Category"
                                        rules={[{ required: true, message: 'Please select a category' }]}
                                    >
                                        <Select placeholder="Select category" size="large">
                                            <Option value="recruitment">Recruitment</Option>
                                            <Option value="marketing">Marketing</Option>
                                            <Option value="sales">Sales</Option>
                                            <Option value="customer_service">Customer Service</Option>
                                            <Option value="internal">Internal Communication</Option>
                                            <Option value="partnership">Partnership</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="purpose"
                                        label="Email Purpose"
                                        rules={[{ required: true, message: 'Please select a purpose' }]}
                                    >
                                        <Select placeholder="Select purpose" size="large">
                                            <Option value="interview_invitation">Interview Invitation</Option>
                                            <Option value="follow_up">Follow-up</Option>
                                            <Option value="offer">Job Offer</Option>
                                            <Option value="rejection">Rejection</Option>
                                            <Option value="product_launch">Product Launch</Option>
                                            <Option value="newsletter">Newsletter</Option>
                                            <Option value="promotion">Promotion</Option>
                                            <Option value="welcome">Welcome</Option>
                                            <Option value="reminder">Reminder</Option>
                                            <Option value="thank_you">Thank You</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={8}>
                                    <Form.Item
                                        name="tone"
                                        label="Email Tone"
                                        rules={[{ required: true, message: 'Please select tone' }]}
                                    >
                                        <Select placeholder="Select tone" size="large">
                                            <Option value="professional">Professional</Option>
                                            <Option value="friendly">Friendly</Option>
                                            <Option value="casual">Casual</Option>
                                            <Option value="formal">Formal</Option>
                                            <Option value="enthusiastic">Enthusiastic</Option>
                                            <Option value="empathetic">Empathetic</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name="length"
                                        label="Email Length"
                                        rules={[{ required: true, message: 'Please select length' }]}
                                    >
                                        <Select placeholder="Select length" size="large">
                                            <Option value="short">Short (1-2 paragraphs)</Option>
                                            <Option value="medium">Medium (3-4 paragraphs)</Option>
                                            <Option value="long">Long (5+ paragraphs)</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name="audience"
                                        label="Target Audience"
                                        rules={[{ required: true, message: 'Please select audience' }]}
                                    >
                                        <Select placeholder="Select audience" size="large">
                                            <Option value="candidates">Job Candidates</Option>
                                            <Option value="customers">Customers</Option>
                                            <Option value="employees">Employees</Option>
                                            <Option value="partners">Business Partners</Option>
                                            <Option value="prospects">Prospects</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item
                                name="key_points"
                                label="Key Points to Include"
                            >
                                <TextArea
                                    rows={3}
                                    placeholder="Enter key points or messages you want to include in the email..."
                                />
                            </Form.Item>

                            <Form.Item
                                name="special_requirements"
                                label="Special Requirements"
                            >
                                <TextArea
                                    rows={2}
                                    placeholder="Any special requirements, compliance needs, or specific formatting..."
                                />
                            </Form.Item>

                            <div style={{ textAlign: 'center', marginTop: 24 }}>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    icon={<StarOutlined />}
                                    loading={generating}
                                    style={{ minWidth: 200 }}
                                >
                                    {generating ? 'Generating Template...' : 'Generate Email Template'}
                                </Button>
                            </div>
                        </Form>
                    </Card>
                );

            case 1:
                return (
                    <div style={{ marginTop: 16 }}>
                        <Row gutter={16}>
                            <Col span={16}>
                                <Card title="Generated Template" style={{ height: '100%' }}>
                                    {generatedTemplate && (
                                        <div>
                                            <div style={{ marginBottom: 16 }}>
                                                <Text strong>Subject Line:</Text>
                                                <div style={{
                                                    padding: 12,
                                                    background: '#f5f5f5',
                                                    borderRadius: 6,
                                                    marginTop: 8,
                                                    border: '1px solid #d9d9d9'
                                                }}>
                                                    {generatedTemplate.subject}
                                                </div>
                                            </div>

                                            <div style={{ marginBottom: 16 }}>
                                                <Text strong>Email Content:</Text>
                                                <div style={{
                                                    padding: 16,
                                                    background: '#fafafa',
                                                    borderRadius: 6,
                                                    marginTop: 8,
                                                    border: '1px solid #d9d9d9',
                                                    minHeight: 300,
                                                    whiteSpace: 'pre-wrap',
                                                    fontFamily: 'monospace'
                                                }}>
                                                    {generatedTemplate.content}
                                                </div>
                                            </div>

                                            <div style={{ marginBottom: 16 }}>
                                                <Text strong>Variables Detected:</Text>
                                                <div style={{ marginTop: 8 }}>
                                                    {generatedTemplate.variables.map(variable => (
                                                        <Tag key={variable} color="blue" style={{ margin: '2px 4px' }}>
                                                            {`{{${variable}}}`}
                                                        </Tag>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            </Col>

                            <Col span={8}>
                                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                    <Card title="Actions" size="small">
                                        <Space direction="vertical" style={{ width: '100%' }}>
                                            <Button
                                                type="primary"
                                                icon={<SaveOutlined />}
                                                block
                                                onClick={saveTemplate}
                                                loading={loading}
                                            >
                                                Save Template
                                            </Button>
                                            <Button
                                                icon={<EyeOutlined />}
                                                block
                                                onClick={() => setPreviewVisible(true)}
                                            >
                                                Preview Email
                                            </Button>
                                            <Button
                                                icon={<CopyOutlined />}
                                                block
                                                onClick={() => {
                                                    if (generatedTemplate) {
                                                        navigator.clipboard.writeText(generatedTemplate.content);
                                                        message.success('Content copied to clipboard');
                                                    }
                                                }}
                                            >
                                                Copy Content
                                            </Button>
                                        </Space>
                                    </Card>

                                    <Card title="AI Refinement" size="small">
                                        <Form layout="vertical">
                                            <Form.Item>
                                                <TextArea
                                                    rows={3}
                                                    placeholder="Tell the AI how to improve the template... e.g., 'Make it more enthusiastic' or 'Add a call-to-action button'"
                                                />
                                            </Form.Item>
                                            <Button
                                                type="default"
                                                icon={<BulbOutlined />}
                                                block
                                                loading={generating}
                                                onClick={() => {
                                                    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
                                                    if (textarea && textarea.value) {
                                                        refineTemplate(textarea.value);
                                                    }
                                                }}
                                            >
                                                Refine Template
                                            </Button>
                                        </Form>
                                    </Card>

                                    <Card title="Template Info" size="small">
                                        {generatedTemplate && (
                                            <div>
                                                <div style={{ marginBottom: 8 }}>
                                                    <Text type="secondary">Category:</Text>
                                                    <Tag color="purple" style={{ marginLeft: 8 }}>
                                                        {generatedTemplate.category}
                                                    </Tag>
                                                </div>
                                                <div style={{ marginBottom: 8 }}>
                                                    <Text type="secondary">Purpose:</Text>
                                                    <Tag color="blue" style={{ marginLeft: 8 }}>
                                                        {generatedTemplate.purpose}
                                                    </Tag>
                                                </div>
                                                <div style={{ marginBottom: 8 }}>
                                                    <Text type="secondary">Tone:</Text>
                                                    <Tag color="green" style={{ marginLeft: 8 }}>
                                                        {generatedTemplate.tone}
                                                    </Tag>
                                                </div>
                                                <div>
                                                    <Text type="secondary">Variables:</Text>
                                                    <Badge
                                                        count={generatedTemplate.variables.length}
                                                        style={{ backgroundColor: '#52c41a', marginLeft: 8 }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </Card>
                                </Space>
                            </Col>
                        </Row>
                    </div>
                );

            case 2:
                return (
                    <Card title="Template Saved Successfully!" style={{ marginTop: 16, textAlign: 'center' }}>
                        <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
                        <Title level={4}>Your email template is ready to use!</Title>
                        <Paragraph>
                            The template has been saved to your template database and is ready for use in email campaigns.
                        </Paragraph>

                        <Space size="large" style={{ marginTop: 24 }}>
                            <Button type="primary" onClick={() => setCurrentStep(0)}>
                                Create Another Template
                            </Button>
                            <Button onClick={() => setActiveTab('saved')}>
                                View Saved Templates
                            </Button>
                        </Space>
                    </Card>
                );

            default:
                return null;
        }
    };

    return (
        <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
            <div style={{ marginBottom: 24 }}>
                <Title level={2}>
                    <StarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                    AI Mail Template Generator
                </Title>
                <Paragraph>
                    Generate professional email templates using AI. Perfect for recruitment, marketing, sales, and internal communications.
                </Paragraph>
            </div>

            <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
                <TabPane
                    tab={
                        <span>
                            <StarOutlined />
                            Template Generator
                        </span>
                    }
                    key="generator"
                >
                    <Steps current={currentStep} items={steps} style={{ marginBottom: 24 }} />
                    {renderStepContent()}
                </TabPane>

                <TabPane
                    tab={
                        <span>
                            <FileTextOutlined />
                            Saved Templates ({savedTemplates.length})
                        </span>
                    }
                    key="saved"
                >
                    <Row gutter={16}>
                        {savedTemplates.map(template => (
                            <Col xs={24} sm={12} lg={8} key={template.id} style={{ marginBottom: 16 }}>
                                <Card
                                    title={template.name}
                                    extra={
                                        <Space>
                                            {template.ai_generated && <RobotOutlined style={{ color: '#1890ff' }} />}
                                            <StarOutlined style={{ color: template.usage_count > 10 ? '#faad14' : '#d9d9d9' }} />
                                        </Space>
                                    }
                                    actions={[
                                        <Tooltip title="Preview">
                                            <Button
                                                type="text"
                                                icon={<EyeOutlined />}
                                                onClick={() => {
                                                    setSelectedTemplate(template);
                                                    setPreviewVisible(true);
                                                }}
                                            />
                                        </Tooltip>,
                                        <Tooltip title="Edit">
                                            <Button type="text" icon={<EditOutlined />} />
                                        </Tooltip>,
                                        <Tooltip title="Copy">
                                            <Button type="text" icon={<CopyOutlined />} />
                                        </Tooltip>
                                    ]}
                                >
                                    <div>
                                        <div style={{ marginBottom: 8 }}>
                                            <Tag color="purple">{template.category}</Tag>
                                            <Tag color="blue">{template.purpose}</Tag>
                                        </div>

                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            {template.subject}
                                        </Text>

                                        <div style={{ marginTop: 8 }}>
                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                Used {template.usage_count} times
                                            </Text>
                                        </div>

                                        {template.performance_metrics && (
                                            <div style={{ marginTop: 8 }}>
                                                <Row gutter={8}>
                                                    <Col span={8} style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '12px', color: '#52c41a' }}>
                                                            {template.performance_metrics.open_rate}%
                                                        </div>
                                                        <div style={{ fontSize: '10px', color: '#666' }}>Open</div>
                                                    </Col>
                                                    <Col span={8} style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '12px', color: '#1890ff' }}>
                                                            {template.performance_metrics.click_rate}%
                                                        </div>
                                                        <div style={{ fontSize: '10px', color: '#666' }}>Click</div>
                                                    </Col>
                                                    <Col span={8} style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '12px', color: '#722ed1' }}>
                                                            {template.performance_metrics.response_rate}%
                                                        </div>
                                                        <div style={{ fontSize: '10px', color: '#666' }}>Response</div>
                                                    </Col>
                                                </Row>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </TabPane>

                <TabPane
                    tab={
                        <span>
                            <HistoryOutlined />
                            Generation History
                        </span>
                    }
                    key="history"
                >
                    <Timeline>
                        <Timeline.Item dot={<ClockCircleOutlined style={{ color: '#1890ff' }} />}>
                            <div>
                                <Text strong>Interview Follow-up Template</Text>
                                <div style={{ color: '#666', fontSize: '12px' }}>Generated 2 hours ago</div>
                                <Tag color="green">recruitment</Tag>
                                <Tag color="blue">follow_up</Tag>
                            </div>
                        </Timeline.Item>
                        <Timeline.Item dot={<CheckCircleOutlined style={{ color: '#52c41a' }} />}>
                            <div>
                                <Text strong>Product Launch Email</Text>
                                <div style={{ color: '#666', fontSize: '12px' }}>Generated yesterday</div>
                                <Tag color="purple">marketing</Tag>
                                <Tag color="orange">product_launch</Tag>
                            </div>
                        </Timeline.Item>
                        <Timeline.Item dot={<UserOutlined style={{ color: '#722ed1' }} />}>
                            <div>
                                <Text strong>Welcome Email Series</Text>
                                <div style={{ color: '#666', fontSize: '12px' }}>Generated 3 days ago</div>
                                <Tag color="cyan">customer_service</Tag>
                                <Tag color="gold">welcome</Tag>
                            </div>
                        </Timeline.Item>
                    </Timeline>
                </TabPane>
            </Tabs>

            {/* Preview Modal */}
            <Modal
                title="Email Preview"
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
                    <div style={{
                        border: '1px solid #d9d9d9',
                        borderRadius: 6,
                        overflow: 'hidden',
                        background: 'white'
                    }}>
                        {/* Email Header */}
                        <div style={{
                            background: '#f5f5f5',
                            padding: 16,
                            borderBottom: '1px solid #d9d9d9'
                        }}>
                            <div style={{ marginBottom: 8 }}>
                                <Text strong>Subject: </Text>
                                <Text>{selectedTemplate.subject}</Text>
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                                From: no-reply@company.com | To: recipient@example.com
                            </div>
                        </div>

                        {/* Email Body */}
                        <div style={{
                            padding: 24,
                            minHeight: 300,
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.6
                        }}>
                            {selectedTemplate.content}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MailTemplateGenerator;
