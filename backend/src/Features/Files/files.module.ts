import { Module } from '@nestjs/common';
import { FilesController } from './Controllers/files.controller';
import { IGCSService } from 'src/Common/ApplicationCore/Services/IGCSService';
import { GCSService } from 'src/Common/Infrastructure/Services/GCSService';
import { InvoiceInfraModule } from '../Invoice/invoiceInfra.module';

@Module({
  imports: [InvoiceInfraModule],
  controllers: [FilesController],
  providers: [{ provide: IGCSService, useClass: GCSService }],
})
export class FilesModule {} 