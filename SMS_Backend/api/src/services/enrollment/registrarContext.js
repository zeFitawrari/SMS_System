import { AppError, ERROR_CODES } from '../../utils/errors.js';
import { PLATFORM_ROLES } from '../../constants/auth.js';
import { PLATFORM_SCHOOL_ID } from '../../constants/platform.js';

const resolveSchoolId = (input, actorSchoolId, platform) => {
  let schoolId = input?.school_id ? String(input.school_id) : null;
  if (!schoolId && actorSchoolId && actorSchoolId !== PLATFORM_SCHOOL_ID) {
    schoolId = String(actorSchoolId);
  }
  if (platform && !schoolId) {
    throw new AppError('school_id is required for platform operators.', 422, ERROR_CODES.VALIDATION_ERROR);
  }
  if (!schoolId) {
    throw new AppError(
      'school_id is required. Select a school context or pass school_id.',
      422,
      ERROR_CODES.VALIDATION_ERROR
    );
  }
  return schoolId;
};

/** When JWT has no branch (school-wide role), use the only active branch if there is exactly one. */
const inferBranchIdForSchool = async (client, schoolId) => {
  const { rows } = await client.query(
    `SELECT id FROM tenancy.branches
     WHERE school_id = $1 AND status = 'active'
     ORDER BY is_main DESC, created_at ASC`,
    [schoolId]
  );
  if (rows.length === 1) {
    return String(rows[0].id);
  }
  return null;
};

const assertActiveBranchForSchool = async (client, schoolId, branchId) => {
  const { rowCount } = await client.query(
    `SELECT 1 FROM tenancy.branches WHERE id = $1 AND school_id = $2 AND status = 'active'`,
    [branchId, schoolId]
  );
  if (!rowCount) {
    throw new AppError('Invalid or inactive branch for this school.', 422, ERROR_CODES.VALIDATION_ERROR);
  }
};

/**
 * Resolves school/branch for registrar flows: input → JWT → single-branch fallback (needs DB client).
 */
export const resolveRegistrarTenant = async (client, input, { actorRole, actorSchoolId, actorBranchId }) => {
  const platform = PLATFORM_ROLES.includes(actorRole);
  const schoolId = resolveSchoolId(input, actorSchoolId, platform);

  let branchId = input?.branch_id ? String(input.branch_id) : null;
  if (!branchId && actorBranchId) {
    branchId = String(actorBranchId);
  }
  if (!branchId && client) {
    branchId = await inferBranchIdForSchool(client, schoolId);
  }

  if (!branchId) {
    throw new AppError(
      'branch_id is required. School-wide roles (e.g. SCHOOL_ADMIN) have no branch in the token — pass branch_id in the request, or use a branch-scoped role via SelectContext.',
      422,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  if (client) {
    await assertActiveBranchForSchool(client, schoolId, branchId);
  }

  return { schoolId, branchId };
};
