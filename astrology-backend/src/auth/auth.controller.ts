import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService, ReqCtx, Session } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto } from './dto/password.dto';
import { Public } from './public.decorator';
import { ReqUser } from './req-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthedUser } from './jwt.strategy';
import { REFRESH_COOKIE, refreshCookiePath } from './auth.config';

const ctxOf = (req: Request): ReqCtx => ({
  ip: req.ip,
  userAgent: req.header('user-agent') ?? undefined,
});

function cookieSecure(req: Request): boolean {
  const flag = process.env.COOKIE_SECURE;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return req.secure || req.header('x-forwarded-proto') === 'https';
}

function setRefreshCookie(req: Request, res: Response, s: Session) {
  res.cookie(REFRESH_COOKIE, s.refreshToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure: cookieSecure(req),
    path: refreshCookiePath(),
    expires: s.refreshExpiresAt,
  });
}

function clearRefreshCookie(req: Request, res: Response) {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    sameSite: 'strict',
    secure: cookieSecure(req),
    path: refreshCookiePath(),
  });
}

/** Never put the refresh token in a response body. */
const body = (s: Session) => ({ accessToken: s.accessToken, expiresIn: s.expiresIn, user: s.user });

/** Cookie-authenticated endpoints require a custom header a cross-site form/img cannot send. */
function requireXhr(req: Request) {
  if (!req.header('x-requested-with')) throw new ForbiddenException('Missing X-Requested-With header');
}

function appUrl(req: Request): string {
  if (process.env.APP_URL) return process.env.APP_URL;
  const origin = req.header('origin');
  if (origin) return origin;
  return 'http://localhost:6600';
}

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    if (process.env.ALLOW_REGISTRATION === 'false') {
      throw new ForbiddenException('Registration is currently closed');
    }
    const s = await this.auth.register(dto, ctxOf(req));
    setRefreshCookie(req, res, s);
    return body(s);
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const s = await this.auth.login(dto, ctxOf(req));
    setRefreshCookie(req, res, s);
    return body(s);
  }

  /** Exchanges the httpOnly refresh cookie for a new access token (and rotates the cookie). */
  @Public()
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @HttpCode(200)
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    requireXhr(req);
    try {
      const s = await this.auth.refresh(req.cookies?.[REFRESH_COOKIE], ctxOf(req));
      setRefreshCookie(req, res, s);
      return body(s);
    } catch (e) {
      clearRefreshCookie(req, res);
      throw e;
    }
  }

  @Public()
  @HttpCode(204)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    requireXhr(req);
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE]);
    clearRefreshCookie(req, res);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  @Post('logout-all')
  async logoutAll(@ReqUser() user: AuthedUser, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logoutAll(user.id);
    clearRefreshCookie(req, res);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@ReqUser() user: AuthedUser) {
    return this.auth.me(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(204)
  @Post('change-password')
  async changePassword(@ReqUser() user: AuthedUser, @Body() dto: ChangePasswordDto) {
    await this.auth.changePassword(user.id, user.sid, dto.currentPassword, dto.newPassword);
  }

  /** Always answers the same way so it cannot be used to discover which emails are registered. */
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(202)
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    await this.auth.forgotPassword(dto.email, appUrl(req));
    return { message: 'If an account exists for that email, a reset link is on its way.' };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(204)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.auth.resetPassword(dto.token, dto.newPassword);
  }
}
