-- Run on existing MySQL databases (once) after pulling auth changes.
-- Adjust user id in UPDATE lines if needed.

CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- birth_records.owner
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'birth_records' AND COLUMN_NAME = 'user_id'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `birth_records` ADD COLUMN `user_id` int DEFAULT NULL AFTER `id`, ADD KEY `idx_birth_records_user_id` (`user_id`)',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- transit_reminders.user_id
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transit_reminders' AND COLUMN_NAME = 'user_id'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `transit_reminders` ADD COLUMN `user_id` int NULL AFTER `id`, ADD KEY `idx_reminders_user` (`user_id`)',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- Assign orphan reminders to first user (create a user via /auth/register first, or set id manually)
UPDATE `transit_reminders` SET `user_id` = (SELECT id FROM `users` ORDER BY id ASC LIMIT 1) WHERE `user_id` IS NULL;
ALTER TABLE `transit_reminders` MODIFY `user_id` int NOT NULL;
