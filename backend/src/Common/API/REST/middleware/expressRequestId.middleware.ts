import * as express from 'express';
import { v4 as uuidv4 } from 'uuid';

export function generateUUID(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const oldValue = req.headers['x-request-id'];
  const id = oldValue === undefined ? uuidv4() : oldValue;
  if (oldValue === undefined) {
    res.set('x-request-id', id);
  }
  req.headers['x-request-id'] = id;

  next();
}
