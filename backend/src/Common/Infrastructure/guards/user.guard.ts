import {CanActivate, ExecutionContext, Injectable, UnauthorizedException,} from '@nestjs/common';
import {getDesiredFieldFromRequest} from "src/Common/Utils/authorization.utils";
import {ConfigService} from "@nestjs/config";
import * as httpContext from 'express-http-context';
import { UserContext } from '../types/user-context.type';

@Injectable()
export class UserGuard implements CanActivate {
    constructor(private readonly configService: ConfigService) {}
    async canActivate(context: ExecutionContext): Promise<boolean> {
        if (this.configService.get<string>('DISABLE_AUTH') === 'true') {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        try {
            const userId = Number(getDesiredFieldFromRequest(request, 'userId'));
            const userContext = httpContext.get('user_context') as UserContext | undefined;
            return userContext?.userId === userId?.toString();
        } catch (error) {
            throw new UnauthorizedException(error.message);
        }
    }
}
