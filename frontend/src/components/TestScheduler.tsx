import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface TestTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
  duration_minutes: number;
  total_questions: number;
  passing_score: number;
}

interface ScheduledTest {
  id: number;
  template_name: string;
  candidate_name: string;
  scheduled_date: string;
  deadline: string;
  status: string;
  score: number | null;
  access_code: string;
}

interface TestSchedulerProps {
  socket?: WebSocket | null;
  sendMessage?: (message: string) => void;
  isConnected?: boolean;
}

const TestScheduler: React.FC<TestSchedulerProps> = ({ socket, sendMessage, isConnected }) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'templates' | 'results'>('schedule');
  const [templates, setTemplates] = useState<TestTemplate[]>([]);
  const [scheduledTests, setScheduledTests] = useState<ScheduledTest[]>([]);
  const [loading, setLoading] = useState(false);

  // Schedule Test Form State
  const [scheduleForm, setScheduleForm] = useState({
    template_id: '',
    candidate_emails: '',
    scheduled_date: '',
    validity_days: 7,
    time_limit: 60,
    job_id: ''
  });

  // Template Form State
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: 'technical',
    duration_minutes: 60,
    total_questions: 20,
    passing_score: 70,
    instructions: ''
  });

  useEffect(() => {
    loadTemplates();
    loadScheduledTests();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await api.get('/api/v1/tests/templates');
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadScheduledTests = async () => {
    try {
      const response = await api.get('/api/v1/tests/scheduled');
      setScheduledTests(response.data.tests || []);
    } catch (error) {
      console.error('Error loading scheduled tests:', error);
    }
  };

  const handleScheduleTest = async () => {
    if (!scheduleForm.template_id || !scheduleForm.candidate_emails || !scheduleForm.scheduled_date) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const candidateEmails = scheduleForm.candidate_emails.split(',').map(email => email.trim());
      
      const response = await api.post('/api/v1/tests/schedule', {
        ...scheduleForm,
        candidate_emails: candidateEmails
      });

      if (response.data.success) {
        alert(`Test scheduled for ${candidateEmails.length} candidate(s)`);
        setScheduleForm({
          template_id: '',
          candidate_emails: '',
          scheduled_date: '',
          validity_days: 7,
          time_limit: 60,
          job_id: ''
        });
        loadScheduledTests();

        if (sendMessage && isConnected) {
          sendMessage(`Scheduled ${templates.find(t => t.id.toString() === scheduleForm.template_id)?.name} test for ${candidateEmails.length} candidates`);
        }
      }
    } catch (error) {
      console.error('Error scheduling test:', error);
      alert('Failed to schedule test');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateForm.name || !templateForm.description) {
      alert('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/v1/tests/templates', templateForm);
      
      if (response.data.success) {
        alert('Test template created successfully');
        setTemplateForm({
          name: '',
          description: '',
          category: 'technical',
          duration_minutes: 60,
          total_questions: 20,
          passing_score: 70,
          instructions: ''
        });
        loadTemplates();
      }
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'started': return '#f59e0b';
      case 'scheduled': return '#3b82f6';
      case 'expired': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="test-scheduler">
      <div className="page-header">
        <h1>📝 Test Scheduler</h1>
        <p>Schedule and manage candidate assessments with Mettl integration</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          📅 Schedule Test
        </button>
        <button 
          className={`tab-button ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          📋 Templates
        </button>
        <button 
          className={`tab-button ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          📊 Results
        </button>
      </div>

      {/* Schedule Test Tab */}
      {activeTab === 'schedule' && (
        <div className="tab-content">
          <div className="form-card">
            <h3>Schedule New Test</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Test Template *</label>
                <select
                  value={scheduleForm.template_id}
                  onChange={(e) => setScheduleForm({...scheduleForm, template_id: e.target.value})}
                >
                  <option value="">Select a template</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.duration_minutes} min)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Candidate Emails *</label>
                <textarea
                  placeholder="Enter emails separated by commas"
                  value={scheduleForm.candidate_emails}
                  onChange={(e) => setScheduleForm({...scheduleForm, candidate_emails: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Scheduled Date *</label>
                <input
                  type="datetime-local"
                  value={scheduleForm.scheduled_date}
                  onChange={(e) => setScheduleForm({...scheduleForm, scheduled_date: e.target.value})}
                  min={getTomorrowDate()}
                />
              </div>

              <div className="form-group">
                <label>Validity (Days)</label>
                <input
                  type="number"
                  value={scheduleForm.validity_days}
                  onChange={(e) => setScheduleForm({...scheduleForm, validity_days: parseInt(e.target.value)})}
                  min="1"
                  max="30"
                />
              </div>

              <div className="form-group">
                <label>Time Limit (Minutes)</label>
                <input
                  type="number"
                  value={scheduleForm.time_limit}
                  onChange={(e) => setScheduleForm({...scheduleForm, time_limit: parseInt(e.target.value)})}
                  min="15"
                  max="180"
                />
              </div>

              <div className="form-group">
                <label>Job ID (Optional)</label>
                <input
                  type="text"
                  placeholder="Associated job ID"
                  value={scheduleForm.job_id}
                  onChange={(e) => setScheduleForm({...scheduleForm, job_id: e.target.value})}
                />
              </div>
            </div>

            <button 
              className="btn-primary"
              onClick={handleScheduleTest}
              disabled={loading}
            >
              {loading ? 'Scheduling...' : '📅 Schedule Test'}
            </button>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="tab-content">
          <div className="form-card">
            <h3>Create Test Template</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Template Name *</label>
                <input
                  type="text"
                  placeholder="e.g., JavaScript Developer Assessment"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  placeholder="Describe what this test evaluates"
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({...templateForm, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={templateForm.category}
                  onChange={(e) => setTemplateForm({...templateForm, category: e.target.value})}
                >
                  <option value="technical">Technical</option>
                  <option value="aptitude">Aptitude</option>
                  <option value="personality">Personality</option>
                  <option value="domain">Domain Specific</option>
                </select>
              </div>

              <div className="form-group">
                <label>Duration (Minutes)</label>
                <input
                  type="number"
                  value={templateForm.duration_minutes}
                  onChange={(e) => setTemplateForm({...templateForm, duration_minutes: parseInt(e.target.value)})}
                  min="15"
                  max="180"
                />
              </div>

              <div className="form-group">
                <label>Total Questions</label>
                <input
                  type="number"
                  value={templateForm.total_questions}
                  onChange={(e) => setTemplateForm({...templateForm, total_questions: parseInt(e.target.value)})}
                  min="5"
                  max="100"
                />
              </div>

              <div className="form-group">
                <label>Passing Score (%)</label>
                <input
                  type="number"
                  value={templateForm.passing_score}
                  onChange={(e) => setTemplateForm({...templateForm, passing_score: parseFloat(e.target.value)})}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div className="form-group full-width">
                <label>Instructions</label>
                <textarea
                  placeholder="Instructions for candidates taking this test"
                  value={templateForm.instructions}
                  onChange={(e) => setTemplateForm({...templateForm, instructions: e.target.value})}
                  rows={4}
                />
              </div>
            </div>

            <button 
              className="btn-primary"
              onClick={handleCreateTemplate}
              disabled={loading}
            >
              {loading ? 'Creating...' : '📋 Create Template'}
            </button>
          </div>

          {/* Existing Templates */}
          <div className="templates-list">
            <h3>Existing Templates</h3>
            <div className="templates-grid">
              {templates.map(template => (
                <div key={template.id} className="template-card">
                  <h4>{template.name}</h4>
                  <p>{template.description}</p>
                  <div className="template-meta">
                    <span className="category">{template.category}</span>
                    <span className="duration">{template.duration_minutes} min</span>
                    <span className="questions">{template.total_questions} questions</span>
                  </div>
                  <div className="template-actions">
                    <button className="btn-secondary">Edit</button>
                    <button className="btn-secondary">Duplicate</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <div className="tab-content">
          <div className="results-card">
            <h3>Scheduled Tests & Results</h3>
            
            <div className="results-table">
              <table>
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Test</th>
                    <th>Scheduled</th>
                    <th>Deadline</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledTests.map(test => (
                    <tr key={test.id}>
                      <td>{test.candidate_name}</td>
                      <td>{test.template_name}</td>
                      <td>{new Date(test.scheduled_date).toLocaleDateString()}</td>
                      <td>{new Date(test.deadline).toLocaleDateString()}</td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(test.status) }}
                        >
                          {test.status}
                        </span>
                      </td>
                      <td>{test.score ? `${test.score}%` : '-'}</td>
                      <td>
                        <button className="btn-small">View</button>
                        <button className="btn-small">Resend</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* <style jsx>{`
        .test-scheduler {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .page-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .page-header h1 {
          color: #1f2937;
          margin-bottom: 10px;
        }

        .tab-navigation {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
          border-bottom: 2px solid #e5e7eb;
        }

        .tab-button {
          padding: 12px 24px;
          background: transparent;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s;
        }

        .tab-button.active {
          border-bottom-color: #3b82f6;
          color: #3b82f6;
        }

        .tab-button:hover {
          background: #f8fafc;
        }

        .form-card, .results-card {
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          margin-bottom: 30px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          margin-bottom: 8px;
          font-weight: 600;
          color: #374151;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.3s;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .btn-primary {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(59, 130, 246, 0.3);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .templates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .template-card {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .template-card h4 {
          margin-bottom: 10px;
          color: #1f2937;
        }

        .template-meta {
          display: flex;
          gap: 10px;
          margin: 15px 0;
        }

        .template-meta span {
          background: #e5e7eb;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        .template-actions {
          display: flex;
          gap: 10px;
        }

        .btn-secondary, .btn-small {
          background: #6b7280;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .results-table {
          overflow-x: auto;
        }

        .results-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .results-table th,
        .results-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }

        .results-table th {
          background: #f8fafc;
          font-weight: 600;
        }

        .status-badge {
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          
          .tab-navigation {
            flex-direction: column;
          }
        }
      `}</style> */}
    </div>
  );
};

export default TestScheduler;
