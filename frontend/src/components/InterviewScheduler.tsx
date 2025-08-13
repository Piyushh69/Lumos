import React, { useState } from 'react';

interface InterviewSchedulerProps {
  socket: WebSocket | null;
  sendMessage: (message: string) => void;
  isConnected: boolean;
}

const InterviewScheduler: React.FC<InterviewSchedulerProps> = ({ socket, sendMessage, isConnected }) => {
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');

  const scheduleInterview = () => {
    if (!selectedCandidate || !interviewDate || !interviewTime) {
      alert('Please fill all fields');
      return;
    }
    
    alert(`Interview scheduled for ${selectedCandidate} on ${interviewDate} at ${interviewTime}`);
  };

  return (
    <div>
      <h2 style={{marginBottom: '12px'}}>Interview Scheduler</h2>
      <p>Schedule and manage candidate interviews</p>
      
      <div className="form-grid">
        <div className="form-group">
          <label>Candidate</label>
          <select
            value={selectedCandidate}
            onChange={(e) => setSelectedCandidate(e.target.value)}
            className="form-input"
          >
            <option value="">Select Candidate</option>
            <option value="John Doe">John Doe</option>
            <option value="Jane Smith">Jane Smith</option>
            <option value="Mike Johnson">Mike Johnson</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            value={interviewDate}
            onChange={(e) => setInterviewDate(e.target.value)}
            className="form-input"
          />
        </div>
        
        <div className="form-group">
          <label>Time</label>
          <input
            type="time"
            value={interviewTime}
            onChange={(e) => setInterviewTime(e.target.value)}
            className="form-input"
          />
        </div>
      </div>
      
      <button className="btn btn-primary" onClick={scheduleInterview}>
        Schedule Interview
      </button>
    </div>
  );
};

export default InterviewScheduler;