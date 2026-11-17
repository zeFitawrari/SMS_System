import catchAsync from '../../utils/catchAsync.js';
import { refreshAuthSession } from '../../services/auth/login.js';
import { requestMeta } from '../../utils/requestMeta.js';
import { formatLoginOutput } from './formatLoginOutput.js';

/** Hasura RefreshSession action — same shape as LoginOutput */
export const refresh = catchAsync(async (req, res) => {
  const { session_token: sessionToken } = req.hasuraInput || {};
  const session = await refreshAuthSession(sessionToken, requestMeta(req));
  res.status(200).json(formatLoginOutput(session));
});
