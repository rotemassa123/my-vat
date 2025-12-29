import {CanActivate, ExecutionContext, Injectable, UnauthorizedException,} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {Request} from 'express';
import {ConfigService} from "@nestjs/config";
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/publicEndpoint.decorator';
import { UserRole } from '../../consts/userRole';
import * as httpContext from 'express-http-context';
import { UserContext } from '../types/user-context.type';

@Injectable()
export class AuthenticationGuard implements CanActivate {
    constructor(
      private jwtService: JwtService, 
      private configService: ConfigService,
      private reflector: Reflector
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        try {
            const request = context.switchToHttp().getRequest();
            const token = this.extractToken(request);

            if (!token) {
                throw new UnauthorizedException('un-authenticated');
            }

            const secret = this.configService.get<string>('JWT_SECRET');
            const jwt = await this.jwtService.verifyAsync(token, { secret });

            if (!jwt) {
                return false;
            }

            this.validateUserTypeConsistency(jwt);

            // Populate httpContext as a single object for downstream guards and interceptors
            const userContext: UserContext = {
                accountId: jwt.accountId,
                userId: jwt.userId,
                userType: jwt.userType,
                entityId: jwt.entityId,
                impersonatedBy: jwt.impersonatedBy,
            };
            httpContext.set('user_context', userContext);

        } catch (error) {
            throw new UnauthorizedException(error.message);
        }
        return true;
    }

    private validateUserTypeConsistency(jwt: any): void {
        const { userType, accountId, entityId } = jwt;
        
        // Operator: must NOT have accountId or entityId
        if (userType === UserRole.OPERATOR) {
            if (accountId || entityId) {
                throw new UnauthorizedException('Operator users cannot have account or entity associations');
            }
            return;
        }
        
        // Admin: must have accountId, must NOT have entityId
        if (userType === UserRole.ADMIN) {
            if (!accountId) {
                throw new UnauthorizedException('Admin users must have an account association');
            }
            if (entityId) {
                throw new UnauthorizedException('Admin users cannot have entity associations');
            }
            return;
        }
        
        // Member/Guest: must have both accountId and entityId
        if (userType === UserRole.MEMBER || userType === UserRole.VIEWER) {
            if (!accountId || !entityId) {
                throw new UnauthorizedException('Member/Guest users must have both account and entity associations');
            }
            return;
        }
        
        // Unknown user type
        throw new UnauthorizedException('Invalid user type');
    }

    private extractToken(request: Request): string | undefined {
        if (request.cookies && request.cookies.auth_token) {
            return request.cookies.auth_token;
        }
    }
}
