ALTER TABLE identity.sessions
  ADD COLUMN IF NOT EXISTS active_role TEXT,
  ADD COLUMN IF NOT EXISTS active_branch_id UUID;

ALTER TABLE identity.sessions
  ADD CONSTRAINT sessions_active_branch_fk
  FOREIGN KEY (active_branch_id)
  REFERENCES tenancy.branches (id)
  ON DELETE SET NULL
  DEFERRABLE INITIALLY DEFERRED;

COMMENT ON COLUMN identity.sessions.active_role IS 'Selected Hasura role for this session (refresh + JWT)';
COMMENT ON COLUMN identity.sessions.active_branch_id IS 'Set when active_role uses BRANCH-scoped assignment';
