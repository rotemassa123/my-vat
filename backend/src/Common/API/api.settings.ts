import { plainToInstance } from 'class-transformer';
import { IsNumber, IsOptional, validateSync } from 'class-validator';

export default () => ({
  RestApi: {
    Port: parseInt(process.env.APP_PORT, 10) || 8080
  }
});

export class ApiSettings {
  Port: number;
}

class ApiEnvironmentValidator {
  @IsNumber()
  @IsOptional()
  PORT: number;
}

export function ValidateApiConfig(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(ApiEnvironmentValidator, config, { enableImplicitConversion: true });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
