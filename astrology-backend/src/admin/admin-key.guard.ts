import { CanActivate, ExecutionContext, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AdminKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const key = process.env.ADMIN_API_KEY;
    if (key == null || key.length === 0) {
      throw new ServiceUnavailableException('ADMIN_API_KEY is not set; admin API is disabled');
    }
    const req = context.switchToHttp().getRequest<Request>();
    const provided = req.header('x-admin-key');
    if (provided && provided === key) {
      return true;
    }
    throw new UnauthorizedException('Invalid or missing X-Admin-Key header');
  }
}
