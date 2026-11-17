import catchAsync from '../../utils/catchAsync.js';
import { assignRoleToUser } from '../../services/auth/grantService.js';
import {
  getHasuraActiveRole,
  getHasuraSchoolId,
  getHasuraUserId,
} from '../../utils/hasuraPayload.js';
import { PLATFORM_SCHOOL_ID } from '../../constants/platform.js';

export const assignRole = catchAsync(async (req, res) => {
  const {
    user_id: targetUserId,
    role,
    scope_type: scopeType,
    branch_id: branchId,
  } = req.hasuraInput || {};

  const result = await assignRoleToUser({
    actorUserId: getHasuraUserId(req),
    actorRole: getHasuraActiveRole(req),
    actorSchoolId: getHasuraSchoolId(req) || PLATFORM_SCHOOL_ID,
    targetUserId,
    roleName: role,
    scopeType,
    branchId: branchId || null,
  });

  res.status(200).json({
    status: 'success',
    user_id: result.targetUserId,
    role: result.roleName,
    scope_type: result.scopeType,
    branch_id: result.branchId,
    school_id: result.schoolId,
  });
});
