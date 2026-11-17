ALTER TABLE identity.sessions DROP CONSTRAINT IF EXISTS sessions_active_branch_fk;
ALTER TABLE identity.sessions
  DROP COLUMN IF EXISTS active_branch_id,
  DROP COLUMN IF EXISTS active_role;
