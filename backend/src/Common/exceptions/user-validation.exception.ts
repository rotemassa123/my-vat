import { BadRequestException } from '@nestjs/common';
 
export class UserValidationException extends BadRequestException {
  constructor(message: string) {
    super(message);
  }
} 