import React, { useState } from 'react';

interface FormData {
  jobTitle: string;
  department: string;
  location: string;
  experienceLevel: string;
  employmentType: string;
  keySkills: string;
  teamSize: string;
  reportingTo: string;
  salaryRange: string;
  urgency: string;
}

interface SavedJD {
  id: number;
  title: string;
  department: string;
  content: string;
  createdDate: string;
  status: string;
}

const JobDescriptionGenerator: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    jobTitle: '',
    department: '',
    location: '',
    experienceLevel: '',
    employmentType: '',
    keySkills: '',
    teamSize: '',
    reportingTo: '',
    salaryRange: '',
    urgency: 'medium'
  });

  const [generatedJD, setGeneratedJD] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedJDs, setSavedJDs] = useState<SavedJD[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const generateJobDescription = async () => {
    if (!formData.jobTitle || !formData.department) {
      alert('Please fill in at least Job Title and Department');
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      const mockJD = `
# ${formData.jobTitle}

## Company Overview
Join our innovative team at Navikenz India Pvt Ltd. 
Navikenz is an Artificial Intelligence (AI) focused IT Services company that helps Enterprises discover and implement Artificial Intelligence enabled solutions to improve business processes and supplant human effort with human intuition.

## Role Summary
We are seeking a talented ${formData.jobTitle} to join our ${formData.department} team. This is an excellent opportunity for a ${formData.experienceLevel} professional to make a significant impact.

## Key Responsibilities
• Lead and manage ${formData.teamSize || 'team'} members
• Develop and implement strategic initiatives for ${formData.department}
• Collaborate with cross-functional teams to achieve business objectives
• Drive innovation and continuous improvement processes
• ${formData.keySkills ? `Utilize expertise in ${formData.keySkills}` : 'Apply technical expertise to solve complex challenges'}

## Required Qualifications
• ${formData.experienceLevel || 'Relevant'} experience in relevant field
• Strong expertise in ${formData.keySkills || 'required technologies'}
• Excellent communication and leadership skills
• Bachelor's degree in relevant field
• Proven track record of delivering results

## Preferred Qualifications
• Advanced degree in relevant field
• Industry certifications
• Experience with agile methodologies
• Previous experience in ${formData.department} domain

## What We Offer
• Competitive salary range: ${formData.salaryRange || 'Competitive package'}
• Comprehensive health benefits
• Professional development opportunities
• Flexible work arrangements
• Stock options and performance bonuses

## Location & Work Arrangement
${formData.location || 'Location TBD'} - ${formData.employmentType || 'Full-time'}

*This position has ${formData.urgency} priority for filling.*
      `;
      
      setGeneratedJD(mockJD);
      setIsGenerating(false);
    }, 3000);
  };

  const saveJobDescription = () => {
    const newJD: SavedJD = {
      id: Date.now(),
      title: formData.jobTitle,
      department: formData.department,
      content: generatedJD,
      createdDate: new Date().toLocaleDateString(),
      status: 'draft'
    };
    
    setSavedJDs([...savedJDs, newJD]);
    alert('Job Description saved successfully!');
  };

  return (
    <div className="job-generator">
      <div className="page-header">
        <h1>🤖 AI Job Description Generator</h1>
        <p>Create compelling job descriptions in minutes with AI assistance</p>
      </div>

      <div className="generator-layout">
        {/* Input Form */}
        <div className="form-section">
          <h2>Job Requirements</h2>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Job Title *</label>
              <input
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleInputChange}
                placeholder="e.g., Senior Software Engineer"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Department *</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="">Select Department</option>
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="HR">Human Resources</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
              </select>
            </div>

            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Bangalore, Remote, Hybrid"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Experience Level</label>
              <select
                name="experienceLevel"
                value={formData.experienceLevel}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="">Select Experience</option>
                <option value="Entry Level (0-2 years)">Entry Level (0-2 years)</option>
                <option value="Mid Level (3-5 years)">Mid Level (3-5 years)</option>
                <option value="Senior Level (5-8 years)">Senior Level (5-8 years)</option>
                <option value="Lead Level (8+ years)">Lead Level (8+ years)</option>
                <option value="Executive Level">Executive Level</option>
              </select>
            </div>

            <div className="form-group">
              <label>Employment Type</label>
              <select
                name="employmentType"
                value={formData.employmentType}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="">Select Type</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            <div className="form-group">
              <label>Salary Range</label>
              <input
                type="text"
                name="salaryRange"
                value={formData.salaryRange}
                onChange={handleInputChange}
                placeholder="e.g., ₹12-18 LPA"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label>Key Skills Required</label>
            <textarea
              name="keySkills"
              value={formData.keySkills}
              onChange={handleInputChange}
              placeholder="e.g., React, Node.js, Python, AWS, Leadership, Communication"
              className="form-textarea"
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button
              className="btn btn-primary"
              onClick={generateJobDescription}
              disabled={isGenerating}
            >
              {isGenerating ? '🤖 Generating...' : '✨ Generate Job Description'}
            </button>
          </div>
        </div>

        {/* Generated Output */}
        <div className="output-section">
          <h2>Generated Job Description</h2>
          
          {isGenerating && (
            <div className="generating-indicator">
              <div className="spinner"></div>
              <p>AI is crafting your job description...</p>
            </div>
          )}

          {generatedJD && (
            <div className="generated-content">
              <div className="content-header">
                <h3>Preview</h3>
                <div className="content-actions">
                  <button className="btn btn-secondary" onClick={() => setGeneratedJD('')}>
                    🔄 Regenerate
                  </button>
                  <button className="btn btn-success" onClick={saveJobDescription}>
                    💾 Save JD
                  </button>
                </div>
              </div>
              
              <div className="jd-preview">
                <pre>{generatedJD}</pre>
              </div>
            </div>
          )}

          {!generatedJD && !isGenerating && (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>Ready to Generate</h3>
              <p>Fill in the job requirements and click "Generate Job Description" to create a comprehensive JD with AI assistance.</p>
            </div>
          )}
        </div>
      </div>

      {/* Saved Job Descriptions */}
      {savedJDs.length > 0 && (
        <div className="saved-jds">
          <h2>Saved Job Descriptions</h2>
          <div className="jd-list">
            {savedJDs.map((jd) => (
              <div key={jd.id} className="jd-card">
                <h3>{jd.title}</h3>
                <p>{jd.department} • {jd.createdDate}</p>
                <span className={`status ${jd.status}`}>{jd.status}</span>
                <div className="jd-actions">
                  <button className="btn btn-sm">Edit</button>
                  <button className="btn btn-sm btn-primary">Publish</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDescriptionGenerator;