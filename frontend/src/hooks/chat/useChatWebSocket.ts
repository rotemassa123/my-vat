import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isError?: boolean; // Optional error flag for styling
}

interface UseChatWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  messages: ChatMessage[];
  sendMessage: (message: string) => void;
  isLoading: boolean;
}

export const useChatWebSocket = (userId: string): UseChatWebSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log('Attempting to connect to WebSocket...');
    const newSocket = io(`${import.meta.env.VITE_WS_URL || 'http://localhost:8000'}/chat`, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    // Join with userId for proper thread management
    newSocket.emit('join-chat', { userId });
    
    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('✅ Connected to chat server');
    });
    
    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('❌ Disconnected from chat server');
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      setIsConnected(false);
    });
    
    newSocket.on('ai-response-chunk', (data: { messageId: string; chunk: string; isStreaming: boolean }) => {
      // Update the last AI message with the new chunk
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && !lastMessage.isUser) {
          // Update existing AI message
          return prev.map((msg, index) => 
            index === prev.length - 1 
              ? { ...msg, content: msg.content + data.chunk }
              : msg
          );
        } else {
          // Create new AI message
          const newMessage: ChatMessage = {
            id: data.messageId,
            content: data.chunk,
            isUser: false,
            timestamp: new Date(),
          };
          return [...prev, newMessage];
        }
      });
    });
    
    newSocket.on('ai-response-complete', (data: { messageId: string; isStreaming: boolean }) => {
      setIsLoading(false);
    });
    
    newSocket.on('ai-response-error', (data: { messageId: string; error: string; isStreaming: boolean }) => {
      setIsLoading(false);
      // Add error message with special styling
      const errorMessage: ChatMessage = {
        id: data.messageId || Date.now().toString(),
        content: `❌ ${data.error}`,
        isUser: false,
        timestamp: new Date(),
        isError: true, // Add error flag for styling
      };
      setMessages(prev => [...prev, errorMessage]);
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.close();
    };
  }, [userId]);

  const sendMessage = useCallback((message: string) => {
    if (socket && message.trim()) {
      // Add user message to local state immediately
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content: message,
        isUser: true,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);
      
      // Send message to backend
      socket.emit('send-message', { message, userId });
    }
  }, [socket, userId]);

  return { 
    socket, 
    isConnected, 
    messages, 
    sendMessage, 
    isLoading 
  };
};
