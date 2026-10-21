import { CanActivate, ExecutionContext, Injectable, SetMetadata, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { timingSafeEqual } from 'crypto';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { User } from '../auth/user.entity';

export const SkipAdminGuard = () => SetMetadata('skipAdminGuard', true);

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/**
 * Admin access = the normal session access token of a user who is *currently* an admin in the DB
 * (so demoting/deleting an admin takes effect immediately) and whose session is still active.
 * The optional X-Admin-Key remains as a constant-time-compared break-glass for automation.
 */
@Injectable()
export class AdminKeyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride<boolean>('skipAdminGuard', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const req = context.switchToHttp().getRequest<Request>();

    const apiKey = process.env.ADMIN_API_KEY;
    const providedKey = req.header('x-admin-key');
    if (apiKey && providedKey && safeEqual(providedKey, apiKey)) return true;

    const header = req.header('authorization') ?? '';
    if (header.startsWith('Bearer ')) {
      try {
        const payload = this.auth.verifyAccessToken(header.slice(7));
        const [user, active] = await Promise.all([
          this.users.findOne({ where: { id: Number(payload.sub) } }),
          payload.sid ? this.auth.isSessionActive(payload.sid) : Promise.resolve(false),
        ]);
        if (user?.isAdmin && active) return true;
      } catch {
        /* invalid or expired token */
      }
    }
    throw new UnauthorizedException('Admin access required');
  }
}
