INSERT INTO tenancy.schools (id, name, slug, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Platform',
  'platform-system',
  'active'
)
ON CONFLICT (id) DO NOTHING;
