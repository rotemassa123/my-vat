import { MiddlewareConsumer, Module, NestModule, RequestMethod} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiAutomapperRegistration } from './api.automapper';
import RestApiLoadConfiguration, { ValidateApiConfig } from './api.settings';
import { HealthCheckMiddleware } from './REST/middleware/healthcheck.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [RestApiLoadConfiguration],
      validate: ValidateApiConfig
    })
  ],
  providers: [ApiAutomapperRegistration]
})

export class ApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HealthCheckMiddleware).forRoutes({ path: 'healthcheck', method: RequestMethod.GET });
  }
}
