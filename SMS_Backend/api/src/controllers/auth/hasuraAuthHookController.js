import catchAsync from '../../utils/catchAsync.js';
import {
  hasuraHookHeadersFromClaims,
  pickRoleForRequest,
  verifyAccessToken,
} from '../../utils/auth.js';
import { query } from '../../config/db.js';
import { assertSessionActive } from '../../services/auth/sessionStore.js';
import { resolveContextAssignment } from '../../services/auth/roleAssignments.js';
import { PLATFORM_SCHOOL_ID } from '../../constants/platform.js';
import { recordAuthEvent, AUTH_EVENT } from '../../services/auth/authEvents.js';
import { AppError, ERROR_CODES } from '../../utils/errors.js';

const UNAUTHORIZED_ROLE = process.env.HASURA_UNAUTHORIZED_ROLE || 'anonymous';

const headerFromBody = (headers, name) => {
  if (!headers || typeof headers !== 'object') return undefined;
  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === target) return value;
  }
  return undefined;
};

/**
 * Hasura authentication webhook — validates access JWT + active server session.
 * Replaces Hasura-native JWT mode (see docker HASURA_GRAPHQL_AUTH_HOOK).
 */
export const hasuraAuthHook = catchAsync(async (req, res) => {
  const headers = req.body?.headers || {};
  const authorization = headerFromBody(headers, 'Authorization');
  const clientIp =
    headerFromBody(headers, 'x-forwarded-for')?.split(',')[0]?.trim() ||
    headerFromBody(headers, 'x-real-ip');
  const userAgent = headerFromBody(headers, 'user-agent');

  if (!authorization?.startsWith('Bearer ')) {
    return res.status(200).json({ 'X-Hasura-Role': UNAUTHORIZED_ROLE });
  }

  const token = authorization.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(200).json({ 'X-Hasura-Role': UNAUTHORIZED_ROLE });
  }

  try {
    const { claims } = verifyAccessToken(token);
    const userId = claims['x-hasura-user-id'];
    const sessionId = claims['x-hasura-session-id'];
    await assertSessionActive(sessionId, userId);

    const tokenAuthzVersion = Number(claims['x-hasura-authz-version'] ?? 0);
    const { rows: userRows } = await query(
      `SELECT authz_version FROM identity.users WHERE id = $1`,
      [userId]
    );
    const currentAuthzVersion = Number(userRows[0]?.authz_version ?? 0);
    if (tokenAuthzVersion !== currentAuthzVersion) {
      throw new AppError('Authorization changed. Refresh your session.', 401, ERROR_CODES.UNAUTHORIZED);
    }

    const requestedRole = headerFromBody(headers, 'x-hasura-role');
    const activeRole = pickRoleForRequest(claims, requestedRole);

    const branchId = claims['x-hasura-branch-id'];
    const schoolId = claims['x-hasura-school-id'] || PLATFORM_SCHOOL_ID;
    if (branchId) {
      await resolveContextAssignment(query, userId, schoolId, activeRole, branchId);
    } else {
      await resolveContextAssignment(query, userId, schoolId, activeRole, null);
    }

    return res.status(200).json(hasuraHookHeadersFromClaims(claims, activeRole));
  } catch (err) {
    await recordAuthEvent({
      eventType: AUTH_EVENT.AUTH_HOOK_DENY,
      clientIp,
      userAgent,
      metadata: {
        reason: err instanceof AppError ? err.code : ERROR_CODES.UNAUTHORIZED,
        message: err.message,
      },
    }).catch(() => {});

    if (err instanceof AppError && err.statusCode === 403) {
      return res.status(401).json({ message: err.message });
    }
    return res.status(401).json({ message: 'Unauthorized' });
  }
});
