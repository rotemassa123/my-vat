import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invitationApi, type SendInvitationRequest, type SendInvitationResponse } from '../../lib/invitationApi';

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