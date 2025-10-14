import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { invitationApi, type SendInvitationRequest, type SendInvitationResponse, type ValidateInvitationRequest, type ValidateInvitationResponse, type CompleteSignupRequest, type CompleteSignupResponse } from '../../lib/invitationApi';
import { profileApi } from '../../lib/profileApi';
import { useAccountStore } from '../../store/accountStore';
import { type User } from '../../types/user';

export const useInviteUsers = () => {
  const queryClient = useQueryClient();
  const { setProfile, users: currentUsers } = useAccountStore();

  const { mutateAsync, isPending, isError, error, data } = useMutation<
    SendInvitationResponse,
    Error,
    SendInvitationRequest
  >({
    mutationFn: async (data: SendInvitationRequest) => {
      return invitationApi.sendInvitations(data);
    },
    onSuccess: async (response, variables) => {
      // Optionally invalidate user-related queries
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Add invited users to the client-side list immediately
      const invitedUsers: User[] = response.results
        .filter(result => result.success)
        .map(result => ({
          _id: `pending-${Date.now()}-${Math.random()}`, // Temporary ID
          fullName: 'Pending User',
          email: result.email,
          userType: variables.role === 'admin' ? 1 : variables.role === 'member' ? 2 : 3,
          status: 'pending',
          accountId: '', // Will be filled when user completes signup
          entityId: variables.entityId || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

      // Add the invited users to the current users list
      const updatedUsers = [...(currentUsers || []), ...invitedUsers];
      
      // Update the profile store with the new users
      try {
        const profileData = await profileApi.getProfile();
        setProfile(profileData);
        console.log('Profile refreshed after invitation sent');
      } catch (error) {
        console.error('Failed to refresh profile after invitation:', error);
        // Fallback: update with client-side data
        const currentProfile = useAccountStore.getState();
        setProfile({
          account: currentProfile.account || undefined,
          entities: currentProfile.entities,
          users: updatedUsers,
        });
      }
      
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

export const useValidateInvitationToken = (token?: string) => {
  return useQuery<ValidateInvitationResponse, Error>({
    queryKey: ['validate-invitation-token', token],
    queryFn: () => invitationApi.validateInvitationToken({ token: token! }),
    enabled: !!token,
    retry: false, // Don't retry failed invitation validations
    staleTime: 0, // Always refetch when component mounts
  });
};

export const useCompleteSignup = () => {
  const queryClient = useQueryClient();
  const { setProfile } = useAccountStore();

  const { mutateAsync, isPending, isError, error, data } = useMutation<
    CompleteSignupResponse,
    Error,
    CompleteSignupRequest
  >({
    mutationFn: async (data: CompleteSignupRequest) => {
      return invitationApi.completeSignup(data);
    },
    onSuccess: async (response) => {
      console.log('Signup completed successfully:', response);
      // Optionally invalidate auth-related queries
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      
      // Refresh profile data to include the newly signed up user
      try {
        const profileData = await profileApi.getProfile();
        setProfile(profileData);
        console.log('Profile refreshed after signup completion');
      } catch (error) {
        console.error('Failed to refresh profile after signup:', error);
      }
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
