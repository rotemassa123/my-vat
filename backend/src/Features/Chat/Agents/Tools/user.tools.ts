import { tool } from '@openai/agents';
import { z } from 'zod';
import { IProfileRepository } from '../../../../Common/ApplicationCore/Services/IProfileRepository';

/**
 * Tool factory that creates user tools with injected repository
 */
export function createUserTools(profileRepository: IProfileRepository) {
  const getUsersTool = tool({
    name: 'get_users',
    description: 'Get all users for the current account. Returns a list of users with their details including name, email, role, and status.',
    parameters: z.object({}),
    async execute() {
      try {
        const users = await profileRepository.getUsersForAccount();
        
        return {
          users: users.map(user => ({
            id: user._id,
            full_name: user.full_name,
            email: user.email,
            user_type: user.role,
            status: user.status,
            entity_id: user.entityId,
            profile_image_url: user.profile_image_url,
            last_login_at: user.last_login_at,
          })),
          count: users.length,
        };
      } catch (error) {
        return {
          error: true,
          message: `Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    },
  });

  const getUserByIdTool = tool({
    name: 'get_user_by_id',
    description: 'Get a single user by their ID. Returns detailed user information including role and status.',
    parameters: z.object({
      user_id: z.string().describe('The ID of the user to retrieve'),
    }),
    async execute(input) {
      try {
        const user = await profileRepository.findUserById(input.user_id);
        
        if (!user) {
          return {
            error: true,
            message: `User with ID ${input.user_id} not found`,
          };
        }

        return {
          id: user._id,
          full_name: user.full_name,
          email: user.email,
          user_type: user.role,
          status: user.status,
          account_id: user.accountId,
          entity_id: user.entityId,
          profile_image_url: user.profile_image_url,
          last_login_at: user.last_login_at,
        };
      } catch (error) {
        return {
          error: true,
          message: `Failed to fetch user: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    },
  });

  return {
    getUsersTool,
    getUserByIdTool,
  };
}

