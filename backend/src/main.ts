import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { InitializeRestApi } from './Common/API/REST/rest.bootstrap';



async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await InitializeRestApi(app);
}
bootstrap();
