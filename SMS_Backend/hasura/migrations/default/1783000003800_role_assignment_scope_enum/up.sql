-- CHECK constraints and partial indexes compare scope_type to text; drop before type change.
ALTER TABLE identity.role_assignments
  DROP CONSTRAINT IF EXISTS role_assignments_branch_scope_check,
  DROP CONSTRAINT IF EXISTS role_assignments_scope_type_check;

DROP INDEX IF EXISTS identity.role_assignments_one_active_school_scope;
DROP INDEX IF EXISTS identity.role_assignments_one_active_branch_scope;

CREATE TYPE identity.role_assignment_scope AS ENUM ('SCHOOL', 'BRANCH');

ALTER TABLE identity.role_assignments
  ALTER COLUMN scope_type TYPE identity.role_assignment_scope
  USING scope_type::identity.role_assignment_scope;

ALTER TABLE identity.role_assignments
  ADD CONSTRAINT role_assignments_branch_scope_check CHECK (
    (scope_type = 'BRANCH'::identity.role_assignment_scope AND branch_id IS NOT NULL)
    OR (scope_type = 'SCHOOL'::identity.role_assignment_scope AND branch_id IS NULL)
  );

CREATE UNIQUE INDEX role_assignments_one_active_school_scope
  ON identity.role_assignments (user_id, role_id, school_id)
  WHERE revoked_at IS NULL AND scope_type = 'SCHOOL'::identity.role_assignment_scope;

CREATE UNIQUE INDEX role_assignments_one_active_branch_scope
  ON identity.role_assignments (user_id, role_id, school_id, branch_id)
  WHERE revoked_at IS NULL AND scope_type = 'BRANCH'::identity.role_assignment_scope;

COMMENT ON TYPE identity.role_assignment_scope IS 'Aligns with GraphQL RoleAssignmentScope on AssignRole.';
