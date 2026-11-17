import catchAsync from '../../utils/catchAsync.js';
import { selectAuthContext } from '../../services/auth/contextService.js';
import {
  getHasuraSessionId,
  getHasuraUserId,
} from '../../utils/hasuraPayload.js';
import { formatContextOutput } from './formatContextOutput.js';

export const selectContext = catchAsync(async (req, res) => {
  const { role, branch_id: branchId } = req.hasuraInput || {};
  const userId = getHasuraUserId(req);
  const sessionId = getHasuraSessionId(req);

  const result = await selectAuthContext({
    userId,
    sessionId,
    role,
    branchId: branchId || null,
  });

  res.status(200).json(formatContextOutput(result));
});
