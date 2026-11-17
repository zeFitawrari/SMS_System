DROP INDEX IF EXISTS finance.school_registration_packages_id_key;

ALTER TABLE finance.school_registration_packages
  DROP COLUMN IF EXISTS id;
