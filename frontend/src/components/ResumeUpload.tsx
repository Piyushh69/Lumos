import React, { useState, useRef, useEffect } from 'react';
import {
  Card, Table, Tag, Space, Modal, Button, Input, Select,
  Statistic, Row, Col, Drawer, Badge, Divider, Tabs, Alert, message, Spin, Checkbox, Typography
} from 'antd';
import {
  UploadOutlined, FileTextOutlined, UserOutlined, SearchOutlined,
  DownloadOutlined, EyeOutlined, DeleteOutlined, MailOutlined, CalendarOutlined, TrophyOutlined, TeamOutlined,
  PhoneOutlined, EnvironmentOutlined, SafetyCertificateOutlined, BookOutlined, GlobalOutlined
} from '@ant-design/icons';
import api from '../services/api';

const { TabPane } = Tabs;
const { Option } = Select;
const { Search } = Input;
const { Text, Paragraph } = Typography;

interface ResumeUploadProps {
  socket: WebSocket | null;
  sendMessage: (message: string) => void;
  isConnected: boolean;
}

interface FileWithId {
  file: File;
  id: string;
  preview?: string;
}

interface ProcessedResume {
  candidate_id: number | string;
  filename: string;
  candidate_name: string;
  email: string;
  phone?: string;
  location?: string;
  resume_url?: string;
  resume_text?: string;
  status: string;
  score: number;
  technical_score?: number;
  experience_score?: number;
  skills: string[];
  skills_count: number;
  experience_years: number;
  education?: any[];
  certifications?: any[];
  is_available?: boolean;
  source?: string;
  created_at?: string;
  last_contacted?: string;
}

interface FailedResume {
  filename: string;
  error: string;
  error_type: string;
}

interface UploadResults {
  totalUploaded: number;
  totalProcessed: number;
  failedCount: number;
  processedResumes: ProcessedResume[];
  failedResumes: FailedResume[];
  matchingResults?: any;
}

// UI helpers
const STATUS_COLORS: { [k: string]: string } = {
  success: 'green',
  reviewed: 'blue',
  shortlisted: 'geekblue',
  rejected: 'volcano',
  hired: 'purple',
  new: 'default'
};

function getScoreColor(score: number) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#ef4444';
  return '#6b7280';
}

