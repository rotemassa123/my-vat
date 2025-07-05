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

  async onModuleInit() {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    
    if (nodeEnv === 'development') {
      logger.info('Running database initialization for development environment...', 'DatabaseInitializationService');
      await this.accountModel.createIndexes();
      await this.entityModel.createIndexes();
      await this.invoiceModel.createIndexes();
      await this.summaryModel.createIndexes();
      await this.userModel.createIndexes();
      logger.info('Database initialization complete.', 'DatabaseInitializationService');
    }
  }
} 