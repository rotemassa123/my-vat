import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isError?: boolean; // Optional error flag for styling
}

// LocalStorage helper for chat messages
const CHAT_STORAGE_KEY_PREFIX = 'chat_messages_';
const MAX_STORED_MESSAGES = 100; // Limit to prevent localStorage bloat

const getStorageKey = (userId: string): string => {
  return `${CHAT_STORAGE_KEY_PREFIX}${userId}`;
};

const saveMessagesToStorage = (userId: string, messages: ChatMessage[]): void => {
  try {
    // Only keep the last N messages to prevent storage bloat
    const messagesToSave = messages.slice(-MAX_STORED_MESSAGES);
    const serialized = messagesToSave.map(msg => ({
      ...msg,
      timestamp: msg.timestamp.toISOString(), // Convert Date to string for JSON
    }));
    localStorage.setItem(getStorageKey(userId), JSON.stringify(serialized));
  } catch (error) {
    console.error('Failed to save messages to localStorage:', error);
    // If storage is full, try to clear old messages
    try {
      const messagesToSave = messages.slice(-Math.floor(MAX_STORED_MESSAGES / 2));
      const serialized = messagesToSave.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(),
      }));
      localStorage.setItem(getStorageKey(userId), JSON.stringify(serialized));
    } catch (retryError) {
      console.error('Failed to save messages after retry:', retryError);
    }
  }
};

const loadMessagesFromStorage = (userId: string): ChatMessage[] => {
  try {
    const stored = localStorage.getItem(getStorageKey(userId));
    if (!stored) return [];
    
    const parsed = JSON.parse(stored) as Array<{
      id: string;
      content: string;
      isUser: boolean;
      timestamp: string; // ISO string
      isError?: boolean;
    }>;
    
    // Convert timestamp strings back to Date objects
    return parsed.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));
  } catch (error) {
    console.error('Failed to load messages from localStorage:', error);
    return [];
  }
};

const clearMessagesFromStorage = (userId: string): void => {
  try {
    localStorage.removeItem(getStorageKey(userId));
  } catch (error) {
    console.error('Failed to clear messages from localStorage:', error);
  }
};

interface UseChatWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  messages: ChatMessage[];
  sendMessage: (message: string) => void;
  isLoading: boolean;
  clearMessages: () => void;
}

// Export clearMessages function for external use
export const clearChatMessages = (userId: string): void => {
  clearMessagesFromStorage(userId);
};

export const useChatWebSocket = (userId: string): UseChatWebSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  // Load messages from localStorage on mount
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load messages from localStorage when userId changes
  useEffect(() => {
    if (userId && userId !== 'demo-user') {
      const storedMessages = loadMessagesFromStorage(userId);
      setMessages(storedMessages);
    } else {
      setMessages([]);
    }
  }, [userId]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (userId && userId !== 'demo-user' && messages.length > 0) {
      saveMessagesToStorage(userId, messages);
    }
  }, [messages, userId]);

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
        if (lastMessage && !lastMessage.isUser && lastMessage.id === data.messageId) {
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

  const clearMessages = useCallback(() => {
    setMessages([]);
    if (userId && userId !== 'demo-user') {
      clearMessagesFromStorage(userId);
    }
  }, [userId]);

  return { 
    socket, 
    isConnected, 
    messages, 
    sendMessage, 
    isLoading,
    clearMessages
  };
};
