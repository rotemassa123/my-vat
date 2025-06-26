import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';

@Injectable()
export class DatabaseInitializerService implements OnApplicationBootstrap {
    private readonly logger = new Logger(DatabaseInitializerService.name);

    constructor(private readonly dataSource: DataSource) {}

    async onApplicationBootstrap(): Promise<void> {
        if (!this.dataSource.isInitialized) {
            await this.dataSource.initialize();
        }

        // Run initialization logic
        await this.runInitScript();
    }

    private async runInitScript(): Promise<void> {
        this.logger.log('Running database initialization script...');
        const queryRunner = this.dataSource.createQueryRunner();

        try {
            await queryRunner.connect();

            const dbType = this.dataSource.options.type;

            if (dbType === 'mysql') {

                await queryRunner.manager.query(`
                    INSERT IGNORE INTO \`userTypes\` (\`userTypeId\`, \`name\`)
                VALUES 
                    (0, 'resident'),
                    (1, 'representative'),
                    (2, 'administration'),
                    (3, 'lawyer'),
                    (4, 'appraiser'),
                    (5, 'inspector'),
                    (6, 'entrepreneur');
                `);
            } else if (dbType === 'sqlite') {
                // SQLite-compatible SQL
                await queryRunner.manager.query(`
                    INSERT OR IGNORE INTO userTypes (userTypeId, name)
                    VALUES 
                        (0, 'resident'),
                        (1, 'representative'),
                        (2, 'administration'),
                        (3, 'lawyer'),
                        (4, 'appraiser'),
                        (5, 'inspector'),
                        (6, 'entrepreneur');
                `);
            } else {
                this.logger.warn(`Database type "${dbType}" is not supported for initialization.`);
            }

            this.logger.log('Database initialization completed successfully.');
        } catch (error) {
            this.logger.error('Database initialization failed:', error.message);
        } finally {
            await queryRunner.release();
        }
    }
}
