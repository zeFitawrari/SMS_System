import catchAsync from '../../utils/catchAsync.js';
import { listSessionsForUser } from '../../services/auth/sessionManagement.js';
import { formatListMySessionsOutput } from './formatSessionOutput.js';
import { resolveCurrentSessionId } from '../../utils/sessionFromRequest.js';
import { isValidUuid } from '../../utils/uuid.js';

export const listMySessions = catchAsync(async (req, res) => {
  const input = req.hasuraInput || {};
  let currentSessionId = resolveCurrentSessionId(req, input.current_session_id);
  if (currentSessionId && !isValidUuid(currentSessionId)) {
    currentSessionId = null;
  }

  const sessions = await listSessionsForUser(req.authUserId, {
    currentSessionId,
    includeInactive: Boolean(input.include_inactive),
  });

  res.status(200).json(formatListMySessionsOutput(sessions));
});
