CREATE TABLE identity.auth_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES identity.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  client_ip TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX auth_events_user_id_idx ON identity.auth_events (user_id, created_at DESC);
CREATE INDEX auth_events_type_created_idx ON identity.auth_events (event_type, created_at DESC);

COMMENT ON TABLE identity.auth_events IS 'Security audit trail for authentication (not exposed via Hasura)';
