import { applyDecorators, UseGuards } from '@nestjs/common';
import { UserRole } from 'src/Common/consts/userRole';
import { Roles } from './roles.decorator';
import { RolesGuard } from '../guards/roles.guard';

export const RequireRoles = (...roles: UserRole[]) => {
  return applyDecorators(
    Roles(...roles),
    UseGuards(RolesGuard)
  );
}; 