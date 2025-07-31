// import React, { useState, useEffect, useRef } from 'react';
// import { useFormik } from 'formik';
// import * as Yup from 'yup';
// import {
//   Button, Input, Select, Modal, Progress, Tag, notification, Tooltip,
//   Card, Row, Col, Divider, Switch, Badge, Dropdown, Menu, Space,
//   AutoComplete, Tabs, message
// } from 'antd';
// import {
//   ReloadOutlined, SaveOutlined, CloseOutlined, FileTextOutlined,
//   CopyOutlined, DeleteOutlined, WarningOutlined, DownloadOutlined,
//   SearchOutlined, EditOutlined, PlusOutlined, SettingOutlined,
//   CheckCircleOutlined, ClockCircleOutlined, EyeOutlined,
//   ShareAltOutlined, ThunderboltOutlined, RobotOutlined,
//   FilePdfOutlined, FileWordOutlined, FileMarkdownOutlined,
//   SendOutlined, BulbOutlined, TeamOutlined, GlobalOutlined, HeartOutlined
// } from '@ant-design/icons';

// import { generateJobDescription as generateWithGemini } from '../../../utils/gemini';

// const { TextArea } = Input;
// const { Option } = Select;
// const { TabPane } = Tabs;

// interface JobGeneratorProps {
//   socket: WebSocket | null;
//   sendMessage: (message: string) => void;
//   isConnected: boolean;
//   messages?: any[];
// }

// interface SavedJD {
//   id: string;
//   title: string;
//   department: string;
//   content: string;
//   htmlContent?: string;
//   createdDate: string;
//   updatedDate: string;
//   status: 'draft' | 'review' | 'approved' | 'published';
//   version: number;
//   tags: string[];
//   analytics?: {
//     readabilityScore: number;
//     biasScore: number;
//     views: number;
//     applications: number;
//   };
//   collaborators?: string[];
//   template?: string;
// }

// const validationSchema = Yup.object({
//   jobTitle: Yup.string()
//     .required('Job title is required')
//     .min(3, 'Job title must be at least 3 characters')
//     .max(100, 'Job title must be less than 100 characters'),
//   department: Yup.string().required('Department is required'),
//   location: Yup.string().required('Location is required'),
//   experienceLevel: Yup.string().required('Experience level is required'),
//   employmentType: Yup.string().required('Employment type is required'),
//   keySkills: Yup.string()
//     .required('Key skills are required')
//     .min(10, 'Please provide more detailed skills'),
// });

// // const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
// // console.log("gemini key", GEMINI_API_KEY);
// // Gemini API integration
// // const generateWithGemini = async (prompt: string): Promise<string> => {
// //   const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
// //   console.log("gemini key", GEMINI_API_KEY);
// //   if (!GEMINI_API_KEY) {
// //     throw new Error('Gemini API key not found in environment variables');
// //   }

// //   try {
// //     const response = await fetch(
// //       `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
// //       {
// //         method: 'POST',
// //         headers: {
// //           'Content-Type': 'application/json',
// //         },
// //         body: JSON.stringify({
// //           contents: [{
// //             parts: [{
// //               text: prompt
// //             }]
// //           }],
// //           generationConfig: {
// //             temperature: 0.9,
// //             topK: 1,
// //             topP: 1,
// //             maxOutputTokens: 2048,
// //           },
// //           safetySettings: [
// //             {
// //               category: "HARM_CATEGORY_HARASSMENT",
// //               threshold: "BLOCK_MEDIUM_AND_ABOVE"
// //             },
// //             {
// //               category: "HARM_CATEGORY_HATE_SPEECH",
// //               threshold: "BLOCK_MEDIUM_AND_ABOVE"
// //             },
// //             {
// //               category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
// //               threshold: "BLOCK_MEDIUM_AND_ABOVE"
// //             },
// //             {
// //               category: "HARM_CATEGORY_DANGEROUS_CONTENT",
// //               threshold: "BLOCK_MEDIUM_AND_ABOVE"
// //             }
// //           ]
// //         })
// //       }
// //     );

// //     if (!response.ok) {
// //       throw new Error(`HTTP error! status: ${response.status}`);
// //     }

// //     const data = await response.json();

// //     if (data.candidates && data.candidates[0] && data.candidates[0].content) {
// //       return data.candidates[0].content.parts[0].text;
// //     } else {
// //       throw new Error('No content generated');
// //     }
// //   } catch (error) {
// //     console.error('Gemini API Error:', error);
// //     throw error;
// //   }
// // };

// const JobGenerator: React.FC<JobGeneratorProps> = ({ socket, sendMessage, isConnected, messages }) => {
//   // State Management
//   const [savedJDs, setSavedJDs] = useState<SavedJD[]>([]);
//   const [generatedJD, setGeneratedJD] = useState('');
//   const [generatedHTML, setGeneratedHTML] = useState('');
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [generationProgress, setGenerationProgress] = useState(0);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterStatus, setFilterStatus] = useState<string>('all');
//   const [sortBy, setSortBy] = useState<string>('updatedDate');
//   const [editingJD, setEditingJD] = useState<SavedJD | null>(null);
//   const [showTemplates, setShowTemplates] = useState(false);
//   const [autoSave, setAutoSave] = useState(true);
//   const [autoSaveStatus, setAutoSaveStatus] = useState<'saving' | 'saved' | 'error' | null>(null);
//   const [aiConfidence, setAiConfidence] = useState(0);
//   const [activeTab, setActiveTab] = useState('1');
//   const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

//   // Form Management with Formik - COMPLETE FORM
//   const formik = useFormik({
//     initialValues: {
//       jobTitle: '',
//       department: '',
//       location: '',
//       experienceLevel: '',
//       employmentType: '',
//       keySkills: '',
//       teamSize: '',
//       reportingTo: '',
//       salaryRange: '',
//       urgency: 'medium',
//       jobType: '',
//       benefits: '',
//       responsibilities: '',
//       requirements: '',
//       template: '',
//       workArrangement: '',
//       travelRequired: '',
//       industry: '',
//       companySize: ''
//     },
//     validationSchema,
//     onSubmit: generateJobDescription,
//   });

//   // Helper function to ensure analytics exist
//   const ensureAnalytics = (jd: SavedJD): SavedJD => {
//     return {
//       ...jd,
//       analytics: jd.analytics || {
//         readabilityScore: 0,
//         biasScore: 0,
//         views: 0,
//         applications: 0
//       },
//       collaborators: jd.collaborators || [],
//       htmlContent: jd.htmlContent || '',
//       version: jd.version || 1,
//       tags: jd.tags || []
//     };
//   };

//   // Auto-save functionality
//   useEffect(() => {
//     if (autoSave && autoSaveTimer.current) {
//       clearTimeout(autoSaveTimer.current);
//     }

//     if (autoSave) {
//       autoSaveTimer.current = setTimeout(() => {
//         if (formik.values.jobTitle && formik.dirty) {
//           autoSaveForm();
//         }
//       }, 2000);
//     }

//     return () => {
//       if (autoSaveTimer.current) {
//         clearTimeout(autoSaveTimer.current);
//       }
//     };
//   }, [formik.values, autoSave]);

//   // Load saved data on mount
//   useEffect(() => {
//     loadSavedJDs();
//   }, []);

//   const autoSaveForm = async () => {
//     setAutoSaveStatus('saving');
//     try {
//       await new Promise(resolve => setTimeout(resolve, 500));
//       localStorage.setItem('jd_draft', JSON.stringify(formik.values));
//       setAutoSaveStatus('saved');
//       setTimeout(() => setAutoSaveStatus(null), 2000);
//     } catch (error) {
//       setAutoSaveStatus('error');
//       message.error('Auto-save failed');
//     }
//   };

//   const loadSavedJDs = () => {
//     const saved = localStorage.getItem('saved_jds');
//     if (saved) {
//       try {
//         const parsedJDs = JSON.parse(saved);
//         const normalizedJDs = parsedJDs.map(ensureAnalytics);
//         setSavedJDs(normalizedJDs);
//         localStorage.setItem('saved_jds', JSON.stringify(normalizedJDs));
//       } catch (error) {
//         console.error('Error loading saved job descriptions:', error);
//         message.error('Error loading saved job descriptions');
//         setSavedJDs([]);
//       }
//     }

//     // Load draft if exists
//     const draft = localStorage.getItem('jd_draft');
//     if (draft) {
//       try {
//         const draftData = JSON.parse(draft);
//         formik.setValues(draftData);
//       } catch (error) {
//         console.error('Error loading draft:', error);
//       }
//     }
//   };

//   //   const createAIPrompt = (data: any): string => {
//   //     return `Create a comprehensive, professional job description for the following position:

//   // **Job Details:**
//   // - Title: ${data.jobTitle}
//   // - Department: ${data.department}
//   // - Location: ${data.location}
//   // - Experience Level: ${data.experienceLevel}
//   // - Employment Type: ${data.employmentType}
//   // - Work Arrangement: ${data.workArrangement || 'Not specified'}
//   // - Industry: ${data.industry || 'Technology'}
//   // - Company Size: ${data.companySize || 'Mid-size'}

//   // **Team & Reporting:**
//   // - Team Size: ${data.teamSize || 'Cross-functional team'}
//   // - Reports To: ${data.reportingTo || 'Department Manager'}
//   // - Travel Required: ${data.travelRequired || 'Minimal'}

//   // **Compensation & Benefits:**
//   // - Salary Range: ${data.salaryRange || 'Competitive package'}
//   // - Additional Benefits: ${data.benefits || 'Standard benefits package'}

//   // **Skills & Requirements:**
//   // - Key Skills: ${data.keySkills}
//   // - Additional Requirements: ${data.requirements || 'Standard qualifications'}
//   // - Key Responsibilities: ${data.responsibilities || 'Standard responsibilities'}

//   // **Urgency:** ${data.urgency}

//   // Please create a detailed, engaging job description that includes:
//   // 1. Company overview (use Navikenz India Pvt Ltd - AI-focused IT Services company)
//   // 2. Role summary and objectives
//   // 3. Key responsibilities (5-7 bullet points)
//   // 4. Required qualifications and skills
//   // 5. Preferred qualifications
//   // 6. Compensation and benefits
//   // 7. Work environment and culture
//   // 8. Application instructions

//   // Make it professional, inclusive, and appealing to qualified candidates. Use modern, engaging language while maintaining professionalism.`;
//   //   };

//   const createAIPrompt = (data: any): string => {
//     return `You are an expert HR professional and job description writer. Create a comprehensive, engaging, and professional job description for the following position. 

// **CRITICAL: You must provide a COMPLETE job description from start to finish. Do not truncate or stop mid-sentence.**

// **Job Details:**
// - Title: ${data.jobTitle}
// - Department: ${data.department}
// - Location: ${data.location}
// - Experience Level: ${data.experienceLevel}
// - Employment Type: ${data.employmentType}
// - Work Arrangement: ${data.workArrangement || 'Hybrid'}
// - Industry: Technology/AI Services
// - Company Size: Mid-size startup

// **Team & Reporting:**
// - Team Size: ${data.teamSize || 'Cross-functional team'}
// - Reports To: ${data.reportingTo || 'Department Manager'}
// - Travel Required: ${data.travelRequired || 'Minimal'}

