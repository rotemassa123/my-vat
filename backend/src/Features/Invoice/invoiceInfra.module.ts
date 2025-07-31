import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { InfraModule } from "src/Common/Infrastructure/infra.module";
import { IInvoiceRepository } from "src/Common/ApplicationCore/Services/IInvoiceRepository";
import { InvoiceMongoService } from "src/Common/Infrastructure/Services/invoice-mongo-service";
import { Invoice, InvoiceSchema } from "src/Common/Infrastructure/DB/schemas/invoice.schema";
import { Summary, SummarySchema } from "src/Common/Infrastructure/DB/schemas/summary.schema";
import { Entity, EntitySchema } from "src/Common/Infrastructure/DB/schemas/entity.schema";
import { ReportingService } from './Services/reporting.service';
import { ReportingQueryBuilderService } from './Services/reporting-query-builder.service';
import { ReportingCacheService } from './Services/reporting-cache.service';

@Module({
  imports: [
    InfraModule,
    MongooseModule.forFeature([
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Summary.name, schema: SummarySchema },
      { name: Entity.name, schema: EntitySchema }
    ])
  ],
  providers: [
    {
      provide: IInvoiceRepository,
      useClass: InvoiceMongoService,
    },
    ReportingService,
    ReportingQueryBuilderService,
    ReportingCacheService,
  ],
  exports: [
    IInvoiceRepository, 
    InfraModule,
    ReportingService,
    ReportingQueryBuilderService,
    ReportingCacheService,
  ],
})
export class InvoiceInfraModule {} 