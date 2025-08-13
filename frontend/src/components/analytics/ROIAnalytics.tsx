import React from 'react';

interface ROIAnalyticsProps {
  socket?: WebSocket | null;
  sendMessage?: (message: string) => void;
  isConnected?: boolean;
}

const ROIAnalytics: React.FC<ROIAnalyticsProps> = ({ socket, sendMessage, isConnected }) => {
  return (
    <div className="roi-analytics">
      <h1>💰 ROI Analytics</h1>
      <p>Return on investment analytics coming soon...</p>
    </div>
  );
};

export default ROIAnalytics;