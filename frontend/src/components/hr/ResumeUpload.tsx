import React, { useState } from 'react';

const ResumeUpload: React.FC = () => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      setMessage('Please select files to upload');
      return;
    }

    setUploading(true);
    setMessage('');

    // Simulate upload
    setTimeout(() => {
      setUploading(false);
      setMessage(`Successfully uploaded ${files.length} resume(s)`);
      setFiles(null);
    }, 2000);
  };

  return (
    <div>
      <h2 style={{marginBottom: '20px'}}>Resume Upload & Analysis</h2>
      
      <div className="upload-area">
        <div className="upload-icon">📄</div>
        <h3>Drag & Drop Resumes Here</h3>
        <p>Or click to select files (PDF, DOC, DOCX)</p>
        <input 
          type="file" 
          multiple 
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          style={{marginTop: '15px'}}
        />
      </div>

      {files && files.length > 0 && (
        <div style={{margin: '20px 0'}}>
          <h4>Selected Files:</h4>
          <ul>
            {Array.from(files).map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}

      <button 
        className="btn btn-primary" 
        onClick={handleUpload}
        disabled={uploading}
        style={{marginTop: '20px'}}
      >
        {uploading ? 'Uploading...' : 'Upload & Analyze'}
      </button>

      {message && (
        <div className={`alert ${message.includes('Success') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;