ALTER TABLE identity.users DROP COLUMN IF EXISTS last_login_at;
DROP TABLE IF EXISTS identity.refresh_tokens;
