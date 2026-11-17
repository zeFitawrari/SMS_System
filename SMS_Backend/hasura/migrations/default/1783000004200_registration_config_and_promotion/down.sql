ALTER TABLE finance.registration_payments DROP COLUMN IF EXISTS registration_type;

DROP TABLE IF EXISTS finance.school_registration_packages;

ALTER TABLE student.enrollments DROP COLUMN IF EXISTS previous_enrollment_id;
