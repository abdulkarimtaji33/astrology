-- Run on production if migrate-auth-mysql.sql stopped mid-way (e.g. user_id NULL on old reminders).
-- Creates admin@admin.com if missing (password: admin123!@# — change after first login).
-- Assigns orphan reminders to the first user, then enforces NOT NULL on user_id.

INSERT INTO users (email, password_hash, is_admin)
SELECT 'admin@admin.com', '$2b$10$a7nIkqF.6LO05/WFreQOxu0V3FlIPl2p/8SzjO4adYIexcZP80cSW', 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@admin.com');

UPDATE transit_reminders SET user_id = (SELECT id FROM users ORDER BY id ASC LIMIT 1) WHERE user_id IS NULL;

ALTER TABLE transit_reminders MODIFY user_id int NOT NULL;
