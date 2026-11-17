DROP INDEX IF EXISTS identity.sessions_active_user_last_seen_idx;

ALTER TABLE identity.sessions
  DROP COLUMN IF EXISTS previous_token_hash,
  DROP COLUMN IF EXISTS last_active_at;
