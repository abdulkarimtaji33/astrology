import { CanActivate, ExecutionContext, Injectable, ServiceUnavailableException, SetMetadata, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

export const SkipAdminGuard = () => SetMetadata('skipAdminGuard', true);

@Injectable()
export class AdminKeyGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skip = this.reflector.getAllAndOverride<boolean>('skipAdminGuard', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const apiKey = process.env.ADMIN_API_KEY;
    if (!apiKey) throw new ServiceUnavailableException('ADMIN_API_KEY is not configured');
    const req = context.switchToHttp().getRequest<Request>();
    const provided = req.header('x-admin-key');
    if (provided && provided === apiKey) return true;
    throw new UnauthorizedException('Admin access required');
  }
}
