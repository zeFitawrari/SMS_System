import { AppError, ERROR_CODES } from '../../utils/errors.js';
import { canGrantRoles, PLATFORM_ROLES } from '../../constants/auth.js';

const ENROLLMENT_SECTION_ROLES = [
  ...PLATFORM_ROLES,
  'SCHOOL_OWNER',
  'SCHOOL_ADMIN',
  'BRANCH_ADMIN',
  'RECEPTIONIST',
];

export const assertMayConfigureSchoolAcademics = (actorRole, actorSchoolId, schoolId) => {
  if (!canGrantRoles(actorRole) && !PLATFORM_ROLES.includes(actorRole)) {
    throw new AppError('Forbidden.', 403, ERROR_CODES.FORBIDDEN);
  }
  if (!PLATFORM_ROLES.includes(actorRole) && String(actorSchoolId) !== String(schoolId)) {
    throw new AppError('Cannot configure another school.', 403, ERROR_CODES.FORBIDDEN);
  }
};

export const assertMayManageEnrollmentSection = (
  actorRole,
  actorSchoolId,
  actorBranchId,
  { schoolId, branchId }
) => {
  if (!ENROLLMENT_SECTION_ROLES.includes(actorRole)) {
    throw new AppError('Forbidden.', 403, ERROR_CODES.FORBIDDEN);
  }
  if (PLATFORM_ROLES.includes(actorRole)) return;

  if (String(actorSchoolId) !== String(schoolId)) {
    throw new AppError('Cannot manage enrollments outside your school.', 403, ERROR_CODES.FORBIDDEN);
  }
  if (actorRole === 'BRANCH_ADMIN' && actorBranchId && String(actorBranchId) !== String(branchId)) {
    throw new AppError('Cannot manage enrollments outside your branch.', 403, ERROR_CODES.FORBIDDEN);
  }
};
