import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../../lib/profileApi';
import { useAccountStore } from '../../store/accountStore';

export const useUserManagement = (onSuccess?: (message: string) => void) => {
  const queryClient = useQueryClient();
  const { setProfile } = useAccountStore();

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
    mutationFn: ({ userId, userType, entityId }: { userId: string; userType: number; entityId?: string }) => 
      profileApi.updateUserRole(userId, userType, entityId),
  });

  const updateUserRole = async (userId: string, userType: number, entityId?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      updateUserRoleMutation.mutate(
        { userId, userType, entityId },
        {
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
            
            // Show success message
            if (onSuccess) {
              onSuccess('User role updated successfully');
            }
            
            resolve();
          },
          onError: (error) => {
            console.error('Update user role failed:', error);
            reject(error);
          }
        }
      );
    });
  };

  const updateUserEntityMutation = useMutation({
    mutationFn: ({ userId, entityId }: { userId: string; entityId: string }) => 
      profileApi.updateUserEntity(userId, entityId),
  });

  const updateUserEntity = async (userId: string, entityId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      updateUserEntityMutation.mutate(
        { userId, entityId },
        {
          onSuccess: async () => {
            // Refetch profile data to update the users list
            try {
              const profileData = await profileApi.getProfile();
              setProfile(profileData);
            } catch (error) {
              console.error('Failed to refetch profile after entity update:', error);
            }
            
            // Invalidate and refetch profile query
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            
            // Show success message
            if (onSuccess) {
              onSuccess('User entity updated successfully');
            }
            
            resolve();
          },
          onError: (error) => {
            console.error('Update user entity failed:', error);
            reject(error);
          }
        }
      );
    });
  };

  return {
    deleteUser,
    isDeleting: deleteUserMutation.isPending,
    deleteError: deleteUserMutation.error,
    updateUserRole,
    updateRoleError: updateUserRoleMutation.error,
    updateUserEntity,
    updateEntityError: updateUserEntityMutation.error,
  };
}; 