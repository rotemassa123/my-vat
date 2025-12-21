import apiClient from '../lib/apiClient';

export interface Conversation {
  id: string;
  title?: string;
  lastMessageAt?: string;
  messageCount: number;
  createdAt: string;
}

export interface ChatMessage {
  message_id: string;
  content: string;
  role: string;
  sender_type?: string;
  created_at?: string;
}

export const chatApi = {
  // Create new conversation
  createConversation: async (): Promise<{ conversationId: string }> => {
    const response = await apiClient.post<{ conversationId: string }>('/chat/conversations');
    return response.data;
  },

  // List conversations
  listConversations: async (limit?: number): Promise<{ conversations: Conversation[] }> => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await apiClient.get<{ conversations: Conversation[] }>(`/chat/conversations${params}`);
    return response.data;
  },

  // Get messages for a conversation
  getConversationMessages: async (conversationId: string): Promise<{ messages: ChatMessage[] }> => {
    const response = await apiClient.get<{ messages: ChatMessage[] }>(`/chat/conversations/${conversationId}/messages`);
    return response.data;
  },

  // Send message
  sendMessage: async (message: string, conversationId?: string): Promise<{ message: ChatMessage; conversationId: string }> => {
    const response = await apiClient.post<{ message: ChatMessage; conversationId: string }>('/chat/message', {
      message,
      conversationId,
    });
    return response.data;
  },
};

