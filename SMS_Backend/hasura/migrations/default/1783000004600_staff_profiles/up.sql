CREATE SCHEMA IF NOT EXISTS staff;

CREATE TABLE staff.staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES tenancy.schools(id) ON DELETE CASCADE,
  branch_id UUID,
  employee_code TEXT,
  job_title TEXT,
  hired_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT staff_profiles_user_school_key UNIQUE (user_id, school_id),
  CONSTRAINT staff_profiles_branch_fk
    FOREIGN KEY (school_id, branch_id)
    REFERENCES tenancy.branches (school_id, id)
    DEFERRABLE INITIALLY DEFERRED
);

CREATE UNIQUE INDEX staff_profiles_school_employee_code_key
  ON staff.staff_profiles (school_id, employee_code)
  WHERE employee_code IS NOT NULL;

CREATE INDEX staff_profiles_school_branch_idx ON staff.staff_profiles (school_id, branch_id);

COMMENT ON TABLE staff.staff_profiles IS 'School staff/teachers: common identity on identity.users; HR fields here';