const getFileIcon = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf': return '📄';
    case 'doc':
    case 'docx': return '📝';
    case 'txt': return '📃';
    default: return '📄';
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const ResumeUpload: React.FC<ResumeUploadProps> = ({ socket, sendMessage, isConnected }) => {
  // File & upload state
  const [files, setFiles] = useState<FileWithId[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [messageState, setMessageState] = useState('');
  const [results, setResults] = useState<UploadResults | null>(null);

  // Candidates (from DB), stats, table filters
  const [candidates, setCandidates] = useState<ProcessedResume[]>([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<ProcessedResume | null>(null);
  const [loadingCandidateDetails, setLoadingCandidateDetails] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | string>('all');
  const [jobId, setJobId] = useState<string>('');
  const [stats, setStats] = useState<{
    avgScore: number;
    shortlisted: number;
    hired: number;
    avgExp: number;
    totalCandidates: number;
    totalSkills: number;
  }>({ avgScore: 0, shortlisted: 0, hired: 0, avgExp: 0, totalCandidates: 0, totalSkills: 0 });

  // Select which parsed candidates to persist
  const [storeSelections, setStoreSelections] = useState<{ [id: string]: boolean }>({});
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [savingCandidates, setSavingCandidates] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
  };

  const addFiles = (newFiles: File[]) => {
    const filesWithId: FileWithId[] = newFiles.map(file => ({
      file,
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));
    setFiles(prev => [...prev, ...filesWithId]);
    setResults(null); 
    setMessageState('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { 
    e.preventDefault(); 
    setDragOver(true); 
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { 
    e.preventDefault(); 
    setDragOver(false); 
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); 
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files); 
    if (dropped.length > 0) addFiles(dropped);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      const removed = prev.find(f => f.id === fileId);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return updated;
    });
    if (files.length === 1) { setResults(null); setMessageState(''); }
  };

  const removeAllFiles = () => {
    files.forEach(({ preview }) => preview && URL.revokeObjectURL(preview));
    setFiles([]); 
    // setResults(null); 
    // setMessageState(''); 
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateFiles = (filesToValidate: FileWithId[]): string[] => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const maxSize = 10 * 1024 * 1024;
    return filesToValidate.flatMap((f, idx) => {
      const ext = '.' + f.file.name.split('.').pop()?.toLowerCase();
      const errs: string[] = [];
      if (!allowedTypes.includes(ext)) errs.push(
        `File ${idx + 1} (${f.file.name}): Unsupported file type.`
      );
      if (f.file.size > maxSize) errs.push(
        `File ${idx + 1} (${f.file.name}): File too large (max 10MB).`
      );
      if (f.file.size === 0) errs.push(
        `File ${idx + 1} (${f.file.name}): File is empty.`
      );
      return errs;
    });
  };

  const handleUpload = async () => {
    if (!files.length) { 
      setMessageState('Please select files to upload'); 
      return; 
    }
    
    const validationErrors = validateFiles(files);
    if (validationErrors.length) {
      setMessageState(`Validation errors:\n${validationErrors.join('\n')}`); 
      return;
    }
    
    setUploading(true); 
    setMessageState(''); 
    setResults(null);
    
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f.file));
      if (jobId.trim()) formData.append('job_id', jobId.trim());
      
      if (isConnected && sendMessage)
        sendMessage(`Starting AI analysis of ${files.length} resume(s)${jobId ? ` for job ${jobId}` : ''}`);
      
      console.log('📤 Uploading files to backend...');
      
      const response = await api.post('/api/v1/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }, 
        timeout: 120000
      });
      
      console.log('✅ Upload response:', response.data);
      
      if (response.data.success) {
        const uploadResults: UploadResults = {
          totalUploaded: response.data.total_uploaded,
          totalProcessed: response.data.total_processed,
          failedCount: response.data.failed_count,
          processedResumes: response.data.processed_resumes || [],
          failedResumes: response.data.failed_resumes || [],
          matchingResults: response.data.matching_results
        };
        
        console.log('📊 Setting results:', uploadResults);
        setResults(uploadResults);

        setMessageState(
          `Successfully processed ${uploadResults.totalProcessed} out of ${uploadResults.totalUploaded} resume(s)`
          + (uploadResults.failedCount > 0 ? `. ${uploadResults.failedCount} failed.` : '')
        );

        // Initialize store selections for all processed candidates
        if (uploadResults.processedResumes.length > 0) {
          const sel: { [id: string]: boolean } = {};
          uploadResults.processedResumes.forEach(r => { 
            sel[String(r.candidate_id)] = true; 
          });
          setStoreSelections(sel);
        }

        if (isConnected && sendMessage)
          sendMessage('AI analysis complete');
        
        removeAllFiles();
      } else {
        throw new Error(response.data.error || 'Upload failed');
      }
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      setMessageState(
        'Upload failed: ' +
        (error.response?.data?.detail || error.message || 'Unknown error occurred')
      );
      if (isConnected && sendMessage)
        sendMessage(`Resume upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleStoreCandidates = async () => {
    if (!results) { 
      setShowStoreModal(false); 
      return; 
    }
    
    const selected = results.processedResumes.filter(r => storeSelections[String(r.candidate_id)]);
    if (selected.length === 0) {
      message.info('No candidates selected for storage.');
      setShowStoreModal(false);
      return;
    }
    
    setSavingCandidates(true);
    
    try {
      console.log('Storing candidates:', selected);
      
      let successCount = 0;
      let failedCount = 0;
      
      // Store candidates with full data mapping
      for (const candidate of selected) {
        try {
          console.log(`📝 Saving candidate: ${candidate.candidate_name}`);
          
          const candidateData = {
            full_name: candidate.candidate_name,
            email: candidate.email,
            phone: candidate.phone,
            location: candidate.location,
            resume_filename: candidate.filename,
            resume_url: candidate.resume_url,
            resume_text: candidate.resume_text,
            skills: candidate.skills || [],
            experience_years: Number(candidate.experience_years) || 0,
            education: candidate.education || [],
            certifications: candidate.certifications || [],
            overall_score: Number(candidate.score) || 0,
            technical_score: Number(candidate.technical_score) || 0,
            experience_score: Number(candidate.experience_score) || 0,
            status: candidate.status || 'new',
            is_available: candidate.is_available !== undefined ? candidate.is_available : true,
            source: candidate.source || 'resume_upload'
          };
          
          const response = await api.post('/api/v1/candidates', candidateData);
          
          if (response.data.success) {
            successCount++;
            console.log(`✅ Saved: ${candidate.candidate_name}`);
          } else {
            failedCount++;
            console.error(`❌ Failed to save: ${candidate.candidate_name}`, response.data);
          }
        } catch (error: any) {
          failedCount++;
          console.error(`❌ Error saving candidate ${candidate.candidate_name}:`, error.response?.data || error.message);
        }
      }
      
      if (successCount > 0) {
        message.success(`${successCount} candidate(s) stored successfully!`);
      }
      
      if (failedCount > 0) {
        message.warning(`${failedCount} candidate(s) failed to save.`);
      }
      
      setShowStoreModal(false);
      
      // Refresh candidates list if on DB tab
      if (activeTab === 'db') {
        fetchCandidateDatabase();
      }
      
    } catch (error: any) {
      console.error('❌ Store candidates error:', error);
      message.error('Failed to store candidates: ' + (error?.response?.data?.detail || error?.message || 'unknown'));
    } finally {
      setSavingCandidates(false);
    }
  };

  // Enhanced fetch with proper field mapping
  const fetchCandidateDatabase = async () => {
    setLoadingCandidates(true);
    try {
      console.log('📋 Fetching candidates from database...');
      const response = await api.get('/api/v1/candidates');
      
      console.log('📋 Candidates response:', response.data);
      
      if (response.data.success) {
        const mappedCandidates = response.data.candidates.map((c: any) => ({
          candidate_id: c.candidate_id,
          candidate_name: c.candidate_name,
          email: c.email,
          phone: c.phone,
          location: c.location,
          filename: c.filename,
          resume_url: c.resume_url,
          resume_text: c.resume_text,
          status: c.status,
          score: c.score,
          technical_score: c.technical_score,
          experience_score: c.experience_score,
          skills: c.skills || [],
          skills_count: c.skills_count || (c.skills ? c.skills.length : 0),
          experience_years: c.experience_years,
          education: c.education || [],
          certifications: c.certifications || [],
          is_available: c.is_available,
          source: c.source,
          created_at: c.created_at,
          last_contacted: c.last_contacted
        }));
        
        setCandidates(mappedCandidates);
      } else {
        console.error('Failed to fetch candidates:', response.data);
        setCandidates([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch candidates:', error);
      message.error('Failed to load candidates from database');
      setCandidates([]);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const fetchCandidateDetails = async (candidateId: string | number) => {
    setLoadingCandidateDetails(true);
    try {
      console.log(`🔍 Fetching detailed info for candidate ${candidateId}`);
      const response = await api.get(`/api/v1/candidates/${candidateId}`);
      
      if (response.data.success) {
        const detailedCandidate = {
          candidate_id: response.data.candidate.candidate_id,
          candidate_name: response.data.candidate.candidate_name,
          email: response.data.candidate.email,
          phone: response.data.candidate.phone,
          location: response.data.candidate.location,
          filename: response.data.candidate.filename,
          resume_url: response.data.candidate.resume_url,
          resume_text: response.data.candidate.resume_text,
          status: response.data.candidate.status,
          score: response.data.candidate.score,
          technical_score: response.data.candidate.technical_score,
          experience_score: response.data.candidate.experience_score,
          skills: response.data.candidate.skills || [],
          skills_count: response.data.candidate.skills_count,
          experience_years: response.data.candidate.experience_years,
          education: response.data.candidate.education || [],
          certifications: response.data.candidate.certifications || [],
          is_available: response.data.candidate.is_available,
          source: response.data.candidate.source,
          created_at: response.data.candidate.created_at,
          last_contacted: response.data.candidate.last_contacted
        };
        
        setSelectedCandidate(detailedCandidate);
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
  const viewCandidateDetails = async (candidate: ProcessedResume) => {
    setDrawerVisible(true);
    await fetchCandidateDetails(candidate.candidate_id);
  };

  useEffect(() => { 
    if (activeTab === "db") fetchCandidateDatabase(); 
  }, [activeTab]);
  
  useEffect(() => { 
    calculateStatsDB(); 
  }, [candidates]);

  const calculateStatsDB = () => {
    if (!candidates.length) return setStats({
      avgScore: 0, shortlisted: 0, hired: 0, avgExp: 0, totalCandidates: 0, totalSkills: 0
    });
    
    const avgScore = candidates.reduce((sum, c) => sum + (Number(c.score) || 0), 0) / candidates.length;
    const shortlisted = candidates.filter(c => (c.status || '').toLowerCase() === 'shortlisted').length;
    const hired = candidates.filter(c => (c.status || '').toLowerCase() === 'hired').length;
    const avgExp = candidates.reduce((sum, c) => sum + (Number(c.experience_years) || 0), 0) / candidates.length;
    const totalSkills = candidates.reduce((sum, c) => sum + (Number(c.skills_count) || 0), 0);
    
    setStats({
      avgScore: Number(avgScore.toFixed(1)),
      shortlisted, hired,
      avgExp: Number(avgExp.toFixed(1)),
      totalCandidates: candidates.length, 
      totalSkills
    });
  };

  const deleteCandidate = (candidate_id: string | number) => {
    Modal.confirm({
      title: 'Delete Candidate',
      content: 'Are you sure you want to delete this candidate?',
      onOk: async () => {
        try {
          await api.delete(`/api/v1/candidates/${candidate_id}`);
          fetchCandidateDatabase();
          message.success('Candidate deleted');
          
          // Close drawer if deleted candidate was selected
          if (selectedCandidate?.candidate_id === candidate_id) {
            setDrawerVisible(false);
            setSelectedCandidate(null);
          }
        } catch (e) {
          message.error('Delete failed');
        }
      }
    });
  };

  // Enhanced table columns with better data display
  const columns = [
    {
      title: "Name",
      dataIndex: "candidate_name",
      key: "candidate_name",
      render: (text: string) => <Space><UserOutlined />{text}</Space>,
      sorter: (a: any, b: any) => (a.candidate_name || '').localeCompare(b.candidate_name || ''),
    },
    {
      title: "Contact",
      key: "contact",
      render: (record: ProcessedResume) => (
        <div>
          <div style={{ fontSize: '12px' }}>
            <MailOutlined /> {record.email || 'No email'}
          </div>
          {record.phone && (
            <div style={{ fontSize: '11px', color: '#666' }}>
              <PhoneOutlined /> {record.phone}
            </div>
          )}
          {record.location && (
            <div style={{ fontSize: '11px', color: '#666' }}>
              <EnvironmentOutlined /> {record.location}
            </div>
          )}
        </div>
      )
    },
    {
      title: "Scores",
      key: "scores",
      render: (record: ProcessedResume) => (
        <div>
          <div style={{ marginBottom: 4 }}>
            <Badge color={getScoreColor(record.score)} text={`${record.score}%`} />
          </div>
          {(record.technical_score || record.experience_score) && (
            <div style={{ fontSize: '10px', color: '#666' }}>
              {record.technical_score && `Tech: ${record.technical_score}%`}
              {record.technical_score && record.experience_score && ' | '}
              {record.experience_score && `Exp: ${record.experience_score}%`}
            </div>
          )}
        </div>
      ),
      sorter: (a: any, b: any) => (Number(a.score) || 0) - (Number(b.score) || 0),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string, record: ProcessedResume) => (
        <div>
          <Tag color={STATUS_COLORS[status?.toLowerCase()] || STATUS_COLORS['new']}>{status}</Tag>
          {record.is_available !== undefined && (
            <div style={{ marginTop: 4 }}>
              <Tag color={record.is_available ? 'green' : 'red'}>
                {record.is_available ? 'Available' : 'Unavailable'}
              </Tag>
            </div>
          )}
        </div>
      )
    },
    {
      title: "Skills & Experience",
      key: "skills_exp",
      render: (record: ProcessedResume) => (
        <div>
          <div style={{ marginBottom: 2 }}>
            <BookOutlined style={{ marginRight: 4 }} />
            {record.skills_count || 0} skills
          </div>
          <div style={{ fontSize: '11px', color: '#666' }}>
            <CalendarOutlined style={{ marginRight: 4 }} />
            {record.experience_years} years exp
          </div>
          {record.certifications && record.certifications.length > 0 && (
            <div style={{ fontSize: '11px', color: '#666' }}>
              <SafetyCertificateOutlined style={{ marginRight: 4 }} />
              {record.certifications.length} certs
            </div>
          )}
        </div>
      ),
      sorter: (a: any, b: any) => (Number(a.experience_years) || 0) - (Number(b.experience_years) || 0),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, row: ProcessedResume) => (
        <Space>
          <Button 
            icon={<EyeOutlined />} 
            size="small" 
            onClick={() => viewCandidateDetails(row)} 
          />
          <Button 
            icon={<DeleteOutlined />} 
            size="small" 
            danger 
            onClick={() => deleteCandidate(row.candidate_id)} 
          />
        </Space>
      )
    }
  ];

  const candidateFilter = (candidate: ProcessedResume) =>
    (filterStatus === 'all' || (candidate.status || '').toLowerCase() === filterStatus) &&
    (candidate.candidate_name?.toLowerCase().includes(search.toLowerCase())
      || candidate.email?.toLowerCase().includes(search.toLowerCase())
      || candidate.phone?.toLowerCase().includes(search.toLowerCase())
      || candidate.location?.toLowerCase().includes(search.toLowerCase())
      || candidate.filename?.toLowerCase().includes(search.toLowerCase())
      || candidate.skills?.some(skill => skill.toLowerCase().includes(search.toLowerCase()))
    );

  const exportCandidates = () => {
    const dataStr = JSON.stringify(candidates, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `candidates_export_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    message.success('Candidates exported successfully');
  };

  const getResultStats = (results: UploadResults) => {
    const data = results.processedResumes;
    if (!data.length) return null;
    
    const uniqueEmailSet = new Set(data.map(x => x.email).filter(Boolean));
    const namesSet = new Set(data.map(x => x.candidate_name));
    const avgScore = data.reduce((a, b) => a + (Number(b.score) || 0), 0) / data.length;
    const avgExp = data.reduce((a, b) => a + (Number(b.experience_years) || 0), 0) / data.length;
    const totalSkills = data.reduce((sum, c) => sum + (Number(c.skills_count) || 0), 0);

    return {
      total: data.length,
      uniqueNames: namesSet.size,
      uniqueEmails: uniqueEmailSet.size,
      avgScore: Number(avgScore.toFixed(1)),
      avgExp: Number(avgExp.toFixed(1)),
      totalSkills,
      highScorers: data.filter(c => (Number(c.score) || 0) >= 80).length,
      experiencedCandidates: data.filter(c => (Number(c.experience_years) || 0) >= 5).length
    };
  };

  return (
    <div style={{ padding: 24 }}>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>

        <TabPane tab={<span><UploadOutlined />Upload & Analyze</span>} key="upload">
          <Card>
            <div className="page-header">
              <h2><FileTextOutlined /> Resume Upload & AI Analysis</h2>
              <p>Upload resumes for parsing, scoring, and candidate matching</p>
            </div>
            
            <div className="job-selection" style={{ marginBottom: 12 }}>
              <label htmlFor="jobId">Job ID (Optional):</label>
              <Input
                id="jobId"
                type="text"
                placeholder="Enter Job ID for candidate matching"
                value={jobId}
                onChange={e => setJobId(e.target.value)}
                style={{ width: 250, marginLeft: 10 }}
                disabled={uploading}
              />
              <small style={{ display: 'block' }}>
                If provided, candidates will be automatically matched to this job
              </small>
            </div>
            
            <div
              className={`upload-area ${dragOver ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: 30, border: '1px dashed #cbd5e1',
                borderRadius: 10, marginBottom: 18, textAlign: 'center', 
                background: dragOver ? '#f0f9ff' : ''
              }}>
              <div style={{ fontSize: 36 }}>{<FileTextOutlined />}</div>
              <h3>Drag & Drop Resumes Here</h3>
              <p>Or click to select files (PDF, DOC, DOCX, TXT)</p>
              <p className="file-limits">Maximum 10MB per file • Up to 20 files at once</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileChange}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </div>
            
            {/* Selected Files Display */}
            {files.length > 0 && (
              <div className="selected-files" style={{ marginBottom: 20 }}>
                <div className="files-header" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <h4>Selected Files ({files.length})</h4>
                  <Button type="text" onClick={removeAllFiles} disabled={uploading} icon={<DeleteOutlined />}>
                    Remove All
                  </Button>
                </div>
                <div className="files-list" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {files.map((fileWithId) => (
                    <div key={fileWithId.id} className="file-item" style={{
                      border: '1px solid #e5e7eb', borderRadius: 6,
                      padding: 6, background: '#f8fafc', display: 'flex', alignItems: 'center'
                    }}>
                      <span style={{ fontSize: 24 }}>{getFileIcon(fileWithId.file.name)}</span>
                      <span style={{ marginLeft: 7 }}>{fileWithId.file.name}</span>
                      <span style={{ marginLeft: 8, fontSize: 12, color: '#888' }}>
                        {formatFileSize(fileWithId.file.size)}
                      </span>
                      <Button 
                        disabled={uploading} 
                        size="small" 
                        icon={<DeleteOutlined />} 
                        style={{ marginLeft: 8 }}
                        onClick={() => removeFile(fileWithId.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Upload Button */}
            <div className="upload-actions" style={{ marginBottom: 14 }}>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                loading={uploading}
                onClick={handleUpload}
                disabled={uploading || !files || files.length === 0}
                size="large"
              >
                {uploading ? `Processing ${files.length} file(s)...` : 'Upload & Analyze with AI'}
              </Button>
            </div>
            
            {/* Status Message */}
            {messageState && (
              <Alert
                type={messageState.toLowerCase().includes('fail') ? 'error' : 'success'}
                message={messageState}
                style={{ marginBottom: 18 }}
                showIcon
              />
            )}
            
            {/* Processing Results */}
            {/* {results && (
              <div className="processing-results" style={{ marginTop: 24 }}>
                <Card style={{ border: '2px solid #1890ff', borderRadius: 12 }}>
                  <h3 style={{ marginBottom: 16, color: '#1890ff' }}>
                    <FileTextOutlined /> Analysis Report
                  </h3>
                  
                  <Row gutter={16} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={8}>
                      <Statistic 
                        title="Total Uploaded" 
                        value={results.totalUploaded} 
                        prefix={<UploadOutlined />}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Statistic 
                        title="Successfully Processed" 
                        value={results.totalProcessed} 
                        valueStyle={{ color: '#16a34a' }}
                        prefix={<FileTextOutlined />}
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Statistic 
                        title="Failed" 
                        value={results.failedCount} 
                        valueStyle={{ color: '#dc2626' }}
                        prefix={<DeleteOutlined />}
                      />
                    </Col>
                  </Row>

                  {results.processedResumes.length > 0 && (
                    <>
                      <Divider orientation="left">📊 Batch Analysis</Divider>
                      <Card size="small" style={{ marginBottom: 16, background: '#f8fafc' }}>
                        <Row gutter={16}>
                          {(() => {
                            const batchStats = getResultStats(results);
                            if (!batchStats) return null;
                            return (
                              <>
                                <Col xs={12} sm={8} md={4}>
                                  <Statistic 
                                    title="Unique Candidates" 
                                    value={batchStats.uniqueNames}
                                    prefix={<UserOutlined />}
                                  />
                                </Col>
                                <Col xs={12} sm={8} md={4}>
                                  <Statistic 
                                    title="Unique Emails" 
                                    value={batchStats.uniqueEmails}
                                    prefix={<MailOutlined />}
                                  />
                                </Col>
                                <Col xs={12} sm={8} md={4}>
                                  <Statistic 
                                    title="Avg Score" 
                                    value={batchStats.avgScore} 
                                    suffix="%" 
                                    valueStyle={{ color: getScoreColor(batchStats.avgScore) }}
                                    prefix={<TrophyOutlined />}
                                  />
                                </Col>
                                <Col xs={12} sm={8} md={4}>
                                  <Statistic 
                                    title="Avg Experience" 
                                    value={batchStats.avgExp} 
                                    suffix=" yrs"
                                    prefix={<CalendarOutlined />}
                                  />
                                </Col>
                                <Col xs={12} sm={8} md={4}>
                                  <Statistic 
                                    title="Total Skills Found" 
                                    value={batchStats.totalSkills}
                                  />
                                </Col>
                                <Col xs={12} sm={8} md={4}>
                                  <Statistic 
                                    title="High Scorers (80%+)" 
                                    value={batchStats.highScorers}
                                    valueStyle={{ color: '#10b981' }}
                                  />
                                </Col>
                              </>
                            );
                          })()}
                        </Row>
                      </Card>
                    </>
                  )}

                  {results.processedResumes.length > 0 && (
                    <div className="processed-resumes">
                      <Divider orientation="left">👥 Processed Candidates</Divider>
                      <Row gutter={[16, 16]}>
                        {results.processedResumes.map((resume, i) => (
                          <Col xs={24} sm={12} lg={8} key={resume.candidate_id || i}>
                            <Card 
                              hoverable 
                              size="small" 
                              onClick={() => { setSelectedCandidate(resume); setDrawerVisible(true); }}
                              style={{ 
                                borderLeft: `4px solid ${getScoreColor(resume.score)}`,
                                height: '100%'
                              }}
                            >
                              <div style={{ marginBottom: 8 }}>
                                <h5 style={{ margin: 0, marginBottom: 4 }}>{resume.candidate_name}</h5>
                                <Tag color={getScoreColor(resume.score)} style={{ fontSize: '12px' }}>
                                  {resume.score}% Match
                                </Tag>
                              </div>
                              <div style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>
                                📧 {resume.email || 'No email'}
                                {resume.phone && (
                                  <div>📱 {resume.phone}</div>
                                )}
                                {resume.location && (
                                  <div>📍 {resume.location}</div>
                                )}
                              </div>
                              <div style={{ fontSize: 12, marginBottom: 8 }}>
                                🎯 {resume.skills_count} skills • 💼 {resume.experience_years} yrs exp
                              </div>
                              <div style={{ fontSize: 11, color: '#999' }}>
                                📄 {resume.filename}
                              </div>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  )}

                  {results.failedResumes.length > 0 && (
                    <div className="failed-resumes" style={{ marginTop: 18 }}>
                      <Divider orientation="left">❌ Failed to Process</Divider>
                      <Alert
                        type="warning"
                        message={`${results.failedResumes.length} file(s) failed to process`}
                        description={
                          <ul style={{ marginTop: 8, marginBottom: 0 }}>
                            {results.failedResumes.map((failed, i) => (
                              <li key={i}>
                                <strong>{failed.filename}</strong>: {failed.error}
                              </li>
                            ))}
                          </ul>
                        }
                        showIcon
                      />
                    </div>
                  )}

                  {results.processedResumes.length > 0 && (
                    <div style={{ textAlign: 'center', marginTop: 32, padding: '20px 0', background: '#f0f9ff', borderRadius: 8 }}>
                      <Button 
                        type="primary" 
                        size="large"
                        style={{ fontSize: '16px', height: '50px', padding: '0 40px' }}
                        onClick={() => setShowStoreModal(true)}
                      >
                        💾 Save {results.processedResumes.length} Candidates to Database
                      </Button>
                      <p style={{ marginTop: 8, color: '#666' }}>
                        Review and select candidates to save permanently
                      </p>
                    </div>
                  )}
                </Card>
              </div>
            )}

            <Modal
              title="💾 Save Candidates to Database"
              open={showStoreModal}
              onOk={handleStoreCandidates}
              onCancel={() => setShowStoreModal(false)}
              okText={`Save Selected (${Object.values(storeSelections).filter(Boolean).length})`}
              cancelText="Skip All"
              width={700}
              confirmLoading={savingCandidates}
            >
              <div style={{ marginBottom: 16 }}>
                <Alert
                  type="info"
                  message="Choose which candidates to save to your permanent database"
                  description="Selected candidates will be stored and available in the Candidates DB tab for future reference."
                  showIcon
                />
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <Button 
                  size="small" 
                  onClick={() => {
                    const allSelected = Object.keys(storeSelections).reduce((acc, key) => {
                      acc[key] = true;
                      return acc;
                    }, {} as { [id: string]: boolean });
                    setStoreSelections(allSelected);
                  }}
                >
                  Select All
                </Button>
                <Button 
                  size="small" 
                  style={{ marginLeft: 8 }}
                  onClick={() => {
                    const allUnselected = Object.keys(storeSelections).reduce((acc, key) => {
                      acc[key] = false;
                      return acc;
                    }, {} as { [id: string]: boolean });
                    setStoreSelections(allUnselected);
                  }}
                >
                  Select None
                </Button>
              </div>

              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {results?.processedResumes.map((resume) => (
                  <Card 
                    key={resume.candidate_id} 
                    size="small" 
                    style={{ marginBottom: 8 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Checkbox
                        checked={storeSelections[String(resume.candidate_id)] ?? true}
                        onChange={e => setStoreSelections({
                          ...storeSelections,
                          [String(resume.candidate_id)]: e.target.checked
                        })}
                        style={{ marginRight: 12 }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                          {resume.candidate_name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          📧 {resume.email} • 🎯 {resume.score}% • 💼 {resume.experience_years} yrs • 🛠️ {resume.skills_count} skills
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Modal> */}
          </Card>
        </TabPane>

        {/* Candidates DB Tab */}
        <TabPane tab={<span><TeamOutlined />Candidates DB</span>} key="db">
          <Card>
            <Row gutter={[16, 16]} style={{ marginBottom: 12 }}>
              <Col xs={24} md={8}>
                <Search
                  placeholder="Search candidates..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  allowClear 
                />
              </Col>
              <Col xs={24} md={6}>
                <Select
                  placeholder="Status"
                  value={filterStatus}
                  onChange={v => setFilterStatus(v)}
                  style={{ width: '100%' }}>
                  <Option value="all">All Status</Option>
                  <Option value="new">New</Option>
                  <Option value="success">Success</Option>
                  <Option value="reviewed">Reviewed</Option>
                  <Option value="shortlisted">Shortlisted</Option>
                  <Option value="rejected">Rejected</Option>
                  <Option value="hired">Hired</Option>
                </Select>
              </Col>
              <Col xs={24} md={7}>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={exportCandidates}
                  disabled={!(candidates && candidates.length)}
                >
                  Export ({candidates.length})
                </Button>
              </Col>
            </Row>
            
            {loadingCandidates ? (
              <div style={{ textAlign: 'center', padding: '50px 0' }}>
                <Spin size="large" />
                <p style={{ marginTop: 16 }}>Loading candidates from database...</p>
              </div>
            ) : (
              <Table
                size="middle"
                bordered
                columns={columns}
                dataSource={candidates.filter(candidateFilter)}
                pagination={{ 
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} candidates`
                }}
                rowKey="candidate_id"
                scroll={{ x: 800 }}
              />
            )}
          </Card>
        </TabPane>

        {/* Analytics Tab */}
        <TabPane tab={<span><TrophyOutlined />Analytics</span>} key="stats">
          <Card>
            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Statistic 
                  title="Total Candidates" 
                  value={stats.totalCandidates} 
                  prefix={<UserOutlined />} 
                />
              </Col>
              <Col xs={24} md={8}>
                <Statistic 
                  title="Shortlisted" 
                  value={stats.shortlisted} 
                  prefix={<TrophyOutlined />} 
                />
              </Col>
              <Col xs={24} md={8}>
                <Statistic 
                  title="Hired" 
                  value={stats.hired} 
                  prefix={<TrophyOutlined />} 
                />
              </Col>
            </Row>
            <Divider />
            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Statistic 
                  title="Average Score" 
                  value={stats.avgScore} 
                  prefix={<FileTextOutlined />} 
                  suffix="%" 
                />
              </Col>
              <Col xs={24} md={8}>
                <Statistic 
                  title="Average Experience" 
                  value={stats.avgExp} 
                  prefix={<CalendarOutlined />} 
                  suffix=" years" 
                />
              </Col>
              <Col xs={24} md={8}>
                <Statistic 
                  title="Total Skills Pool" 
                  value={stats.totalSkills} 
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
            <div>
              <div>{selectedCandidate?.candidate_name}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {selectedCandidate?.email}
              </div>
            </div>
          </div>
        }
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        loading={loadingCandidateDetails}
      >
        {selectedCandidate && (
          <div>
            <Row gutter={[16, 16]}>
              {/* Contact Information */}
              <Col span={24}>
                <Card size="small" title="Contact Information">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div><MailOutlined /> <strong>Email:</strong> {selectedCandidate.email || 'Not provided'}</div>
                    {selectedCandidate.phone && (
                      <div><PhoneOutlined /> <strong>Phone:</strong> {selectedCandidate.phone}</div>
                    )}
                    {selectedCandidate.location && (
                      <div><EnvironmentOutlined /> <strong>Location:</strong> {selectedCandidate.location}</div>
                    )}
                    {selectedCandidate.is_available !== undefined && (
                      <div>
                        <strong>Availability:</strong> 
                        <Tag color={selectedCandidate.is_available ? 'green' : 'red'} style={{ marginLeft: 8 }}>
                          {selectedCandidate.is_available ? 'Available' : 'Unavailable'}
                        </Tag>
                      </div>
                    )}
                  </Space>
                </Card>
              </Col>

              {/* Scoring Information */}
              <Col span={24}>
                <Card size="small" title="AI Scoring & Analysis">
                  <Row gutter={16}>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: getScoreColor(selectedCandidate.score) }}>
                          {selectedCandidate.score}%
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
                  <div>
                    <div style={{ marginBottom: 8 }}>
                      <strong>Status:</strong> 
                      <Tag color={STATUS_COLORS[selectedCandidate.status?.toLowerCase()] || STATUS_COLORS['new']} style={{ marginLeft: 8 }}>
                        {selectedCandidate.status}
                      </Tag>
                    </div>
                    <div><strong>Experience:</strong> {selectedCandidate.experience_years} years</div>
                  </div>
                </Card>
              </Col>

              {/* Skills & Qualifications */}
              <Col span={24}>
                <Card size="small" title="Skills & Qualifications">
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
                      <strong>Education:</strong>
                      <div style={{ marginTop: 4 }}>
                        {selectedCandidate.education.map((edu: any, index: number) => (
                          <div key={index} style={{ fontSize: '12px', marginBottom: 2 }}>
                            • {typeof edu === 'string' ? edu : JSON.stringify(edu)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedCandidate.certifications && selectedCandidate.certifications.length > 0 && (
                    <div>
                      <strong>Certifications:</strong>
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
                  <Card size="small" title="Resume Content">
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
                <Card size="small" title="Source & Timeline">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div><strong>Source:</strong> {selectedCandidate.source || 'Unknown'}</div>
                    {selectedCandidate.filename && (
                      <div><FileTextOutlined /> <strong>Resume File:</strong> {selectedCandidate.filename}</div>
                    )}
                    {selectedCandidate.resume_url && (
                      <div>
                        <GlobalOutlined /> <strong>Resume URL:</strong> 
                        <a href={selectedCandidate.resume_url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8 }}>
                          View Resume
                        </a>
                      </div>
                    )}
                    {selectedCandidate.created_at && (
                      <div><strong>Added:</strong> {new Date(selectedCandidate.created_at).toLocaleString()}</div>
                    )}
                    {selectedCandidate.last_contacted && (
                      <div><strong>Last Contacted:</strong> {new Date(selectedCandidate.last_contacted).toLocaleString()}</div>
                    )}
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

export default ResumeUpload;
