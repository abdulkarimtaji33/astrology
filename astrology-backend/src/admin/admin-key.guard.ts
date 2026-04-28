import { CanActivate, ExecutionContext, Injectable, SetMetadata, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

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

    const req = context.switchToHttp().getRequest<Request>();

    // Optional legacy: X-Admin-Key when ADMIN_API_KEY is set (automation / break-glass)
    const apiKey = process.env.ADMIN_API_KEY;
    const providedKey = req.header('x-admin-key');
    if (apiKey && providedKey && providedKey === apiKey) return true;

    // Primary: Bearer JWT from POST /admin/login (isAdmin must be true)
    const auth = req.header('authorization') ?? '';
    if (auth.startsWith('Bearer ')) {
      const token = auth.slice(7);
      try {
        const secret = process.env.JWT_SECRET || 'dev-insecure';
        const payload = jwt.verify(token, secret) as { isAdmin?: boolean };
        if (payload?.isAdmin === true) return true;
      } catch {
        /* invalid token */
      }
    }

    throw new UnauthorizedException('Admin access required');
  }
}
