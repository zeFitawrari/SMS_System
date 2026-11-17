export const formatSessionSummary = (session) => ({
  session_id: session.sessionId,
  created_at: session.createdAt,
  last_active_at: session.lastActiveAt,
  expires_at: session.expiresAt,
  revoked_at: session.revokedAt,
  user_agent: session.userAgent,
  client_ip: session.clientIp,
  is_active: session.isActive,
  is_current: session.isCurrent,
});

export const formatListMySessionsOutput = (sessions) => ({
  sessions: sessions.map(formatSessionSummary),
});
