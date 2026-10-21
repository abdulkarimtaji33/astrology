import { BadRequestException } from '@nestjs/common';

/** Tiny blocklist of the most common passwords that still satisfy letter+digit rules. */
const COMMON = new Set([
  'password1', 'password12', 'password123', 'password1234', 'password!', 'passw0rd', 'p@ssw0rd', 'p@ssword1',
  'qwerty123', 'qwerty1234', 'qwertyuiop1', '1q2w3e4r', '1qaz2wsx', 'iloveyou1', 'iloveyou123', 'welcome1',
  'welcome123', 'admin123', 'admin1234', 'letmein123', 'abc12345', 'abcd1234', 'abc123456', 'monkey123',
  'dragon123', 'football1', 'baseball1', 'sunshine1', 'princess1', 'master123', 'shadow123', 'superman1',
  'changeme1', 'changeme123', 'test1234', 'test12345', 'azerty123', 'zaq12wsx', '123456789a', 'a123456789',
]);

/** bcrypt silently truncates at 72 bytes, so reject longer input instead of weakening it. */
export function assertPasswordAllowed(password: string, email?: string): void {
  if (Buffer.byteLength(password, 'utf8') > 72) {
    throw new BadRequestException('Password must be at most 72 bytes long');
  }
  const lower = password.toLowerCase();
  if (COMMON.has(lower)) {
    throw new BadRequestException('That password is too common. Please choose a stronger one');
  }
  if (email) {
    const local = email.toLowerCase().split('@')[0];
    if (local.length >= 4 && lower.includes(local)) {
      throw new BadRequestException('Password must not contain your email name');
    }
  }
  if (/^(.)\1+$/.test(password)) {
    throw new BadRequestException('Password must not be a single repeated character');
  }
}
