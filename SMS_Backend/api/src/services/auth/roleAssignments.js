import { assertRoleSetAllowed } from '../../constants/rolePolicy.js';
import { ASSIGNMENT_SCOPE } from '../../constants/auth.js';
import { AppError, ERROR_CODES } from '../../utils/errors.js';
import { DEFAULT_ROLE_PRIORITY, pickDefaultRole } from '../../constants/roles.js';

const resolveRoleIds = async (client, roleNames) => {
  const { rows } = await client.query(
    `SELECT id, name FROM identity.roles
     WHERE name = ANY($1::text[]) AND school_id IS NULL`,
    [roleNames]
  );
  if (rows.length !== roleNames.length) {
    const found = new Set(rows.map((r) => r.name));
    const missing = roleNames.filter((n) => !found.has(n));
    throw new AppError(`Role catalog incomplete: ${missing.join(', ')}`, 500, ERROR_CODES.INTERNAL_ERROR);
  }
  return rows;
};

export const bumpAuthzVersion = async (client, userId) => {
  await client.query(
    `UPDATE identity.users SET authz_version = authz_version + 1, updated_at = NOW() WHERE id = $1`,
    [userId]
  );
};

export const grantRoleAssignment = async (
  client,
  {
    userId,
    schoolId,
    roleId,
    roleName,
    scopeType = ASSIGNMENT_SCOPE.SCHOOL,
    branchId = null,
    grantedBy = null,
  }
) => {
  if (scopeType === ASSIGNMENT_SCOPE.BRANCH && !branchId) {
    throw new AppError('branch_id is required for BRANCH scope.', 422, ERROR_CODES.VALIDATION_ERROR);
  }
  if (scopeType === ASSIGNMENT_SCOPE.SCHOOL && branchId) {
    throw new AppError('branch_id must be null for SCHOOL scope.', 422, ERROR_CODES.VALIDATION_ERROR);
  }

  const active = await client.query(
    `SELECT 1 FROM identity.role_assignments
     WHERE user_id = $1 AND role_id = $2 AND school_id = $3
       AND scope_type = $4 AND revoked_at IS NULL
       AND (
         ($4 = 'SCHOOL' AND branch_id IS NULL)
         OR ($4 = 'BRANCH' AND branch_id = $5)
       )`,
    [userId, roleId, schoolId, scopeType, branchId]
  );
  if (active.rows[0]) {
    return { roleName, scopeType, branchId, inserted: false };
  }

  await client.query(
    `INSERT INTO identity.role_assignments
       (user_id, school_id, role_id, scope_type, branch_id, granted_by)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, schoolId, roleId, scopeType, branchId, grantedBy]
  );

  await bumpAuthzVersion(client, userId);

  return { roleName, scopeType, branchId, inserted: true };
};

export const grantSchoolScopeRoles = async (
  client,
  { userId, schoolId, roleNames, grantedBy = null }
) => {
  const names = assertRoleSetAllowed(roleNames);
  const roles = await resolveRoleIds(client, names);
  const results = [];
  for (const role of roles) {
    results.push(
      await grantRoleAssignment(client, {
        userId,
        schoolId,
        roleId: role.id,
        roleName: role.name,
        scopeType: ASSIGNMENT_SCOPE.SCHOOL,
        branchId: null,
        grantedBy,
      })
    );
  }
  return results;
};

export const grantBranchScopeRole = async (
  client,
  { userId, schoolId, branchId, roleName, grantedBy = null }
) => {
  assertRoleSetAllowed([roleName]);
  const roles = await resolveRoleIds(client, [roleName]);
  return grantRoleAssignment(client, {
    userId,
    schoolId,
    roleId: roles[0].id,
    roleName,
    scopeType: ASSIGNMENT_SCOPE.BRANCH,
    branchId,
    grantedBy,
  });
};

export const revokeRoleAssignmentById = async (client, { assignmentId, schoolId, actorUserId }) => {
  const { rows } = await client.query(
    `SELECT ra.id, ra.user_id, ra.school_id
     FROM identity.role_assignments ra
     WHERE ra.id = $1 AND ra.school_id = $2 AND ra.revoked_at IS NULL`,
    [assignmentId, schoolId]
  );
  const row = rows[0];
  if (!row) {
    throw new AppError('Role assignment not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  await client.query(
    `UPDATE identity.role_assignments SET revoked_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [assignmentId]
  );
  await bumpAuthzVersion(client, row.user_id);

  return { assignmentId, userId: row.user_id, revokedBy: actorUserId };
};

