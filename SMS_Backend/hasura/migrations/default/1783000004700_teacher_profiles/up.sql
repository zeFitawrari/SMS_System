CREATE SCHEMA IF NOT EXISTS teacher;

CREATE TYPE teacher.education_level AS ENUM (
  'CERTIFICATE',
  'DIPLOMA',
  'BACHELOR',
  'MASTER',
  'DOCTORATE',
  'OTHER'
);

CREATE TYPE teacher.employment_type AS ENUM (
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT'
);

CREATE TABLE teacher.teacher_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_profile_id UUID NOT NULL UNIQUE REFERENCES staff.staff_profiles(id) ON DELETE CASCADE,
  education_level teacher.education_level,
  field_of_study TEXT,
  academic_background TEXT,
  years_of_experience INT CHECK (years_of_experience IS NULL OR years_of_experience >= 0),
  teaching_license_number TEXT,
  employment_type teacher.employment_type,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX teacher_profiles_staff_profile_idx ON teacher.teacher_profiles (staff_profile_id);

COMMENT ON TABLE teacher.teacher_profiles IS 'Teacher-specific academic/HR fields; identity on identity.users, employment on staff.staff_profiles';
