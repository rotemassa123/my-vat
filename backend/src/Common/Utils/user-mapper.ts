import { UserData } from '../ApplicationCore/Services/IProfileRepository';
import { UserResponse } from '../../Features/Profile/Responses/profile.responses';
import { roleToUserType } from './role-converter';

/**
 * Maps UserData (internal) to UserResponse (API)
 */
export function mapUserDataToResponse(user: UserData): UserResponse {
  return {
    _id: user._id,
    fullName: user.full_name,
    email: user.email,
    userType: roleToUserType(user.role),
    accountId: user.accountId,
    entityId: user.entityId,
    status: user.status,
    last_login: user.last_login_at,
    profile_image_url: user.profile_image_url,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

