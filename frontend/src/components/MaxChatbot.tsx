import React, { useState, useEffect, useRef } from 'react';
import {
    Card, Input, Button, Avatar, Spin, Typography, Space, Divider, Tag, Modal,
    Form, Select, InputNumber, DatePicker, Alert, Badge, Tooltip, Drawer,
    List, Collapse, Row, Col, Progress, Steps, Popconfirm, message, notification,
    Empty
} from 'antd';
import {
    SendOutlined, UserOutlined, RobotOutlined, CheckOutlined, CloseOutlined,
    ExclamationCircleOutlined, FormOutlined, MailOutlined, FileTextOutlined,
    BulbOutlined, ThunderboltOutlined, CopyOutlined, DownloadOutlined,
    HistoryOutlined, SettingOutlined, SaveOutlined, LoadingOutlined,
    CheckCircleOutlined, WarningOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';
import api from '../services/api';
import { callGemini } from '../utils/gemini';

const { TextArea } = Input;
const { Text, Title, Paragraph } = Typography;
const { Option } = Select;
const { Panel } = Collapse;
const { Step } = Steps;

interface MaxChatbotProps {
    socket?: WebSocket | null;
    sendMessage?: (message: string) => void;
    isConnected?: boolean;
}

interface ChatMessage {
    id: string;
    type: 'user' | 'assistant' | 'system' | 'action' | 'form' | 'confirmation';
    content: string;
    timestamp: Date;
    metadata?: any;
    actions?: ActionItem[];
    form?: FormData;
    requiresConfirmation?: boolean;
    confirmed?: boolean;
    taskId?: string;
}

interface ActionItem {
    id: string;
    type: 'api_call' | 'create_template' | 'send_email' | 'create_job' | 'match_candidates';
    title: string;
    description: string;
    parameters: any;
    status: 'pending' | 'confirmed' | 'executed' | 'failed';
    result?: any;
}

interface FormData {
    type: 'email_template' | 'job_creation' | 'email_sending' | 'candidate_search';
    title: string;
    fields: FormField[];
    submitAction: string;
}

interface FormField {
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'email';
    required: boolean;
    options?: string[];
    value?: any;
    placeholder?: string;
}

interface ChatSession {
    id: string;
    name: string;
    created_at: Date;
    updated_at: Date;
    context: string;
    message_count: number;
    last_message: string;
}

const MaxChatbot: React.FC<MaxChatbotProps> = ({ socket, sendMessage, isConnected }) => {
    // State Management
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [sessionId, setSessionId] = useState('');
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentTask, setCurrentTask] = useState<ActionItem | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<FormData | null>(null);
    const [formValues, setFormValues] = useState<any>({});
    const [sessionsVisible, setSessionsVisible] = useState(false);
    const [maxThinking, setMaxThinking] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [form] = Form.useForm();

    // Initialize Max
    useEffect(() => {
        initializeMax();
        loadChatSessions();
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const initializeMax = async () => {
        const welcomeMessage: ChatMessage = {
            id: generateId(),
            type: 'assistant',
            content: `👋 Hello! I'm **Max**, your intelligent AI assistant for NaviHire!

I'm here to help you with everything related to your recruitment portal. I can:

🤖 **Answer questions** about NaviHire features and HR processes
📧 **Create and send emails** using templates or custom content  
📝 **Generate job descriptions** and manage job postings
🎯 **Match candidates** to positions using AI
📊 **Provide insights** about your recruitment data
🔧 **Automate tasks** with step-by-step confirmation

**What would you like me to help you with today?**

*Try asking: "Create an interview invitation template and send it to a candidate" or "Find the best candidates for a Software Engineer position"*`,
            timestamp: new Date()
        };

        setMessages([welcomeMessage]);

        // Generate new session ID
        const newSessionId = generateId();
        setSessionId(newSessionId);
    };

    const loadChatSessions = async () => {
        try {
            const response = await api.get('/api/v1/chat/sessions');
            if (response.data.success) {
                setSessions(response.data.sessions || []);
            }
        } catch (error) {
            console.error('Failed to load chat sessions:', error);
        }
    };

    const saveCurrentSession = async () => {
        if (messages.length <= 1) return; // Don't save empty sessions

        try {
            const sessionData = {
                session_id: sessionId,
                name: generateSessionName(),
                messages: messages,
                context: generateContextSummary(),
                updated_at: new Date().toISOString()
            };

            await api.post('/api/v1/chat/sessions', sessionData);
            await loadChatSessions();
        } catch (error) {
            console.error('Failed to save session:', error);
        }
    };

    const loadSession = async (session: ChatSession) => {
        try {
            const response = await api.get(`/api/v1/chat/sessions/${session.id}`);
            if (response.data.success) {
                setMessages(response.data.messages || []);
                setSessionId(session.id);
                setSessionsVisible(false);

                // Add continuation message
                const continuationMessage: ChatMessage = {
                    id: generateId(),
                    type: 'system',
                    content: `📚 **Session Restored: "${session.name}"**\n\nContinuing our conversation from ${moment(session.updated_at).format('MMM DD, YYYY HH:mm')}...\n\n*I remember our previous context and am ready to continue where we left off!*`,
                    timestamp: new Date()
                };

                setMessages(prev => [...prev, continuationMessage]);
            }
        } catch (error) {
            console.error('Failed to load session:', error);
            message.error('Failed to load chat session');
        }
    };

    const generateSessionName = (): string => {
        const userMessages = messages.filter(m => m.type === 'user');
        if (userMessages.length > 0) {
            const firstMessage = userMessages[0].content;
            return firstMessage.length > 50 ? firstMessage.substring(0, 50) + '...' : firstMessage;
        }
        return `Chat ${moment().format('MMM DD, HH:mm')}`;
    };

    const generateContextSummary = (): string => {
        const context = {
            totalMessages: messages.length,
            userQuestions: messages.filter(m => m.type === 'user').length,
            actionsPerformed: messages.filter(m => m.actions?.some(a => a.status === 'executed')).length,
            lastTopic: messages.slice(-3).map(m => m.content).join(' ')
        };
        return JSON.stringify(context);
    };

    const generateId = (): string => {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMessage: ChatMessage = {
            id: generateId(),
            type: 'user',
            content: inputValue.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsTyping(true);

        // Save session after user input
        setTimeout(saveCurrentSession, 500);

        try {
            await processUserMessage(inputValue.trim());
        } catch (error) {
            console.error('Error processing message:', error);

            const errorMessage: ChatMessage = {
                id: generateId(),
                type: 'assistant',
                content: '❌ **Oops!** I encountered an error while processing your request. Please try again or rephrase your question.',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const processUserMessage = async (userInput: string) => {
        setMaxThinking('Analyzing your request...');

        try {
            // Send message to backend
            const response = await api.post('/api/v1/chat/message', {
                message: userInput,
                session_id: sessionId,
                user_id: 'current_user'
            });

            setMaxThinking('');

            if (!response.data.success) {
                throw new Error(response.data.error || 'Failed to process message');
            }

            console.log('🤖 Max Response:', response.data); // Debug log

            // Create assistant message
            const assistantMessage: ChatMessage = {
                id: generateId(),
                type: 'assistant',
                content: response.data.response,
                timestamp: new Date(),
                actions: response.data.actions || [],
                requiresConfirmation: response.data.requires_action || false
            };

            setMessages(prev => [...prev, assistantMessage]);

            // Handle actions if present
            if (response.data.requires_action && response.data.actions?.length > 0) {
                console.log('🎯 Action detected:', response.data.actions[0]);
                handleActionRequest(response.data.actions[0], assistantMessage.id);
            }

        } catch (error) {
            console.error('❌ Error processing message:', error);
            setMaxThinking('');

            // Fallback response
            const fallbackMessage: ChatMessage = {
                id: generateId(),
                type: 'assistant',
                content: `I understand you want help with: "${userInput}"\n\nI'm having trouble processing this right now, but I can still help you with:\n\n• Creating email templates\n• Managing job postings\n• Finding candidate matches\n• Sending recruitment emails\n• NaviHire feature questions\n\nCould you please be more specific about what you'd like me to do?`,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, fallbackMessage]);
        }
    };


    const handleActionRequest = (action: ActionItem, messageId: string) => {
        const actionWithDefaults: ActionItem = {
            ...action,
            id: generateId(),
            status: 'pending'
        };

        setCurrentTask(actionWithDefaults);

        // Check if this action requires a form
        if ('requires_form' in action && action.requires_form || needsFormForAction(action.type)) {
            createFormForAction(actionWithDefaults);
        }
        else {
            setShowConfirmation(true);
        }
    };

    const needsFormForAction = (actionType: string): boolean => {
        const formRequiredActions = [
            'create_email_template',
            'send_email',
            'create_job',
            'generate_job_description'
        ];
        return formRequiredActions.includes(actionType);
    };

    const createFormForAction = (action: ActionItem) => {
        let formConfig: FormData;

        switch (action.type) {
            case 'create_template':
                formConfig = {
                    type: 'email_template',
                    title: 'Create Email Template',
                    submitAction: 'Create Template',
                    fields: [
                        { name: 'name', label: 'Template Name', type: 'text', required: true, placeholder: 'e.g., Interview Invitation' },
                        { name: 'category', label: 'Category', type: 'select', required: true, options: ['interview', 'offer_letter', 'rejection', 'follow_up', 'onboarding'] },
                        { name: 'subject', label: 'Email Subject', type: 'text', required: true, placeholder: 'e.g., Interview Invitation - {{job_title}} Position' },
                        { name: 'body', label: 'Email Body', type: 'textarea', required: true, placeholder: 'Use {{variable_name}} for dynamic content' },
                    ]
                };
                break;

            case 'send_email':
                formConfig = {
                    type: 'email_sending',
                    title: 'Send Email',
                    submitAction: 'Send Email',
                    fields: [
                        { name: 'template_id', label: 'Email Template', type: 'select', required: true, options: ['1', '2', '3'] },
                        { name: 'recipient_email', label: 'Recipient Email', type: 'email', required: true },
                        { name: 'candidate_name', label: 'Candidate Name', type: 'text', required: true },
                        { name: 'job_title', label: 'Job Title', type: 'text', required: false },
                        { name: 'interview_date', label: 'Interview Date', type: 'date', required: false },
                    ]
                };
                break;

            case 'create_job':
                formConfig = {
                    type: 'job_creation',
                    title: 'Create Job Posting',
                    submitAction: 'Create Job',
                    fields: [
                        { name: 'title', label: 'Job Title', type: 'text', required: true },
                        { name: 'department', label: 'Department', type: 'select', required: true, options: ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance'] },
                        { name: 'location', label: 'Location', type: 'text', required: true },
                        { name: 'experience_level', label: 'Experience Level', type: 'select', required: true, options: ['Entry Level', 'Mid Level', 'Senior Level', 'Lead Level'] },
                        { name: 'employment_type', label: 'Employment Type', type: 'select', required: true, options: ['Full-time', 'Part-time', 'Contract', 'Internship'] },
                    ]
                };
                break;

            default:
                formConfig = {
                    type: 'email_template',
                    title: 'Action Details',
                    submitAction: 'Continue',
                    fields: [
                        { name: 'details', label: 'Additional Details', type: 'textarea', required: false, placeholder: 'Any additional information...' }
                    ]
                };
        }

        setFormData(formConfig);
        setShowForm(true);
    };

    const handleFormSubmit = (values: any) => {
        setFormValues(values);
        setShowForm(false);

        if (currentTask) {
            const updatedTask = {
                ...currentTask,
                parameters: { ...currentTask.parameters, ...values }
            };
            setCurrentTask(updatedTask);
            setShowConfirmation(true);
        }
    };

    const handleConfirmAction = async () => {
        if (!currentTask) return;

        setShowConfirmation(false);

        // Update task status
        const confirmingTask = { ...currentTask, status: 'confirmed' as const };
        setCurrentTask(confirmingTask);

        // Add confirmation message
        const confirmationMessage: ChatMessage = {
            id: generateId(),
            type: 'system',
            content: `✅ **Action Confirmed**: ${confirmingTask.title}\n\n⏳ Executing task...`,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, confirmationMessage]);

        try {
            // Execute the action
            const result = await executeAction(confirmingTask);

            // Update task status
            const completedTask = { ...confirmingTask, status: 'executed' as const, result };
            setCurrentTask(completedTask);

            // Add success message
            const successMessage: ChatMessage = {
                id: generateId(),
                type: 'assistant',
                content: `🎉 **Task Completed Successfully!**\n\n${result.message}\n\n${result.details ? `**Details:**\n${result.details}` : ''}\n\n**Is there anything else I can help you with?**`,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, successMessage]);

            // Notify user
            notification.success({
                message: 'Task Completed',
                description: result.message,
                placement: 'topRight'
            });

        } catch (error) {
            console.error('Action execution failed:', error);

            const errorMessage: ChatMessage = {
                id: generateId(),
                type: 'assistant',
                content: `❌ **Task Failed**\n\nI encountered an error while executing this task: ${error}\n\nWould you like me to try again or help you with something else?`,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, errorMessage]);
        }

        setCurrentTask(null);
    };

    const executeAction = async (action: ActionItem): Promise<any> => {
        switch (action.type) {
            case 'create_template':
                return await createEmailTemplate(action.parameters);

            case 'send_email':
                return await sendEmail(action.parameters);

            case 'create_job':
                return await createJobPosting(action.parameters);

            case 'match_candidates':
                return await matchCandidates(action.parameters);

            case 'create_job':
                return await generateJobDescription(action.parameters);

            default:
                throw new Error('Unknown action type');
        }
    };

    const createEmailTemplate = async (params: any) => {
        const response = await api.post('/api/v1/emails/templates', {
            name: params.name,
            category: params.category,
            subject: params.subject,
            body_html: params.body
        });

        return {
            message: `Email template "${params.name}" created successfully!`,
            details: `Template ID: ${response.data.template?.id}\nCategory: ${params.category}`
        };
    };

    const sendEmail = async (params: any) => {
        const response = await api.post('/api/v1/emails/send', {
            template_id: params.template_id,
            recipient_email: params.recipient_email,
            variables: {
                candidate_name: params.candidate_name,
                job_title: params.job_title,
                interview_date: params.interview_date
            }
        });

        return {
            message: `Email sent successfully to ${params.recipient_email}!`,
            details: `Template used: ${params.template_id}\nRecipient: ${params.candidate_name}`
        };
    };

    const createJobPosting = async (params: any) => {
        const response = await api.post('/api/v1/jobs', {
            title: params.title,
            department: params.department,
            location: params.location,
            experience_level: params.experience_level,
            employment_type: params.employment_type
        });

        return {
            message: `Job posting "${params.title}" created successfully!`,
            details: `Job ID: ${response.data.job?.id}\nDepartment: ${params.department}\nLocation: ${params.location}`
        };
    };

    const matchCandidates = async (params: any) => {
        // Mock implementation
        return {
            message: `Found 12 matching candidates for ${params.job_title}!`,
            details: `Top matches:\n• John Doe (94% match)\n• Jane Smith (89% match)\n• Mike Johnson (87% match)`
        };
    };

    const generateJobDescription = async (params: any) => {
        // Mock implementation  
        return {
            message: `Job description generated for ${params.title}!`,
            details: `Generated comprehensive JD with responsibilities, requirements, and benefits.`
        };
    };

    const handleCancelAction = () => {
        setShowConfirmation(false);
        setShowForm(false);
        setCurrentTask(null);
        setFormData(null);
        setFormValues({});

        const cancelMessage: ChatMessage = {
            id: generateId(),
            type: 'system',
            content: '❌ **Action Cancelled**\n\nNo problem! Is there anything else I can help you with?',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, cancelMessage]);
    };

    const clearChat = () => {
        Modal.confirm({
            title: 'Clear Chat',
            content: 'Are you sure you want to clear the current conversation? This cannot be undone.',
            onOk: () => {
                setMessages([]);
                initializeMax();
            }
        });
    };

    const MessageBubble = ({ message }: { message: ChatMessage }) => {
        const isUser = message.type === 'user';
        const isSystem = message.type === 'system';

        return (
            <div style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                marginBottom: 16,
                alignItems: 'flex-start'
            }}>
                {!isUser && (
                    <Avatar
                        style={{
                            backgroundColor: isSystem ? '#722ed1' : '#1890ff',
                            marginRight: 12,
                            flexShrink: 0
                        }}
                        icon={isSystem ? <SettingOutlined /> : <RobotOutlined />}
                    />
                )}

                <div style={{
                    maxWidth: '70%',
                    backgroundColor: isUser ? '#1890ff' : isSystem ? '#f0f0f0' : '#fff',
                    color: isUser ? '#fff' : '#000',
                    padding: '12px 16px',
                    borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: isSystem ? '1px solid #d9d9d9' : 'none'
                }}>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                        {message.content}
                    </div>

                    {message.actions && message.actions.length > 0 && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                            <Text style={{ color: isUser ? '#fff' : '#666', fontSize: '12px' }}>
                                📋 Pending Actions: {message.actions.length}
                            </Text>
                        </div>
                    )}

                    <div style={{
                        fontSize: '11px',
                        opacity: 0.7,
                        marginTop: 8,
                        textAlign: isUser ? 'right' : 'left'
                    }}>
                        {moment(message.timestamp).format('HH:mm')}
                    </div>
                </div>

                {isUser && (
                    <Avatar
                        style={{
                            backgroundColor: '#52c41a',
                            marginLeft: 12,
                            flexShrink: 0
                        }}
                        icon={<UserOutlined />}
                    />
                )}
            </div>
        );
    };

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f0f2f5' }}>
            {/* Header */}
            <Card style={{
                borderRadius: 0,
                borderBottom: '1px solid #e8e8e8',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Space>
                            <Avatar size={40} style={{ backgroundColor: '#fff', color: '#667eea' }}>
                                <RobotOutlined />
                            </Avatar>
                            <div>
                                <Title level={4} style={{ margin: 0, color: '#fff' }}>
                                    Max - AI Assistant
                                </Title>
                                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                                    {maxThinking || 'Ready to help with NaviHire tasks'}
                                    {maxThinking && <LoadingOutlined style={{ marginLeft: 8 }} />}
                                </Text>
                            </div>
                        </Space>
                    </Col>
                    <Col>
                        <Space>
                            <Tooltip title="Chat History">
                                <Button
                                    icon={<HistoryOutlined />}
                                    onClick={() => setSessionsVisible(true)}
                                    style={{ color: '#fff', borderColor: '#fff' }}
                                    ghost
                                >
                                    History ({sessions.length})
                                </Button>
                            </Tooltip>
                            <Tooltip title="Clear Chat">
                                <Button
                                    icon={<CloseOutlined />}
                                    onClick={clearChat}
                                    style={{ color: '#fff', borderColor: '#fff' }}
                                    ghost
                                />
                            </Tooltip>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* Chat Messages */}
            <div style={{
                flex: 1,
                padding: '20px',
                overflowY: 'auto',
                backgroundColor: '#fafafa'
            }}>
                {messages.map(message => (
                    <MessageBubble key={message.id} message={message} />
                ))}

                {isTyping && (
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                        <Avatar
                            style={{ backgroundColor: '#1890ff', marginRight: 12 }}
                            icon={<RobotOutlined />}
                        />
                        <div style={{
                            backgroundColor: '#fff',
                            padding: '12px 16px',
                            borderRadius: '18px 18px 18px 4px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                            <Space>
                                <Spin size="small" />
                                <Text style={{ color: '#666' }}>Max is thinking...</Text>
                            </Space>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <Card style={{ borderRadius: 0, borderTop: '1px solid #e8e8e8' }}>
                <Space.Compact style={{ width: '100%', display: 'flex' }}>
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onPressEnter={handleSendMessage}
                        placeholder="Ask Max anything about NaviHire or request help with tasks..."
                        style={{ flex: 1 }}
                        size="large"
                        disabled={isTyping}
                    />
                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={handleSendMessage}
                        size="large"
                        loading={isTyping}
                        disabled={!inputValue.trim()}
                    >
                        Send
                    </Button>
                </Space.Compact>

                {/* Quick Actions */}
                <div style={{ marginTop: 12 }}>
                    <Space wrap>
                        <Button
                            size="small"
                            icon={<MailOutlined />}
                            onClick={() => setInputValue('Create an interview invitation email template')}
                            ghost
                        >
                            Create Email Template
                        </Button>
                        <Button
                            size="small"
                            icon={<FileTextOutlined />}
                            onClick={() => setInputValue('Generate a job description for Software Engineer')}
                            ghost
                        >
                            Generate Job Description
                        </Button>
                        <Button
                            size="small"
                            icon={<UserOutlined />}
                            onClick={() => setInputValue('Find matching candidates for a React Developer position')}
                            ghost
                        >
                            Match Candidates
                        </Button>
                        <Button
                            size="small"
                            icon={<BulbOutlined />}
                            onClick={() => setInputValue('What features does NaviHire offer?')}
                            ghost
                        >
                            NaviHire Help
                        </Button>
                    </Space>
                </div>
            </Card>

            {/* Confirmation Modal */}
            <Modal
                title={
                    <Space>
                        <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                        Confirm Action
                    </Space>
                }
                open={showConfirmation}
                onOk={handleConfirmAction}
                onCancel={handleCancelAction}
                okText="Yes, Execute"
                cancelText="Cancel"
                okButtonProps={{ type: 'primary', danger: false }}
            >
                {currentTask && (
                    <div>
                        <Alert
                            message="Action Confirmation Required"
                            description={`Max wants to perform the following action. Please review and confirm.`}
                            type="info"
                            style={{ marginBottom: 16 }}
                        />

                        <Card size="small">
                            <Title level={5}>{currentTask.title}</Title>
                            <Paragraph>{currentTask.description}</Paragraph>

                            {Object.keys(currentTask.parameters || {}).length > 0 && (
                                <div>
                                    <Text strong>Parameters:</Text>
                                    <div style={{ marginTop: 8, background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                                        {Object.entries(currentTask.parameters || {}).map(([key, value]) => (
                                            <div key={key} style={{ marginBottom: 4 }}>
                                                <Text strong>{key}:</Text> <Text code>{String(value)}</Text>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                )}
            </Modal>

            {/* Dynamic Form Modal */}
            <Modal
                title={formData?.title}
                open={showForm}
                onCancel={handleCancelAction}
                footer={null}
                width={600}
            >
                {formData && (
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleFormSubmit}
                        initialValues={formValues}
                    >
                        {formData.fields.map(field => (
                            <Form.Item
                                key={field.name}
                                name={field.name}
                                label={field.label}
                                rules={[{ required: field.required, message: `${field.label} is required` }]}
                            >
                                {field.type === 'text' && (
                                    <Input placeholder={field.placeholder} />
                                )}
                                {field.type === 'email' && (
                                    <Input type="email" placeholder={field.placeholder} />
                                )}
                                {field.type === 'textarea' && (
                                    <TextArea rows={4} placeholder={field.placeholder} />
                                )}
                                {field.type === 'select' && (
                                    <Select placeholder={`Select ${field.label}`}>
                                        {field.options?.map(option => (
                                            <Option key={option} value={option}>{option}</Option>
                                        ))}
                                    </Select>
                                )}
                                {field.type === 'number' && (
                                    <InputNumber style={{ width: '100%' }} placeholder={field.placeholder} />
                                )}
                                {field.type === 'date' && (
                                    <DatePicker style={{ width: '100%' }} />
                                )}
                            </Form.Item>
                        ))}

                        <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
                            <Space>
                                <Button onClick={handleCancelAction}>Cancel</Button>
                                <Button type="primary" htmlType="submit" icon={<CheckOutlined />}>
                                    {formData.submitAction}
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                )}
            </Modal>

            {/* Chat Sessions Drawer */}
            <Drawer
                title="Chat History"
                placement="right"
                onClose={() => setSessionsVisible(false)}
                open={sessionsVisible}
                width={400}
            >
                <List
                    dataSource={sessions}
                    renderItem={(session) => (
                        <List.Item
                            actions={[
                                <Button
                                    type="link"
                                    size="small"
                                    onClick={() => loadSession(session)}
                                >
                                    Load
                                </Button>
                            ]}
                        >
                            <List.Item.Meta
                                avatar={<Avatar icon={<HistoryOutlined />} />}
                                title={session.name}
                                description={
                                    <div>
                                        <div>{moment(session.updated_at).fromNow()}</div>
                                        <div style={{ fontSize: '11px', color: '#999' }}>
                                            {session.message_count} messages
                                        </div>
                                    </div>
                                }
                            />
                        </List.Item>
                    )}
                    locale={{
                        emptyText: (
                            <Empty
                                description="No chat history yet"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        )
                    }}
                />
            </Drawer>
        </div>
    );
};

export default MaxChatbot;
