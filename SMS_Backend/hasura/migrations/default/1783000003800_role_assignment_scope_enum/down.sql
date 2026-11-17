ALTER TABLE identity.role_assignments
  DROP CONSTRAINT IF EXISTS role_assignments_branch_scope_check;

DROP INDEX IF EXISTS identity.role_assignments_one_active_school_scope;
DROP INDEX IF EXISTS identity.role_assignments_one_active_branch_scope;

ALTER TABLE identity.role_assignments
  ALTER COLUMN scope_type TYPE TEXT USING scope_type::text;

ALTER TABLE identity.role_assignments
  ADD CONSTRAINT role_assignments_scope_type_check CHECK (scope_type = ANY (ARRAY['SCHOOL'::text, 'BRANCH'::text])),
  ADD CONSTRAINT role_assignments_branch_scope_check CHECK (
    scope_type = 'BRANCH'::text AND branch_id IS NOT NULL
    OR scope_type = 'SCHOOL'::text AND branch_id IS NULL
  );

CREATE UNIQUE INDEX role_assignments_one_active_school_scope
  ON identity.role_assignments (user_id, role_id, school_id)
  WHERE revoked_at IS NULL AND scope_type = 'SCHOOL'::text;

CREATE UNIQUE INDEX role_assignments_one_active_branch_scope
  ON identity.role_assignments (user_id, role_id, school_id, branch_id)
  WHERE revoked_at IS NULL AND scope_type = 'BRANCH'::text;

DROP TYPE identity.role_assignment_scope;
