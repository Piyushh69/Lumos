import React from 'react';

interface TravelDashboardProps {
  socket: WebSocket | null;
  sendMessage: (message: string) => void;
  isConnected: boolean;
}

const TravelDashboard: React.FC<TravelDashboardProps> = ({ socket, sendMessage, isConnected }) => {
  return (
    <div>
      <h2 style={{marginBottom: '12px'}}>Travel Dashboard</h2>
      <p>AI-powered travel management and insights</p>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">3</div>
          <div className="stat-label">Active Travel Requests</div>
          <div className="stat-change">+2 this week</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">₹45,000</div>
          <div className="stat-label">Travel Budget Used</div>
          <div className="stat-change">65% of monthly budget</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">8</div>
          <div className="stat-label">Flights Booked</div>
          <div className="stat-change">+3 from last month</div>
        </div>
      </div>
      
      <div style={{marginTop: '30px'}}>
        <h3>Recent Travel Requests</h3>
        <div className="action-card">
          <p><strong>Interview Travel - Delhi to Mumbai</strong></p>
          <p style={{color: '#666', fontSize: '0.9rem'}}>Status: Approved | Date: June 15, 2025</p>
          <button className="btn btn-primary" style={{marginTop: '10px'}}>
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default TravelDashboard;