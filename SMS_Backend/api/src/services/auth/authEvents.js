import { query } from '../../config/db.js';

export const AUTH_EVENT = {
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  REFRESH_SUCCESS: 'refresh_success',
  REFRESH_FAILURE: 'refresh_failure',
  LOGOUT: 'logout',
  SESSION_REVOKED: 'session_revoked',
  SESSION_REUSE: 'session_reuse',
  AUTH_HOOK_DENY: 'auth_hook_deny',
};

export const recordAuthEvent = async ({
  userId = null,
  eventType,
  clientIp = null,
  userAgent = null,
  metadata = {},
}) => {
  await query(
    `INSERT INTO identity.auth_events (user_id, event_type, client_ip, user_agent, metadata)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [userId, eventType, clientIp, userAgent, JSON.stringify(metadata || {})]
  );
};