// **Compensation & Benefits:**
// - Salary Range: ${data.salaryRange || 'Competitive package'}
// - Additional Benefits: ${data.benefits || 'Standard benefits package'}

// **Skills & Requirements:**
// - Key Skills: ${data.keySkills}
// - Additional Requirements: ${data.requirements || 'Standard qualifications'}
// - Key Responsibilities: ${data.responsibilities || 'Standard responsibilities'}

// **Urgency:** ${data.urgency}

// **STRUCTURE REQUIREMENTS:**
// Please create a COMPLETE job description with the following sections (write each section in full):

// 1. **Job Title and Basic Info**
// 2. **About Navikenz India Pvt Ltd** - Brief company overview (AI-focused IT Services)
// 3. **Position Overview** - Role summary with key details
// 4. **Role Summary** - Engaging description of the opportunity
// 5. **Key Responsibilities** - 6-8 detailed bullet points
// 6. **Required Qualifications** - Essential skills and experience
// 7. **Preferred Qualifications** - Nice-to-have skills
// 8. **Compensation & Benefits** - Complete benefits package
// 9. **Work Environment** - Culture and working conditions
// 10. **Why Join Navikenz?** - Compelling reasons to apply
// 11. **Application Instructions** - Clear next steps

// **WRITING GUIDELINES:**
// - Use engaging, modern language while maintaining professionalism
// - Write in second person ("you will", "you'll be responsible for")
// - Make it inclusive and bias-free
// - Include specific details about growth opportunities
// - End with a strong call-to-action
// - Ensure the description is 800-1200 words minimum
// - COMPLETE ALL SECTIONS - do not stop until you reach the application instructions

// **IMPORTANT: Write the complete job description from beginning to end. Do not truncate or stop mid-sentence. The response should end with application instructions and contact information.**

// Begin writing the complete job description now:`;
//   };

//   async function generateJobDescription() {
//     if (!formik.isValid) {
//       message.error('Please fix validation errors before generating');
//       return;
//     }

//     setIsGenerating(true);
//     setGenerationProgress(0);
//     setAiConfidence(0);

//     const prompt = createAIPrompt(formik.values);

//     try {
//       // Check if we have Gemini API key
//       const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

//       if (GEMINI_API_KEY) {
//         // Use real Gemini API
//         message.loading('Generating with Gemini AI...', 0);

//         // Simulate progress for better UX
//         const progressInterval = setInterval(() => {
//           setGenerationProgress(prev => {
//             if (prev >= 90) {
//               clearInterval(progressInterval);
//               return 90;
//             }
//             return prev + Math.random() * 15;
//           });
//         }, 500);

//         // const generatedContent = await generateWithGemini(prompt);
//         // console.log(generatedContent);

//         const response = await generateWithGemini(prompt, {
//           temperature: 0.8,
//           retryOnTruncation: true
//         });

//         clearInterval(progressInterval);
//         setGenerationProgress(100);
//         setGeneratedJD(response.text);
//         setGeneratedHTML(convertToHTML(response.text));
//         setAiConfidence(Math.floor(Math.random() * 10) + 90); // 90-100% for real AI

//         message.destroy();
//         notification.success({
//           message: 'Job Description Generated!',
//           description: `Complete job description generated (${response.text.length} characters)`,
//           icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
//         });

//       } else {
//         // Fallback to simulation if no API key
//         message.warning('Gemini API key not found. Using simulation mode.');
//         simulateGeneration();
//       }

//     } catch (error) {
//       console.error('Generation error:', error);
//       message.destroy();

//       // More specific error messages
//       const err = error as any;
//       if (err.message?.includes('quota')) {
//         message.error('API quota exceeded. Please try again later or contact support.');
//       } else if (err.message?.includes('safety')) {
//         message.error('Content was filtered by safety settings. Please modify your request.');
//       } else {
//         message.error(`Failed to generate job description: ${err.message}`);
//       }

//       // Fallback to simulation on error
//       message.info('Falling back to simulation mode...');
//       simulateGeneration();
//     } finally {
//       setIsGenerating(false);
//     }
//   }

//   const simulateGeneration = () => {
//     const fullContent = generateMockJD(formik.values);

//     let progress = 0;
//     const interval = setInterval(() => {
//       progress += Math.random() * 15;
//       setGenerationProgress(Math.min(progress, 100));

//       if (progress >= 100) {
//         clearInterval(interval);
//         setGeneratedJD(fullContent);
//         setGeneratedHTML(convertToHTML(fullContent));
//         setAiConfidence(Math.floor(Math.random() * 20) + 70); // 70-90% for simulation

//         notification.success({
//           message: 'Job Description Generated!',
//           description: 'Your job description has been generated (simulation mode).',
//           icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
//         });
//       }
//     }, 300);
//   };

//   const generateMockJD = (data: any): string => {
//     return `# ${data.jobTitle}

// ## About Navikenz India Pvt Ltd
// Navikenz is an Artificial Intelligence (AI) focused IT Services company that helps Enterprises discover and implement AI-enabled solutions to improve business processes and supplant human effort with human intuition.

// ## Position Overview
// **Department:** ${data.department}  
// **Location:** ${data.location}  
// **Experience Level:** ${data.experienceLevel}  
// **Employment Type:** ${data.employmentType}  
// **Work Arrangement:** ${data.workArrangement || 'Hybrid'}  
// **Reports To:** ${data.reportingTo || 'Department Head'}  
// **Team Size:** ${data.teamSize || '5-10 people'}  
// **Travel Required:** ${data.travelRequired || 'Minimal (< 10%)'}

// ## Role Summary
// We are seeking a dynamic ${data.jobTitle} to join our ${data.department} team. This role offers an exciting opportunity to work with cutting-edge AI technologies and make a significant impact on our client's business transformation journey.

// ## Key Responsibilities
// • Lead and collaborate with ${data.teamSize || 'cross-functional'} teams
// • Drive innovation in ${data.department} initiatives
// • Develop and implement strategic solutions using ${data.keySkills}
// • Mentor junior team members and foster knowledge sharing
// • Ensure quality delivery and adherence to best practices
// • Collaborate with stakeholders to understand business requirements
// ${data.responsibilities ? `• ${data.responsibilities.split(',').map((r: string) => r.trim()).join('\n• ')}` : ''}

// ## Required Qualifications
// • ${data.experienceLevel} in relevant field
// • Strong expertise in: ${data.keySkills}
// • Excellent communication and leadership skills
// • Bachelor's degree in relevant field or equivalent experience
// • Proven track record of successful project delivery
// ${data.requirements ? `• ${data.requirements.split(',').map((r: string) => r.trim()).join('\n• ')}` : ''}

// ## Preferred Qualifications
// • Advanced degree in relevant field
// • Industry certifications
// • Experience with agile methodologies
// • Previous experience in ${data.department} domain
// • Leadership or mentoring experience

// ## Compensation & Benefits
// ${data.salaryRange ? `• Competitive salary: ${data.salaryRange}` : '• Competitive salary package'}
// • Comprehensive health and dental insurance
// • Professional development opportunities and training budget
// • Flexible work arrangements and remote work options
// • Performance-based bonuses and stock options
// • Modern work environment with latest technology
// ${data.benefits ? `• ${data.benefits.split(',').map((b: string) => b.trim()).join('\n• ')}` : ''}

// ## Work Environment
// • Collaborative and innovation-driven culture
// • Modern office with latest technology
// • ${data.workArrangement || 'Hybrid'} work model
// • Supportive learning environment
// • Opportunities for rapid career growth

// ## Why Join Navikenz?
// • Work on cutting-edge AI projects with Fortune 500 clients
// • Access to latest technologies and tools
// • Clear career paths and growth opportunities
// • Diverse and inclusive workplace
// • Make a real impact on business transformation

// ---
// **Application Instructions:**
// This position has **${data.urgency}** priority for filling. We encourage diverse candidates to apply.

// Ready to transform the future with AI? Apply now with your resume and cover letter.

// *Navikenz is an equal opportunity employer committed to diversity and inclusion.*`;
//   };

//   const convertToHTML = (markdown: string): string => {
//     return markdown
//       .replace(/^# (.*$)/gm, '<h1>$1</h1>')
//       .replace(/^## (.*$)/gm, '<h2>$1</h2>')
//       .replace(/^### (.*$)/gm, '<h3>$1</h3>')
//       .replace(/^\• (.*$)/gm, '<li>$1</li>')
//       .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
//       .replace(/\*(.*?)\*/g, '<em>$1</em>')
//       .replace(/\n/g, '<br>');
//   };

//   const saveJobDescription = async () => {
//     if (!generatedJD) {
//       message.warning('No job description to save');
//       return;
//     }

//     const newJD: SavedJD = {
//       id: editingJD?.id || `jd_${Date.now()}`,
//       title: formik.values.jobTitle,
//       department: formik.values.department,
//       content: generatedJD,
//       htmlContent: generatedHTML,
//       createdDate: editingJD?.createdDate || new Date().toISOString(),
//       updatedDate: new Date().toISOString(),
//       status: editingJD?.status || 'draft',
//       version: (editingJD?.version || 0) + 1,
//       tags: [formik.values.department, formik.values.experienceLevel, formik.values.location].filter(Boolean),
//       analytics: {
//         readabilityScore: calculateReadabilityScore(generatedJD),
//         biasScore: calculateBiasScore(generatedJD),
//         views: editingJD?.analytics?.views || 0,
//         applications: editingJD?.analytics?.applications || 0
//       },
//       collaborators: editingJD?.collaborators || [],
//     };

//     const updatedJDs = editingJD
//       ? savedJDs.map(jd => jd.id === editingJD.id ? newJD : jd)
//       : [...savedJDs, newJD];

//     setSavedJDs(updatedJDs);
//     localStorage.setItem('saved_jds', JSON.stringify(updatedJDs));
//     localStorage.removeItem('jd_draft');
//     setEditingJD(null);

//     notification.success({
//       message: editingJD ? 'Job Description Updated!' : 'Job Description Saved!',
//       description: 'Your job description has been saved successfully.',
//       icon: <SaveOutlined style={{ color: '#52c41a' }} />
//     });
//   };

//   const calculateReadabilityScore = (text: string): number => {
//     if (!text) return 0;
//     const sentences = text.split(/[.!?]+/).length;
//     const words = text.split(/\s+/).length;
//     const syllables = text.toLowerCase().split(/[aeiou]+/).length;

//     if (sentences === 0 || words === 0) return 0;

//     const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
//     return Math.max(0, Math.min(100, Math.round(score)));
//   };

//   const calculateBiasScore = (text: string): number => {
//     if (!text) return 0;
//     const biasWords = ['ninja', 'rockstar', 'guru', 'he/him', 'she/her', 'guys', 'manpower'];
//     const inclusiveWords = ['they/them', 'team member', 'professional', 'expert', 'specialist'];

//     const biasCount = biasWords.reduce((count, word) =>
//       count + (text.toLowerCase().includes(word) ? 1 : 0), 0);
//     const inclusiveCount = inclusiveWords.reduce((count, word) =>
//       count + (text.toLowerCase().includes(word) ? 1 : 0), 0);

