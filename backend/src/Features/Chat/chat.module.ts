import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatController } from './Controllers/chat.controller';
import { ChatService } from './Services/chat.service';
import { MCPQueryProcessor } from './Services/mcp-query-processor.service';
import { OpenAIService } from './Services/openai-assistant.service';
import { ThreadCacheService } from './Services/thread-cache.service';
import { UserProfileService } from './Services/user-profile.service';
import { ChatGateway } from './Gateways/chat.gateway';
import { InvoiceInfraModule } from '../Invoice/invoiceInfra.module';
import { InfraModule } from '../../Common/Infrastructure/infra.module';

@Module({
  imports: [
    ConfigModule,
    InvoiceInfraModule, // Provides IInvoiceRepository
    InfraModule, // Provides IProfileRepository
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    MCPQueryProcessor,
    OpenAIService,
    ThreadCacheService,
    UserProfileService,
    ChatGateway,
  ],
  exports: [ChatService, ThreadCacheService],
})
export class ChatModule {}
