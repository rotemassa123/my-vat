import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserType } from 'src/Common/consts/userType';
import {ConfigService} from "@nestjs/config";

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector, private configService: ConfigService) {}

    canActivate(context: ExecutionContext): boolean {

        if (this.configService.get<string>('DISABLE_AUTH') === 'true') {
            return true;
        }

        const requiredRoles: UserType[] = this.reflector.get<UserType[]>('roles', context.getHandler()) || [];
        const request = context.switchToHttp().getRequest();

        if (!requiredRoles.includes(request.user?.userType)) {
            throw new ForbiddenException("You do not have permission to access this resource.");
        }

        return true;
    }
}