//     const score = Math.max(0, 100 - (biasCount * 10) + (inclusiveCount * 5));
//     return Math.min(100, score);
//   };

//   const resetForm = () => {
//     formik.resetForm();
//     setGeneratedJD('');
//     setGeneratedHTML('');
//     setEditingJD(null);
//     setGenerationProgress(0);
//     localStorage.removeItem('jd_draft');
//     message.success('Form reset successfully');
//   };

//   // Rest of the component methods (deleteJD, editJD, etc.) remain the same...
//   const deleteJD = (id: string) => {
//     Modal.confirm({
//       title: 'Delete Job Description',
//       content: 'Are you sure you want to delete this job description? This action cannot be undone.',
//       icon: <DeleteOutlined />,
//       okText: 'Yes, Delete',
//       okType: 'danger',
//       cancelText: 'Cancel',
//       onOk() {
//         const updatedJDs = savedJDs.filter(jd => jd.id !== id);
//         setSavedJDs(updatedJDs);
//         localStorage.setItem('saved_jds', JSON.stringify(updatedJDs));
//         notification.success({
//           message: 'Job Description Deleted',
//           description: 'The job description has been successfully deleted.',
//           icon: <DeleteOutlined style={{ color: '#52c41a' }} />
//         });
//       }
//     });
//   };

//   const updateJDStatus = (id: string, status: SavedJD['status']) => {
//     const updatedJDs = savedJDs.map(jd =>
//       jd.id === id ? { ...jd, status, updatedDate: new Date().toISOString() } : jd
//     );
//     setSavedJDs(updatedJDs);
//     localStorage.setItem('saved_jds', JSON.stringify(updatedJDs));
//     message.success(`Status updated to ${status}`);
//   };

//   const shareJD = (jd: SavedJD) => {
//     navigator.clipboard.writeText(jd.content).then(() => {
//       notification.success({
//         message: 'Job Description Copied!',
//         description: 'The job description has been copied to your clipboard for sharing.',
//         icon: <ShareAltOutlined style={{ color: '#52c41a' }} />
//       });
//     });
//   };

//   const editJD = (jd: SavedJD) => {
//     const normalizedJD = ensureAnalytics(jd);
//     setEditingJD(normalizedJD);
//     setGeneratedJD(normalizedJD.content);
//     setGeneratedHTML(normalizedJD.htmlContent || '');

//     formik.setValues({
//       jobTitle: normalizedJD.title,
//       department: normalizedJD.department,
//       location: '',
//       experienceLevel: '',
//       employmentType: '',
//       keySkills: normalizedJD.tags.join(', '),
//       teamSize: '',
//       reportingTo: '',
//       salaryRange: '',
//       urgency: 'medium',
//       jobType: '',
//       benefits: '',
//       responsibilities: '',
//       requirements: '',
//       template: '',
//       workArrangement: '',
//       travelRequired: '',
//       industry: '',
//       companySize: ''
//     });
//     setActiveTab('1');
//   };

//   const filteredJDs = savedJDs.filter(jd => {
//     const normalizedJD = ensureAnalytics(jd);
//     const matchesSearch = normalizedJD.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       normalizedJD.department.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesStatus = filterStatus === 'all' || normalizedJD.status === filterStatus;
//     return matchesSearch && matchesStatus;
//   });

//   // Safe calculation for analytics
//   const getAverageReadabilityScore = () => {
//     if (savedJDs.length === 0) return 0;
//     const total = savedJDs.reduce((sum, jd) => {
//       const normalizedJD = ensureAnalytics(jd);
//       return sum + (normalizedJD.analytics?.readabilityScore || 0);
//     }, 0);
//     return Math.round(total / savedJDs.length);
//   };

//   const getAverageBiasScore = () => {
//     if (savedJDs.length === 0) return 0;
//     const total = savedJDs.reduce((sum, jd) => {
//       const normalizedJD = ensureAnalytics(jd);
//       return sum + (normalizedJD.analytics?.biasScore || 0);
//     }, 0);
//     return Math.round(total / savedJDs.length);
//   };

//   return (
//     <div className="job-generator">
//       {/* Header */}
//       <div className="page-header">
//         <Row justify="space-between" align="middle">
//           <Col>
//             <h1>AI Job Description Generator</h1>
//             <p>Create compelling, inclusive job descriptions with {process.env.REACT_APP_GEMINI_API_KEY ? 'Gemini AI' : 'AI simulation'}</p>
//           </Col>
//           <Col>
//             <Space>
//               {autoSaveStatus && (
//                 <Badge
//                   status={autoSaveStatus === 'saved' ? 'success' : autoSaveStatus === 'saving' ? 'processing' : 'error'}
//                   text={
//                     autoSaveStatus === 'saving' ? 'Saving...' :
//                       autoSaveStatus === 'saved' ? 'Auto-saved' : 'Save failed'
//                   }
//                 />
//               )}
//               <Tooltip title="Toggle Auto-save">
//                 <Switch
//                   checked={autoSave}
//                   onChange={setAutoSave}
//                   checkedChildren={<SaveOutlined />}
//                   unCheckedChildren={<CloseOutlined />}
//                 />
//               </Tooltip>
//             </Space>
//           </Col>
//         </Row>
//       </div>

//       <Tabs activeKey={activeTab} onChange={setActiveTab}>
//         <TabPane tab={<span><EditOutlined />Create & Edit</span>} key="1">
//           <Row gutter={24}>
//             {/* COMPLETE FORM SECTION */}
//             <Col xs={24} lg={12}>
//               <Card
//                 title="Job Requirements"
//                 extra={
//                   <Space>
//                     <Button
//                       icon={<ReloadOutlined />}
//                       onClick={resetForm}
//                       disabled={isGenerating}
//                     >
//                       Reset
//                     </Button>
//                   </Space>
//                 }
//               >
//                 <form onSubmit={formik.handleSubmit}>
//                   {/* Row 1: Job Title & Department */}
//                   <Row gutter={16}>
//                     <Col xs={24} sm={12}>
//                       <div className="form-group">
//                         <label>Job Title *</label>
//                         <Input
//                           name="jobTitle"
//                           value={formik.values.jobTitle}
//                           onChange={formik.handleChange}
//                           onBlur={formik.handleBlur}
//                           placeholder="e.g., Senior Software Engineer"
//                           status={formik.touched.jobTitle && formik.errors.jobTitle ? 'error' : ''}
//                           className='JD-FormInput'
//                         />
//                         {formik.touched.jobTitle && formik.errors.jobTitle && (
//                           <div className="error-message">{formik.errors.jobTitle}</div>
//                         )}
//                       </div>
//                     </Col>

//                     <Col xs={24} sm={12}>
//                       <div className="form-group">
//                         <label>Department *</label>
//                         <Select
//                           value={formik.values.department}
//                           onChange={(value) => formik.setFieldValue('department', value)}
//                           placeholder="Select Department"
//                           style={{ width: '100%' }}
//                           status={formik.touched.department && formik.errors.department ? 'error' : ''}
//                           className='JD-FormInput'
//                         >
//                           <Option value="Engineering"><RobotOutlined /> Engineering</Option>
//                           <Option value="Product"><BulbOutlined /> Product</Option>
//                           <Option value="Marketing"><GlobalOutlined /> Marketing</Option>
//                           <Option value="Sales"><ThunderboltOutlined /> Sales</Option>
//                           <Option value="HR"><TeamOutlined /> Human Resources</Option>
//                           <Option value="Finance"><HeartOutlined /> Finance</Option>
//                           <Option value="Operations"><SettingOutlined /> Operations</Option>
//                           <Option value="Design"><BulbOutlined /> Design</Option>
//                         </Select>
//                         {formik.touched.department && formik.errors.department && (
//                           <div className="error-message">{formik.errors.department}</div>
//                         )}
//                       </div>
//                     </Col>
//                   </Row>

//                   {/* Row 2: Location & Experience Level */}
//                   <Row gutter={16}>
//                     <Col xs={24} sm={12}>
//                       <div className="form-group">
//                         <label>Location *</label>
//                         <Input
//                           name="location"
//                           value={formik.values.location}
//                           onChange={formik.handleChange}
//                           onBlur={formik.handleBlur}
//                           placeholder="e.g., Bangalore, Remote, Hybrid"
//                           status={formik.touched.location && formik.errors.location ? 'error' : ''}
//                           className='JD-FormInput'
//                         />
//                         {formik.touched.location && formik.errors.location && (
//                           <div className="error-message">{formik.errors.location}</div>
//                         )}
//                       </div>
//                     </Col>

//                     <Col xs={24} sm={12}>
//                       <div className="form-group">
//                         <label>Experience Level *</label>
//                         <Select
//                           value={formik.values.experienceLevel}
//                           onChange={(value) => formik.setFieldValue('experienceLevel', value)}
//                           placeholder="Select Experience"
//                           style={{ width: '100%' }}
//                           status={formik.touched.experienceLevel && formik.errors.experienceLevel ? 'error' : ''}
//                           className='JD-FormInput'
//                         >
//                           <Option value="Entry Level (0-2 years)">Entry Level (0-2 years)</Option>
//                           <Option value="Mid Level (3-5 years)">Mid Level (3-5 years)</Option>
//                           <Option value="Senior Level (5-8 years)">Senior Level (5-8 years)</Option>
//                           <Option value="Lead Level (8+ years)">Lead Level (8+ years)</Option>
//                           <Option value="Executive Level">Executive Level</Option>
//                         </Select>
//                         {formik.touched.experienceLevel && formik.errors.experienceLevel && (
//                           <div className="error-message">{formik.errors.experienceLevel}</div>
//                         )}
//                       </div>
//                     </Col>
//                   </Row>

//                   {/* Row 3: Employment Type & Work Arrangement */}
//                   <Row gutter={16}>
//                     <Col xs={24} sm={12}>
//                       <div className="form-group">
//                         <label>Employment Type *</label>
//                         <Select
//                           value={formik.values.employmentType}
//                           onChange={(value) => formik.setFieldValue('employmentType', value)}
//                           placeholder="Select Type"
//                           style={{ width: '100%' }}
//                           status={formik.touched.employmentType && formik.errors.employmentType ? 'error' : ''}
//                           className='JD-FormInput'
//                         >
//                           <Option value="Full-time">Full-time</Option>
//                           <Option value="Part-time">Part-time</Option>
//                           <Option value="Contract">Contract</Option>
//                           <Option value="Internship">Internship</Option>
//                           <Option value="Freelance">Freelance</Option>
//                         </Select>
//                         {formik.touched.employmentType && formik.errors.employmentType && (
//                           <div className="error-message">{formik.errors.employmentType}</div>
//                         )}
//                       </div>
//                     </Col>

//                     <Col xs={24} sm={12}>
//                       <div className="form-group">
//                         <label>Work Arrangement</label>
//                         <Select
//                           value={formik.values.workArrangement}
//                           onChange={(value) => formik.setFieldValue('workArrangement', value)}
//                           placeholder="Select Work Model"
//                           style={{ width: '100%' }}
//                           className='JD-FormInput'
//                         >
//                           <Option value="On-site">On-site</Option>
//                           <Option value="Remote">Remote</Option>
//                           <Option value="Hybrid">Hybrid</Option>
//                           <Option value="Flexible">Flexible</Option>
//                         </Select>
//                       </div>
//                     </Col>
//                   </Row>

