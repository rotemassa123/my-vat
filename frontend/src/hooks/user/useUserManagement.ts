import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../../lib/profileApi';
import { useProfileStore } from '../../store/profileStore';

export const useUserManagement = () => {
  const queryClient = useQueryClient();
  const { setProfile } = useProfileStore();

  const deleteUserMutation = useMutation({
    mutationFn: profileApi.deleteUser,
    onSuccess: async () => {
      // Refetch profile data to update the users list
      try {
        const profileData = await profileApi.getProfile();
        setProfile(profileData);
      } catch (error) {
        console.error('Failed to refetch profile after user deletion:', error);
      }
      
      // Invalidate and refetch profile query
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: Error) => {
      console.error('Delete user failed:', error);
    },
  });

  const deleteUser = (userId: string) => {
    deleteUserMutation.mutate(userId);
  };

  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, userType }: { userId: string; userType: number }) => 
      profileApi.updateUserRole(userId, userType),
    onSuccess: async () => {
      // Refetch profile data to update the users list
      try {
        const profileData = await profileApi.getProfile();
        setProfile(profileData);
      } catch (error) {
        console.error('Failed to refetch profile after role update:', error);
      }
      
      // Invalidate and refetch profile query
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: Error) => {
      console.error('Update user role failed:', error);
    },
  });

  const updateUserRole = (userId: string, userType: number) => {
    updateUserRoleMutation.mutate({ userId, userType });
  };

  return {
    deleteUser,
    isDeleting: deleteUserMutation.isPending,
    deleteError: deleteUserMutation.error,
    updateUserRole,
    isUpdatingRole: updateUserRoleMutation.isPending,
    updateRoleError: updateUserRoleMutation.error,
  };
}; 