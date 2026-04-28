import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

export type JwtPayload = { sub: number; email: string; isAdmin?: boolean };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(ConfigService)
    config: ConfigService,
    @InjectRepository(User)
    private users: Repository<User>,
  ) {
    const secret = config.get<string>('JWT_SECRET') || 'dev-insecure';
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<{ id: number; email: string; isAdmin: boolean }> {
    const user = await this.users.findOne({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('Session invalid or expired');
    return { id: user.id, email: user.email, isAdmin: !!user.isAdmin };
  }
}
