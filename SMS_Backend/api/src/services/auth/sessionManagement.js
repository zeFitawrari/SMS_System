import { query } from '../../config/db.js';
import { AppError, ERROR_CODES } from '../../utils/errors.js';
import { revokeSessionById } from './sessionStore.js';

const isSessionActive = (row) =>
  !row.revoked_at && new Date(row.expires_at).getTime() > Date.now();

const mapSessionRow = (row, currentSessionId) => ({
  sessionId: row.id,
  createdAt: row.created_at,
  lastActiveAt: row.last_active_at,
  expiresAt: row.expires_at,
  revokedAt: row.revoked_at,
  userAgent: row.user_agent,
  clientIp: row.client_ip,
  isActive: isSessionActive(row),
  isCurrent: currentSessionId ? String(row.id) === String(currentSessionId) : false,
});

export const listSessionsForUser = async (userId, { currentSessionId, includeInactive = false } = {}) => {
  const { rows } = await query(
    `SELECT id, created_at, last_active_at, expires_at, revoked_at, user_agent, client_ip
     FROM identity.sessions
     WHERE user_id = $1
       AND (
         (revoked_at IS NULL AND expires_at > NOW())
         OR ($2::boolean = true)
       )
     ORDER BY last_active_at DESC NULLS LAST, created_at DESC`,
    [userId, includeInactive]
  );

  return rows.map((row) => mapSessionRow(row, currentSessionId));
};

export const revokeUserSessionById = async (userId, sessionId) => {
  const revoked = await revokeSessionById(sessionId, userId);
  if (!revoked) {
    throw new AppError('Session not found or already ended.', 404, ERROR_CODES.NOT_FOUND);
  }
  return sessionId;
};

export const revokeOtherSessionsForUser = async (userId, currentSessionId) => {
  const owned = await query(
    `SELECT id FROM identity.sessions
     WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL`,
    [currentSessionId, userId]
  );
  if (!owned.rows[0]) {
    throw new AppError('Current session not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  const { rowCount } = await query(
    `UPDATE identity.sessions SET revoked_at = NOW()
     WHERE user_id = $1
       AND id <> $2
       AND revoked_at IS NULL`,
    [userId, currentSessionId]
  );
  return rowCount;
};
