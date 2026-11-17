import { getClient, query } from '../../config/db.js';
import { PLATFORM_SCHOOL_ID } from '../../constants/platform.js';
import { ASSIGNMENT_SCOPE, canGrantRoles, PLATFORM_ROLES } from '../../constants/auth.js';
import { AppError, ERROR_CODES } from '../../utils/errors.js';
import {
  grantBranchScopeRole,
  grantSchoolScopeRoles,
  revokeRoleAssignmentById,
} from './roleAssignments.js';

export const assertActorMayGrant = (actorRole, actorSchoolId, targetSchoolId) => {
  if (!canGrantRoles(actorRole)) {
    throw new AppError('Forbidden.', 403, ERROR_CODES.FORBIDDEN);
  }
  if (PLATFORM_ROLES.includes(actorRole)) return;
  if (String(actorSchoolId) !== String(targetSchoolId)) {
    throw new AppError('Cannot manage roles outside your school.', 403, ERROR_CODES.FORBIDDEN);
  }
};

const loadTargetUser = async (client, userId) => {
  const { rows } = await client.query(
    `SELECT id, school_id FROM identity.users WHERE id = $1`,
    [userId]
  );
  return rows[0] || null;
};

export const assignRoleToUser = async ({
  actorUserId,
  actorRole,
  actorSchoolId,
  targetUserId,
  roleName,
  scopeType,
  branchId,
}) => {
  if (scopeType === ASSIGNMENT_SCOPE.BRANCH && !branchId) {
    throw new AppError('branch_id is required for BRANCH scope.', 422, ERROR_CODES.VALIDATION_ERROR);
  }
  if (scopeType === ASSIGNMENT_SCOPE.SCHOOL && branchId) {
    throw new AppError('branch_id must be omitted for SCHOOL scope.', 422, ERROR_CODES.VALIDATION_ERROR);
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');
    const target = await loadTargetUser(client, targetUserId);
    if (!target) {
      throw new AppError('User not found.', 404, ERROR_CODES.NOT_FOUND);
    }
    const schoolId = target.school_id || PLATFORM_SCHOOL_ID;
    assertActorMayGrant(actorRole, actorSchoolId, schoolId);

    if (scopeType === ASSIGNMENT_SCOPE.BRANCH) {
      await grantBranchScopeRole(client, {
        userId: targetUserId,
        schoolId,
        branchId,
        roleName,
        grantedBy: actorUserId,
      });
    } else {
      await grantSchoolScopeRoles(client, {
        userId: targetUserId,
        schoolId,
        roleNames: [roleName],
        grantedBy: actorUserId,
      });
    }

    await client.query('COMMIT');
    return { targetUserId, roleName, scopeType, branchId, schoolId };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const revokeAssignment = async ({
  actorUserId,
  actorRole,
  actorSchoolId,
  assignmentId,
}) => {
  const { rows } = await query(
    `SELECT ra.id, ra.school_id FROM identity.role_assignments ra WHERE ra.id = $1 AND ra.revoked_at IS NULL`,
    [assignmentId]
  );
  const row = rows[0];
  if (!row) {
    throw new AppError('Role assignment not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  assertActorMayGrant(actorRole, actorSchoolId, row.school_id);

  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await revokeRoleAssignmentById(client, {
      assignmentId,
      schoolId: row.school_id,
      actorUserId,
    });
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
