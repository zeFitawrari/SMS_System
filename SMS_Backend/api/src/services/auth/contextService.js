import { query } from '../../config/db.js';
import { signHasuraToken } from '../../utils/auth.js';
import { PLATFORM_SCHOOL_ID } from '../../constants/platform.js';
import { AppError, ERROR_CODES } from '../../utils/errors.js';
import {
  loadActiveAssignmentRoles,
  loadActiveAssignments,
  resolveContextAssignment,
} from './roleAssignments.js';
import { updateSessionContext, getSessionContext } from './sessionStore.js';

const loadUserPublic = async (userId) => {
  const { rows } = await query(
    `SELECT id, email, phone, school_id, authz_version, first_name, last_name, status
     FROM identity.users WHERE id = $1`,
    [userId]
  );
  return rows[0] || null;
};

export const listAvailableContexts = async (userId, schoolId) => {
  const assignments = await loadActiveAssignments(query, userId, schoolId);
  return assignments.map((row) => ({
    assignmentId: row.assignment_id,
    role: row.role_name,
    scopeType: row.scope_type,
    branchId: row.branch_id,
    branchName: row.branch_name,
    branchCode: row.branch_code,
  }));
};

export const selectAuthContext = async ({
  userId,
  sessionId,
  role,
  branchId = null,
}) => {
  const user = await loadUserPublic(userId);
  if (!user) {
    throw new AppError('User not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  const schoolId = user.school_id || PLATFORM_SCHOOL_ID;
  await resolveContextAssignment(query, userId, schoolId, role, branchId);

  const ctx = await getSessionContext(sessionId, userId);
  if (!ctx) {
    throw new AppError('Session not found.', 401, ERROR_CODES.SESSION_INVALID);
  }

  const branchForToken = branchId || null;
  await updateSessionContext(sessionId, userId, role, branchForToken);

  const accessToken = signHasuraToken({
    id: user.id,
    schoolId,
    roles: [role],
    firstName: user.first_name,
    lastName: user.last_name,
    sessionId,
    authzVersion: Number(user.authz_version ?? 0),
    branchId: branchForToken,
  });

  const allRoles = await loadActiveAssignmentRoles(query, userId, schoolId);

  return {
    user,
    schoolId,
    activeRole: role,
    activeBranchId: branchForToken,
    sessionId,
    accessToken,
    availableRoles: allRoles,
  };
};

export const mintTokenFromSessionContext = async (userId, sessionId) => {
  const user = await loadUserPublic(userId);
  if (!user) {
    throw new AppError('Invalid session.', 401, ERROR_CODES.SESSION_INVALID);
  }

  const schoolId = user.school_id || PLATFORM_SCHOOL_ID;
  let ctx = await getSessionContext(sessionId, userId);
  if (!ctx) {
    throw new AppError('Invalid session.', 401, ERROR_CODES.SESSION_INVALID);
  }

  if (!ctx.active_role) {
    const roles = await loadActiveAssignmentRoles(query, userId, schoolId);
    const role = roles[0];
    await updateSessionContext(sessionId, userId, role, null);
    ctx = { ...ctx, active_role: role, active_branch_id: null };
  }

  if (ctx.active_role && ctx.active_branch_id) {
    await resolveContextAssignment(
      query,
      userId,
      schoolId,
      ctx.active_role,
      ctx.active_branch_id
    );
  } else if (ctx.active_role) {
    await resolveContextAssignment(query, userId, schoolId, ctx.active_role, null);
  }

  const accessToken = signHasuraToken({
    id: user.id,
    schoolId,
    roles: [ctx.active_role],
    firstName: user.first_name,
    lastName: user.last_name,
    sessionId,
    authzVersion: Number(user.authz_version ?? 0),
    branchId: ctx.active_branch_id,
  });

  const allRoles = await loadActiveAssignmentRoles(query, userId, schoolId);

  return { user, schoolId, accessToken, activeRole: ctx.active_role, activeBranchId: ctx.active_branch_id, allRoles };
};
