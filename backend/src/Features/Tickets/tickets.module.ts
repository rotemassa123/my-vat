import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TicketsController } from './Controllers/tickets.controller';
import { TicketsService } from './Services/tickets.service';
import { TicketsGateway } from './Gateways/tickets.gateway';
import { Ticket, TicketSchema } from 'src/Common/Infrastructure/DB/schemas/ticket.schema';
import { User, UserSchema } from 'src/Common/Infrastructure/DB/schemas/user.schema';
import { InfraModule } from 'src/Common/Infrastructure/infra.module';

@Module({
  imports: [
    InfraModule,
    MongooseModule.forFeature([
      { name: Ticket.name, schema: TicketSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [TicketsController],
  providers: [TicketsService, TicketsGateway],
  exports: [TicketsService, TicketsGateway],
})
export class TicketsModule {}

