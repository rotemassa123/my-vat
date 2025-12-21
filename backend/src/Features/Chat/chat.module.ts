import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatController } from './Controllers/chat.controller';
import { ChatService } from './Services/chat.service';
import { MessageRepository } from './Repositories/message.repository';
import { AgentGateway } from './Agents/agent.gateway';
import { InvoiceInfraModule } from '../Invoice/invoiceInfra.module';
import { InfraModule } from '../../Common/Infrastructure/infra.module';

@Module({
  imports: [
    ConfigModule,
    InvoiceInfraModule, // Provides IInvoiceRepository
    InfraModule, // Provides IProfileRepository and MongooseModule (for Conversation, Message models)
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    MessageRepository,
    AgentGateway,
  ],
  exports: [ChatService],
})
export class ChatModule {}
