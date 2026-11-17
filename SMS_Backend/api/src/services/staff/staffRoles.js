import { ASSIGNMENT_SCOPE } from '../../constants/auth.js';
import { AppError, ERROR_CODES } from '../../utils/errors.js';

/** Roles creatable via ManageUser (not school owners/admins/students/parents). */
export const STAFF_MANAGEABLE_ROLES = [
  'TEACHER',
  'LIBRARIAN',
  'RECEPTIONIST',
  'FINANCE',
  'SCHOOL_STAFF',
  'BRANCH_ADMIN',
];

export const isStaffManageableRole = (role) => STAFF_MANAGEABLE_ROLES.includes(String(role || '').toUpperCase());

/** Load catalog role by id; must be a staff-manageable global role. */
export const resolveStaffRoleById = async (client, roleId) => {
  if (!roleId) {
    throw new AppError('role_id is required.', 422, ERROR_CODES.VALIDATION_ERROR);
  }
  const { rows } = await client.query(
    `SELECT id, name FROM identity.roles WHERE id = $1 AND school_id IS NULL`,
    [roleId]
  );
  const row = rows[0];
  if (!row) {
    throw new AppError('Role not found.', 404, ERROR_CODES.NOT_FOUND);
  }
  const roleName = String(row.name).toUpperCase();
  if (!isStaffManageableRole(roleName)) {
    throw new AppError('This role cannot be assigned via ManageUser.', 422, ERROR_CODES.VALIDATION_ERROR);
  }
  return { id: row.id, name: roleName };
};

export const normalizeScopeType = (scopeType, roleName) => {
  const scope = String(scopeType || '').toUpperCase();
  if (scope === ASSIGNMENT_SCOPE.SCHOOL || scope === ASSIGNMENT_SCOPE.BRANCH) {
    return scope;
  }
  if (roleName === 'FINANCE' || roleName === 'SCHOOL_STAFF') {
    return ASSIGNMENT_SCOPE.SCHOOL;
  }
  return ASSIGNMENT_SCOPE.BRANCH;
};

export const assertScopeMatchesRole = (roleName, scopeType, branchId) => {
  if (scopeType === ASSIGNMENT_SCOPE.BRANCH && !branchId) {
    throw new AppError('branch_id is required for branch-scoped staff.', 422, ERROR_CODES.VALIDATION_ERROR);
  }
  if (scopeType === ASSIGNMENT_SCOPE.SCHOOL && branchId) {
    throw new AppError('branch_id must be omitted for school-scoped staff.', 422, ERROR_CODES.VALIDATION_ERROR);
  }
  if (roleName === 'BRANCH_ADMIN' && scopeType !== ASSIGNMENT_SCOPE.BRANCH) {
    throw new AppError('BRANCH_ADMIN must use BRANCH scope.', 422, ERROR_CODES.VALIDATION_ERROR);
  }
};
