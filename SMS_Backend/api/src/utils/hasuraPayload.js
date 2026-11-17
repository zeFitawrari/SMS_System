import { AppError, ERROR_CODES } from './errors.js';

export const parseHasuraActionInput = (body) => {
  const { input } = body || {};
  if (input?.object != null) return input.object;
  if (input != null && typeof input === 'object') return input;
  return null;
};

export const getHasuraSessionVariables = (req) =>
  req.body?.session_variables || req.hasuraSession || null;

export const getHasuraUserId = (req) => {
  const vars = getHasuraSessionVariables(req);
  const userId = vars?.['x-hasura-user-id'];
  if (!userId) {
    throw new AppError('Authentication required.', 401, ERROR_CODES.UNAUTHORIZED);
  }
  return String(userId);
};

export const getHasuraSessionId = (req) => {
  const vars = getHasuraSessionVariables(req);
  const sessionId = vars?.['x-hasura-session-id'];
  if (!sessionId) {
    throw new AppError('Session context required.', 401, ERROR_CODES.UNAUTHORIZED);
  }
  return String(sessionId);
};

export const getHasuraActiveRole = (req) => {
  const vars = getHasuraSessionVariables(req);
  return String(vars?.['x-hasura-role'] || vars?.['x-hasura-default-role'] || '');
};

export const getHasuraSchoolId = (req) => {
  const vars = getHasuraSessionVariables(req);
  const schoolId = vars?.['x-hasura-school-id'];
  return schoolId ? String(schoolId) : null;
};
