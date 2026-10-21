import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** One row per issued refresh token. Only the SHA-256 hash is stored. */
@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  /** All tokens descended from one login share a family; reuse revokes the family. */
  @Index()
  @Column({ name: 'family_id', length: 36 })
  familyId: string;

  @Index({ unique: true })
  @Column({ name: 'token_hash', length: 64 })
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt: Date;

  /** Hard cap for the whole family regardless of rotation. */
  @Column({ name: 'family_expires_at', type: 'datetime' })
  familyExpiresAt: Date;

  @Column({ name: 'revoked_at', type: 'datetime', nullable: true })
  revokedAt: Date | null;

  @Column({ name: 'replaced_by_id', type: 'int', nullable: true })
  replacedById: number | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 255, nullable: true })
  userAgent: string | null;

  @Column({ name: 'ip', type: 'varchar', length: 64, nullable: true })
  ip: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
