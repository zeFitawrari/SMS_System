import catchAsync from '../../utils/catchAsync.js';
import { revokeUserSessionById } from '../../services/auth/sessionManagement.js';
import { assertValidUuid } from '../../utils/uuid.js';
import { recordAuthEvent, AUTH_EVENT } from '../../services/auth/authEvents.js';
import { requestMeta } from '../../utils/requestMeta.js';

export const revokeSession = catchAsync(async (req, res) => {
  const sessionId = assertValidUuid(req.hasuraInput?.session_id, 'session_id');
  const revokedId = await revokeUserSessionById(req.authUserId, sessionId);

  const meta = requestMeta(req);
  await recordAuthEvent({
    userId: req.authUserId,
    eventType: AUTH_EVENT.SESSION_REVOKED,
    clientIp: meta.clientIp,
    userAgent: meta.userAgent,
    metadata: { session_id: revokedId, via: 'RevokeSession' },
  }).catch(() => {});

  res.status(200).json({
    status: 'success',
    message: 'Session revoked.',
    revoked_session_id: revokedId,
  });
});
