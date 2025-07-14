import { Module } from '@nestjs/common';
import { InvoiceInfraModule } from "./invoiceInfra.module";
import { InvoiceController } from './Controllers/invoice.controller';
import { SummaryController } from './Controllers/summary.controller';
import { ReportingController } from './Controllers/reporting.controller';

@Module({
    imports: [
        InvoiceInfraModule,
    ],
    controllers: [InvoiceController, SummaryController, ReportingController],
    providers: []
})
export class InvoiceModule {} 