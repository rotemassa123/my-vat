import { Module } from '@nestjs/common';
import { InvoiceInfraModule } from "./invoiceInfra.module";
import { InvoiceController } from './Controllers/invoice.controller';
import { ReportingController } from './Controllers/reporting.controller';

@Module({
    imports: [
        InvoiceInfraModule,
    ],
    controllers: [InvoiceController, ReportingController],
    providers: []
})
export class InvoiceModule {} 