export const loadActiveAssignmentRoles = async (queryFn, userId, schoolId) => {
  const { rows } = await queryFn(
    `SELECT DISTINCT r.name
     FROM identity.role_assignments ra
     INNER JOIN identity.roles r ON r.id = ra.role_id
     WHERE ra.user_id = $1
       AND ra.school_id = $2
       AND ra.revoked_at IS NULL`,
    [userId, schoolId]
  );

  if (rows.length === 0) {
    throw new AppError('User has no assigned roles.', 403, ERROR_CODES.FORBIDDEN);
  }

  const names = rows.map((r) => r.name);
  names.sort((a, b) => DEFAULT_ROLE_PRIORITY.indexOf(a) - DEFAULT_ROLE_PRIORITY.indexOf(b));
  return assertRoleSetAllowed(names);
};

export const loadActiveAssignments = async (queryFn, userId, schoolId) => {
  const { rows } = await queryFn(
    `SELECT ra.id AS assignment_id, ra.scope_type, ra.branch_id, r.name AS role_name,
            b.name AS branch_name, b.code AS branch_code
     FROM identity.role_assignments ra
     INNER JOIN identity.roles r ON r.id = ra.role_id
     LEFT JOIN tenancy.branches b ON b.id = ra.branch_id
     WHERE ra.user_id = $1
       AND ra.school_id = $2
       AND ra.revoked_at IS NULL
     ORDER BY r.name, b.name NULLS FIRST`,
    [userId, schoolId]
  );
  return rows;
};

/** Resolve an active assignment matching role + optional branch for SelectContext. */
export const resolveContextAssignment = async (queryFn, userId, schoolId, roleName, branchIdInput) => {
  const { rows } = await queryFn(
    `SELECT ra.id, ra.scope_type, ra.branch_id, r.name AS role_name
     FROM identity.role_assignments ra
     INNER JOIN identity.roles r ON r.id = ra.role_id
     WHERE ra.user_id = $1
       AND ra.school_id = $2
       AND ra.revoked_at IS NULL
       AND r.name = $3`,
    [userId, schoolId, roleName]
  );

  if (rows.length === 0) {
    throw new AppError('Role not assigned to this user.', 403, ERROR_CODES.FORBIDDEN);
  }

  const branchScoped = rows.filter((r) => r.scope_type === ASSIGNMENT_SCOPE.BRANCH);
  const schoolScoped = rows.filter((r) => r.scope_type === ASSIGNMENT_SCOPE.SCHOOL);

  if (branchScoped.length > 0) {
    if (!branchIdInput) {
      throw new AppError('branch_id is required for this role.', 422, ERROR_CODES.VALIDATION_ERROR);
    }
    const match = branchScoped.find((r) => String(r.branch_id) === String(branchIdInput));
    if (!match) {
      throw new AppError('Branch not authorized for this role.', 403, ERROR_CODES.FORBIDDEN);
    }
    return match;
  }

  const schoolGrant = schoolScoped[0];
  if (!schoolGrant) {
    throw new AppError('Invalid role context.', 403, ERROR_CODES.FORBIDDEN);
  }
  if (branchIdInput) {
    throw new AppError('branch_id must be omitted for school-wide roles.', 422, ERROR_CODES.VALIDATION_ERROR);
  }
  return schoolGrant;
};

export const defaultActiveRole = (roleNames) => pickDefaultRole(roleNames);
