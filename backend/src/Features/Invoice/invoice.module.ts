import { Module } from '@nestjs/common';
import { InvoiceInfraModule } from "./invoiceInfra.module";
import { InvoiceController } from './Controllers/invoice.controller';
import { SummaryController } from './Controllers/summary.controller';

@Module({
    imports: [
        InvoiceInfraModule,
    ],
    controllers: [InvoiceController, SummaryController],
    providers: []
})
export class InvoiceModule {} 