import apiClient from './apiClient';

export interface SendInvitationRequest {
  emails: string[];
  entityId: string;
  role: 'admin' | 'member' | 'viewer';
  personalMessage?: string;
}

export interface InvitationResult {
  email: string;
  success: boolean;
  message: string;
  errorCode?: string;
  messageId?: string;
}

export interface SendInvitationResponse {
  totalProcessed: number;
  successful: number;
  failed: number;
  results: InvitationResult[];
}

// Invitation API functions
export const invitationApi = {
  // Send invitations
  sendInvitations: async (data: SendInvitationRequest): Promise<SendInvitationResponse> => {
    const response = await apiClient.post('/invitations/send', data);
    return response.data;
  },
}; 