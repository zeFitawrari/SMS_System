CREATE TABLE identity.refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  family_id UUID NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  user_agent TEXT,
  client_ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX refresh_tokens_user_id_idx ON identity.refresh_tokens (user_id);
CREATE INDEX refresh_tokens_family_id_idx ON identity.refresh_tokens (family_id);
CREATE INDEX refresh_tokens_active_idx ON identity.refresh_tokens (user_id, expires_at)
  WHERE revoked_at IS NULL;

ALTER TABLE identity.users
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
