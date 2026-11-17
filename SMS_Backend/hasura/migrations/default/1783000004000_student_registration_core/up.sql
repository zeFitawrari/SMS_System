CREATE SCHEMA IF NOT EXISTS academic;
CREATE SCHEMA IF NOT EXISTS student;
CREATE SCHEMA IF NOT EXISTS finance;

CREATE TYPE student.student_sex AS ENUM ('male', 'female');

CREATE TYPE student.guardian_relationship AS ENUM (
  'father',
  'mother',
  'grandfather',
  'grandmother',
  'aunt',
  'uncle',
  'legal_guardian',
  'other'
);

CREATE TYPE student.enrollment_status AS ENUM (
  'active',
  'withdrawn',
  'completed',
  'transferred'
);

CREATE TYPE academic.grade_level_type AS ENUM ('GRADE', 'KG');

CREATE TYPE finance.registration_payment_method AS ENUM ('CASH', 'BANK_TRANSFER');

CREATE TYPE finance.registration_payment_status AS ENUM (
  'pending_verification',
  'confirmed',
  'rejected'
);

CREATE TABLE academic.academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES tenancy.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT academic_years_school_code_key UNIQUE (school_id, code),
  CONSTRAINT academic_years_dates_check CHECK (ends_on > starts_on)
);

CREATE UNIQUE INDEX academic_years_one_current_per_school
  ON academic.academic_years (school_id)
  WHERE is_current;

CREATE TABLE academic.grade_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES tenancy.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  level_type academic.grade_level_type NOT NULL DEFAULT 'GRADE',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT grade_levels_school_code_key UNIQUE (school_id, code)
);

CREATE TABLE academic.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES tenancy.schools(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL,
  academic_year_id UUID NOT NULL REFERENCES academic.academic_years(id) ON DELETE RESTRICT,
  grade_level_id UUID NOT NULL REFERENCES academic.grade_levels(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sections_branch_fk
    FOREIGN KEY (school_id, branch_id)
    REFERENCES tenancy.branches (school_id, id)
    DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT sections_school_branch_year_grade_name_key
    UNIQUE (school_id, branch_id, academic_year_id, grade_level_id, name)
);

CREATE TABLE student.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES tenancy.schools(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL,
  registration_id TEXT NOT NULL,
  user_id UUID REFERENCES identity.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  sex student.student_sex NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT students_branch_fk
    FOREIGN KEY (school_id, branch_id)
    REFERENCES tenancy.branches (school_id, id)
    DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT students_school_registration_id_key UNIQUE (school_id, registration_id)
);

CREATE INDEX students_school_branch_idx ON student.students (school_id, branch_id);
CREATE INDEX students_registration_id_idx ON student.students (registration_id);

CREATE TABLE student.student_health (
  student_id UUID PRIMARY KEY REFERENCES student.students(id) ON DELETE CASCADE,
  medical_conditions TEXT,
  allergies TEXT,
  medications TEXT,
  medical_history TEXT,
  special_needs TEXT,
  emergency_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE student.student_addresses (
  student_id UUID PRIMARY KEY REFERENCES student.students(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'home',
  address_line TEXT,
  latitude DOUBLE PRECISION CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
  longitude DOUBLE PRECISION CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE student.guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES tenancy.schools(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  phone_alt TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT guardians_school_phone_key UNIQUE (school_id, phone)
);

CREATE TABLE student.student_guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student.students(id) ON DELETE CASCADE,
  guardian_id UUID NOT NULL REFERENCES student.guardians(id) ON DELETE RESTRICT,
  relationship student.guardian_relationship NOT NULL,
  is_primary_contact BOOLEAN NOT NULL DEFAULT false,
  is_emergency_contact BOOLEAN NOT NULL DEFAULT false,
  is_authorized_pickup BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT student_guardians_student_guardian_key UNIQUE (student_id, guardian_id)
);

CREATE TABLE student.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student.students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES tenancy.schools(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL,
  academic_year_id UUID NOT NULL REFERENCES academic.academic_years(id) ON DELETE RESTRICT,
  grade_level_id UUID NOT NULL REFERENCES academic.grade_levels(id) ON DELETE RESTRICT,
  section_id UUID REFERENCES academic.sections(id) ON DELETE SET NULL,
  enrolled_on DATE NOT NULL DEFAULT CURRENT_DATE,
  status student.enrollment_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT enrollments_branch_fk
    FOREIGN KEY (school_id, branch_id)
    REFERENCES tenancy.branches (school_id, id)
    DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT enrollments_one_active_per_year
    UNIQUE (student_id, academic_year_id)
);

CREATE INDEX enrollments_school_year_idx ON student.enrollments (school_id, academic_year_id, status);

CREATE TABLE finance.grade_monthly_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES tenancy.schools(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic.academic_years(id) ON DELETE CASCADE,
  grade_level_id UUID NOT NULL REFERENCES academic.grade_levels(id) ON DELETE CASCADE,
  monthly_amount NUMERIC(14, 2) NOT NULL CHECK (monthly_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'ETB',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT grade_monthly_fees_unique UNIQUE (school_id, academic_year_id, grade_level_id)
);

CREATE TABLE finance.registration_payment_packages (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  duration_months INT NOT NULL CHECK (duration_months > 0),
  discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0
);

INSERT INTO finance.registration_payment_packages (code, label, duration_months, discount_percent, sort_order)
VALUES
  ('MONTHLY', 'Monthly', 1, 0, 1),
  ('QUARTERLY', 'Quarterly', 3, 5, 2),
  ('FIVE_MONTH', 'Five month', 5, 10, 3),
  ('TEN_MONTH', 'Ten month', 10, 15, 4)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE finance.registration_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES tenancy.schools(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL,
  student_id UUID NOT NULL REFERENCES student.students(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES student.enrollments(id) ON DELETE RESTRICT,
  package_code TEXT NOT NULL REFERENCES finance.registration_payment_packages(code),
  monthly_fee_snapshot NUMERIC(14, 2) NOT NULL,
  duration_months INT NOT NULL,
  discount_percent NUMERIC(5, 2) NOT NULL,
  base_amount NUMERIC(14, 2) NOT NULL,
  discount_amount NUMERIC(14, 2) NOT NULL,
  final_amount NUMERIC(14, 2) NOT NULL,
  payment_method finance.registration_payment_method NOT NULL,
  transfer_reference TEXT,
  payment_status finance.registration_payment_status NOT NULL,
  paid_on DATE NOT NULL DEFAULT CURRENT_DATE,
  package_starts_on DATE NOT NULL,
  package_ends_on DATE NOT NULL,
  recorded_by UUID REFERENCES identity.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT registration_payments_branch_fk
    FOREIGN KEY (school_id, branch_id)
    REFERENCES tenancy.branches (school_id, id)
    DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT registration_payments_transfer_ref_check CHECK (
    (payment_method = 'BANK_TRANSFER' AND transfer_reference IS NOT NULL AND length(trim(transfer_reference)) > 0)
    OR (payment_method = 'CASH' AND transfer_reference IS NULL)
  )
);

CREATE UNIQUE INDEX registration_payments_transfer_ref_per_school
  ON finance.registration_payments (school_id, transfer_reference)
  WHERE transfer_reference IS NOT NULL;

COMMENT ON COLUMN student.students.registration_id IS 'Immutable human-readable ID: SCHOOL_CODE + YEAR_CODE + random digits';
COMMENT ON TABLE student.enrollments IS 'Academic placement per year; student identity is stable across years';