//                   {/* Row 4: Salary Range & Team Size */}
//                   <Row gutter={16}>
//                     <Col xs={24} sm={12}>
//                       <div className="form-group">
//                         <label>Salary Range</label>
//                         <Input
//                           name="salaryRange"
//                           value={formik.values.salaryRange}
//                           onChange={formik.handleChange}
//                           placeholder="e.g., ₹12-18 LPA"
//                           prefix="₹"
//                           className='JD-FormInput'
//                         />
//                       </div>
//                     </Col>

//                     <Col xs={24} sm={12}>
//                       <div className="form-group">
//                         <label>Team Size</label>
//                         <Input
//                           name="teamSize"
//                           value={formik.values.teamSize}
//                           onChange={formik.handleChange}
//                           placeholder="e.g., 5-10 people"
//                           className='JD-FormInput'
//                         />
//                       </div>
//                     </Col>
//                   </Row>

//                   {/* Row 5: Reports To & Travel Required */}
//                   <Row gutter={16}>
//                     <Col xs={24} sm={12}>
//                       <div className="form-group">
//                         <label>Reports To</label>
//                         <Input
//                           name="reportingTo"
//                           value={formik.values.reportingTo}
//                           onChange={formik.handleChange}
//                           placeholder="e.g., Engineering Manager"
//                           className='JD-FormInput'
//                         />
//                       </div>
//                     </Col>

//                     <Col xs={24} sm={12}>
//                       <div className="form-group">
//                         <label>Travel Required</label>
//                         <Select
//                           value={formik.values.travelRequired}
//                           onChange={(value) => formik.setFieldValue('travelRequired', value)}
//                           placeholder="Select Travel"
//                           style={{ width: '100%' }}
//                           className='JD-FormInput'
//                         >
//                           <Option value="None">None</Option>
//                           <Option value="Minimal (< 10%)">Minimal (&lt; 10%)</Option>
//                           <Option value="Occasional (10-25%)">Occasional (10-25%)</Option>
//                           <Option value="Frequent (25-50%)">Frequent (25-50%)</Option>
//                           <Option value="Extensive (> 50%)">Extensive (&gt; 50%)</Option>
//                         </Select>
//                       </div>
//                     </Col>
//                   </Row>

//                   {/* Key Skills */}
//                   <div className="form-group">
//                     <label>Key Skills Required *</label>
//                     <Select
//                       mode="tags"
//                       value={formik.values.keySkills.split(',').filter(skill => skill.trim())}
//                       onChange={(values) => formik.setFieldValue('keySkills', values.join(', '))}
//                       placeholder="Type or select skills"
//                       style={{ width: '100%' }}
//                       tokenSeparators={[',']}
//                       status={formik.touched.keySkills && formik.errors.keySkills ? 'error' : ''}
//                       className='JD-FormInput'
//                     >
//                       <Option value="JavaScript">JavaScript</Option>
//                       <Option value="React">React</Option>
//                       <Option value="Node.js">Node.js</Option>
//                       <Option value="Python">Python</Option>
//                       <Option value="Java">Java</Option>
//                       <Option value="AWS">AWS</Option>
//                       <Option value="Docker">Docker</Option>
//                       <Option value="Leadership">Leadership</Option>
//                       <Option value="Communication">Communication</Option>
//                       <Option value="Project Management">Project Management</Option>
//                     </Select>
//                     {formik.touched.keySkills && formik.errors.keySkills && (
//                       <div className="error-message">{formik.errors.keySkills}</div>
//                     )}
//                   </div>

//                   {/* Additional Fields */}
//                   <Row gutter={16}>
//                     <Col xs={24} sm={12}>
//                       <div className="form-group">
//                         <label>Additional Benefits</label>
//                         <TextArea
//                           name="benefits"
//                           value={formik.values.benefits}
//                           onChange={formik.handleChange}
//                           placeholder="e.g., Health insurance, Stock options, Flexible hours"
//                           rows={3}
//                         />
//                       </div>
//                     </Col>

//                     <Col xs={24} sm={12}>
//                       <div className="form-group">
//                         <label>Additional Requirements</label>
//                         <TextArea
//                           name="requirements"
//                           value={formik.values.requirements}
//                           onChange={formik.handleChange}
//                           placeholder="Any additional qualifications"
//                           rows={3}
//                         />
//                       </div>
//                     </Col>
//                   </Row>

//                   <div className="form-group">
//                     <label>Key Responsibilities</label>
//                     <TextArea
//                       name="responsibilities"
//                       value={formik.values.responsibilities}
//                       onChange={formik.handleChange}
//                       placeholder="List main responsibilities (comma-separated)"
//                       rows={3}
//                     />
//                   </div>

//                   <Divider />

//                   <Space wrap>
//                     <Button
//                       type="primary"
//                       htmlType="submit"
//                       loading={isGenerating}
//                       // disabled={!formik.isValid}
//                       icon={<RobotOutlined />}
//                       size="large"
//                     >
//                       {isGenerating ? `Generating... ${generationProgress}%` : 'Generate Job Description'}
//                     </Button>

//                     {!process.env.REACT_APP_GEMINI_API_KEY && (
//                       <div style={{ color: '#faad14', display: 'flex', alignItems: 'center', gap: 8 }}>
//                         <WarningOutlined />
//                         Add REACT_APP_GEMINI_API_KEY to .env for real AI generation
//                       </div>
//                     )}
//                   </Space>

//                   {isGenerating && (
//                     <div style={{ marginTop: 16 }}>
//                       <Progress
//                         percent={generationProgress}
//                         status={generationProgress === 100 ? 'success' : 'active'}
//                         strokeColor={{
//                           '0%': '#108ee9',
//                           '100%': '#87d068',
//                         }}
//                       />
//                     </div>
//                   )}
//                 </form>
//               </Card>
//             </Col>

//             {/* Output Section */}
//             <Col xs={24} lg={12}>
//               <Card
//                 title={
//                   <Space>
//                     <span>Generated Job Description</span>
//                     {aiConfidence > 0 && (
//                       <Badge count={`${aiConfidence}% confidence`} style={{ backgroundColor: '#52c41a' }} />
//                     )}
//                   </Space>
//                 }
//                 extra={
//                   generatedJD && (
//                     <Space>
//                       <Button
//                         icon={<ReloadOutlined />}
//                         onClick={() => generateJobDescription()}
//                         disabled={isGenerating}
//                       >
//                         Regenerate
//                       </Button>
//                       <Button
//                         icon={<CopyOutlined />}
//                         onClick={() => {
//                           navigator.clipboard.writeText(generatedJD);
//                           message.success('Copied to clipboard!');
//                         }}
//                       >
//                         Copy
//                       </Button>
//                       <Button
//                         type="primary"
//                         icon={<SaveOutlined />}
//                         onClick={saveJobDescription}
//                       >
//                         Save
//                       </Button>
//                     </Space>
//                   )
//                 }
//               >
//                 {isGenerating && (
//                   <div style={{ textAlign: 'center', padding: '40px 0' }}>
//                     <RobotOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
//                     <p>{process.env.REACT_APP_GEMINI_API_KEY ? 'Crafting your job description...' : 'Crafting your job description...'}</p>
//                   </div>
//                 )}

//                 {generatedJD && !isGenerating && (
//                   <div>
//                     <Tabs size="small" style={{ marginBottom: 16 }}>
//                       <TabPane tab="Markdown" key="markdown">
//                         <div style={{
//                           background: '#fafafa',
//                           border: '1px solid #d9d9d9',
//                           borderRadius: 6,
//                           padding: 16,
//                           maxHeight: 500,
//                           overflow: 'auto'
//                         }}>
//                           <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: 13 }}>
//                             {generatedJD}
//                           </pre>
//                         </div>
//                       </TabPane>
//                       <TabPane tab="HTML Preview" key="html">
//                         <div
//                           style={{
//                             background: 'white',
//                             border: '1px solid #d9d9d9',
//                             borderRadius: 6,
//                             padding: 16,
//                             maxHeight: 500,
//                             overflow: 'auto'
//                           }}
//                           dangerouslySetInnerHTML={{ __html: generatedHTML }}
//                         />
//                       </TabPane>
//                     </Tabs>

//                     {/* Analytics Section */}
//                     <Card size="small" title="Content Analysis">
//                       <Row gutter={16}>
//                         <Col span={12}>
//                           <div style={{ textAlign: 'center' }}>
//                             <div style={{ fontSize: 18, color: '#52c41a', marginBottom: 4 }}>
//                               {calculateReadabilityScore(generatedJD)}%
//                             </div>
//                             <div style={{ fontSize: 12, color: '#666' }}>Readability Score</div>
//                           </div>
//                         </Col>
//                         <Col span={12}>
//                           <div style={{ textAlign: 'center' }}>
//                             <div style={{ fontSize: 18, color: '#1890ff', marginBottom: 4 }}>
//                               {calculateBiasScore(generatedJD)}%
//                             </div>
//                             <div style={{ fontSize: 12, color: '#666' }}>Inclusivity Score</div>
//                           </div>
//                         </Col>
//                       </Row>
//                     </Card>
//                   </div>
//                 )}

//                 {!generatedJD && !isGenerating && (
//                   <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
//                     <FileTextOutlined style={{ fontSize: 64, marginBottom: 16 }} />
//                     {/* <h3 style={{ color: '#666' }}>Ready to Generate</h3> */}
//                     {process.env.REACT_APP_GEMINI_API_KEY && (
//                       <h3 style={{ color: '#52c41a' }}>Ready to Generate</h3>
//                     )}
//                     <p>Fill in the job requirements and click "Generate Job Description"</p>
//                   </div>
//                 )}
//               </Card>
//             </Col>
//           </Row>
//         </TabPane>

//         <TabPane tab={<span><FileTextOutlined />Saved Jobs ({savedJDs.length})</span>} key="2">
//           {/* Saved jobs section remains the same */}
//           <Card>
//             <Row gutter={16} align="middle">
//               <Col xs={24} sm={8}>
//                 <Input
//                   placeholder="Search job descriptions..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   prefix={<SearchOutlined />}
//                   allowClear
//                 />
//               </Col>
//               <Col xs={24} sm={6}>
//                 <Select
//                   value={filterStatus}
//                   onChange={setFilterStatus}
//                   style={{ width: '100%' }}
//                   placeholder="Filter by status"
//                 >
//                   <Option value="all">All Status</Option>
//                   <Option value="draft">Draft</Option>
//                   <Option value="review">Under Review</Option>
//                   <Option value="approved">Approved</Option>
//                   <Option value="published">Published</Option>
//                 </Select>
//               </Col>
//               <Col xs={24} sm={4}>
//                 <Button
//                   icon={<PlusOutlined />}
//                   type="primary"
//                   onClick={() => setActiveTab('1')}
//                   block
//                 >
//                   New JD
//                 </Button>
//               </Col>
//             </Row>
//           </Card>

