import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Widget, WidgetSchema } from 'src/Common/Infrastructure/DB/schemas/widget.schema';
import { Invoice, InvoiceSchema } from 'src/Common/Infrastructure/DB/schemas/invoice.schema';
import { Summary, SummarySchema } from 'src/Common/Infrastructure/DB/schemas/summary.schema';
import { Entity, EntitySchema } from 'src/Common/Infrastructure/DB/schemas/entity.schema';
import { WidgetRepository } from 'src/Common/Infrastructure/Repositories/widget.repository';
import { IWidgetRepository } from 'src/Common/ApplicationCore/Services/IWidgetRepository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Widget.name, schema: WidgetSchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Summary.name, schema: SummarySchema },
      { name: Entity.name, schema: EntitySchema },
    ]),
  ],
  providers: [
    {
      provide: 'IWidgetRepository',
      useClass: WidgetRepository,
    },
  ],
  exports: ['IWidgetRepository', MongooseModule],
})
export class AnalysisInfraModule {}

