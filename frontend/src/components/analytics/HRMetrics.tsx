import React from 'react';

interface HRMetricsProps {
  socket?: WebSocket | null;
  sendMessage?: (message: string) => void;
  isConnected?: boolean;
}

const HRMetrics: React.FC<HRMetricsProps> = ({ socket, sendMessage, isConnected }) => {
  return (
    <div className="hr-metrics">
      <h1>📊 HR Metrics</h1>
      <p>HR analytics and metrics dashboard coming soon...</p>
    </div>
  );
};

export default HRMetrics;