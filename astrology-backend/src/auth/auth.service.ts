import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { DataSource, IsNull, MoreThan, Repository } from 'typeorm';
import { User } from './user.entity';
import { RefreshToken } from './refresh-token.entity';
import { PasswordReset } from './password-reset.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from './mail.service';
import { assertPasswordAllowed } from './password-policy';
import {
  ACCESS_TTL_SECONDS,
  BCRYPT_COST,
  LOCK_MINUTES,
  MAX_FAILED_LOGINS,
  REFRESH_ABSOLUTE_DAYS,
  REFRESH_GRACE_MS,
  REFRESH_IDLE_DAYS,
  RESET_TTL_MINUTES,
} from './auth.config';
import type { JwtPayload } from './jwt.strategy';

export type ReqCtx = { ip?: string; userAgent?: string };

export type PublicUser = { id: number; email: string; isAdmin: boolean };

export type Session = {
  accessToken: string;
  expiresIn: number;
  user: PublicUser;
  /** Raw refresh token — goes into the httpOnly cookie, never the JSON body. */
  refreshToken: string;
  refreshExpiresAt: Date;
};

const DAY = 24 * 60 * 60 * 1000;
const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');
const newOpaqueToken = () => randomBytes(32).toString('base64url');

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  /** Compared against when the email is unknown so timing does not reveal existence. */
  private readonly dummyHash = bcrypt.hashSync('not-a-real-password', BCRYPT_COST);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(RefreshToken) private readonly tokens: Repository<RefreshToken>,
    @InjectRepository(PasswordReset) private readonly resets: Repository<PasswordReset>,
    private readonly ds: DataSource,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  // ─── Registration / login ────────────────────────────────────────────────

  async register(dto: RegisterDto, ctx: ReqCtx): Promise<Session> {
    const email = dto.email.trim().toLowerCase();
    assertPasswordAllowed(dto.password, email);
    const existing = await this.users.findOne({ where: { email } });
    if (existing) throw new ConflictException('An account with this email already exists');
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);
    let user: User;
    try {
      user = await this.users.save(this.users.create({ email, passwordHash }));
    } catch (e: unknown) {
      if ((e as { code?: string })?.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('An account with this email already exists');
      }
      throw e;
    }
    return this.startSession(user, ctx);
  }

  async login(dto: LoginDto, ctx: ReqCtx): Promise<Session> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.users.findOne({ where: { email } });
    if (!user) {
      await bcrypt.compare(dto.password, this.dummyHash);
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      // Still burn a compare so locked vs. unlocked timing is similar.
      await bcrypt.compare(dto.password, user.passwordHash);
      throw new HttpException(
        'Too many failed sign-in attempts. Try again in a few minutes or reset your password.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      const failed = (user.failedLogins ?? 0) + 1;
      if (failed >= MAX_FAILED_LOGINS) {
        await this.users.update(user.id, {
          failedLogins: 0,
          lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60_000),
        });
        this.logger.warn(`Account ${user.id} locked for ${LOCK_MINUTES}m after repeated failures`);
      } else {
        await this.users.update(user.id, { failedLogins: failed });
      }
      throw new UnauthorizedException('Invalid email or password');
    }

    const patch: Partial<User> = {};
    if (user.failedLogins || user.lockedUntil) {
      patch.failedLogins = 0;
      patch.lockedUntil = null;
    }
    // Transparently upgrade old, cheaper hashes.
    if (bcrypt.getRounds(user.passwordHash) < BCRYPT_COST) {
      patch.passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);
    }
    if (Object.keys(patch).length) await this.users.update(user.id, patch);

    return this.startSession(user, ctx);
  }

  // ─── Sessions: refresh rotation with reuse detection ─────────────────────

  async refresh(raw: string | undefined, ctx: ReqCtx): Promise<Session> {
    if (!raw) throw new UnauthorizedException('No session');
    const hash = sha256(raw);
    let row = await this.tokens.findOne({ where: { tokenHash: hash } });
    if (!row) throw new UnauthorizedException('Session expired');

    const now = new Date();
    if (row.familyExpiresAt <= now) {
      await this.revokeFamily(row.familyId);
      throw new UnauthorizedException('Session expired');
    }

    if (row.revokedAt) {
      row = await this.resolveRevoked(row, now);
    } else if (row.expiresAt <= now) {
      throw new UnauthorizedException('Session expired');
    }

    const user = await this.users.findOne({ where: { id: row.userId } });
    if (!user) throw new UnauthorizedException('Session invalid');

    const rotated = await this.rotate(row, ctx);
    if (!rotated) {
      // Lost a race to a concurrent refresh of the same token; treat like the grace path.
      const again = await this.tokens.findOne({ where: { id: row.id } });
      if (!again?.replacedById) throw new UnauthorizedException('Session expired');
      const succ = await this.tokens.findOne({ where: { id: again.replacedById } });
      if (!succ || succ.revokedAt) throw new UnauthorizedException('Session expired');
      const second = await this.rotate(succ, ctx);
      if (!second) throw new UnauthorizedException('Session expired');
      return this.buildSession(user, second.raw, second.row);
    }
    return this.buildSession(user, rotated.raw, rotated.row);
  }

  /**
   * A revoked token was presented. Inside the grace window it is a multi-tab race, so continue
   * from its live successor. Anywhere else it is reuse of a stolen/old token: kill the family.
   */
  private async resolveRevoked(row: RefreshToken, now: Date): Promise<RefreshToken> {
    const withinGrace = row.revokedAt && now.getTime() - row.revokedAt.getTime() <= REFRESH_GRACE_MS;
    if (withinGrace && row.replacedById) {
      const succ = await this.tokens.findOne({ where: { id: row.replacedById } });
      if (succ && !succ.revokedAt && succ.expiresAt > now) return succ;
    }
    await this.revokeFamily(row.familyId);
    this.logger.warn(`Refresh token reuse detected for user ${row.userId}; family revoked`);
    throw new UnauthorizedException('Session expired');
  }

  /** Atomically retire `current` and issue its replacement. Returns null if someone else won. */
  private async rotate(current: RefreshToken, ctx: ReqCtx) {
    const now = new Date();
    const raw = newOpaqueToken();
    const expiresAt = new Date(
      Math.min(now.getTime() + REFRESH_IDLE_DAYS * DAY, current.familyExpiresAt.getTime()),
    );
    const next = await this.tokens.save(
      this.tokens.create({
        userId: current.userId,
        familyId: current.familyId,
        tokenHash: sha256(raw),
        expiresAt,
        familyExpiresAt: current.familyExpiresAt,
        userAgent: ctx.userAgent?.slice(0, 255) ?? null,
        ip: ctx.ip?.slice(0, 64) ?? null,
      }),
    );
    const res = await this.tokens
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revokedAt: now, replacedById: next.id })
      .where('id = :id AND revoked_at IS NULL', { id: current.id })
      .execute();
    if (!res.affected) {
      await this.tokens.delete(next.id);
      return null;
    }
    return { raw, row: next };
  }

  async logout(raw: string | undefined): Promise<void> {
    if (!raw) return;
    const row = await this.tokens.findOne({ where: { tokenHash: sha256(raw) } });
    if (row) await this.revokeFamily(row.familyId);
  }

  async logoutAll(userId: number): Promise<void> {
    await this.revokeAllForUser(userId);
  }

  private revokeFamily(familyId: string) {
    return this.tokens.update({ familyId, revokedAt: IsNull() }, { revokedAt: new Date() });
  }

  private revokeAllForUser(userId: number) {
    return this.tokens.update({ userId, revokedAt: IsNull() }, { revokedAt: new Date() });
  }

  /** True while the login this access token came from has not been signed out/revoked. */
  async isSessionActive(sid: string): Promise<boolean> {
    const live = await this.tokens.findOne({
      where: { familyId: sid, revokedAt: IsNull(), expiresAt: MoreThan(new Date()) },
      select: ['id'],
    });
    return !!live;
  }

  // ─── Account management ──────────────────────────────────────────────────

  async me(userId: number): Promise<PublicUser> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Session invalid');
    return this.publicUser(user);
  }

  async changePassword(userId: number, currentSid: string, current: string, next: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Session invalid');
    if (!(await bcrypt.compare(current, user.passwordHash))) {
      throw new BadRequestException('Current password is incorrect');
    }
    assertPasswordAllowed(next, user.email);
    if (await bcrypt.compare(next, user.passwordHash)) {
      throw new BadRequestException('New password must be different from the current one');
    }
    await this.users.update(user.id, {
      passwordHash: await bcrypt.hash(next, BCRYPT_COST),
      passwordChangedAt: new Date(),
      failedLogins: 0,
      lockedUntil: null,
    });
    // Sign out every other device; keep this one.
    await this.tokens
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revokedAt: new Date() })
      .where('user_id = :userId AND revoked_at IS NULL AND family_id <> :sid', { userId, sid: currentSid })
      .execute();
  }

  async forgotPassword(emailRaw: string, appUrl: string): Promise<void> {
    const email = emailRaw.trim().toLowerCase();
    const user = await this.users.findOne({ where: { email } });
    if (!user) return; // caller always answers the same way
    // Invalidate older unused links.
    await this.resets.update({ userId: user.id, usedAt: IsNull() }, { usedAt: new Date() });
    const raw = newOpaqueToken();
    await this.resets.save(
      this.resets.create({
        userId: user.id,
        tokenHash: sha256(raw),
        expiresAt: new Date(Date.now() + RESET_TTL_MINUTES * 60_000),
      }),
    );
    const link = `${appUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(raw)}`;
    const text =
      `We received a request to reset your Jyotish password.\n\nOpen this link within ${RESET_TTL_MINUTES} minutes:\n${link}\n\n` +
      'If you did not ask for this, you can ignore this email — your password will not change.';
    const html =
      `<p>We received a request to reset your Jyotish password.</p>` +
      `<p><a href="${link}">Reset your password</a> (valid for ${RESET_TTL_MINUTES} minutes)</p>` +
      `<p>If you did not ask for this, you can ignore this email — your password will not change.</p>`;
    await this.mail.send(user.email, 'Reset your Jyotish password', text, html);
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const row = await this.resets.findOne({ where: { tokenHash: sha256(rawToken) } });
    if (!row || row.usedAt || row.expiresAt <= new Date()) {
      throw new BadRequestException('This reset link is invalid or has expired');
    }
    const user = await this.users.findOne({ where: { id: row.userId } });
    if (!user) throw new BadRequestException('This reset link is invalid or has expired');
    assertPasswordAllowed(newPassword, user.email);

    const claimed = await this.resets
      .createQueryBuilder()
      .update(PasswordReset)
      .set({ usedAt: new Date() })
      .where('id = :id AND used_at IS NULL', { id: row.id })
      .execute();
    if (!claimed.affected) throw new BadRequestException('This reset link is invalid or has expired');

    await this.users.update(user.id, {
      passwordHash: await bcrypt.hash(newPassword, BCRYPT_COST),
      passwordChangedAt: new Date(),
      failedLogins: 0,
      lockedUntil: null,
    });
    await this.revokeAllForUser(user.id);
    void this.mail.send(
      user.email,
      'Your Jyotish password was changed',
      'Your password was just changed and all devices were signed out. If this was not you, reset it again right away.',
      '<p>Your password was just changed and all devices were signed out.</p><p>If this was not you, reset it again right away.</p>',
    );
  }

  // ─── Token plumbing ──────────────────────────────────────────────────────

  verifyAccessToken(token: string): JwtPayload {
    return this.jwt.verify<JwtPayload>(token);
  }

  private publicUser(user: User): PublicUser {
    return { id: user.id, email: user.email, isAdmin: !!user.isAdmin };
  }

  private async startSession(user: User, ctx: ReqCtx): Promise<Session> {
    const raw = newOpaqueToken();
    const now = Date.now();
    const row = await this.tokens.save(
      this.tokens.create({
        userId: user.id,
        familyId: randomUUID(),
        tokenHash: sha256(raw),
        expiresAt: new Date(now + REFRESH_IDLE_DAYS * DAY),
        familyExpiresAt: new Date(now + REFRESH_ABSOLUTE_DAYS * DAY),
        userAgent: ctx.userAgent?.slice(0, 255) ?? null,
        ip: ctx.ip?.slice(0, 64) ?? null,
      }),
    );
    return this.buildSession(user, raw, row);
  }

  private buildSession(user: User | PublicUser, raw: string, row: RefreshToken): Session {
    const pub: PublicUser = { id: user.id, email: user.email, isAdmin: !!user.isAdmin };
    const payload: JwtPayload = { sub: pub.id, email: pub.email, isAdmin: pub.isAdmin, sid: row.familyId };
    return {
      accessToken: this.jwt.sign(payload),
      expiresIn: ACCESS_TTL_SECONDS,
      user: pub,
      refreshToken: raw,
      refreshExpiresAt: row.expiresAt,
    };
  }

  /** Housekeeping: drop long-expired rows. Called from a daily cron. */
  async purgeExpired(): Promise<void> {
    const cutoff = new Date(Date.now() - 7 * DAY);
    await this.ds.query('DELETE FROM refresh_tokens WHERE family_expires_at < ? OR (revoked_at IS NOT NULL AND revoked_at < ?)', [cutoff, cutoff]);
    await this.ds.query('DELETE FROM password_resets WHERE expires_at < ?', [cutoff]);
  }
}
