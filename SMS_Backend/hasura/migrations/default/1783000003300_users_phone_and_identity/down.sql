DROP INDEX IF EXISTS identity.users_email_unique_idx;
DROP INDEX IF EXISTS identity.users_phone_unique_idx;

ALTER TABLE identity.users DROP CONSTRAINT IF EXISTS users_email_or_phone_check;
ALTER TABLE identity.users DROP COLUMN IF EXISTS phone;

ALTER TABLE identity.users ALTER COLUMN email SET NOT NULL;
