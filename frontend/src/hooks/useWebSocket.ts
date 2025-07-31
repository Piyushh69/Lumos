import { useState, useEffect, useRef, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  content: string;
  agent?: string;
  task_progress?: any;
}

interface UseWebSocketReturn {
  socket: WebSocket | null;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  sendMessage: (message: string) => void;
  messages: WebSocketMessage[];
  reconnect: () => void;
  lastActivity: Date | null;
}

export const useWebSocket = (userId: string): UseWebSocketReturn => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);

  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds
  const heartbeatInterval = 30000; // 30 seconds
  const idleTimeout = 300000; // 5 minutes

  const wsUrl = `${process.env.REACT_APP_WS_URL || 'ws://localhost:8000'}/ws/chat/${userId}`;

  const connect = useCallback(() => {
    if (socket?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    console.log('🔌 Connecting to WebSocket...');

    try {
      const newSocket = new WebSocket(wsUrl);

      newSocket.onopen = () => {
        console.log('✅ WebSocket connected');
        setSocket(newSocket);
        setIsConnected(true);
        setConnectionStatus('connected');
        setLastActivity(new Date());
        reconnectAttemptsRef.current = 0;

        // Start heartbeat
        startHeartbeat(newSocket);
      };

      newSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setMessages(prev => [...prev, data]);
          setLastActivity(new Date());
          console.log('📨 Message received:', data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      newSocket.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setSocket(null);
        setIsConnected(false);
        setConnectionStatus('disconnected');

        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }

        // Attempt reconnection if not a manual close
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          scheduleReconnect();
        }
      };

      newSocket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionStatus('disconnected');
      };

    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
      setConnectionStatus('disconnected');
      scheduleReconnect();
    }
  }, [wsUrl, socket]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log('❌ Max reconnection attempts reached');
      setConnectionStatus('disconnected');
      return;
    }

    reconnectAttemptsRef.current++;
    setConnectionStatus('reconnecting');

    console.log(`🔄 Scheduling reconnect attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts} in ${reconnectDelay}ms`);

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, reconnectDelay * reconnectAttemptsRef.current); // Exponential backoff
  }, [connect]);

  const startHeartbeat = useCallback((ws: WebSocket) => {
    heartbeatIntervalRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        // Send ping message
        ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        console.log('💓 Heartbeat sent');

        // Check for idle timeout
        const now = new Date();
        if (lastActivity && (now.getTime() - lastActivity.getTime()) > idleTimeout) {
          console.log('⏰ Connection idle for too long, refreshing...');
          ws.close(1000, 'Idle timeout');
          connect();
        }
      }
    }, heartbeatInterval);
  }, [lastActivity, connect]);

  const sendMessage = useCallback((message: string) => {
    if (socket?.readyState === WebSocket.OPEN) {
      const messageData = {
        message,
        timestamp: Date.now(),
        userId
      };
      socket.send(JSON.stringify(messageData));
      setLastActivity(new Date());
      console.log('📤 Message sent:', message);
    } else {
      console.warn('⚠️ WebSocket not connected, attempting to reconnect...');
      connect();
    }
  }, [socket, userId, connect]);

  const reconnect = useCallback(() => {
    console.log('🔄 Manual reconnection triggered');
    reconnectAttemptsRef.current = 0;

    // Close existing connection
    if (socket) {
      socket.close(1000, 'Manual reconnect');
    }

    // Clear timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    // Reconnect
    setTimeout(connect, 100);
  }, [socket, connect]);

  // Initialize connection
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (socket) {
        socket.close(1000, 'Component unmount');
      }
    };
  }, []);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected) {
        console.log('👁️ Page became visible, checking connection...');
        reconnect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isConnected, reconnect]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Network back online, reconnecting...');
      reconnect();
    };

    const handleOffline = () => {
      console.log('📵 Network offline');
      setConnectionStatus('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [reconnect]);

  return {
    socket,
    isConnected,
    connectionStatus,
    sendMessage,
    messages,
    reconnect,
    lastActivity
  };
};