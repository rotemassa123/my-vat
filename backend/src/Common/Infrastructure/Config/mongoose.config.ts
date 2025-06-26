import { MongooseModuleOptions, MongooseOptionsFactory } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MongooseConfigService implements MongooseOptionsFactory {
    constructor(private configService: ConfigService) {}

    createMongooseOptions(): MongooseModuleOptions {
        return {
            uri: `mongodb://${this.configService.get<string>('DB_HOST')}:${this.configService.get<string>('DB_PORT')}/${this.configService.get<string>('DB_DATABASE')}`,
            user: this.configService.get<string>('DB_USERNAME'),
            pass: this.configService.get<string>('DB_PASSWORD'),
            authSource: this.configService.get<string>('DB_AUTH_SOURCE', 'admin'),
        };
    }
}
