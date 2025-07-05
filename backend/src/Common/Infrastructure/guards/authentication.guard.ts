import {CanActivate, ExecutionContext, Injectable, UnauthorizedException,} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {Request} from 'express';
import {ConfigService} from "@nestjs/config";
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/publicEndpoint.decorator';

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
            
            request['jwt'] = jwt;
            request.user = jwt;

        } catch (error) {
            throw new UnauthorizedException(error.message);
        }
        return true;
    }

    private extractToken(request: Request): string | undefined {
        if (request.cookies && request.cookies.auth_token) {
            return request.cookies.auth_token;
        }
    }
}
