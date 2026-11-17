ALTER TABLE identity.users
  ADD COLUMN IF NOT EXISTS authz_version INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN identity.users.authz_version IS 'Incremented on grant/revoke; JWT must match (auth hook).';

CREATE TABLE identity.role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES tenancy.schools(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES identity.roles(id) ON DELETE RESTRICT,
  scope_type TEXT NOT NULL CHECK (scope_type IN ('SCHOOL', 'BRANCH')),
  branch_id UUID,
  granted_by UUID REFERENCES identity.users(id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT role_assignments_branch_scope_check CHECK (
    (scope_type = 'BRANCH' AND branch_id IS NOT NULL)
    OR (scope_type = 'SCHOOL' AND branch_id IS NULL)
  ),
  CONSTRAINT role_assignments_branch_fk
    FOREIGN KEY (school_id, branch_id)
    REFERENCES tenancy.branches (school_id, id)
    DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX role_assignments_user_active_idx
  ON identity.role_assignments (user_id, school_id)
  WHERE revoked_at IS NULL;

CREATE UNIQUE INDEX role_assignments_one_active_school_scope
  ON identity.role_assignments (user_id, role_id, school_id)
  WHERE revoked_at IS NULL AND scope_type = 'SCHOOL';

CREATE UNIQUE INDEX role_assignments_one_active_branch_scope
  ON identity.role_assignments (user_id, role_id, school_id, branch_id)
  WHERE revoked_at IS NULL AND scope_type = 'BRANCH';

COMMENT ON TABLE identity.role_assignments IS 'Scoped role grants (source of truth for authorization).';

-- Backfill existing grants as school-wide scope (single-school users).
INSERT INTO identity.role_assignments (user_id, school_id, role_id, scope_type, branch_id)
SELECT ur.user_id, u.school_id, ur.role_id, 'SCHOOL', NULL
FROM identity.userroles ur
INNER JOIN identity.users u ON u.id = ur.user_id
WHERE u.school_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM identity.role_assignments ra
    WHERE ra.user_id = ur.user_id
      AND ra.role_id = ur.role_id
      AND ra.school_id = u.school_id
      AND ra.scope_type = 'SCHOOL'
      AND ra.revoked_at IS NULL
  );
