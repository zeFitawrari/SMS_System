ALTER TABLE student.students
  ADD COLUMN first_name TEXT,
  ADD COLUMN middle_name TEXT,
  ADD COLUMN last_name TEXT;

UPDATE student.students s
SET
  first_name = u.first_name,
  middle_name = u.middle_name,
  last_name = u.last_name
FROM identity.users u
WHERE s.user_id = u.id;

ALTER TABLE student.students
  ALTER COLUMN first_name SET NOT NULL,
  ALTER COLUMN last_name SET NOT NULL;

ALTER TABLE student.students
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE identity.users
  ALTER COLUMN password_hash SET NOT NULL;

ALTER TABLE identity.users
  DROP COLUMN IF EXISTS middle_name;
