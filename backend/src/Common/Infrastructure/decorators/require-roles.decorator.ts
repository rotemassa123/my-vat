import { applyDecorators, UseGuards } from '@nestjs/common';
import { UserType } from 'src/Common/consts/userType';
import { Roles } from './roles.decorator';
import { RolesGuard } from '../guards/roles.guard';

export const RequireRoles = (...roles: UserType[]) => {
  return applyDecorators(
    Roles(...roles),
    UseGuards(RolesGuard)
  );
}; 