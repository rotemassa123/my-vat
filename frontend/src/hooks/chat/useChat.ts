import { useEffect, useState, useCallback } from 'react';
import { chatApi } from '../../services/chat.service';
import type { ChatMessage as ChatMessageResponse } from '../../services/chat.service';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isError?: boolean;
}


interface UseChatReturn {
  isConnected: boolean;
  messages: ChatMessage[];
  sendMessage: (message: string) => void;
  isLoading: boolean;
  clearMessages: () => void;
  conversationId: string | null;
  loadConversation: (conversationId: string) => Promise<void>;
}

export const useChat = (conversationId?: string): UseChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true); // Always connected for HTTP
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationId || null);

  // Load messages when conversation ID changes
  const loadConversation = useCallback(async (convId: string) => {
    try {
      setIsLoading(true);
      const response = await chatApi.getConversationMessages(convId);
      
      const formattedMessages: ChatMessage[] = response.messages.map((msg: ChatMessageResponse) => ({
        id: msg.message_id,
        content: msg.content,
        isUser: msg.role === 'user' || msg.sender_type === 'user',
        timestamp: msg.created_at ? new Date(msg.created_at) : new Date(),
      }));
      
      setMessages(formattedMessages);
      setCurrentConversationId(convId);
    } catch (error: any) {
      console.error('Failed to load conversation:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    } else {
      setMessages([]);
      setCurrentConversationId(null);
    }
  }, [conversationId, loadConversation]);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return;

    // Add user message to local state immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      isUser: true,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Send message to backend via HTTP
      const response = await chatApi.sendMessage(message.trim(), currentConversationId || undefined);

      // Update conversation ID if this was a new conversation
      if (!currentConversationId && response.conversationId) {
        setCurrentConversationId(response.conversationId);
      }

      // Add AI response to messages
      const aiMessage: ChatMessage = {
        id: response.message.message_id,
        content: response.message.content,
        isUser: false,
        timestamp: response.message.created_at 
          ? new Date(response.message.created_at)
          : new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        content: `❌ Failed to send message: ${error.response?.data?.message || error.message || 'Unknown error'}`,
        isUser: false,
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, currentConversationId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
  }, []);

  return { 
    isConnected, 
    messages, 
    sendMessage, 
    isLoading,
    clearMessages,
    conversationId: currentConversationId,
    loadConversation,
  };
};

