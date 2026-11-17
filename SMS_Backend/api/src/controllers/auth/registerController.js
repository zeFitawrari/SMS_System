import catchAsync from '../../utils/catchAsync.js';
import { getHasuraSessionVariables } from '../../utils/hasuraPayload.js';
import { provisionSchool } from '../../services/tenant/provisionSchool.js';
import { requestMeta } from '../../utils/requestMeta.js';
import { formatLoginOutput } from './formatLoginOutput.js';

/** Hasura RegisterSchool action handler — body matches RegisterSchoolOutput. */
export const registerSchool = catchAsync(async (req, res) => {
  const session = getHasuraSessionVariables(req);
  const provisionedBy = session?.['x-hasura-user-id'] ?? null;

  const result = await provisionSchool(req.hasuraInput, {
    provisionedBy,
    meta: requestMeta(req),
  });

  const auth = formatLoginOutput(result.auth);

  res.status(200).json({
    school_id: result.schoolId,
    main_branch_id: result.mainBranchId,
    admin_id: result.adminId,
    owner_id: result.ownerId,
    access_token: auth.access_token,
    token: auth.access_token,
    session_id: auth.session_id,
    session_token: auth.session_token,
  });
});
