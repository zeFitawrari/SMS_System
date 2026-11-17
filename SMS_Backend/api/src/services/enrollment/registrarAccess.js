import { AppError, ERROR_CODES } from '../../utils/errors.js';
import { PLATFORM_ROLES, SCHOOL_GRANTOR_ROLES } from '../../constants/auth.js';

/** Roles allowed to register students and fetch registration payment quotes. */
const REGISTRAR_ROLES = [
  ...PLATFORM_ROLES,
  ...SCHOOL_GRANTOR_ROLES,
  'BRANCH_ADMIN',
  'RECEPTIONIST',
  'FINANCE',
];

export const assertMayRegisterStudent = (
  actorRole,
  actorSchoolId,
  targetSchoolId,
  actorBranchId,
  targetBranchId
) => {
  if (!REGISTRAR_ROLES.includes(actorRole)) {
    throw new AppError('Forbidden.', 403, ERROR_CODES.FORBIDDEN);
  }
  if (PLATFORM_ROLES.includes(actorRole)) return;

  if (String(actorSchoolId) !== String(targetSchoolId)) {
    throw new AppError('Cannot register students outside your school.', 403, ERROR_CODES.FORBIDDEN);
  }

  if (actorRole === 'BRANCH_ADMIN' && actorBranchId && String(actorBranchId) !== String(targetBranchId)) {
    throw new AppError('Cannot register students outside your branch.', 403, ERROR_CODES.FORBIDDEN);
  }
};
