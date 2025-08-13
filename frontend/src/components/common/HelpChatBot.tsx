import React, { useState, useRef, useEffect } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import api from '../../services/api';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  actions?: Array<{
    label: string;
    action: 'navigate' | 'external';
    target: string;
  }>;
}

interface HelpChatBotProps {
  currentPage?: string;
  userRole?: string;
}

const HelpChatBot: React.FC<HelpChatBotProps> = ({ currentPage, userRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { sendMessage: sendWebSocketMessage, isConnected } = useWebSocket('help-bot');

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Send welcome message
      const welcomeMessage: ChatMessage = {
        id: generateId(),
        type: 'bot',
        content: `👋 Hi! I'm Mini, your NaviHire assistant. I can help you with:
        
• Navigate to any feature in the portal
• Explain how to use specific tools
• Answer questions about HR and travel management
• Guide you through workflows

What would you like help with today?`,
        timestamp: new Date(),
        actions: [
          { label: '📄 Resume Upload Help', action: 'navigate', target: '/resume-upload' },
          { label: '📧 Email Automation', action: 'navigate', target: '/email-automation' },
          { label: '📝 Test Scheduler', action: 'navigate', target: '/test-scheduler' }
        ]
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Send to help bot API
      const response = await api.post('/api/v1/help-bot/chat', {
        message: inputMessage,
        context: {
          currentPage,
          userRole,
          previousMessages: messages.slice(-5) // Last 5 messages for context
        }
      });

      const botResponse: ChatMessage = {
        id: generateId(),
        type: 'bot',
        content: response.data.response,
        timestamp: new Date(),
        actions: response.data.actions || []
      };

      setMessages(prev => [...prev, botResponse]);

      // Send to WebSocket for real-time updates
      if (isConnected && sendWebSocketMessage) {
        sendWebSocketMessage(`Help bot interaction: ${inputMessage}`);
      }

    } catch (error) {
      const errorMessage: ChatMessage = {
        id: generateId(),
        type: 'bot',
        content: 'Sorry, I encountered an error. Please try again or contact support.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAction = (action: { label: string; action: 'navigate' | 'external'; target: string }) => {
    if (action.action === 'navigate') {
      window.location.href = action.target;
    } else if (action.action === 'external') {
      window.open(action.target, '_blank');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <>
      {/* Chat Bot Button */}
      <div className={`chat-bot-button ${isOpen ? 'active' : ''}`} onClick={toggleChat}>
        {isOpen ? '✕' : '💬'}
        <div className="help-text">Need Help?</div>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className={`chat-window ${isMinimized ? 'minimized' : ''}`}>
          <div className="chat-header">
            <div className="header-info">
              <div className="bot-avatar">🌸</div>
              <div className="bot-details">
                <h4>NaviHire Assistant</h4>
                <span className="status">Online</span>
              </div>
            </div>
            <div className="header-actions">
              <button onClick={() => setIsMinimized(!isMinimized)}>
                {isMinimized ? '🔼' : '🔽'}
              </button>
              <button onClick={() => setIsOpen(false)}>✕</button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div className="chat-messages">
                {messages.map((message) => (
                  <div key={message.id} className={`message ${message.type}`}>
                    <div className="message-content">
                      <pre>{message.content}</pre>
                      {message.actions && message.actions.length > 0 && (
                        <div className="message-actions">
                          {message.actions.map((action, index) => (
                            <button
                              key={index}
                              className="action-button"
                              onClick={() => handleAction(action)}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="message-time">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="message bot typing">
                    <div className="message-content">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-input">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask me anything about NaviHire..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isTyping}
                />
                <button onClick={handleSendMessage} disabled={isTyping || !inputMessage.trim()}>
                  📤
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        .chat-bot-button {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          transition: all 0.3s ease;
          z-index: 1000;
          font-size: 24px;
          color: white;
        }

        .chat-bot-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        }

        .chat-bot-button.active {
          background: #ef4444;
        }

        .help-text {
          position: absolute;
          right: 70px;
          top: 50%;
          transform: translateY(-50%);
          background: #1f2937;
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 14px;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .chat-bot-button:hover .help-text {
          opacity: 1;
        }

        .chat-window {
          position: fixed;
          bottom: 100px;
          right: 20px;
          width: 380px;
          height: 500px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          z-index: 999;
          animation: slideUp 0.3s ease;
        }

        .chat-window.minimized {
          height: 60px;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border-radius: 12px 12px 0 0;
        }

        .header-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .bot-avatar {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .bot-details h4 {
          margin: 0;
          font-size: 16px;
        }

        .status {
          font-size: 12px;
          opacity: 0.8;
        }

        .header-actions {
          display: flex;
          gap: 5px;
        }

        .header-actions button {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          padding: 5px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .header-actions button:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .chat-messages {
          flex: 1;
          padding: 15px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .message {
          display: flex;
          flex-direction: column;
          max-width: 80%;
        }

        .message.user {
          align-self: flex-end;
        }

        .message.bot {
          align-self: flex-start;
        }

        .message-content {
          padding: 12px 16px;
          border-radius: 18px;
          word-wrap: break-word;
        }

        .message.user .message-content {
          background: #3b82f6;
          color: white;
        }

        .message.bot .message-content {
          background: #f3f4f6;
          color: #1f2937;
        }

        .message-content pre {
          white-space: pre-wrap;
          margin: 0;
          font-family: inherit;
        }

        .message-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }

        .action-button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 12px;
          transition: background-color 0.3s;
        }

        .action-button:hover {
          background: #2563eb;
        }

        .message-time {
          font-size: 10px;
          color: #6b7280;
          margin-top: 4px;
          align-self: flex-end;
        }

        .message.bot .message-time {
          align-self: flex-start;
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 8px 0;
        }

        .typing-indicator span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #6b7280;
          animation: typing 1.4s infinite ease-in-out;
        }

        .typing-indicator span:nth-child(1) {
          animation-delay: -0.32s;
        }

        .typing-indicator span:nth-child(2) {
          animation-delay: -0.16s;
        }

        @keyframes typing {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .chat-input {
          display: flex;
          padding: 15px;
          border-top: 1px solid #e5e7eb;
          gap: 10px;
        }

        .chat-input input {
          flex: 1;
          padding: 10px 15px;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          outline: none;
          font-size: 14px;
        }

        .chat-input input:focus {
          border-color: #3b82f6;
        }

        .chat-input button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 50%;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .chat-input button:hover:not(:disabled) {
          background: #2563eb;
        }

        .chat-input button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .chat-window {
            width: calc(100vw - 40px);
            right: 20px;
            left: 20px;
            bottom: 100px;
          }
        }
      `}</style>
    </>
  );
};

export default HelpChatBot;