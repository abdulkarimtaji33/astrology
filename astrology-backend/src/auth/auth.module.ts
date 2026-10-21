import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { Cron, CronExpression, ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { RefreshToken } from './refresh-token.entity';
import { PasswordReset } from './password-reset.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthSchemaService } from './auth-schema.service';
import { MailService } from './mail.service';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ACCESS_TTL_SECONDS, JWT_AUDIENCE, JWT_ISSUER, jwtSecret } from './auth.config';
import { Injectable } from '@nestjs/common';

@Injectable()
class AuthHousekeeping {
  constructor(private readonly auth: AuthService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  purge() {
    return this.auth.purgeExpired();
  }
}

@Module({
  imports: [
    ConfigModule,
    ScheduleModule,
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    TypeOrmModule.forFeature([User, RefreshToken, PasswordReset]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // Async so the secret is read after ConfigModule has loaded .env (not at import time).
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (): JwtModuleOptions => ({
        secret: jwtSecret(),
        signOptions: {
          algorithm: 'HS256',
          expiresIn: ACCESS_TTL_SECONDS,
          issuer: JWT_ISSUER,
          audience: JWT_AUDIENCE,
        },
        verifyOptions: { algorithms: ['HS256'], issuer: JWT_ISSUER, audience: JWT_AUDIENCE },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthSchemaService, MailService, JwtStrategy, JwtAuthGuard, AuthHousekeeping],
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
