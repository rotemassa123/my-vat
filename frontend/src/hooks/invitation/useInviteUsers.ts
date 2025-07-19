import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { invitationApi, type SendInvitationRequest, type SendInvitationResponse, type ValidateInvitationRequest, type ValidateInvitationResponse, type CompleteSignupRequest, type CompleteSignupResponse } from '../../lib/invitationApi';

export const useInviteUsers = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error, data } = useMutation<
    SendInvitationResponse,
    Error,
    SendInvitationRequest
  >({
    mutationFn: async (data: SendInvitationRequest) => {
      return invitationApi.sendInvitations(data);
    },
    onSuccess: (response) => {
      // Optionally invalidate user-related queries
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      console.log('Invitations sent successfully:', response);
    },
    onError: (error) => {
      console.error('Failed to send invitations:', error);
    },
  });

  const sendInvitations = async (data: SendInvitationRequest) => {
    return await mutateAsync(data);
  };

  return {
    sendInvitations,
    isLoading: isPending,
    isError,
    error,
    data,
  };
};

export const useValidateInvitation = (invitationData?: ValidateInvitationRequest) => {
  return useQuery<ValidateInvitationResponse, Error>({
    queryKey: ['validate-invitation', invitationData],
    queryFn: () => invitationApi.validateInvitation(invitationData!),
    enabled: !!invitationData,
    retry: false, // Don't retry failed invitation validations
    staleTime: 0, // Always refetch when component mounts
  });
};

export const useCompleteSignup = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error, data } = useMutation<
    CompleteSignupResponse,
    Error,
    CompleteSignupRequest
  >({
    mutationFn: async (data: CompleteSignupRequest) => {
      return invitationApi.completeSignup(data);
    },
    onSuccess: (response) => {
      console.log('Signup completed successfully:', response);
      // Optionally invalidate auth-related queries
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    onError: (error) => {
      console.error('Failed to complete signup:', error);
    },
  });

  const completeSignup = async (data: CompleteSignupRequest) => {
    return await mutateAsync(data);
  };

  return {
    completeSignup,
    isLoading: isPending,
    isError,
    error,
    data,
  };
}; 