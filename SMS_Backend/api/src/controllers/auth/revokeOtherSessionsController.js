import catchAsync from '../../utils/catchAsync.js';
import { revokeOtherSessionsForUser } from '../../services/auth/sessionManagement.js';
import { assertValidUuid } from '../../utils/uuid.js';
import { getHasuraSessionId } from '../../utils/hasuraPayload.js';

export const revokeOtherSessions = catchAsync(async (req, res) => {
  let currentSessionId = req.hasuraInput?.current_session_id;
  if (!currentSessionId) {
    currentSessionId = getHasuraSessionId(req);
  } else {
    currentSessionId = assertValidUuid(currentSessionId, 'current_session_id');
  }
  const revokedCount = await revokeOtherSessionsForUser(req.authUserId, currentSessionId);

  res.status(200).json({
    status: 'success',
    message:
      revokedCount > 0
        ? `Revoked ${revokedCount} other session(s).`
        : 'No other active sessions to revoke.',
    revoked_count: revokedCount,
  });
});
