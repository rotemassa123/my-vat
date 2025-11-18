import { Module } from '@nestjs/common';
import { AnalysisInfraModule } from './analysisInfra.module';
import { WidgetController } from './Controllers/widget.controller';
import { WidgetService } from './Services/widget.service';
import { WidgetDataService } from './Services/widget-data.service';

@Module({
  imports: [AnalysisInfraModule],
  controllers: [WidgetController],
  providers: [WidgetService, WidgetDataService],
  exports: [WidgetService],
})
export class AnalysisModule {}

