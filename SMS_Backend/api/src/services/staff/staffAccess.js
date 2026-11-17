import { AppError, ERROR_CODES } from '../../utils/errors.js';
import { canGrantRoles, PLATFORM_ROLES } from '../../constants/auth.js';

export const assertMayManageStaffUsers = (actorRole, actorSchoolId, schoolId) => {
  if (!canGrantRoles(actorRole) && !PLATFORM_ROLES.includes(actorRole)) {
    throw new AppError('Forbidden.', 403, ERROR_CODES.FORBIDDEN);
  }
  if (!PLATFORM_ROLES.includes(actorRole) && String(actorSchoolId) !== String(schoolId)) {
    throw new AppError('Cannot manage staff outside your school.', 403, ERROR_CODES.FORBIDDEN);
  }
};
