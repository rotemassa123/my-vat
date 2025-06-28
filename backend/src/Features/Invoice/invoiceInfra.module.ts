import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { IInvoiceRepository } from "src/Common/ApplicationCore/Services/IInvoiceRepository";
import { InvoiceMongoService } from "src/Common/Infrastructure/Services/invoice-mongo-service";
import { Invoice, InvoiceSchema } from "src/Common/Infrastructure/DB/schemas/invoice.schema";
import { Summary, SummarySchema } from "src/Common/Infrastructure/DB/schemas/summary.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Summary.name, schema: SummarySchema }
    ])
  ],
  providers: [
    {
      provide: IInvoiceRepository,
      useClass: InvoiceMongoService,
    },
  ],
  exports: [IInvoiceRepository, MongooseModule],
})
export class InvoiceInfraModule {} 