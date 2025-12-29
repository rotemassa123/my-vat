import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'src/Common/consts/userRole';
import { ConfigService } from "@nestjs/config";
import * as httpContext from 'express-http-context';
import { UserContext } from '../types/user-context.type';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector, private configService: ConfigService) {}

    canActivate(context: ExecutionContext): boolean {

        if (this.configService.get<string>('DISABLE_AUTH') === 'true') {
            return true;
        }

        const requiredRoles: UserRole[] = this.reflector.get<UserRole[]>('roles', context.getHandler()) || [];
        const userContext = httpContext.get('user_context') as UserContext | undefined;
        const userType = userContext?.userType;

        if ((!userType && userType !== UserRole.OPERATOR) || !requiredRoles.includes(userType)) {
            throw new ForbiddenException("You do not have permission to access this resource.");
        }

        return true;
    }
}
