import { AppError, ERROR_CODES } from '../utils/errors.js';

/** At most one role, or PARENT plus exactly one other role. */
export const assertRoleSetAllowed = (roleNames) => {
  const roles = [...new Set((roleNames || []).filter(Boolean))];
  if (roles.length === 0) {
    throw new AppError('User has no assigned roles.', 403, ERROR_CODES.FORBIDDEN);
  }
  if (roles.length === 1) return roles;
  if (roles.length === 2 && roles.includes('PARENT')) return roles;
  throw new AppError(
    'A user may have one role, or PARENT plus one other role only.',
    422,
    ERROR_CODES.VALIDATION_ERROR
  );
};
