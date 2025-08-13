import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Space, Button, Input, Select, Statistic, Row, Col, Modal, Drawer,
  Badge, Divider, Alert, message, Spin, Progress, Tooltip, Typography, Tabs, Switch,
  Form, InputNumber, Slider, List, Avatar, Rate, Timeline, Empty
} from 'antd';
import {
  SearchOutlined, UserOutlined, TrophyOutlined, RobotOutlined, FilterOutlined,
  EyeOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined, CalendarOutlined,
  BookOutlined, SafetyCertificateOutlined, FileTextOutlined, BulbOutlined,
  ThunderboltOutlined, CheckCircleOutlined, StarOutlined, TeamOutlined,
  GlobalOutlined, SyncOutlined, DownloadOutlined, ShareAltOutlined, TagsOutlined,
  EditOutlined, ExperimentOutlined, SettingOutlined, DashboardOutlined,
  FireOutlined, DatabaseOutlined, AimOutlined, CodeOutlined, BarChartOutlined
} from '@ant-design/icons';
import api from '../services/api';
import { callGemini } from '../utils/gemini';

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { Text, Title, Paragraph } = Typography;

interface CandidateMatchingProps {
  socket: WebSocket | null;
  sendMessage: (message: string) => void;
  isConnected: boolean;
}

interface Job {
  id: number;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  required_skills: string[];
  preferred_skills: string[];
  experience_level: string;
  min_experience_years: number;
  max_experience_years?: number;
  description: string;
  status: string;
  priority: string;
  positions_available: number;
  positions_filled: number;
}

interface Candidate {
  candidate_id: number;
  candidate_name: string;
  email: string;
  phone?: string;
  location?: string;
  filename?: string;
  resume_url?: string;
  resume_text?: string;
  skills: string[];
  skills_count: number;
  experience_years: number;
  overall_score: number;
  technical_score: number;
  experience_score: number;
  education: any[];
  certifications: any[];
  status: string;
  is_available: boolean;
  source?: string;
  created_at: string;
  last_contacted?: string;
}

interface MatchResult {
  candidate: Candidate;
  match_score: number;
  match_details: {
    skills_match: number;
    experience_match: number;
    location_match: number;
    overall_fit: number;
    strengths: string[];
    gaps: string[];
    recommendation: string;
  };
  ai_analysis: string;
}

interface MatchingFilters {
  min_match_score: number;
  max_candidates: number;
  location_weight: number;
  skills_weight: number;
  experience_weight: number;
  availability_only: boolean;
  min_overall_score: number;
}

