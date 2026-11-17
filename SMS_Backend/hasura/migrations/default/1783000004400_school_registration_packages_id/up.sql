ALTER TABLE finance.school_registration_packages
  ADD COLUMN IF NOT EXISTS id UUID NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS school_registration_packages_id_key
  ON finance.school_registration_packages (id);
