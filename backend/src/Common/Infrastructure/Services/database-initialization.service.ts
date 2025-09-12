import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Account } from '../DB/schemas/account.schema';
import { Entity } from '../DB/schemas/entity.schema';
import { Invoice } from '../DB/schemas/invoice.schema';
import { Summary } from '../DB/schemas/summary.schema';
import { User } from '../DB/schemas/user.schema';
import { logger } from '../Config/Logger';

@Injectable()
export class DatabaseInitializationService implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Account.name) private readonly accountModel: Model<Account>,
    @InjectModel(Entity.name) private readonly entityModel: Model<Entity>,
    @InjectModel(Invoice.name) private readonly invoiceModel: Model<Invoice>,
    @InjectModel(Summary.name) private readonly summaryModel: Model<Summary>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  /**
   * Safely creates indexes for a model, handling conflicts gracefully
   * @param model The Mongoose model to create indexes for
   * @param modelName The name of the model for logging purposes
   */
  private async safeCreateIndexes(model: Model<any>, modelName: string): Promise<void> {
    try {
      await model.createIndexes();
      logger.info(`Successfully created indexes for ${modelName}`, 'DatabaseInitializationService');
    } catch (error: any) {
      // Handle index conflicts gracefully
      if (error.code === 86 || error.codeName === 'IndexKeySpecsConflict') {
        logger.warn(`Index conflict detected for ${modelName}, skipping index creation. Existing indexes will be used.`, 'DatabaseInitializationService');
        logger.debug(`Index conflict details: ${error.message}`, 'DatabaseInitializationService');
      } else {
        // Re-throw other errors as they might be more serious
        logger.error(`Failed to create indexes for ${modelName}: ${error.message}`, 'DatabaseInitializationService');
        throw error;
      }
    }
  }

  async onModuleInit() {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    
    if (nodeEnv === 'development') {
      logger.info('Running database initialization for development environment...', 'DatabaseInitializationService');
      
      // Create indexes safely for all models
      await this.safeCreateIndexes(this.accountModel, 'Account');
      await this.safeCreateIndexes(this.entityModel, 'Entity');
      await this.safeCreateIndexes(this.invoiceModel, 'Invoice');
      await this.safeCreateIndexes(this.summaryModel, 'Summary');
      await this.safeCreateIndexes(this.userModel, 'User');
      
      logger.info('Database initialization complete.', 'DatabaseInitializationService');
    }
  }
} 