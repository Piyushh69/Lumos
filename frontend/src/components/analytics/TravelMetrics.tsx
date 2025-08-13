import React from 'react';

interface TravelMetricsProps {
  socket?: WebSocket | null;
  sendMessage?: (message: string) => void;
  isConnected?: boolean;
}

const TravelMetrics: React.FC<TravelMetricsProps> = ({ socket, sendMessage, isConnected }) => {
  return (
    <div className="travel-metrics">
      <h1>✈️ Travel Metrics</h1>
      <p>Travel analytics and cost optimization metrics coming soon...</p>
    </div>
  );
};

export default TravelMetrics;