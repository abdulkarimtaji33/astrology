import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255, name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'is_admin', type: 'tinyint', width: 1, default: 0 })
  isAdmin: boolean;

  /** Consecutive failed logins; reset on success. Drives account lockout. */
  @Column({ name: 'failed_logins', type: 'int', default: 0 })
  failedLogins: number;

  @Column({ name: 'locked_until', type: 'datetime', nullable: true })
  lockedUntil: Date | null;

  /** Access tokens issued before this instant are rejected (password change/reset). */
  @Column({ name: 'password_changed_at', type: 'datetime', nullable: true })
  passwordChangedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