//           {filteredJDs.length === 0 ? (
//             <Card style={{ marginTop: 16 }}>
//               <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
//                 <FileTextOutlined style={{ fontSize: 64, marginBottom: 16 }} />
//                 <h3 style={{ color: '#666' }}>No Job Descriptions Found</h3>
//                 <p>Create your first job description to get started</p>
//                 <Button
//                   type="primary"
//                   icon={<PlusOutlined />}
//                   onClick={() => setActiveTab('1')}
//                   style={{ marginTop: 16 }}
//                 >
//                   Create Job Description
//                 </Button>
//               </div>
//             </Card>
//           ) : (
//             <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
//               {filteredJDs.map((jd) => {
//                 const normalizedJD = ensureAnalytics(jd);
//                 return (
//                   <Col xs={24} sm={12} lg={8} key={normalizedJD.id}>
//                     <Card
//                       hoverable
//                       actions={[
//                         <Tooltip title="View & Edit">
//                           <EyeOutlined onClick={() => editJD(normalizedJD)} />
//                         </Tooltip>,
//                         <Tooltip title="Copy Content">
//                           <CopyOutlined onClick={() => {
//                             navigator.clipboard.writeText(normalizedJD.content);
//                             message.success('Copied to clipboard!');
//                           }} />
//                         </Tooltip>,
//                         <Tooltip title="Delete">
//                           <DeleteOutlined onClick={() => deleteJD(normalizedJD.id)} />
//                         </Tooltip>
//                       ]}
//                     >
//                       <Card.Meta
//                         title={normalizedJD.title}
//                         description={
//                           <div>
//                             <p style={{ margin: '8px 0', color: '#666' }}>
//                               {normalizedJD.department}
//                             </p>
//                             <p style={{ margin: '8px 0', color: '#999', fontSize: 12 }}>
//                               Updated: {new Date(normalizedJD.updatedDate).toLocaleDateString()}
//                             </p>

//                             <div style={{ marginTop: 12 }}>
//                               <Row gutter={8}>
//                                 <Col span={12}>
//                                   <div style={{ textAlign: 'center', fontSize: 12 }}>
//                                     <div style={{ color: '#52c41a', fontWeight: 'bold' }}>
//                                       {normalizedJD.analytics?.readabilityScore || 0}%
//                                     </div>
//                                     <div style={{ color: '#999' }}>Readability</div>
//                                   </div>
//                                 </Col>
//                                 <Col span={12}>
//                                   <div style={{ textAlign: 'center', fontSize: 12 }}>
//                                     <div style={{ color: '#1890ff', fontWeight: 'bold' }}>
//                                       {normalizedJD.analytics?.biasScore || 0}%
//                                     </div>
//                                     <div style={{ color: '#999' }}>Inclusivity</div>
//                                   </div>
//                                 </Col>
//                               </Row>
//                             </div>
//                             <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
//                               {normalizedJD.tags.slice(0, 3).map(tag => (
//                                 <Tag key={tag}>{tag}</Tag>
//                               ))}
//                               {normalizedJD.tags.length > 3 && (
//                                 <Tag>+{normalizedJD.tags.length - 3} more</Tag>
//                               )}
//                             </div>

//                             {normalizedJD.status === 'draft' && (
//                               <Button
//                                 type="link"
//                                 size="small"
//                                 icon={<SendOutlined />}
//                                 onClick={() => updateJDStatus(normalizedJD.id, 'review')}
//                                 style={{ padding: '4px 0', marginTop: 8 }}
//                               >
//                                 Submit for Review
//                               </Button>
//                             )}

//                             {normalizedJD.status === 'approved' && (
//                               <Button
//                                 type="link"
//                                 size="small"
//                                 icon={<GlobalOutlined />}
//                                 onClick={() => updateJDStatus(normalizedJD.id, 'published')}
//                                 style={{ padding: '4px 0', marginTop: 8 }}
//                               >
//                                 Publish
//                               </Button>
//                             )}
//                           </div>
//                         }
//                       />
//                   </Card>
//                   </Col>
//           );
//               })}
//         </Row>
//           )}
//       </TabPane>
//       <TabPane tab={<span><SettingOutlined />Analytics</span>} key="3">
//         <Row gutter={16}>
//           <Col span={24}>
//             <Card title="Job Description Analytics Dashboard">
//               <Row gutter={16}>
//                 <Col xs={24} sm={6}>
//                   <Card>
//                     <div style={{ textAlign: 'center' }}>
//                       <div style={{ fontSize: 24, color: '#1890ff', marginBottom: 8 }}>
//                         {savedJDs.length}
//                       </div>
//                       <div>Total JDs</div>
//                     </div>
//                   </Card>
//                 </Col>
//                 <Col xs={24} sm={6}>
//                   <Card>
//                     <div style={{ textAlign: 'center' }}>
//                       <div style={{ fontSize: 24, color: '#52c41a', marginBottom: 8 }}>
//                         {savedJDs.filter(jd => jd.status === 'published').length}
//                       </div>
//                       <div>Published</div>
//                     </div>
//                   </Card>
//                 </Col>
//                 <Col xs={24} sm={6}>
//                   <Card>
//                     <div style={{ textAlign: 'center' }}>
//                       <div style={{ fontSize: 24, color: '#faad14', marginBottom: 8 }}>
//                         {savedJDs.filter(jd => jd.status === 'review').length}
//                       </div>
//                       <div>Under Review</div>
//                     </div>
//                   </Card>
//                 </Col>
//                 <Col xs={24} sm={6}>
//                   <Card>
//                     <div style={{ textAlign: 'center' }}>
//                       <div style={{ fontSize: 24, color: '#666', marginBottom: 8 }}>
//                         {savedJDs.filter(jd => jd.status === 'draft').length}
//                       </div>
//                       <div>Drafts</div>
//                     </div>
//                   </Card>
//                 </Col>
//               </Row>

//               <Row gutter={16} style={{ marginTop: 16 }}>
//                 <Col xs={24} sm={12}>
//                   <Card title="Average Readability Score">
//                     <div style={{ textAlign: 'center' }}>
//                       <Progress
//                         type="circle"
//                         percent={getAverageReadabilityScore()}
//                         strokeColor="#52c41a"
//                       />
//                     </div>
//                   </Card>
//                 </Col>
//                 <Col xs={24} sm={12}>
//                   <Card title="Average Inclusivity Score">
//                     <div style={{ textAlign: 'center' }}>
//                       <Progress
//                         type="circle"
//                         percent={getAverageBiasScore()}
//                         strokeColor="#1890ff"
//                       />
//                     </div>
//                   </Card>
//                 </Col>
//               </Row>
//             </Card>
//           </Col>
//         </Row>
//       </TabPane>
//     </Tabs>
//     </div >
//   );
// };

// export default JobGenerator;

import React, { useState, useEffect, useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Button, Input, Select, Modal, Progress, Tag, notification, Tooltip,
  Card, Row, Col, Divider, Switch, Badge, Dropdown, Menu, Space,
  AutoComplete, Tabs, message, Spin, Table, InputNumber, DatePicker
} from 'antd';
import {
  ReloadOutlined, SaveOutlined, CloseOutlined, FileTextOutlined,
  CopyOutlined, DeleteOutlined, WarningOutlined, DownloadOutlined,
  SearchOutlined, EditOutlined, PlusOutlined, SettingOutlined,
  CheckCircleOutlined, ClockCircleOutlined, EyeOutlined,
  ShareAltOutlined, ThunderboltOutlined, RobotOutlined,
  FilePdfOutlined, FileWordOutlined, FileMarkdownOutlined,
  SendOutlined, BulbOutlined, TeamOutlined, GlobalOutlined, HeartOutlined
} from '@ant-design/icons';
import moment from 'moment';
import api from '../../../services/api';
import { generateJobDescription as generateWithGemini } from '../../../utils/gemini';

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

interface JobGeneratorProps {
  socket: WebSocket | null;
  sendMessage: (message: string) => void;
  isConnected: boolean;
  messages?: any[];
}

// Updated interface to match your Job model
interface JobRecord {
  id: number;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  description: string;
  responsibilities: string[];
  required_qualifications: string[];
  preferred_qualifications: string[];
  required_skills: string[];
  preferred_skills: string[];
  experience_level: string;
  min_experience_years: number;
  max_experience_years?: number;
  salary_min?: number;
  salary_max?: number;
  currency: string;
  benefits: string[];
  status: 'draft' | 'review' | 'approved' | 'published' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  ai_generated: boolean;
  generation_prompt?: string;
  hiring_manager_id?: number;
  recruiter_id?: number;
  positions_available: number;
  positions_filled: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  deadline?: string;
}

const validationSchema = Yup.object({
  title: Yup.string()
    .required('Job title is required')
    .min(3, 'Job title must be at least 3 characters')
    .max(255, 'Job title must be less than 255 characters'),
  department: Yup.string().required('Department is required'),
  location: Yup.string().required('Location is required'),
  experience_level: Yup.string().required('Experience level is required'),
  employment_type: Yup.string().required('Employment type is required'),
  required_skills: Yup.string()
    .required('Required skills are required')
    .min(10, 'Please provide more detailed skills'),
});