const CandidateMatching: React.FC<CandidateMatchingProps> = ({ socket, sendMessage, isConnected }) => {
  // State Management
  const [jobDescription, setJobDescription] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [matchingInProgress, setMatchingInProgress] = useState(false);
  const [matchingProgress, setMatchingProgress] = useState(0);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [matchingMethod, setMatchingMethod] = useState<'job_id' | 'keywords' | 'jd_text'>('job_id');
  const [keywords, setKeywords] = useState('');
  const [activeTab, setActiveTab] = useState('matching');
  const [loadingCandidateDetails, setLoadingCandidateDetails] = useState(false);

  // Advanced Filtering State
  const [filters, setFilters] = useState<MatchingFilters>({
    min_match_score: 60,
    max_candidates: 50,
    location_weight: 0.2,
    skills_weight: 0.5,
    experience_weight: 0.3,
    availability_only: true,
    min_overall_score: 50
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [aiAnalysisEnabled, setAiAnalysisEnabled] = useState(true);

  // Load initial data
  useEffect(() => {
    fetchJobs();
    fetchCandidates();
  }, []);

  // Fetch jobs from database
  const fetchJobs = async () => {
    try {
      const response = await api.get('/api/v1/jobs');
      if (response.data.success) {
        setJobs(response.data.jobs || []);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      message.error('Failed to load jobs');
    }
  };

  // Fetch candidates from database (list view)
  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/candidates');
      if (response.data.success) {
        const mappedCandidates = response.data.candidates.map((c: any) => ({
          candidate_id: c.candidate_id,
          candidate_name: c.candidate_name || c.full_name,
          email: c.email,
          phone: c.phone,
          location: c.location,
          filename: c.filename || c.resume_filename,
          resume_url: c.resume_url,
          resume_text: c.resume_text,
          skills: Array.isArray(c.skills) ? c.skills : [],
          skills_count: c.skills_count || (c.skills ? c.skills.length : 0),
          experience_years: Number(c.experience_years) || 0,
          overall_score: Number(c.score || c.overall_score) || 0,
          technical_score: Number(c.technical_score) || 0,
          experience_score: Number(c.experience_score) || 0,
          education: Array.isArray(c.education) ? c.education : [],
          certifications: Array.isArray(c.certifications) ? c.certifications : [],
          status: c.status || 'new',
          is_available: Boolean(c.is_available !== undefined ? c.is_available : true),
          source: c.source,
          created_at: c.created_at,
          last_contacted: c.last_contacted
        }));
        setCandidates(mappedCandidates);
      }
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
      message.error('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  // Fetch detailed candidate information using your API
  const fetchCandidateDetails = async (candidateId: number) => {
    setLoadingCandidateDetails(true);
    try {
      console.log(`Fetching detailed info for candidate ${candidateId}`);
      const response = await api.get(`/api/v1/candidates/${candidateId}`);

      if (response.data.success) {
        const detailedCandidate: Candidate = {
          candidate_id: response.data.candidate.candidate_id,
          candidate_name: response.data.candidate.candidate_name,
          email: response.data.candidate.email,
          phone: response.data.candidate.phone,
          location: response.data.candidate.location,
          filename: response.data.candidate.filename,
          resume_url: response.data.candidate.resume_url,
          resume_text: response.data.candidate.resume_text,
          skills: response.data.candidate.skills || [],
          skills_count: response.data.candidate.skills_count,
          experience_years: response.data.candidate.experience_years,
          overall_score: response.data.candidate.score,
          technical_score: response.data.candidate.technical_score,
          experience_score: response.data.candidate.experience_score,
          education: response.data.candidate.education || [],
          certifications: response.data.candidate.certifications || [],
          status: response.data.candidate.status,
          is_available: response.data.candidate.is_available,
          source: response.data.candidate.source,
          created_at: response.data.candidate.created_at,
          last_contacted: response.data.candidate.last_contacted
        };

        setSelectedCandidate(detailedCandidate);
        console.log('Detailed candidate info loaded:', detailedCandidate);
      } else {
        message.error('Failed to load candidate details');
      }
    } catch (error: any) {
      console.error('Failed to fetch candidate details:', error);
      message.error('Failed to load candidate details');
    } finally {
      setLoadingCandidateDetails(false);
    }
  };

  // Create AI matching prompt
  const createMatchingPrompt = (jobData: any, candidate: Candidate): string => {
    return `You are an expert HR professional and recruitment specialist. Analyze this candidate's fit for the job position.

**JOB REQUIREMENTS:**
- Title: ${jobData.title || 'Not specified'}
- Department: ${jobData.department || 'Not specified'}
- Location: ${jobData.location || 'Any'}
- Required Skills: ${Array.isArray(jobData.required_skills) ? jobData.required_skills.join(', ') : jobData.required_skills || 'Not specified'}
- Experience Level: ${jobData.experience_level || 'Not specified'}
- Min Experience: ${jobData.min_experience_years || 0} years
- Job Description: ${jobData.description ? jobData.description.substring(0, 500) : 'Not provided'}

**CANDIDATE PROFILE:**
- Name: ${candidate.candidate_name}
- Experience: ${candidate.experience_years} years
- Skills: ${candidate.skills.join(', ')}
- Location: ${candidate.location || 'Not specified'}
- Overall Score: ${candidate.overall_score}%
- Technical Score: ${candidate.technical_score}%
- Education: ${candidate.education.length} qualification(s)
- Certifications: ${candidate.certifications.length} certification(s)
- Status: ${candidate.status}
- Available: ${candidate.is_available ? 'Yes' : 'No'}

**ANALYSIS REQUEST:**
Provide a comprehensive analysis (100-150 words) covering:
1. Overall fit assessment
2. Key strengths that align with the role
3. Potential skill gaps or concerns
4. Recommendation (Strong Match/Good Match/Moderate Match/Poor Match)
5. Specific next steps for this candidate

Be professional, objective, and focus on job-relevant factors.`;
  };

  // AI-powered candidate analysis
  const analyzeCandidate = async (jobData: any, candidate: Candidate): Promise<string> => {
    if (!aiAnalysisEnabled) return 'AI analysis disabled';

    try {
      const prompt = createMatchingPrompt(jobData, candidate);
      const response = await callGemini(prompt, {
        temperature: 0.3,
        maxOutputTokens: 200
      });
      return response.text || 'Analysis not available';
    } catch (error) {
      console.error('AI analysis failed:', error);
      return 'AI analysis failed - using basic matching';
    }
  };

  // Calculate skill match score - Enhanced with better fuzzy matching
  const calculateSkillsMatch = (requiredSkills: string[], candidateSkills: string[]): number => {
    if (!requiredSkills.length || !candidateSkills.length) return 0;

    const requiredLower = requiredSkills.map(s => s.toLowerCase());
    const candidateLower = candidateSkills.map(s => s.toLowerCase());

    let matches = 0;
    const synonyms: { [key: string]: string[] } = {
      'javascript': ['js', 'ecmascript', 'es6', 'es2020'],
      'typescript': ['ts'],
      'reactjs': ['react', 'react.js'],
      'nodejs': ['node.js', 'node'],
      'python': ['py'],
      'artificial intelligence': ['ai', 'machine learning', 'ml'],
      'database': ['db', 'sql', 'nosql']
    };

    for (const requiredSkill of requiredLower) {
      let found = false;

      // Direct match
      if (candidateLower.some(cSkill => cSkill.includes(requiredSkill) || requiredSkill.includes(cSkill))) {
        found = true;
      }

      // Synonym match
      if (!found) {
        const skillSynonyms = synonyms[requiredSkill] || [];
        if (skillSynonyms.some(synonym =>
          candidateLower.some(cSkill => cSkill.includes(synonym) || synonym.includes(cSkill))
        )) {
          found = true;
        }
      }

      if (found) matches++;
    }

    return Math.round((matches / requiredSkills.length) * 100);
  };

  // Calculate experience match score
  const calculateExperienceMatch = (required: number, actual: number, maxRequired?: number): number => {
    if (actual < required) {
      return Math.max(0, Math.round((actual / required) * 100));
    } else if (maxRequired && actual > maxRequired) {
      const excess = actual - maxRequired;
      return Math.max(70, 100 - (excess * 5)); // Slight penalty for overqualification
    } else {
      return 100;
    }
  };

  // Calculate location match score
  const calculateLocationMatch = (jobLocation: string, candidateLocation: string): number => {
    if (!jobLocation || !candidateLocation) return 80; // Neutral if location not specified

    const jobLoc = jobLocation.toLowerCase();
    const candLoc = candidateLocation.toLowerCase();

    if (jobLoc.includes('remote') || jobLoc.includes('anywhere')) return 100;
    if (jobLoc === candLoc) return 100;
    if (jobLoc.includes(candLoc) || candLoc.includes(jobLoc)) return 90;

    // Check for same city/state
    const jobParts = jobLoc.split(',').map(p => p.trim());
    const candParts = candLoc.split(',').map(p => p.trim());

    const commonParts = jobParts.filter(part => candParts.includes(part));
    if (commonParts.length > 0) return 70;

    return 40; // Different locations
  };

  // Main matching algorithm
  const performMatching = async () => {
    if (!matchingMethod) {
      message.error('Please select a matching method');
      return;
    }

    let jobData: any = {};

    // Prepare job data based on matching method
    if (matchingMethod === 'job_id') {
      if (!selectedJobId) {
        message.error('Please select a job');
        return;
      }
      const selectedJob = jobs.find(j => j.id === selectedJobId);
      if (!selectedJob) {
        message.error('Selected job not found');
        return;
      }
      jobData = selectedJob;
    } else if (matchingMethod === 'keywords') {
      if (!keywords.trim()) {
        message.error('Please enter keywords');
        return;
      }
      jobData = {
        title: 'Custom Search',
        required_skills: keywords.split(',').map(k => k.trim()),
        description: keywords,
        location: 'Any',
        min_experience_years: 0
      };
    } else if (matchingMethod === 'jd_text') {
      if (!jobDescription.trim()) {
        message.error('Please paste job description');
        return;
      }
      // Extract keywords from JD using simple keyword extraction
      const extractedSkills = extractSkillsFromText(jobDescription);
      jobData = {
        title: 'Custom Job Description',
        required_skills: extractedSkills,
        description: jobDescription,
        location: 'Any',
        min_experience_years: 0
      };
    }

    setMatchingInProgress(true);
    setMatchingProgress(0);
    setMatchResults([]);

    try {
      // Filter candidates based on basic criteria
      let eligibleCandidates = candidates.filter(candidate => {
        if (filters.availability_only && !candidate.is_available) return false;
        if (candidate.overall_score < filters.min_overall_score) return false;
        return true;
      });

      if (eligibleCandidates.length === 0) {
        message.warning('No eligible candidates found with current filters');
        setMatchingInProgress(false);
        return;
      }

      const results: MatchResult[] = [];
      const totalCandidates = Math.min(eligibleCandidates.length, filters.max_candidates);

      // Progress tracking
      const progressInterval = setInterval(() => {
        setMatchingProgress(prev => Math.min(prev + 5, 90));
      }, 200);

      for (let i = 0; i < totalCandidates; i++) {
        const candidate = eligibleCandidates[i];

        // Fetch detailed candidate information
        const detailedResponse = await api.get(`/api/v1/candidates/${candidate.candidate_id}`);
        const detailedCandidate = detailedResponse.data.success ?
          detailedResponse.data.candidate : candidate;

        // Use detailed candidate data for matching
        const candidateForMatching: Candidate = {
          ...candidate,
          skills: detailedCandidate.skills || candidate.skills,
          skills_count: detailedCandidate.skills_count || candidate.skills_count,
          resume_text: detailedCandidate.resume_text,
          education: detailedCandidate.education || candidate.education,
          certifications: detailedCandidate.certifications || candidate.certifications
        };

        // Calculate individual match scores
        const skillsMatch = calculateSkillsMatch(jobData.required_skills || [], candidateForMatching.skills);
        const experienceMatch = calculateExperienceMatch(
          jobData.min_experience_years || 0,
          candidateForMatching.experience_years,
          jobData.max_experience_years
        );
        const locationMatch = calculateLocationMatch(jobData.location || '', candidateForMatching.location || '');

        // Calculate weighted overall match score
        const overallMatch = Math.round(
          (skillsMatch * filters.skills_weight) +
          (experienceMatch * filters.experience_weight) +
          (locationMatch * filters.location_weight) +
          (candidateForMatching.overall_score * 0.1) // Slight weight for candidate's general score
        );

        // Skip candidates below minimum match score
        if (overallMatch < filters.min_match_score) continue;

        // Determine strengths and gaps
        const strengths: string[] = [];
        const gaps: string[] = [];

        if (skillsMatch >= 80) strengths.push('Strong technical skills match');
        if (experienceMatch >= 90) strengths.push('Perfect experience level');
        if (locationMatch >= 90) strengths.push('Ideal location match');
        if (candidateForMatching.overall_score >= 80) strengths.push('High overall candidate score');
        if (candidateForMatching.certifications.length > 0) strengths.push(`${candidateForMatching.certifications.length} professional certifications`);

        if (skillsMatch < 60) gaps.push('Some required skills missing');
        if (experienceMatch < 70) gaps.push('Experience level mismatch');
        if (locationMatch < 60) gaps.push('Location preference difference');
        if (!candidateForMatching.is_available) gaps.push('Currently not available');

        // Generate recommendation
        let recommendation = '';
        if (overallMatch >= 90) recommendation = 'Excellent match - Strongly recommend immediate interview';
        else if (overallMatch >= 80) recommendation = 'Very good match - Recommend for interview';
        else if (overallMatch >= 70) recommendation = 'Good match - Consider for interview';
        else recommendation = 'Moderate match - Review carefully';

        // Get AI analysis
        const aiAnalysis = await analyzeCandidate(jobData, candidateForMatching);

        results.push({
          candidate: candidateForMatching,
          match_score: overallMatch,
          match_details: {
            skills_match: skillsMatch,
            experience_match: experienceMatch,
            location_match: locationMatch,
            overall_fit: overallMatch,
            strengths,
            gaps,
            recommendation
          },
          ai_analysis: aiAnalysis
        });

        // Update progress
        setMatchingProgress(Math.round((i + 1) / totalCandidates * 90));
      }

      clearInterval(progressInterval);
      setMatchingProgress(100);

      // Sort by match score
      results.sort((a, b) => b.match_score - a.match_score);
      setMatchResults(results);

      // Success notification
      message.success(`Found ${results.length} matching candidates`);

      if (isConnected && sendMessage) {
        sendMessage(`Smart matching completed: ${results.length} candidates found`);
      }

    } catch (error) {
      console.error('Matching error:', error);
      message.error('Matching failed: ' + (error as Error).message);
    } finally {
      setMatchingInProgress(false);
      setMatchingProgress(0);
    }
  };

  // Extract skills from job description text
  const extractSkillsFromText = (text: string): string[] => {
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'AWS', 'Docker', 'Kubernetes',
      'Machine Learning', 'AI', 'Data Science', 'SQL', 'MongoDB', 'Git', 'Agile',
      'Leadership', 'Communication', 'Project Management', 'Analytics', 'Marketing',
      'Sales', 'Customer Service', 'UI/UX', 'Design', 'Frontend', 'Backend', 'Full Stack'
    ];

    const extractedSkills: string[] = [];
    const lowerText = text.toLowerCase();

    commonSkills.forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        extractedSkills.push(skill);
      }
    });

    return extractedSkills;
  };

  // View candidate details with API fetch
  const viewCandidateDetails = async (matchResult: MatchResult) => {
    setSelectedMatch(matchResult);
    setDrawerVisible(true);
    await fetchCandidateDetails(matchResult.candidate.candidate_id);
  };

  // Get match color based on score
  const getMatchColor = (score: number): string => {
    if (score >= 90) return '#52c41a';
    if (score >= 80) return '#1890ff';
    if (score >= 70) return '#faad14';
    if (score >= 60) return '#fa8c16';
    return '#f5222d';
  };

  // Get match label
  const getMatchLabel = (score: number): string => {
    if (score >= 90) return 'Excellent Match';
    if (score >= 80) return 'Very Good Match';
    if (score >= 70) return 'Good Match';
    if (score >= 60) return 'Fair Match';
    return 'Poor Match';
  };

  // Table columns for match results
  const matchColumns = [
    {
      title: 'Rank',
      key: 'rank',
      render: (_: any, __: any, index: number) => (
        <div style={{ textAlign: 'center' }}>
          <Badge
            count={index + 1}
            style={{ backgroundColor: index < 3 ? '#52c41a' : '#1890ff' }}
          />
        </div>
      ),
      width: 80
    },
    {
      title: 'Candidate',
      key: 'candidate',
      render: (record: MatchResult) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            style={{ backgroundColor: getMatchColor(record.match_score), marginRight: 12 }}
            icon={<UserOutlined />}
          >
            {record.candidate.candidate_name.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.candidate.candidate_name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              <MailOutlined style={{ marginRight: 4 }} />
              {record.candidate.email}
            </div>
            {record.candidate.location && (
              <div style={{ fontSize: '11px', color: '#999' }}>
                <EnvironmentOutlined style={{ marginRight: 4 }} />
                {record.candidate.location}
              </div>
            )}
          </div>
        </div>
      ),
      width: 250
    },
    {
      title: 'Match Score',
      key: 'match_score',
      render: (record: MatchResult) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: getMatchColor(record.match_score)
          }}>
            {record.match_score}%
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            {getMatchLabel(record.match_score)}
          </div>
        </div>
      ),
      sorter: (a: MatchResult, b: MatchResult) => b.match_score - a.match_score,
      width: 120
    },
    {
      title: 'Skills Match',
      key: 'skills_match',
      render: (record: MatchResult) => (
        <Progress
          percent={record.match_details.skills_match}
          size="small"
          strokeColor={getMatchColor(record.match_details.skills_match)}
        />
      ),
      width: 120
    },
    {
      title: 'Experience',
      key: 'experience',
      render: (record: MatchResult) => (
        <div>
          <div>
            <CalendarOutlined style={{ marginRight: 4 }} />
            {record.candidate.experience_years} years
          </div>
          <Progress
            percent={record.match_details.experience_match}
            size="small"
            strokeColor={getMatchColor(record.match_details.experience_match)}
            showInfo={false}
          />
        </div>
      ),
      width: 100
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: MatchResult) => (
        <div>
          <Tag color={record.candidate.is_available ? 'green' : 'red'}>
            {record.candidate.is_available ? 'Available' : 'Unavailable'}
          </Tag>
          <div style={{ fontSize: '11px', marginTop: 4 }}>
            <TrophyOutlined style={{ marginRight: 4 }} />
            Score: {record.candidate.overall_score}%
          </div>
        </div>
      ),
      width: 100
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: MatchResult) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => viewCandidateDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Contact">
            <Button
              icon={<MailOutlined />}
              size="small"
              onClick={() => {
                window.location.href = `mailto:${record.candidate.email}`;
              }}
            />
          </Tooltip>
        </Space>
      ),
      width: 100
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <Title level={2}>
          <AimOutlined style={{ marginRight: 12, color: '#1890ff' }} />
          Smart Candidate Matching
        </Title>
        <Paragraph>
          AI-powered candidate ranking and job matching system with advanced filtering and analysis
        </Paragraph>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={<span><SearchOutlined />Smart Matching</span>} key="matching">
          <Row gutter={24}>
            {/* Matching Configuration */}
            <Col xs={24} lg={10}>
              <Card title={
                <span>
                  <SettingOutlined style={{ marginRight: 8 }} />
                  Matching Configuration
                </span>
              } style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontWeight: 'bold', marginBottom: 8, display: 'block' }}>
                    Matching Method
                  </label>
                  <Select
                    value={matchingMethod}
                    onChange={setMatchingMethod}
                    style={{ width: '100%' }}
                    size="large"
                  >
                    <Option value="job_id">
                      <FileTextOutlined style={{ marginRight: 8 }} />
                      Select from Saved Jobs
                    </Option>
                    <Option value="keywords">
                      <TagsOutlined style={{ marginRight: 8 }} />
                      Keywords/Skills
                    </Option>
                    <Option value="jd_text">
                      <EditOutlined style={{ marginRight: 8 }} />
                      Paste Job Description
                    </Option>
                  </Select>
                </div>

                {matchingMethod === 'job_id' && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontWeight: 'bold', marginBottom: 8, display: 'block' }}>
                      Select Job
                    </label>
                    <Select
                      value={selectedJobId}
                      onChange={setSelectedJobId}
                      style={{ width: '100%', height: 'auto'}}
                      placeholder="Choose a job from database"
                      showSearch
                      filterOption={(input, option) =>
                        !!option?.children?.toString().toLowerCase().includes(input.toLowerCase())
                      }

                    >
                      {jobs.map(job => (
                        <Option key={job.id} value={job.id}>
                          <div>
                            <div style={{ fontWeight: 'bold' }}>{job.title}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {job.department} <EnvironmentOutlined style={{ margin: '0 4px' }} /> {job.location} <BookOutlined style={{ margin: '0 4px' }} /> {job.required_skills.length} skills
                            </div>
                          </div>
                        </Option>
                      ))}
                    </Select>
                  </div>
                )}

                {matchingMethod === 'keywords' && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontWeight: 'bold', marginBottom: 8, display: 'block' }}>
                      Required Skills/Keywords
                    </label>
                    <Select
                      mode="tags"
                      value={keywords.split(',').filter(k => k.trim())}
                      onChange={(values) => setKeywords(values.join(', '))}
                      style={{ width: '100%' }}
                      placeholder="Enter skills, technologies, or keywords"
                      tokenSeparators={[',']}
                    >
                      <Option value="JavaScript">JavaScript</Option>
                      <Option value="Python">Python</Option>
                      <Option value="React">React</Option>
                      <Option value="Node.js">Node.js</Option>
                      <Option value="AWS">AWS</Option>
                      <Option value="Leadership">Leadership</Option>
                      <Option value="Project Management">Project Management</Option>
                    </Select>
                  </div>
                )}

                {matchingMethod === 'jd_text' && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontWeight: 'bold', marginBottom: 8, display: 'block' }}>
                      Job Description
                    </label>
                    <TextArea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the complete job description here..."
                      rows={6}
                      showCount
                      maxLength={5000}
                    />
                  </div>
                )}

                {/* Advanced Filters */}
                <div style={{ marginBottom: 16 }}>
                  <Button
                    type="link"
                    icon={<FilterOutlined />}
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    style={{ padding: 0 }}
                  >
                    {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
                  </Button>
                </div>

                {showAdvancedFilters && (
                  <Card size="small" style={{ marginBottom: 16 }}>
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <div style={{ marginBottom: 16 }}>
                          <label>Min Match Score: {filters.min_match_score}%</label>
                          <Slider
                            value={filters.min_match_score}
                            onChange={(value) => setFilters(prev => ({ ...prev, min_match_score: value }))}
                            min={0}
                            max={100}
                            marks={{ 0: '0%', 50: '50%', 80: '80%', 100: '100%' }}
                          />
                        </div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <div style={{ marginBottom: 16 }}>
                          <label>Max Candidates: {filters.max_candidates}</label>
                          <Slider
                            value={filters.max_candidates}
                            onChange={(value) => setFilters(prev => ({ ...prev, max_candidates: value }))}
                            min={10}
                            max={100}
                            marks={{ 10: '10', 50: '50', 100: '100' }}
                          />
                        </div>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col xs={24} sm={8}>
                        <div style={{ marginBottom: 16 }}>
                          <label>Skills Weight: {(filters.skills_weight * 100).toFixed(0)}%</label>
                          <Slider
                            value={filters.skills_weight}
                            onChange={(value) => setFilters(prev => ({ ...prev, skills_weight: value }))}
                            min={0}
                            max={1}
                            step={0.1}
                          />
                        </div>
                      </Col>
                      <Col xs={24} sm={8}>
                        <div style={{ marginBottom: 16 }}>
                          <label>Experience Weight: {(filters.experience_weight * 100).toFixed(0)}%</label>
                          <Slider
                            value={filters.experience_weight}
                            onChange={(value) => setFilters(prev => ({ ...prev, experience_weight: value }))}
                            min={0}
                            max={1}
                            step={0.1}
                          />
                        </div>
                      </Col>
                      <Col xs={24} sm={8}>
                        <div style={{ marginBottom: 16 }}>
                          <label>Location Weight: {(filters.location_weight * 100).toFixed(0)}%</label>
                          <Slider
                            value={filters.location_weight}
                            onChange={(value) => setFilters(prev => ({ ...prev, location_weight: value }))}
                            min={0}
                            max={1}
                            step={0.1}
                          />
                        </div>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <div style={{ marginBottom: 8 }}>
                          <Switch
                            checked={filters.availability_only}
                            onChange={(checked) => setFilters(prev => ({ ...prev, availability_only: checked }))}
                          />
                          <span style={{ marginLeft: 8 }}>Available candidates only</span>
                        </div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <div style={{ marginBottom: 8 }}>
                          <Switch
                            checked={aiAnalysisEnabled}
                            onChange={setAiAnalysisEnabled}
                          />
                          <span style={{ marginLeft: 8 }}>Enable AI analysis</span>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                )}

                <Button
                  type="primary"
                  size="large"
                  icon={<SearchOutlined />}
                  onClick={performMatching}
                  loading={matchingInProgress}
                  disabled={loading}
                  block
                >
                  {matchingInProgress ? `Matching... ${matchingProgress}%` : 'Find Matching Candidates'}
                </Button>

                {matchingInProgress && (
                  <div style={{ marginTop: 16 }}>
                    <Progress
                      percent={matchingProgress}
                      status="active"
                      strokeColor={{
                        '0%': '#108ee9',
                        '100%': '#87d068',
                      }}
                    />
                  </div>
                )}
              </Card>

              {/* Summary Stats */}
              {matchResults.length > 0 && (
                <Card title={
                  <span>
                    <DashboardOutlined style={{ marginRight: 8 }} />
                    Matching Summary
                  </span>
                } size="small">
                  <Row gutter={16}>
                    <Col span={8}>
                      <Statistic
                        title="Total Matches"
                        value={matchResults.length}
                        prefix={<UserOutlined />}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="Avg Match Score"
                        value={Math.round(matchResults.reduce((sum, r) => sum + r.match_score, 0) / matchResults.length)}
                        suffix="%"
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="Top Score"
                        value={matchResults.length > 0 ? matchResults[0].match_score : 0}
                        suffix="%"
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Col>
                  </Row>
                </Card>
              )}
            </Col>

            {/* Matching Results */}
            <Col xs={24} lg={14}>
              <Card
                title={
                  <span>
                    <BarChartOutlined style={{ marginRight: 8 }} />
                    Matching Results ({matchResults.length})
                  </span>
                }
                extra={
                  matchResults.length > 0 && (
                    <Space>
                      <Button
                        icon={<DownloadOutlined />}
                        onClick={() => {
                          const dataStr = JSON.stringify(matchResults, null, 2);
                          const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
                          const exportFileDefaultName = `matching_results_${new Date().toISOString().split('T')[0]}.json`;
                          const linkElement = document.createElement('a');
                          linkElement.setAttribute('href', dataUri);
                          linkElement.setAttribute('download', exportFileDefaultName);
                          linkElement.click();
                        }}
                      >
                        Export
                      </Button>
                    </Space>
                  )
                }
              >
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <Spin size="large" />
                    <p style={{ marginTop: 16 }}>Loading candidates...</p>
                  </div>
                ) : matchResults.length > 0 ? (
                  <Table
                    columns={matchColumns}
                    dataSource={matchResults}
                    rowKey={(record) => record.candidate.candidate_id}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} matches`
                    }}
                    scroll={{ x: 1000 }}
                  />
                ) : (
                  <Empty
                    description="No matches found"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  >
                    <p>Configure your matching criteria and click "Find Matching Candidates" to get started.</p>
                  </Empty>
                )}
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab={<span><TeamOutlined />Candidate Pool ({candidates.length})</span>} key="candidates">
          <Card>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="Total Candidates"
                  value={candidates.length}
                  prefix={<UserOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Available"
                  value={candidates.filter(c => c.is_available).length}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Avg Score"
                  value={Math.round(candidates.reduce((sum, c) => sum + c.overall_score, 0) / candidates.length)}
                  suffix="%"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Total Skills"
                  value={new Set(candidates.flatMap(c => c.skills)).size}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
            </Row>
          </Card>
        </TabPane>
      </Tabs>

      {/* Enhanced Candidate Details Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              style={{
                backgroundColor: selectedMatch ? getMatchColor(selectedMatch.match_score) : '#1890ff',
                marginRight: 12
              }}
              icon={<UserOutlined />}
            >
              {selectedCandidate?.candidate_name.charAt(0)}
            </Avatar>
            <div>
              <div>{selectedCandidate?.candidate_name}</div>
              {selectedMatch && (
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Match Score: {selectedMatch.match_score}% <StarOutlined style={{ marginLeft: 4 }} /> {getMatchLabel(selectedMatch.match_score)}
                </div>
              )}
            </div>
          </div>
        }
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        loading={loadingCandidateDetails}
      >
        {selectedCandidate && selectedMatch && (
          <div>
            <Row gutter={[16, 16]}>
              {/* Match Analysis */}
              <Col span={24}>
                <Card title={
                  <span>
                    <AimOutlined style={{ marginRight: 8 }} />
                    Match Analysis
                  </span>
                } size="small">
                  <Row gutter={16}>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          fontSize: '24px',
                          fontWeight: 'bold',
                          color: getMatchColor(selectedMatch.match_details.skills_match)
                        }}>
                          {selectedMatch.match_details.skills_match}%
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Skills Match</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          fontSize: '24px',
                          fontWeight: 'bold',
                          color: getMatchColor(selectedMatch.match_details.experience_match)
                        }}>
                          {selectedMatch.match_details.experience_match}%
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Experience Match</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          fontSize: '24px',
                          fontWeight: 'bold',
                          color: getMatchColor(selectedMatch.match_details.location_match)
                        }}>
                          {selectedMatch.match_details.location_match}%
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Location Match</div>
                      </div>
                    </Col>
                  </Row>

                  <Divider />

                  <div style={{ marginBottom: 16 }}>
                    <strong>Recommendation:</strong>
                    <p style={{ marginTop: 8, fontStyle: 'italic' }}>
                      {selectedMatch.match_details.recommendation}
                    </p>
                  </div>

                  {selectedMatch.match_details.strengths.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <strong>
                        <CheckCircleOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                        Key Strengths:
                      </strong>
                      <ul style={{ marginTop: 8, marginBottom: 0 }}>
                        {selectedMatch.match_details.strengths.map((strength, index) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedMatch.match_details.gaps.length > 0 && (
                    <div>
                      <strong>
                        <ExperimentOutlined style={{ marginRight: 8, color: '#faad14' }} />
                        Potential Gaps:
                      </strong>
                      <ul style={{ marginTop: 8, marginBottom: 0 }}>
                        {selectedMatch.match_details.gaps.map((gap, index) => (
                          <li key={index}>{gap}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              </Col>

              {/* AI Analysis */}
              {aiAnalysisEnabled && selectedMatch.ai_analysis && (
                <Col span={24}>
                  <Card title={
                    <span>
                      <RobotOutlined style={{ marginRight: 8 }} />
                      AI Analysis
                    </span>
                  } size="small">
                    <Paragraph style={{ marginBottom: 0 }}>
                      {selectedMatch.ai_analysis}
                    </Paragraph>
                  </Card>
                </Col>
              )}

              {/* Contact Information */}
              <Col span={24}>
                <Card title={
                  <span>
                    <PhoneOutlined style={{ marginRight: 8 }} />
                    Contact Information
                  </span>
                } size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <MailOutlined style={{ marginRight: 8 }} />
                      <strong>Email:</strong> {selectedCandidate.email || 'Not provided'}
                    </div>
                    {selectedCandidate.phone && (
                      <div>
                        <PhoneOutlined style={{ marginRight: 8 }} />
                        <strong>Phone:</strong> {selectedCandidate.phone}
                      </div>
                    )}
                    {selectedCandidate.location && (
                      <div>
                        <EnvironmentOutlined style={{ marginRight: 8 }} />
                        <strong>Location:</strong> {selectedCandidate.location}
                      </div>
                    )}
                    <div>
                      <strong>Status:</strong>
                      <Tag color={selectedCandidate.is_available ? 'green' : 'red'} style={{ marginLeft: 8 }}>
                        {selectedCandidate.is_available ? 'Available' : 'Unavailable'}
                      </Tag>
                    </div>
                  </Space>
                </Card>
              </Col>

              {/* Skills & Experience */}
              <Col span={24}>
                <Card title={
                  <span>
                    <CodeOutlined style={{ marginRight: 8 }} />
                    Skills & Experience
                  </span>
                } size="small">
                  <Row gutter={16}>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: getMatchColor(selectedCandidate.overall_score) }}>
                          {selectedCandidate.overall_score}%
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Overall Score</div>
                      </div>
                    </Col>
                    {selectedCandidate.technical_score && (
                      <Col span={8}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
                            {selectedCandidate.technical_score}%
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>Technical</div>
                        </div>
                      </Col>
                    )}
                    {selectedCandidate.experience_score && (
                      <Col span={8}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                            {selectedCandidate.experience_score}%
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>Experience</div>
                        </div>
                      </Col>
                    )}
                  </Row>
                  <Divider style={{ margin: '12px 0' }} />
                  <div style={{ marginBottom: 12 }}>
                    <strong>Experience:</strong>
                    <CalendarOutlined style={{ marginLeft: 8, marginRight: 4 }} />
                    {selectedCandidate.experience_years} years
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <strong>Skills ({selectedCandidate.skills_count || selectedCandidate.skills?.length || 0}):</strong>
                    <div style={{ marginTop: 8 }}>
                      {selectedCandidate.skills && selectedCandidate.skills.length > 0 ? (
                        selectedCandidate.skills.map((skill, index) => (
                          <Tag key={index} style={{ marginBottom: 4 }}>
                            {skill}
                          </Tag>
                        ))
                      ) : (
                        <Text type="secondary">No skills listed</Text>
                      )}
                    </div>
                  </div>

                  {selectedCandidate.education && selectedCandidate.education.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <strong>
                        <BookOutlined style={{ marginRight: 8 }} />
                        Education:
                      </strong>
                      <div style={{ marginTop: 4 }}>
                        {selectedCandidate.education.map((edu: any, index: number) => (
                          <div key={index} style={{ fontSize: '12px', marginBottom: 2 }}>
                            <BulbOutlined style={{ marginRight: 4 }} />
                            {typeof edu === 'string' ? edu : JSON.stringify(edu)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedCandidate.certifications && selectedCandidate.certifications.length > 0 && (
                    <div>
                      <strong>
                        <SafetyCertificateOutlined style={{ marginRight: 8 }} />
                        Certifications:
                      </strong>
                      <div style={{ marginTop: 4 }}>
                        {selectedCandidate.certifications.map((cert: any, index: number) => (
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
              {selectedCandidate.resume_text && (
                <Col span={24}>
                  <Card title={
                    <span>
                      <FileTextOutlined style={{ marginRight: 8 }} />
                      Resume Content
                    </span>
                  } size="small">
                    <Paragraph
                      ellipsis={{ rows: 6, expandable: true, symbol: 'Show more' }}
                      style={{ fontSize: '12px', marginBottom: 0 }}
                    >
                      {selectedCandidate.resume_text}
                    </Paragraph>
                  </Card>
                </Col>
              )}

              {/* Source & Timeline */}
              <Col span={24}>
                <Card title={
                  <span>
                    <DatabaseOutlined style={{ marginRight: 8 }} />
                    Source & Timeline
                  </span>
                } size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <strong>Source:</strong> {selectedCandidate.source || 'Unknown'}
                    </div>
                    {selectedCandidate.filename && (
                      <div>
                        <FileTextOutlined style={{ marginRight: 8 }} />
                        <strong>Resume File:</strong> {selectedCandidate.filename}
                      </div>
                    )}
                    {selectedCandidate.resume_url && (
                      <div>
                        <GlobalOutlined style={{ marginRight: 8 }} />
                        <strong>Resume URL:</strong>
                        <a href={selectedCandidate.resume_url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8 }}>
                          View Resume
                        </a>
                      </div>
                    )}
                    {selectedCandidate.created_at && (
                      <div>
                        <strong>Added:</strong> {new Date(selectedCandidate.created_at).toLocaleString()}
                      </div>
                    )}
                    {selectedCandidate.last_contacted && (
                      <div>
                        <strong>Last Contacted:</strong> {new Date(selectedCandidate.last_contacted).toLocaleString()}
                      </div>
                    )}
                  </Space>
                </Card>
              </Col>

              {/* Action Buttons */}
              <Col span={24}>
                <Card size="small">
                  <Space style={{ width: '100%', justifyContent: 'center' }}>
                    <Button
                      type="primary"
                      icon={<MailOutlined />}
                      onClick={() => window.location.href = `mailto:${selectedCandidate.email}`}
                    >
                      Send Email
                    </Button>
                    <Button
                      icon={<ShareAltOutlined />}
                      onClick={() => {
                        const matchInfo = `${selectedCandidate.candidate_name} - ${selectedMatch.match_score}% match\n${selectedCandidate.email}`;
                        navigator.clipboard.writeText(matchInfo);
                        message.success('Candidate info copied to clipboard');
                      }}
                    >
                      Share
                    </Button>
                    <Button
                      icon={<FileTextOutlined />}
                      disabled={!selectedCandidate.resume_url && !selectedCandidate.filename}
                    >
                      View Resume
                    </Button>
                  </Space>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default CandidateMatching;
