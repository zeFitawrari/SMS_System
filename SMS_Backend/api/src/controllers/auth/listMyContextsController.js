import catchAsync from '../../utils/catchAsync.js';
import { listAvailableContexts } from '../../services/auth/contextService.js';
import { getHasuraSchoolId, getHasuraUserId } from '../../utils/hasuraPayload.js';
import { PLATFORM_SCHOOL_ID } from '../../constants/platform.js';
import { formatListContextsOutput } from './formatContextOutput.js';

export const listMyContexts = catchAsync(async (req, res) => {
  const userId = getHasuraUserId(req);
  const schoolId = getHasuraSchoolId(req) || PLATFORM_SCHOOL_ID;
  const contexts = await listAvailableContexts(userId, schoolId);
  res.status(200).json(formatListContextsOutput(contexts));
});
