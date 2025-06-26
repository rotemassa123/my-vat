import { JwtModuleOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export const jwtModuleOptionsFactory = {
    useFactory: (configService: ConfigService): JwtModuleOptions => ({
        global: true,
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
            expiresIn: '4h',
        },
    }),
    inject: [ConfigService],  // Inject ConfigService
};
