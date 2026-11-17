-- Common person fields live on identity.users; student.students holds enrollment identity only.

ALTER TABLE identity.users
  ADD COLUMN IF NOT EXISTS middle_name TEXT;

ALTER TABLE identity.users
  ALTER COLUMN password_hash DROP NOT NULL;

COMMENT ON COLUMN identity.users.password_hash IS 'NULL until the user is invited to log in (students, etc.)';
COMMENT ON COLUMN identity.users.middle_name IS 'Shared profile field for all user kinds';

-- Link existing student rows to profile users (internal email until real contact is set).
DO $$
DECLARE
  r RECORD;
  uid UUID;
BEGIN
  FOR r IN
    SELECT id, school_id, first_name, middle_name, last_name
    FROM student.students
    WHERE user_id IS NULL
  LOOP
    uid := gen_random_uuid();
    INSERT INTO identity.users (
      id, email, password_hash, school_id, first_name, middle_name, last_name, status
    ) VALUES (
      uid,
      'student-' || uid::text || '@profile.internal',
      NULL,
      r.school_id,
      r.first_name,
      r.middle_name,
      r.last_name,
      'active'
    );
    UPDATE student.students SET user_id = uid WHERE id = r.id;
  END LOOP;
END $$;

ALTER TABLE student.students
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE student.students
  DROP COLUMN first_name,
  DROP COLUMN middle_name,
  DROP COLUMN last_name;

COMMENT ON COLUMN student.students.user_id IS 'Shared identity profile (identity.users); login credentials added later';
COMMENT ON TABLE student.students IS 'Student-specific enrollment identity; names live on identity.users';
