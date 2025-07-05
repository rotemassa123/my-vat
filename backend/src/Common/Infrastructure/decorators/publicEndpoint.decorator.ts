import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const PublicEndpointGuard = () => SetMetadata(IS_PUBLIC_KEY, true); 