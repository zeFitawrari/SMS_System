ALTER TYPE student.enrollment_status ADD VALUE IF NOT EXISTS 'promoted';

ALTER TABLE student.enrollments
  ADD COLUMN IF NOT EXISTS previous_enrollment_id UUID REFERENCES student.enrollments(id) ON DELETE SET NULL;

CREATE TABLE finance.school_registration_packages (
  school_id UUID NOT NULL REFERENCES tenancy.schools(id) ON DELETE CASCADE,
  package_code TEXT NOT NULL REFERENCES finance.registration_payment_packages(code),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (school_id, package_code)
);

ALTER TABLE finance.registration_payments
  ADD COLUMN IF NOT EXISTS registration_type TEXT NOT NULL DEFAULT 'NEW'
    CHECK (registration_type IN ('NEW', 'PROMOTION'));

COMMENT ON TABLE finance.school_registration_packages IS 'Per-school enabled registration fee packages (amounts from grade_monthly_fees × package).';
