import { MongooseModuleOptions, MongooseOptionsFactory } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MongooseConfigService implements MongooseOptionsFactory {
    constructor(private configService: ConfigService) {}

    createMongooseOptions(): MongooseModuleOptions {
        // Try to get full connection string first, fallback to building one
        const connectionString = this.configService.get<string>('MONGODB_URI') || 
            this.buildConnectionString();

        return {
            uri: connectionString,
            autoIndex: true,
        };
    }

    private buildConnectionString(): string {
        const host = this.configService.get<string>('DB_HOST', 'localhost');
        const port = this.configService.get<string>('DB_PORT', '27017');
        const database = this.configService.get<string>('DB_DATABASE', 'myvat');
        const username = this.configService.get<string>('DB_USERNAME');
        const password = this.configService.get<string>('DB_PASSWORD');
        const authSource = this.configService.get<string>('DB_AUTH_SOURCE', 'admin');

        // Build connection string with or without auth
        if (username && password) {
            return `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=${authSource}`;
        } else {
            return `mongodb://${host}:${port}/${database}`;
        }
    }
}
