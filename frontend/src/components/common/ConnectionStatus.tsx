import React from 'react';

interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  onReconnect: () => void;
  lastActivity: Date | null;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  status, 
  onReconnect, 
  lastActivity 
}) => {
  const getStatusInfo = () => {
    switch (status) {
      case 'connected':
        return {
          text: 'Connected',
          color: '#10b981',
          showReconnect: false
        };
      case 'connecting':
        return {
          text: 'Connecting...',
          color: '#f59e0b',
          showReconnect: false
        };
      case 'reconnecting':
        return {
          text: 'Reconnecting...',
          color: '#f59e0b',
          showReconnect: false
        };
      case 'disconnected':
        return {
          text: 'Disconnected',
          color: '#ef4444',
          showReconnect: true
        };
      default:
        return {
          text: 'Unknown',
          color: '#6b7280',
          showReconnect: true
        };
    }
  };

  const statusInfo = getStatusInfo();
  const lastActivityText = lastActivity 
    ? `Last activity: ${lastActivity.toLocaleTimeString()}`
    : 'No activity';

  return (
    <div className="connection-status">
      <div className="status-indicator">
        {/* <span className="status-icon">{statusInfo.icon}</span> */}
        <span 
          className="status-text"
          style={{ color: statusInfo.color }}
        >
          {statusInfo.text}
        </span>
        {statusInfo.showReconnect && (
          <button 
            className="reconnect-button"
            onClick={onReconnect}
            title="Click to reconnect"
          >
            Reconnect
          </button>
        )}
      </div>
      <div className="last-activity" title={lastActivityText}>
        {lastActivity && (
          <small>{lastActivityText}</small>
        )}
      </div>

      {/* <style jsx>{`
        .connection-status {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: #f8fafc;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          font-size: 14px;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-icon {
          font-size: 12px;
        }

        .status-text {
          font-weight: 500;
        }

        .reconnect-button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .reconnect-button:hover {
          background: #2563eb;
        }

        .last-activity {
          color: #6b7280;
          font-size: 12px;
        }

        @media (max-width: 768px) {
          .connection-status {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
        }
      `}</style> */}
    </div>
  );
};

export default ConnectionStatus;