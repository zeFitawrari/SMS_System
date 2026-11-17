DROP TABLE IF EXISTS finance.registration_payments;
DROP TABLE IF EXISTS finance.registration_payment_packages;
DROP TABLE IF EXISTS finance.grade_monthly_fees;
DROP TABLE IF EXISTS student.enrollments;
DROP TABLE IF EXISTS student.student_guardians;
DROP TABLE IF EXISTS student.guardians;
DROP TABLE IF EXISTS student.student_addresses;
DROP TABLE IF EXISTS student.student_health;
DROP TABLE IF EXISTS student.students;
DROP TABLE IF EXISTS academic.sections;
DROP TABLE IF EXISTS academic.grade_levels;
DROP TABLE IF EXISTS academic.academic_years;

DROP TYPE IF EXISTS finance.registration_payment_status;
DROP TYPE IF EXISTS finance.registration_payment_method;
DROP TYPE IF EXISTS academic.grade_level_type;
DROP TYPE IF EXISTS student.enrollment_status;
DROP TYPE IF EXISTS student.guardian_relationship;
DROP TYPE IF EXISTS student.student_sex;

DROP SCHEMA IF EXISTS finance CASCADE;
DROP SCHEMA IF EXISTS student CASCADE;
DROP SCHEMA IF EXISTS academic CASCADE;
