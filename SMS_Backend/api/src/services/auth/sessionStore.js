import crypto from 'crypto';
import { query, getClient } from '../../config/db.js';
import { MAX_ACTIVE_SESSIONS_PER_USER, SESSION_TTL_SEC } from '../../constants/auth.js';
import { AppError, ERROR_CODES } from '../../utils/errors.js';
import { recordAuthEvent, AUTH_EVENT } from './authEvents.js';

export const hashSessionToken = (plain) =>
  crypto.createHash('sha256').update(String(plain), 'utf8').digest('hex');

const newPlainSessionToken = () => crypto.randomBytes(32).toString('base64url');

const sessionInvalid = (message = 'Invalid session.') =>
  new AppError(message, 401, ERROR_CODES.SESSION_INVALID);

/** Drop oldest active sessions when over per-user limit. */
export const enforceActiveSessionLimit = async (userId, client = null) => {
  if (!MAX_ACTIVE_SESSIONS_PER_USER || MAX_ACTIVE_SESSIONS_PER_USER < 1) return;

  const run = client ? client.query.bind(client) : query;
  const { rows } = await run(
    `SELECT id FROM identity.sessions
     WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW()
     ORDER BY last_active_at ASC, created_at ASC`,
    [userId]
  );

  const excess = rows.length - MAX_ACTIVE_SESSIONS_PER_USER + 1;
  if (excess <= 0) return;

  const toRevoke = rows.slice(0, excess).map((r) => r.id);
  await run(
    `UPDATE identity.sessions SET revoked_at = NOW()
     WHERE id = ANY($1::uuid[]) AND revoked_at IS NULL`,
    [toRevoke]
  );
};

export const createSession = async (
  userId,
  { sessionFamilyId, userAgent, clientIp, activeRole = null, activeBranchId = null } = {}
) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    await enforceActiveSessionLimit(userId, client);

    const plain = newPlainSessionToken();
    const tokenHash = hashSessionToken(plain);
    const family = sessionFamilyId || crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_TTL_SEC * 1000);

    const inserted = await client.query(
      `INSERT INTO identity.sessions
         (user_id, token_hash, session_family_id, expires_at, user_agent, client_ip, last_active_at,
          active_role, active_branch_id)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8)
       RETURNING id`,
      [
        userId,
        tokenHash,
        family,
        expiresAt,
        userAgent || null,
        clientIp || null,
        activeRole,
        activeBranchId,
      ]
    );

    await client.query('COMMIT');
    return {
      sessionId: inserted.rows[0].id,
      sessionToken: plain,
      sessionFamilyId: family,
      expiresAt,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Rotates the opaque session token on the same DB row (one row = one device/session).
 * Reuse of a superseded token revokes the session.
 */
export const rotateSession = async (plainSessionToken, meta = {}) => {
  const tokenHash = hashSessionToken(plainSessionToken);
  const client = await getClient();
  let failureAfterCommit = null;
  let result = null;

  try {
    await client.query('BEGIN');

    const locked = await client.query(
      `SELECT id, user_id, token_hash, previous_token_hash, expires_at, revoked_at
       FROM identity.sessions
       WHERE token_hash = $1 OR previous_token_hash = $1
       FOR UPDATE`,
      [tokenHash]
    );

    const row = locked.rows[0];
    if (!row || row.revoked_at) {
      throw sessionInvalid();
    }

    if (row.previous_token_hash === tokenHash) {
      await client.query(`UPDATE identity.sessions SET revoked_at = NOW() WHERE id = $1`, [row.id]);
      failureAfterCommit = sessionInvalid('Session reuse detected. Please sign in again.');
      await recordAuthEvent({
        userId: row.user_id,
        eventType: AUTH_EVENT.SESSION_REUSE,
        clientIp: meta.clientIp,
        userAgent: meta.userAgent,
        metadata: { session_id: row.id },
      }).catch(() => {});
    } else if (new Date(row.expires_at).getTime() <= Date.now()) {
      await client.query(`UPDATE identity.sessions SET revoked_at = NOW() WHERE id = $1`, [row.id]);
      failureAfterCommit = sessionInvalid('Session expired. Please sign in again.');
    } else {
      const plainNext = newPlainSessionToken();
      const nextHash = hashSessionToken(plainNext);
      const expiresAt = new Date(Date.now() + SESSION_TTL_SEC * 1000);

      await client.query(
        `UPDATE identity.sessions
         SET previous_token_hash = token_hash,
             token_hash = $2,
             expires_at = $3,
             last_active_at = NOW(),
             user_agent = COALESCE($4, user_agent),
             client_ip = COALESCE($5, client_ip)
         WHERE id = $1`,
        [row.id, nextHash, expiresAt, meta.userAgent || null, meta.clientIp || null]
      );

      result = { userId: row.user_id, sessionId: row.id, sessionToken: plainNext };
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  if (failureAfterCommit) throw failureAfterCommit;
  return result;
};

/** Revokes session for opaque refresh token; returns user_id when a row matched (even if already revoked). */
export const revokeSessionByToken = async (plainSessionToken) => {
  const trimmed = plainSessionToken?.trim();
  if (!trimmed) return { revoked: false, userId: null, sessionId: null };

  const hash = hashSessionToken(trimmed);

  const { rows: revokedRows } = await query(
    `UPDATE identity.sessions SET revoked_at = NOW()
     WHERE (token_hash = $1 OR previous_token_hash = $1) AND revoked_at IS NULL
     RETURNING user_id, id`,
    [hash]
  );
  if (revokedRows[0]) {
    return {
      revoked: true,
      userId: revokedRows[0].user_id,
      sessionId: revokedRows[0].id,
    };
  }

  const { rows: existing } = await query(
    `SELECT user_id, id FROM identity.sessions
     WHERE token_hash = $1 OR previous_token_hash = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [hash]
  );
  const row = existing[0];
  return {
    revoked: false,
    userId: row?.user_id ?? null,
    sessionId: row?.id ?? null,
  };
};

export const revokeSessionById = async (sessionId, userId) => {
  const { rowCount } = await query(
    `UPDATE identity.sessions SET revoked_at = NOW()
     WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL`,
    [sessionId, userId]
  );
  return rowCount > 0;
};

/** Ends all active sessions for the user (e.g. logout with access JWT only). */
export const revokeAllSessionsForUser = async (userId) => {
  await query(
    `UPDATE identity.sessions SET revoked_at = NOW()
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );
};

export const updateSessionContext = async (sessionId, userId, activeRole, activeBranchId = null) => {
  const { rowCount } = await query(
    `UPDATE identity.sessions
     SET active_role = $3, active_branch_id = $4, last_active_at = NOW()
     WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL`,
    [sessionId, userId, activeRole, activeBranchId]
  );
  if (!rowCount) {
    throw sessionInvalid();
  }
};

export const getSessionContext = async (sessionId, userId) => {
  const { rows } = await query(
    `SELECT id, active_role, active_branch_id
     FROM identity.sessions
     WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL AND expires_at > NOW()`,
    [sessionId, userId]
  );
  return rows[0] || null;
};

export const assertSessionActive = async (sessionId, userId) => {
  if (!sessionId || !userId) {
    throw sessionInvalid();
  }
  const { rows } = await query(
    `SELECT 1 FROM identity.sessions
     WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL AND expires_at > NOW()`,
    [sessionId, userId]
  );
  if (!rows[0]) {
    throw sessionInvalid('Session expired or revoked.');
  }
};
