import { Injectable, NestMiddleware } from '@nestjs/common';
import { Response } from 'express';

@Injectable()
export class HealthCheckMiddleware implements NestMiddleware {
  use(res: Response) {
    res.json({status: 'OK'});
  }
}
