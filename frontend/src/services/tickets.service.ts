import apiClient from '../lib/apiClient';

export interface Attachment {
  url: string;
  fileName: string;
}

export interface TicketMessage {
  content: string;
  senderId: string;
  senderType: 'user' | 'operator';
  attachments: Attachment[];
  createdAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  userId: string;
  handlerId?: string;
  handlerName?: string;
  status: 'open' | 'in_progress' | 'waiting' | 'closed';
  messages: TicketMessage[];
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketListResponse {
  tickets: Ticket[];
  total: number;
}

export interface CreateTicketRequest {
  title: string;
  content: string;
  attachments?: Attachment[];
}

export interface SendMessageRequest {
  content: string;
  attachments?: Attachment[];
}

export interface UpdateStatusRequest {
  status: 'open' | 'in_progress' | 'waiting' | 'closed';
}

export interface AssignTicketRequest {
  operatorId?: string;
}

export const ticketsApi = {
  createTicket: async (data: CreateTicketRequest): Promise<Ticket> => {
    const response = await apiClient.post<Ticket>('/tickets', data);
    return response.data;
  },

  getUserTickets: async (): Promise<TicketListResponse> => {
    const response = await apiClient.get<TicketListResponse>('/tickets');
    return response.data;
  },

  getTicketById: async (ticketId: string): Promise<Ticket> => {
    const response = await apiClient.get<Ticket>(`/tickets/${ticketId}`);
    return response.data;
  },

  sendMessage: async (ticketId: string, data: SendMessageRequest): Promise<TicketMessage> => {
    const response = await apiClient.post<TicketMessage>(`/tickets/${ticketId}/messages`, data);
    return response.data;
  },

  getUnhandledTickets: async (): Promise<TicketListResponse> => {
    const response = await apiClient.get<TicketListResponse>('/tickets/operator/unhandled');
    return response.data;
  },

  getAllTickets: async (): Promise<TicketListResponse> => {
    const response = await apiClient.get<TicketListResponse>('/tickets/operator/all');
    return response.data;
  },

  getTicketsAssignedToMe: async (): Promise<TicketListResponse> => {
    const response = await apiClient.get<TicketListResponse>('/tickets/operator/assigned-to-me');
    return response.data;
  },

  assignTicket: async (ticketId: string, data?: AssignTicketRequest): Promise<Ticket> => {
    const response = await apiClient.put<Ticket>(`/tickets/${ticketId}/assign`, data || {});
    return response.data;
  },

  unassignTicket: async (ticketId: string): Promise<Ticket> => {
    const response = await apiClient.put<Ticket>(`/tickets/${ticketId}/unassign`, {});
    return response.data;
  },

  updateTicketStatus: async (ticketId: string, data: UpdateStatusRequest): Promise<Ticket> => {
    const response = await apiClient.put<Ticket>(`/tickets/${ticketId}/status`, data);
    return response.data;
  },
};

