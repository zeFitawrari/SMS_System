ALTER TABLE identity.users DROP CONSTRAINT IF EXISTS users_email_key;

ALTER TABLE identity.users
  ALTER COLUMN email DROP NOT NULL;

ALTER TABLE identity.users
  ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE identity.users
  ADD CONSTRAINT users_email_or_phone_check
  CHECK (email IS NOT NULL OR phone IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique_idx
  ON identity.users (phone)
  WHERE phone IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx
  ON identity.users (lower(email))
  WHERE email IS NOT NULL;

COMMENT ON COLUMN identity.users.phone IS 'Normalized digits-only phone; unique when set';
