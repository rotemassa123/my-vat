import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiSettings } from '../api.settings';
import * as httpContext from 'express-http-context';
import * as cookieParser from 'cookie-parser';

export async function InitializeRestApi(app: INestApplication) {
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('SmartEstate')
    .setDescription('התחדשות עירונית - עושים את זה נכון')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  app.use(httpContext.middleware);
  app.use(cookieParser());
  
  app.enableCors({ origin: [`http://localhost:3000`] , credentials:true });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const configService = app.get(ConfigService);
  const restApiConfiguration = configService.get<ApiSettings>('RestApi');
  await app.listen(restApiConfiguration.Port);
}
