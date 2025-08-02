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

export interface ValidateInvitationRequest {
  email: string;
  accountId: string;
  role: string;
  entityId?: string;
}

export interface ValidateInvitationTokenRequest {
  token: string;
}

export interface ValidateInvitationResponse {
  isValid: boolean;
  user?: {
    _id: string;
    fullName: string;
    email: string;
    userType: number;
    status: string;
  };
  account?: {
    _id: string;
    company_name: string;
    account_type: string;
  };
  entity?: {
    _id: string;
    name: string;
  };
  inviter?: {
    fullName: string;
  };
  error?: string;
}

export interface CompleteSignupRequest {
  email: string;
  fullName: string;
  password: string;
  phone?: string;
  profile_image_url?: string;
}

export interface CompleteSignupResponse {
  success: boolean;
  user: {
    _id: string;
    fullName: string;
    email: string;
    userType: number;
    accountId: string;
    entityId?: string;
    status: string;
  };
  message: string;
}

// Invitation API functions
export const invitationApi = {
  // Send invitations
  sendInvitations: async (data: SendInvitationRequest): Promise<SendInvitationResponse> => {
    const response = await apiClient.post('/invitations/send', data);
    return response.data;
  },

  // Validate invitation (legacy - for backward compatibility)
  validateInvitation: async (data: ValidateInvitationRequest): Promise<ValidateInvitationResponse> => {
    const response = await apiClient.post('/invitations/validate', data);
    return response.data;
  },

  // Validate invitation token (new secure method)
  validateInvitationToken: async (data: ValidateInvitationTokenRequest): Promise<ValidateInvitationResponse> => {
    const response = await apiClient.post('/invitations/validate-token', data);
    return response.data;
  },

  // Complete signup
  completeSignup: async (data: CompleteSignupRequest): Promise<CompleteSignupResponse> => {
    const response = await apiClient.post('/invitations/complete-signup', data);
    return response.data;
  },
}; 