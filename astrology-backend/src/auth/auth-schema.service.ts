import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Idempotent schema bootstrap for auth tables/columns (the app runs with synchronize:false,
 * same pattern as ai_analyses). Safe to run on every boot.
 */
@Injectable()
export class AuthSchemaService implements OnModuleInit {
  private readonly logger = new Logger(AuthSchemaService.name);
  constructor(private readonly ds: DataSource) {}

  async onModuleInit() {
    await this.ds.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        family_id VARCHAR(36) NOT NULL,
        token_hash CHAR(64) NOT NULL,
        expires_at DATETIME NOT NULL,
        family_expires_at DATETIME NOT NULL,
        revoked_at DATETIME NULL,
        replaced_by_id INT NULL,
        user_agent VARCHAR(255) NULL,
        ip VARCHAR(64) NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        UNIQUE KEY uq_refresh_hash (token_hash),
        KEY idx_refresh_user (user_id),
        KEY idx_refresh_family (family_id),
        CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    await this.ds.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash CHAR(64) NOT NULL,
        expires_at DATETIME NOT NULL,
        used_at DATETIME NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        UNIQUE KEY uq_reset_hash (token_hash),
        KEY idx_reset_user (user_id),
        CONSTRAINT fk_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    for (const ddl of [
      'ADD COLUMN IF NOT EXISTS failed_logins INT NOT NULL DEFAULT 0',
      'ADD COLUMN IF NOT EXISTS locked_until DATETIME NULL',
      'ADD COLUMN IF NOT EXISTS password_changed_at DATETIME NULL',
    ]) {
      await this.ds.query(`ALTER TABLE users ${ddl}`);
    }
    this.logger.log('auth schema ensured');
  }
}
