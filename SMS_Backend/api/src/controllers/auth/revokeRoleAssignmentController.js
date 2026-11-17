import catchAsync from '../../utils/catchAsync.js';
import { revokeAssignment } from '../../services/auth/grantService.js';
import {
  getHasuraActiveRole,
  getHasuraSchoolId,
  getHasuraUserId,
} from '../../utils/hasuraPayload.js';
import { PLATFORM_SCHOOL_ID } from '../../constants/platform.js';

export const revokeRoleAssignment = catchAsync(async (req, res) => {
  const { assignment_id: assignmentId } = req.hasuraInput || {};

  const result = await revokeAssignment({
    actorUserId: getHasuraUserId(req),
    actorRole: getHasuraActiveRole(req),
    actorSchoolId: getHasuraSchoolId(req) || PLATFORM_SCHOOL_ID,
    assignmentId,
  });

  res.status(200).json({
    status: 'success',
    message: 'Role assignment revoked.',
    assignment_id: result.assignmentId,
    user_id: result.userId,
  });
});
