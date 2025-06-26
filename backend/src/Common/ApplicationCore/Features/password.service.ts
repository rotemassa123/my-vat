import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PasswordService {
    private readonly passwordSecret: string;
    private readonly saltRounds: number;

    constructor(private readonly configService: ConfigService) {
        this.passwordSecret = this.configService.get<string>('PASSOWRD_HASH', '');
        this.saltRounds = Number(this.configService.get<number>('SALT_ROUNDS', 10, {infer: true}));
    }

    async hashPassword(password: string): Promise<string> {
        const passwordWithSecret = password + this.passwordSecret;
        return await bcrypt.hash(passwordWithSecret, this.saltRounds);
    }

    async comparePassword(password: string, hash: string): Promise<boolean> {
        const passwordWithSecret = password + this.passwordSecret;
        return await bcrypt.compare(passwordWithSecret, hash);
    }
}
