CREATE TABLE IF NOT EXISTS identity.userroles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES identity.roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role_id)
);

INSERT INTO identity.userroles (user_id, role_id)
SELECT ra.user_id, ra.role_id
FROM identity.role_assignments ra
WHERE ra.revoked_at IS NULL AND ra.scope_type = 'SCHOOL'
ON CONFLICT DO NOTHING;
