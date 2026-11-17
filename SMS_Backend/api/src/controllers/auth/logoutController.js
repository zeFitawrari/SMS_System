import catchAsync from '../../utils/catchAsync.js';
import { AppError, ERROR_CODES } from '../../utils/errors.js';
import { getHasuraSessionId, getHasuraUserId } from '../../utils/hasuraPayload.js';
import { revokeAllSessionsForUser, revokeSessionByToken } from '../../services/auth/sessionStore.js';
import { recordAuthEvent, AUTH_EVENT } from '../../services/auth/authEvents.js';
import { requestMeta } from '../../utils/requestMeta.js';

/**
 * Logout — server-side session revocation (access JWT alone is not enough after this).
 * - session_token: revoke that device session (Login/Refresh anonymous Logout).
 * - access JWT (session_variables): revoke all sessions for the user.
 */
export const logout = catchAsync(async (req, res) => {
  const meta = requestMeta(req);
  const sessionToken = req.hasuraInput?.session_token?.trim();

  let userId = null;
  let sessionId = null;
  let revokedAny = false;

  if (sessionToken) {
    const result = await revokeSessionByToken(sessionToken);
    userId = result.userId;
    sessionId = result.sessionId;
    revokedAny = result.revoked;
  } else {
    userId = getHasuraUserId(req);
    try {
      sessionId = getHasuraSessionId(req);
    } catch {
      sessionId = null;
    }
    await revokeAllSessionsForUser(userId);
    revokedAny = true;
  }

  if (!userId) {
    try {
      userId = getHasuraUserId(req);
    } catch {
      /* anonymous logout with unknown token */
    }
  }

  if (!sessionToken && !userId) {
    throw new AppError('Provide session_token or sign in to log out.', 401, ERROR_CODES.UNAUTHORIZED);
  }

  await recordAuthEvent({
    userId,
    eventType: AUTH_EVENT.LOGOUT,
    clientIp: meta.clientIp,
    userAgent: meta.userAgent,
    metadata: {
      via_session_token: Boolean(sessionToken),
      session_id: sessionId,
      revoked: revokedAny,
    },
  }).catch(() => {});

  res.status(200).json({
    status: 'success',
    message: revokedAny ? 'Logged out successfully' : 'Already logged out',
  });
});
