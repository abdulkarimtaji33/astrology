import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { AuthService } from './auth.service';
import { JWT_AUDIENCE, JWT_ISSUER, jwtSecret } from './auth.config';

export type JwtPayload = { sub: number; email: string; isAdmin?: boolean; sid: string };

export type AuthedUser = { id: number; email: string; isAdmin: boolean; sid: string };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(ConfigService) _config: ConfigService,
    @InjectRepository(User)
    private users: Repository<User>,
    private auth: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret(),
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload): Promise<AuthedUser> {
    if (!payload?.sid) throw new UnauthorizedException('Session invalid or expired');
    const [user, active] = await Promise.all([
      this.users.findOne({ where: { id: Number(payload.sub) } }),
      this.auth.isSessionActive(payload.sid),
    ]);
    if (!user || !active) throw new UnauthorizedException('Session invalid or expired');
    return { id: user.id, email: user.email, isAdmin: !!user.isAdmin, sid: payload.sid };
  }
}
