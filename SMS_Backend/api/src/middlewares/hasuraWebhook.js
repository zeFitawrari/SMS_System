import { AppError, ERROR_CODES } from '../utils/errors.js';
import { parseHasuraActionInput } from '../utils/hasuraPayload.js';
import catchAsync from '../utils/catchAsync.js';

const ACTION_SECRET_HEADER = 'x-hasura-action-secret';

const assertActionSecret = (req) => {
  const secret = req.headers[ACTION_SECRET_HEADER];
  if (!secret || secret !== process.env.ACTION_SECRET) {
    throw new AppError('Invalid or missing action secret.', 401, ERROR_CODES.UNAUTHORIZED);
  }
};

/**
 * Trust boundary for all Hasura synchronous action webhooks.
 * Caller JWT and roles are already enforced by Hasura before this runs.
 */
export const verifyHasuraWebhook = catchAsync(async (req, _res, next) => {
  assertActionSecret(req);
  req.hasuraSession = req.body?.session_variables || null;
  req.hasuraInput = parseHasuraActionInput(req.body);
  next();
});
