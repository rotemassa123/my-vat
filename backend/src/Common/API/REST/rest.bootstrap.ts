import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiSettings } from '../api.settings';
import * as httpContext from 'express-http-context';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { TenantContextInterceptor } from '../../interceptors/context.interceptor';

export async function InitializeRestApi(app: INestApplication) {
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('myvat')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  app.use(httpContext.middleware);
  app.use(cookieParser());
  
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  
  app.use((req, res, next) => {
    req.setTimeout(300000);
    res.setTimeout(300000);
    next();
  });
  
  app.useGlobalInterceptors(new TenantContextInterceptor());

  app.enableCors({ 
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
    ], 
    credentials: true 
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const configService = app.get(ConfigService);
  const restApiConfiguration = configService.get<ApiSettings>('RestApi');
  await app.listen(restApiConfiguration.Port);
}
