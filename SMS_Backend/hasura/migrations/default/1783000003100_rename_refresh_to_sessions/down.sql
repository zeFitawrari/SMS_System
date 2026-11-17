ALTER TABLE identity.sessions
  RENAME COLUMN session_family_id TO family_id;

ALTER INDEX identity.sessions_user_id_idx RENAME TO refresh_tokens_user_id_idx;
ALTER INDEX identity.sessions_family_id_idx RENAME TO refresh_tokens_family_id_idx;
ALTER INDEX identity.sessions_active_idx RENAME TO refresh_tokens_active_idx;

ALTER TABLE identity.sessions RENAME TO refresh_tokens;
