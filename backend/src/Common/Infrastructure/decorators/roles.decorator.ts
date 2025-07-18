import { SetMetadata } from '@nestjs/common';
import { UserType } from 'src/Common/consts/userType';

export const Roles = (...roles: UserType[]) => SetMetadata('roles', roles); 