const JobGenerator: React.FC<JobGeneratorProps> = ({ socket, sendMessage, isConnected, messages }) => {
  // State Management
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatedJD, setGeneratedJD] = useState('');
  const [generatedHTML, setGeneratedHTML] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updated_at');
  const [editingJob, setEditingJob] = useState<JobRecord | null>(null);
  const [autoSave, setAutoSave] = useState(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saving' | 'saved' | 'error' | null>(null);
  const [aiConfidence, setAiConfidence] = useState(0);
  const [activeTab, setActiveTab] = useState('1');
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // Form Management with Formik - Updated for Job model
  const formik = useFormik({
    initialValues: {
      title: '',
      department: '',
      location: '',
      employment_type: '',
      experience_level: '',
      min_experience_years: 0,
      max_experience_years: '',
      salary_min: '',
      salary_max: '',
      currency: 'INR',
      required_skills: '',
      preferred_skills: '',
      responsibilities: '',
      required_qualifications: '',
      preferred_qualifications: '',
      benefits: '',
      priority: 'medium',
      positions_available: 1,
      deadline: '',
      hiring_manager_id: '',
      recruiter_id: ''
    },
    validationSchema,
    onSubmit: generateJobDescription,
  });

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    if (autoSave) {
      autoSaveTimer.current = setTimeout(() => {
        if (formik.values.title && formik.dirty) {
          autoSaveForm();
        }
      }, 2000);
    }

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [formik.values, autoSave]);

  // Load jobs on mount
  useEffect(() => {
    fetchJobs();
  }, []);

  const autoSaveForm = async () => {
    setAutoSaveStatus('saving');
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      localStorage.setItem('job_draft', JSON.stringify(formik.values));
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus(null), 2000);
    } catch (error) {
      setAutoSaveStatus('error');
      message.error('Auto-save failed');
    }
  };

  // Fetch jobs from database
  const fetchJobs = async () => {
    setLoading(true);
    try {
      console.log('📋 Fetching jobs from database...');
      const response = await api.get('/api/v1/jobs');
      
      if (response.data.success) {
        setJobs(response.data.jobs || []);
        console.log(`✅ Loaded ${response.data.jobs?.length || 0} jobs`);
      } else {
        console.error('Failed to fetch jobs:', response.data);
        message.error('Failed to load jobs from database');
        setJobs([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch jobs:', error);
      message.error('Failed to load jobs from database');
      setJobs([]);
    } finally {
      setLoading(false);
    }

    // Load draft if exists
    const draft = localStorage.getItem('job_draft');
    if (draft) {
      try {
        const draftData = JSON.parse(draft);
        formik.setValues(draftData);
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  };

  const createAIPrompt = (data: any): string => {
    return `You are an expert HR professional and job description writer. Create a comprehensive, engaging, and professional job description for the following position. 

**CRITICAL: You must provide a COMPLETE job description from start to finish. Do not truncate or stop mid-sentence.**

**Job Details:**
- Title: ${data.title}
- Department: ${data.department}
- Location: ${data.location}
- Experience Level: ${data.experience_level}
- Employment Type: ${data.employment_type}
- Min Experience: ${data.min_experience_years} years
- Max Experience: ${data.max_experience_years || 'Not specified'} years
- Priority: ${data.priority}
- Positions Available: ${data.positions_available}

**Compensation & Benefits:**
- Salary Range: ${data.salary_min && data.salary_max ? `${data.currency} ${data.salary_min} - ${data.salary_max}` : 'Competitive package'}
- Additional Benefits: ${data.benefits || 'Standard benefits package'}

**Skills & Requirements:**
- Required Skills: ${data.required_skills}
- Preferred Skills: ${data.preferred_skills || 'Not specified'}
- Required Qualifications: ${data.required_qualifications || 'Standard qualifications'}
- Preferred Qualifications: ${data.preferred_qualifications || 'Not specified'}
- Key Responsibilities: ${data.responsibilities || 'Standard responsibilities'}

**STRUCTURE REQUIREMENTS:**
Please create a COMPLETE job description with the following sections (write each section in full):

1. **Job Title and Basic Info**
2. **About Navikenz India Pvt Ltd** - Brief company overview (AI-focused IT Services)
3. **Position Overview** - Role summary with key details
4. **Role Summary** - Engaging description of the opportunity
5. **Key Responsibilities** - 6-8 detailed bullet points
6. **Required Qualifications** - Essential skills and experience
7. **Preferred Qualifications** - Nice-to-have skills
8. **Compensation & Benefits** - Complete benefits package
9. **Work Environment** - Culture and working conditions
10. **Why Join Navikenz?** - Compelling reasons to apply
11. **Application Instructions** - Clear next steps

**WRITING GUIDELINES:**
- Use engaging, modern language while maintaining professionalism
- Write in second person ("you will", "you'll be responsible for")
- Make it inclusive and bias-free
- Include specific details about growth opportunities
- End with a strong call-to-action
- Ensure the description is 800-1200 words minimum
- COMPLETE ALL SECTIONS - do not stop until you reach the application instructions
- Use HR@navikenz.com for contact email or submission email

**IMPORTANT: Write the complete job description from beginning to end. Do not truncate or stop mid-sentence. The response should end with application instructions and contact information.**

Begin writing the complete job description now:`;
  };

  async function generateJobDescription() {
    if (!formik.isValid) {
      message.error('Please fix validation errors before generating');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setAiConfidence(0);

    const prompt = createAIPrompt(formik.values);

    try {
      const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

      if (GEMINI_API_KEY) {
        message.loading('Generating with Gemini AI...', 0);

        const progressInterval = setInterval(() => {
          setGenerationProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + Math.random() * 15;
          });
        }, 500);

        const response = await generateWithGemini(prompt, {
          temperature: 0.8,
          retryOnTruncation: true
        });

        clearInterval(progressInterval);
        setGenerationProgress(100);
        setGeneratedJD(response.text);
        setGeneratedHTML(convertToHTML(response.text));
        setAiConfidence(Math.floor(Math.random() * 10) + 90);

        message.destroy();
        notification.success({
          message: 'Job Description Generated!',
          description: `Complete job description generated (${response.text.length} characters)`,
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
        });

      } else {
        message.warning('Gemini API key not found. Using simulation mode.');
        simulateGeneration();
      }

    } catch (error) {
      console.error('Generation error:', error);
      message.destroy();

      const err = error as any;
      if (err.message?.includes('quota')) {
        message.error('API quota exceeded. Please try again later or contact support.');
      } else if (err.message?.includes('safety')) {
        message.error('Content was filtered by safety settings. Please modify your request.');
      } else {
        message.error(`Failed to generate job description: ${err.message}`);
      }

      message.info('Falling back to simulation mode...');
      simulateGeneration();
    } finally {
      setIsGenerating(false);
    }
  }

  const simulateGeneration = () => {
    const fullContent = generateMockJD(formik.values);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      setGenerationProgress(Math.min(progress, 100));

      if (progress >= 100) {
        clearInterval(interval);
        setGeneratedJD(fullContent);
        setGeneratedHTML(convertToHTML(fullContent));
        setAiConfidence(Math.floor(Math.random() * 20) + 70);

        notification.success({
          message: 'Job Description Generated!',
          description: 'Your job description has been generated (simulation mode).',
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
        });
      }
    }, 300);
  };

  const generateMockJD = (data: any): string => {
    return `# ${data.title}

## About Navikenz India Pvt Ltd
Navikenz is an Artificial Intelligence (AI) focused IT Services company that helps Enterprises discover and implement AI-enabled solutions to improve business processes and supplant human effort with human intuition.

## Position Overview
**Department:** ${data.department}  
**Location:** ${data.location}  
**Experience Level:** ${data.experience_level}  
**Employment Type:** ${data.employment_type}  
**Experience Required:** ${data.min_experience_years}${data.max_experience_years ? ` - ${data.max_experience_years}` : '+'} years  
**Positions Available:** ${data.positions_available}  
**Priority:** ${data.priority}

## Role Summary
We are seeking a dynamic ${data.title} to join our ${data.department} team. This role offers an exciting opportunity to work with cutting-edge AI technologies and make a significant impact on our client's business transformation journey.

## Key Responsibilities
• Lead and collaborate with cross-functional teams
• Drive innovation in ${data.department} initiatives
• Develop and implement strategic solutions using ${data.required_skills}
• Mentor junior team members and foster knowledge sharing
• Ensure quality delivery and adherence to best practices
• Collaborate with stakeholders to understand business requirements
${data.responsibilities ? `• ${data.responsibilities.split(',').map((r: string) => r.trim()).join('\n• ')}` : ''}

## Required Qualifications
• ${data.experience_level} with ${data.min_experience_years}+ years of experience
• Strong expertise in: ${data.required_skills}
• Excellent communication and leadership skills
• Bachelor's degree in relevant field or equivalent experience
• Proven track record of successful project delivery
${data.required_qualifications ? `• ${data.required_qualifications.split(',').map((r: string) => r.trim()).join('\n• ')}` : ''}

## Preferred Qualifications
• Advanced degree in relevant field
• Industry certifications
• Experience with agile methodologies
• Previous experience in ${data.department} domain
• Leadership or mentoring experience
${data.preferred_qualifications ? `• ${data.preferred_qualifications.split(',').map((r: string) => r.trim()).join('\n• ')}` : ''}
${data.preferred_skills ? `• Experience with: ${data.preferred_skills}` : ''}

## Compensation & Benefits
${data.salary_min && data.salary_max ? `• Competitive salary: ${data.currency} ${data.salary_min} - ${data.salary_max}` : '• Competitive salary package'}
• Comprehensive health and dental insurance
• Professional development opportunities and training budget
• Flexible work arrangements and remote work options
• Performance-based bonuses and stock options
• Modern work environment with latest technology
${data.benefits ? `• ${data.benefits.split(',').map((b: string) => b.trim()).join('\n• ')}` : ''}

## Work Environment
• Collaborative and innovation-driven culture
• Modern office with latest technology
• Hybrid work model
• Supportive learning environment
• Opportunities for rapid career growth

## Why Join Navikenz?
• Work on cutting-edge AI projects with Fortune 500 clients
• Access to latest technologies and tools
• Clear career paths and growth opportunities
• Diverse and inclusive workplace
• Make a real impact on business transformation

---
**Application Instructions:**
This position has **${data.priority}** priority for filling. We have **${data.positions_available}** position(s) available.

Ready to transform the future with AI? Apply now with your resume and cover letter.

*Navikenz is an equal opportunity employer committed to diversity and inclusion.*`;
  };

  const convertToHTML = (markdown: string): string => {
    return markdown
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^• (.*$)/gm, '<li>$1</li>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  };

  // Save job to database
  const saveJobDescription = async () => {
    if (!generatedJD) {
      message.warning('No job description to save');
      return;
    }

    try {
      const jobData = {
        title: formik.values.title,
        department: formik.values.department,
        location: formik.values.location,
        employment_type: formik.values.employment_type,
        description: generatedJD,
        responsibilities: formik.values.responsibilities ? formik.values.responsibilities.split(',').map(r => r.trim()) : [],
        required_qualifications: formik.values.required_qualifications ? formik.values.required_qualifications.split(',').map(r => r.trim()) : [],
        preferred_qualifications: formik.values.preferred_qualifications ? formik.values.preferred_qualifications.split(',').map(r => r.trim()) : [],
        required_skills: formik.values.required_skills ? formik.values.required_skills.split(',').map(r => r.trim()) : [],
        preferred_skills: formik.values.preferred_skills ? formik.values.preferred_skills.split(',').map(r => r.trim()) : [],
        experience_level: formik.values.experience_level,
        min_experience_years: Number(formik.values.min_experience_years) || 0,
        max_experience_years: formik.values.max_experience_years ? Number(formik.values.max_experience_years) : null,
        salary_min: formik.values.salary_min ? Number(formik.values.salary_min) : null,
        salary_max: formik.values.salary_max ? Number(formik.values.salary_max) : null,
        currency: formik.values.currency || 'INR',
        benefits: formik.values.benefits ? formik.values.benefits.split(',').map(b => b.trim()) : [],
        status: editingJob?.status || 'draft',
        priority: formik.values.priority || 'medium',
        ai_generated: true,
        generation_prompt: createAIPrompt(formik.values),
        hiring_manager_id: formik.values.hiring_manager_id ? Number(formik.values.hiring_manager_id) : null,
        recruiter_id: formik.values.recruiter_id ? Number(formik.values.recruiter_id) : null,
        positions_available: Number(formik.values.positions_available) || 1,
        positions_filled: editingJob?.positions_filled || 0,
        deadline: formik.values.deadline ? moment(formik.values.deadline).toISOString() : null
      };

      let response;
      
      if (editingJob) {
        // Update existing job
        response = await api.put(`/api/v1/jobs/${editingJob.id}`, jobData);
      } else {
        // Create new job
        response = await api.post('/api/v1/jobs', jobData);
      }

      if (response.data.success) {
        notification.success({
          message: editingJob ? 'Job Updated!' : 'Job Saved!',
          description: `Job ID: ${response.data.job.id} - Your job description has been saved successfully.`,
          icon: <SaveOutlined style={{ color: '#52c41a' }} />
        });

        // Clear form and refresh jobs list
        localStorage.removeItem('job_draft');
        setEditingJob(null);
        setGeneratedJD('');
        setGeneratedHTML('');
        await fetchJobs();
        
        // Show job ID for future reference
        message.info(`Job saved with ID: ${response.data.job.id}. This ID can be used for candidate matching.`);
      } else {
        throw new Error(response.data.error || 'Failed to save job');
      }
    } catch (error: any) {
      console.error('Save job error:', error);
      message.error(`Failed to save job: ${error.response?.data?.detail || error.message}`);
    }
  };

  // Delete job
  const deleteJob = (id: number) => {
    Modal.confirm({
      title: 'Delete Job',
      content: 'Are you sure you want to delete this job? This action cannot be undone.',
      icon: <DeleteOutlined />,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await api.delete(`/api/v1/jobs/${id}`);
          notification.success({
            message: 'Job Deleted',
            description: 'The job has been successfully deleted.',
            icon: <DeleteOutlined style={{ color: '#52c41a' }} />
          });
          await fetchJobs();
        } catch (error: any) {
          message.error(`Failed to delete job: ${error.response?.data?.detail || error.message}`);
        }
      }
    });
  };

  // Update job status
  const updateJobStatus = async (id: number, status: JobRecord['status']) => {
    try {
      const response = await api.put(`/api/v1/jobs/${id}`, { 
        status,
        ...(status === 'published' ? { published_at: new Date().toISOString() } : {})
      });
      
      if (response.data.success) {
        message.success(`Status updated to ${status}`);
        await fetchJobs();
      } else {
        throw new Error(response.data.error || 'Failed to update status');
      }
    } catch (error: any) {
      message.error(`Failed to update status: ${error.response?.data?.detail || error.message}`);
    }
  };

  // Edit job
  const editJob = (job: JobRecord) => {
    setEditingJob(job);
    setGeneratedJD(job.description);
    setGeneratedHTML(convertToHTML(job.description));

    formik.setValues({
      title: job.title,
      department: job.department,
      location: job.location,
      employment_type: job.employment_type,
      experience_level: job.experience_level,
      min_experience_years: job.min_experience_years,
      max_experience_years: job.max_experience_years?.toString() || '',
      salary_min: job.salary_min?.toString() || '',
      salary_max: job.salary_max?.toString() || '',
      currency: job.currency,
      required_skills: job.required_skills.join(', '),
      preferred_skills: job.preferred_skills.join(', '),
      responsibilities: job.responsibilities.join(', '),
      required_qualifications: job.required_qualifications.join(', '),
      preferred_qualifications: job.preferred_qualifications.join(', '),
      benefits: job.benefits.join(', '),
      priority: job.priority,
      positions_available: job.positions_available,
      deadline: job.deadline ? moment(job.deadline).format('YYYY-MM-DD') : '',
      hiring_manager_id: job.hiring_manager_id?.toString() || '',
      recruiter_id: job.recruiter_id?.toString() || ''
    });
    setActiveTab('1');
  };

  const resetForm = () => {
    formik.resetForm();
    setGeneratedJD('');
    setGeneratedHTML('');
    setEditingJob(null);
    setGenerationProgress(0);
    localStorage.removeItem('job_draft');
    message.success('Form reset successfully');
  };

  const shareJob = (job: JobRecord) => {
    navigator.clipboard.writeText(job.description).then(() => {
      notification.success({
        message: 'Job Description Copied!',
        description: 'The job description has been copied to your clipboard for sharing.',
        icon: <ShareAltOutlined style={{ color: '#52c41a' }} />
      });
    });
  };

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Table columns for jobs list
  const jobColumns = [
    {
      title: 'Job ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a: JobRecord, b: JobRecord) => a.id - b.id,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: JobRecord) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.department}</div>
        </div>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          draft: 'default',
          review: 'orange',
          approved: 'blue',
          published: 'green',
          closed: 'red'
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => {
        const colors = {
          low: 'green',
          medium: 'blue',
          high: 'orange',
          urgent: 'red'
        };
        return <Tag color={colors[priority as keyof typeof colors]}>{priority.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Positions',
      key: 'positions',
      render: (record: JobRecord) => (
        <span>{record.positions_filled}/{record.positions_available}</span>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => moment(date).format('MMM DD, YYYY'),
      sorter: (a: JobRecord, b: JobRecord) => moment(a.created_at).unix() - moment(b.created_at).unix(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: JobRecord) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button 
              icon={<EditOutlined />} 
              size="small" 
              onClick={() => editJob(record)} 
            />
          </Tooltip>
          <Tooltip title="Copy">
            <Button 
              icon={<CopyOutlined />} 
              size="small" 
              onClick={() => shareJob(record)} 
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button 
              icon={<DeleteOutlined />} 
              size="small" 
              danger 
              onClick={() => deleteJob(record.id)} 
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="job-generator">
      {/* Header */}
      <div className="page-header">
        <Row justify="space-between" align="middle" gutter={16}>
          <Col>
            <h1>AI Job Description Generator</h1>
            <p>Create compelling, inclusive job descriptions with {process.env.REACT_APP_GEMINI_API_KEY ? 'Gemini AI' : 'AI simulation'}</p>
          </Col>
          <Col>
            <Space>
              {autoSaveStatus && (
                <Badge
                  status={autoSaveStatus === 'saved' ? 'success' : autoSaveStatus === 'saving' ? 'processing' : 'error'}
                  text={
                    autoSaveStatus === 'saving' ? 'Saving...' :
                      autoSaveStatus === 'saved' ? 'Auto-saved' : 'Save failed'
                  }
                />
              )}
              <Tooltip title="Toggle Auto-save">
                <Switch
                  checked={autoSave}
                  onChange={setAutoSave}
                  checkedChildren={<SaveOutlined />}
                  unCheckedChildren={<CloseOutlined />}
                />
              </Tooltip>
            </Space>
          </Col>
        </Row>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={<span><EditOutlined />Create & Edit</span>} key="1">
          <Row gutter={24}>
            {/* FORM SECTION */}
            <Col xs={24} lg={12}>
              <Card
                title={editingJob ? `Edit Job ID: ${editingJob.id}` : "Job Requirements"}
                extra={
                  <Space>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={resetForm}
                      disabled={isGenerating}
                    >
                      Reset
                    </Button>
                  </Space>
                }
              >
                <form onSubmit={formik.handleSubmit}>
                  {/* Job Title & Department */}
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <div className="form-group">
                        <label>Job Title *</label>
                        <Input
                          name="title"
                          value={formik.values.title}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          className='JD-FormInput'
                          placeholder="e.g., Senior Software Engineer"
                          status={formik.touched.title && formik.errors.title ? 'error' : ''}
                        />
                        {formik.touched.title && formik.errors.title && (
                          <div className="error-message">{formik.errors.title}</div>
                        )}
                      </div>
                    </Col>

                    <Col xs={24} sm={12}>
                      <div className="form-group">
                        <label>Department *</label>
                        <Select
                          value={formik.values.department}
                          onChange={(value) => formik.setFieldValue('department', value)}
                          placeholder="Select Department"
                          style={{ width: '100%' }}
                          className='JD-FormInput'
                          status={formik.touched.department && formik.errors.department ? 'error' : ''}
                        >
                          <Option value="Engineering">Engineering</Option>
                          <Option value="Product">Product</Option>
                          <Option value="Marketing">Marketing</Option>
                          <Option value="Sales">Sales</Option>
                          <Option value="HR">Human Resources</Option>
                          <Option value="Finance">Finance</Option>
                          <Option value="Operations">Operations</Option>
                          <Option value="Design">Design</Option>
                        </Select>
                        {formik.touched.department && formik.errors.department && (
                          <div className="error-message">{formik.errors.department}</div>
                        )}
                      </div>
                    </Col>
                  </Row>

                  {/* Location & Employment Type */}
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <div className="form-group">
                        <label>Location *</label>
                        <Input
                          name="location"
                          value={formik.values.location}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          className='JD-FormInput'
                          placeholder="e.g., Bangalore, Remote, Hybrid"
                          status={formik.touched.location && formik.errors.location ? 'error' : ''}
                        />
                        {formik.touched.location && formik.errors.location && (
                          <div className="error-message">{formik.errors.location}</div>
                        )}
                      </div>
                    </Col>

                    <Col xs={24} sm={12}>
                      <div className="form-group">
                        <label>Employment Type *</label>
                        <Select
                          value={formik.values.employment_type}
                          onChange={(value) => formik.setFieldValue('employment_type', value)}
                          placeholder="Select Type"
                          className='JD-FormInput'
                          style={{ width: '100%' }}
                          status={formik.touched.employment_type && formik.errors.employment_type ? 'error' : ''}
                        >
                          <Option value="Full-time">Full-time</Option>
                          <Option value="Part-time">Part-time</Option>
                          <Option value="Contract">Contract</Option>
                          <Option value="Internship">Internship</Option>
                          <Option value="Freelance">Freelance</Option>
                        </Select>
                        {formik.touched.employment_type && formik.errors.employment_type && (
                          <div className="error-message">{formik.errors.employment_type}</div>
                        )}
                      </div>
                    </Col>
                  </Row>

                  {/* Experience Level & Experience Years */}
                  <Row gutter={16}>
                    <Col xs={24} sm={8}>
                      <div className="form-group">
                        <label>Experience Level *</label>
                        <Select
                          value={formik.values.experience_level}
                          onChange={(value) => formik.setFieldValue('experience_level', value)}
                          placeholder="Select Experience"
                          style={{ width: '100%' }}
                          status={formik.touched.experience_level && formik.errors.experience_level ? 'error' : ''}
                        >
                          <Option value="Entry Level">Entry Level</Option>
                          <Option value="Mid Level">Mid Level</Option>
                          <Option value="Senior Level">Senior Level</Option>
                          <Option value="Lead Level">Lead Level</Option>
                          <Option value="Executive Level">Executive Level</Option>
                        </Select>
                        {formik.touched.experience_level && formik.errors.experience_level && (
                          <div className="error-message">{formik.errors.experience_level}</div>
                        )}
                      </div>
                    </Col>

                    <Col xs={24} sm={8}>
                      <div className="form-group">
                        <label>Min Experience (Years)</label>
                        <InputNumber
                          name="min_experience_years"
                          value={formik.values.min_experience_years}
                          onChange={(value) => formik.setFieldValue('min_experience_years', value || 0)}
                          placeholder="0"
                          min={0}
                          max={50}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </Col>

                    <Col xs={24} sm={8}>
                      <div className="form-group">
                        <label>Max Experience (Years)</label>
                        <InputNumber
                          name="max_experience_years"
                          value={formik.values.max_experience_years ? Number(formik.values.max_experience_years) : undefined}
                          onChange={(value) => formik.setFieldValue('max_experience_years', value?.toString() || '')}
                          placeholder="Optional"
                          min={0}
                          max={50}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </Col>
                  </Row>

                  {/* Salary Range */}
                  <Row gutter={16}>
                    <Col xs={24} sm={8}>
                      <div className="form-group">
                        <label>Currency</label>
                        <Select
                          value={formik.values.currency}
                          onChange={(value) => formik.setFieldValue('currency', value)}
                          style={{ width: '100%' }}
                        >
                          <Option value="INR">INR (₹)</Option>
                          <Option value="USD">USD ($)</Option>
                          <Option value="EUR">EUR (€)</Option>
                        </Select>
                      </div>
                    </Col>

                    <Col xs={24} sm={8}>
                      <div className="form-group">
                        <label>Min Salary</label>
                        <InputNumber
                          name="salary_min"
                          value={formik.values.salary_min ? Number(formik.values.salary_min) : undefined}
                          onChange={(value) => formik.setFieldValue('salary_min', value?.toString() || '')}
                          placeholder="e.g., 1200000"
                          min={0}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </Col>

                    <Col xs={24} sm={8}>
                      <div className="form-group">
                        <label>Max Salary</label>
                        <InputNumber
                          name="salary_max"
                          value={formik.values.salary_max ? Number(formik.values.salary_max) : undefined}
                          onChange={(value) => formik.setFieldValue('salary_max', value?.toString() || '')}
                          placeholder="e.g., 1800000"
                          min={0}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </Col>
                  </Row>

                  {/* Required Skills */}
                  <div className="form-group">
                    <label>Required Skills *</label>
                    <Select
                      mode="tags"
                      value={formik.values.required_skills.split(',').filter(skill => skill.trim())}
                      onChange={(values) => formik.setFieldValue('required_skills', values.join(', '))}
                      placeholder="Type or select skills"
                      style={{ width: '100%' }}
                      tokenSeparators={[',']}
                      status={formik.touched.required_skills && formik.errors.required_skills ? 'error' : ''}
                    >
                      <Option value="JavaScript">JavaScript</Option>
                      <Option value="React">React</Option>
                      <Option value="Node.js">Node.js</Option>
                      <Option value="Python">Python</Option>
                      <Option value="Java">Java</Option>
                      <Option value="AWS">AWS</Option>
                      <Option value="Docker">Docker</Option>
                      <Option value="Leadership">Leadership</Option>
                      <Option value="Communication">Communication</Option>
                      <Option value="Project Management">Project Management</Option>
                    </Select>
                    {formik.touched.required_skills && formik.errors.required_skills && (
                      <div className="error-message">{formik.errors.required_skills}</div>
                    )}
                  </div>

                  {/* Preferred Skills */}
                  <div className="form-group">
                    <label>Preferred Skills</label>
                    <Select
                      mode="tags"
                      value={formik.values.preferred_skills.split(',').filter(skill => skill.trim())}
                      onChange={(values) => formik.setFieldValue('preferred_skills', values.join(', '))}
                      placeholder="Type or select preferred skills"
                      style={{ width: '100%' }}
                      tokenSeparators={[',']}
                    />
                  </div>

                  {/* Additional Fields */}
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <div className="form-group">
                        <label>Key Responsibilities</label>
                        <TextArea
                          name="responsibilities"
                          value={formik.values.responsibilities}
                          onChange={formik.handleChange}
                          placeholder="List main responsibilities (comma-separated)"
                          rows={3}
                        />
                      </div>
                    </Col>

                    <Col xs={24} sm={12}>
                      <div className="form-group">
                        <label>Benefits</label>
                        <TextArea
                          name="benefits"
                          value={formik.values.benefits}
                          onChange={formik.handleChange}
                          placeholder="e.g., Health insurance, Stock options, Flexible hours"
                          rows={3}
                        />
                      </div>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <div className="form-group">
                        <label>Required Qualifications</label>
                        <TextArea
                          name="required_qualifications"
                          value={formik.values.required_qualifications}
                          onChange={formik.handleChange}
                          placeholder="Essential qualifications (comma-separated)"
                          rows={3}
                        />
                      </div>
                    </Col>

                    <Col xs={24} sm={12}>
                      <div className="form-group">
                        <label>Preferred Qualifications</label>
                        <TextArea
                          name="preferred_qualifications"
                          value={formik.values.preferred_qualifications}
                          onChange={formik.handleChange}
                          placeholder="Nice-to-have qualifications (comma-separated)"
                          rows={3}
                        />
                      </div>
                    </Col>
                  </Row>

                  {/* Job Settings */}
                  <Row gutter={16}>
                    <Col xs={24} sm={8}>
                      <div className="form-group">
                        <label>Priority</label>
                        <Select
                          value={formik.values.priority}
                          onChange={(value) => formik.setFieldValue('priority', value)}
                          style={{ width: '100%' }}
                          className='JD-FormInput'
                        >
                          <Option value="low">Low</Option>
                          <Option value="medium">Medium</Option>
                          <Option value="high">High</Option>
                          <Option value="urgent">Urgent</Option>
                        </Select>
                      </div>
                    </Col>

                    <Col xs={24} sm={8}>
                      <div className="form-group">
                        <label>Positions Available</label>
                        <InputNumber
                          name="positions_available"
                          value={formik.values.positions_available}
                          onChange={(value) => formik.setFieldValue('positions_available', value || 1)}
                          min={1}
                          max={100}
                          className='JD-FormInput'
                          style={{ width: '100%' }}
                        />
                      </div>
                    </Col>

                    <Col xs={24} sm={8}>
                      <div className="form-group">
                        <label>Application Deadline</label>
                        <Input
                          type="date"
                          name="deadline"
                          className='JD-FormInput'
                          value={formik.values.deadline}
                          onChange={formik.handleChange}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </Col>
                  </Row>

                  <Divider />

                  <Space wrap>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={isGenerating}
                      icon={<RobotOutlined />}
                      size="large"
                    >
                      {isGenerating ? `Generating... ${generationProgress}%` : 'Generate Job Description'}
                    </Button>

                    {!process.env.REACT_APP_GEMINI_API_KEY && (
                      <div style={{ color: '#faad14', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <WarningOutlined />
                        Add REACT_APP_GEMINI_API_KEY to .env for real AI generation
                      </div>
                    )}
                  </Space>

                  {isGenerating && (
                    <div style={{ marginTop: 16 }}>
                      <Progress
                        percent={generationProgress}
                        status={generationProgress === 100 ? 'success' : 'active'}
                        strokeColor={{
                          '0%': '#108ee9',
                          '100%': '#87d068',
                        }}
                      />
                    </div>
                  )}
                </form>
              </Card>
            </Col>

            {/* Output Section */}
            <Col xs={24} lg={12}>
              <Card
              className='JD-OutputCard'
                title={
                  <Space>
                    <span>Generated Job Description</span>
                    {editingJob && <Badge count={`ID: ${editingJob.id}`} style={{ backgroundColor: '#1890ff' }} />}
                    {aiConfidence > 0 && (
                      <Badge count={`${aiConfidence}% confidence`} style={{ backgroundColor: '#52c41a' }} />
                    )}
                  </Space>
                }
                extra={
                  generatedJD && (
                    <Space>
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={() => generateJobDescription()}
                        disabled={isGenerating}
                      >
                        Regenerate
                      </Button>
                      <Button
                        icon={<CopyOutlined />}
                        onClick={() => {
                          navigator.clipboard.writeText(generatedJD);
                          message.success('Copied to clipboard!');
                        }}
                      >
                        Copy
                      </Button>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={saveJobDescription}
                      >
                        {editingJob ? 'Update' : 'Save'}
                      </Button>
                    </Space>
                  )
                }
              >
                {isGenerating && (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <RobotOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
                    <p>{process.env.REACT_APP_GEMINI_API_KEY ? 'Crafting your job description...' : 'Crafting your job description...'}</p>
                  </div>
                )}

                {generatedJD && !isGenerating && (
                  <div>
                    <Tabs size="small" style={{ marginBottom: 16 }}>
                      <TabPane tab="Markdown" key="markdown">
                        <div style={{
                          background: '#fafafa',
                          border: '1px solid #d9d9d9',
                          borderRadius: 6,
                          padding: 16,
                          maxHeight: 500,
                          overflow: 'auto'
                        }}>
                          <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: 13 }}>
                            {generatedJD}
                          </pre>
                        </div>
                      </TabPane>
                      <TabPane tab="HTML Preview" key="html">
                        <div
                          style={{
                            background: 'white',
                            border: '1px solid #d9d9d9',
                            borderRadius: 6,
                            padding: 16,
                            maxHeight: 500,
                            overflow: 'auto'
                          }}
                          dangerouslySetInnerHTML={{ __html: generatedHTML }}
                        />
                      </TabPane>
                    </Tabs>
                  </div>
                )}

                {!generatedJD && !isGenerating && (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
                    <FileTextOutlined style={{ fontSize: 64, marginBottom: 16 }} />
                    {process.env.REACT_APP_GEMINI_API_KEY && (
                      <h3 style={{ color: '#52c41a' }}>Ready to Generate</h3>
                    )}
                    <p>Fill in the job requirements and click "Generate Job Description"</p>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab={<span><FileTextOutlined />Saved Jobs ({jobs.length})</span>} key="2">
          <Card>
            <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
              <Col xs={24} sm={8}>
                <Input
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  prefix={<SearchOutlined />}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={6}>
                <Select
                  value={filterStatus}
                  onChange={setFilterStatus}
                  style={{ width: '100%' }}
                  placeholder="Filter by status"
                >
                  <Option value="all">All Status</Option>
                  <Option value="draft">Draft</Option>
                  <Option value="review">Under Review</Option>
                  <Option value="approved">Approved</Option>
                  <Option value="published">Published</Option>
                  <Option value="closed">Closed</Option>
                </Select>
              </Col>
              <Col xs={24} sm={4}>
                <Button
                  icon={<PlusOutlined />}
                  type="primary"
                  onClick={() => setActiveTab('1')}
                  block
                >
                  New Job
                </Button>
              </Col>
              <Col xs={24} sm={6}>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchJobs}
                  loading={loading}
                >
                  Refresh
                </Button>
              </Col>
            </Row>

            <Table
              columns={jobColumns}
              dataSource={filteredJobs}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} jobs`
              }}
              scroll={{ x: 1200 }}
            />
          </Card>
        </TabPane>

        <TabPane tab={<span><SettingOutlined />Analytics</span>} key="3">
          <Row gutter={16}>
            <Col span={24}>
              <Card title="Job Analytics Dashboard">
                <Row gutter={16}>
                  <Col xs={24} sm={6}>
                    <Card>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 24, color: '#1890ff', marginBottom: 8 }}>
                          {jobs.length}
                        </div>
                        <div>Total Jobs</div>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Card>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 24, color: '#52c41a', marginBottom: 8 }}>
                          {jobs.filter(job => job.status === 'published').length}
                        </div>
                        <div>Published</div>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Card>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 24, color: '#faad14', marginBottom: 8 }}>
                          {jobs.filter(job => job.status === 'review').length}
                        </div>
                        <div>Under Review</div>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Card>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 24, color: '#ff4d4f', marginBottom: 8 }}>
                          {jobs.filter(job => job.status === 'published').length}
                        </div>
                        <div>publishedk</div>
                      </div>
                    </Card>
                  </Col>
                </Row>

                <Row gutter={16} style={{ marginTop: 16 }}>
                  <Col xs={24} sm={12}>
                    <Card title="Total Positions">
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 32, color: '#1890ff', marginBottom: 8 }}>
                          {jobs.reduce((sum, job) => sum + job.positions_available, 0)}
                        </div>
                        <div>Available Positions</div>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Card title="Filled Positions">
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 32, color: '#52c41a', marginBottom: 8 }}>
                          {jobs.reduce((sum, job) => sum + job.positions_filled, 0)}
                        </div>
                        <div>Positions Filled</div>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default JobGenerator;
