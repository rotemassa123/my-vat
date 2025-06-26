import {CanActivate, ExecutionContext, Injectable, UnauthorizedException,} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {Request} from 'express';
import {ConfigService} from "@nestjs/config";

@Injectable()
export class AuthenticationGuard implements CanActivate {
    constructor(private jwtService: JwtService, private configService: ConfigService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {

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
