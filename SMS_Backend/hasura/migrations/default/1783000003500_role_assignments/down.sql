DROP TABLE IF EXISTS identity.role_assignments;

ALTER TABLE identity.users DROP COLUMN IF EXISTS authz_version;
