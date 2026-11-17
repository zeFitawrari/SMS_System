ALTER TABLE identity.refresh_tokens RENAME TO sessions;

ALTER INDEX identity.refresh_tokens_user_id_idx RENAME TO sessions_user_id_idx;
ALTER INDEX identity.refresh_tokens_family_id_idx RENAME TO sessions_family_id_idx;
ALTER INDEX identity.refresh_tokens_active_idx RENAME TO sessions_active_idx;

ALTER TABLE identity.sessions
  RENAME COLUMN family_id TO session_family_id;

COMMENT ON TABLE identity.sessions IS 'Server-side auth sessions (opaque rotating tokens, hashed at rest)';
