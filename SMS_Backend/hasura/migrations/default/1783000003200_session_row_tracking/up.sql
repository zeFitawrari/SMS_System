ALTER TABLE identity.sessions
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS previous_token_hash TEXT;

CREATE INDEX IF NOT EXISTS sessions_active_user_last_seen_idx
  ON identity.sessions (user_id, last_active_at DESC)
  WHERE revoked_at IS NULL;

COMMENT ON COLUMN identity.sessions.token_hash IS 'SHA-256 of current opaque session_token (rotated in place on refresh)';
COMMENT ON COLUMN identity.sessions.previous_token_hash IS 'Prior token hash; reuse triggers session revocation';
