INSERT INTO identity.roles (name, school_id)
SELECT role_name, NULL
FROM unnest(ARRAY[
  'SUPER_PROVIDER_ADMIN',
  'PROVIDER_ADMIN',
  'SCHOOL_OWNER',
  'SCHOOL_ADMIN',
  'BRANCH_ADMIN',
  'FINANCE',
  'TEACHER',
  'STUDENT',
  'PARENT',
  'LIBRARIAN',
  'RECEPTIONIST',
  'SCHOOL_STAFF'
]) AS roles(role_name)
WHERE NOT EXISTS (
  SELECT 1 FROM identity.roles r
  WHERE r.name = role_name AND r.school_id IS NULL
);
