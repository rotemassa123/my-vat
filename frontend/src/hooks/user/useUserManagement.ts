import { useMutation } from '@tanstack/react-query';
import { profileApi } from '../../lib/profileApi';
import { useAccountStore } from '../../store/accountStore';
import { UserRole } from '../../consts/userType';

export const useUserManagement = (onSuccess?: (message: string) => void) => {
  const { updateUser: updateUserInStore, removeUser } = useAccountStore();

  const deleteUserMutation = useMutation({
    mutationFn: profileApi.deleteUser,
  });

  const deleteUser = async (userId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      deleteUserMutation.mutate(userId, {
        onSuccess: () => {
          // Remove user directly from store
          removeUser(userId);
          
          // Show success message
          if (onSuccess) {
            onSuccess('User deleted successfully');
          }
          
          resolve();
        },
        onError: (error) => {
          console.error('Delete user failed:', error);
          reject(error);
        }
      });
    });
  };

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, userType, entityId }: { userId: string; userType?: UserRole; entityId?: string }) => {
      // If userType is provided, use the role endpoint (which can also handle entityId)
      if (userType !== undefined) {
        return profileApi.updateUserRole(userId, userType, entityId);
      }
      // If only entityId is provided, use the entity endpoint
      if (entityId) {
        return profileApi.updateUserEntity(userId, entityId);
      }
      throw new Error('Either userType or entityId must be provided');
    },
  });

  const updateUser = async (userId: string, options: { userType?: UserRole; entityId?: string }): Promise<void> => {
    return new Promise((resolve, reject) => {
      updateUserMutation.mutate(
        { userId, ...options },
        {
          onSuccess: (response) => {
            // Update user directly in store using the entire user object from response
            if (response.user) {
              updateUserInStore(userId, response.user);
            }
            
            // Show success message
            if (onSuccess) {
              const message = options.userType !== undefined 
                ? 'User role updated successfully'
                : 'User entity updated successfully';
              onSuccess(message);
            }
            
            resolve();
          },
          onError: (error) => {
            console.error('Update user failed:', error);
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
    updateUser,
    updateUserError: updateUserMutation.error,
  };
}; 