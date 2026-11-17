import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { ACCESS_TOKEN_TTL } from '../constants/auth.js';
import { PLATFORM_SCHOOL_ID } from '../constants/platform.js';
import { pickDefaultRole } from '../constants/roles.js';
import { AppError, ERROR_CODES } from './errors.js';

export const comparePassword = (plain, hash) => bcrypt.compare(plain, hash);

const HASURA_CLAIMS_URL = 'https://hasura.io/jwt/claims';

export const signHasuraToken = ({
  id,
  schoolId,
  roles,
  firstName,
  lastName,
  sessionId,
  authzVersion = 0,
  branchId = null,
}) => {
  const allowed = roles?.length ? roles : ['SCHOOL_ADMIN'];
  const claims = {
    'x-hasura-allowed-roles': allowed,
    'x-hasura-default-role': pickDefaultRole(allowed),
    'x-hasura-user-id': String(id),
    'x-hasura-school-id': String(schoolId || PLATFORM_SCHOOL_ID),
    'x-hasura-first-name': firstName || '',
    'x-hasura-last-name': lastName || '',
    'x-hasura-session-id': String(sessionId),
    'x-hasura-authz-version': String(authzVersion),
  };
  if (branchId) {
    claims['x-hasura-branch-id'] = String(branchId);
  }

  return jwt.sign(
    {
      sub: String(id),
      [HASURA_CLAIMS_URL]: claims,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { algorithm: 'HS256', expiresIn: ACCESS_TOKEN_TTL }
  );
};

export const verifyAccessToken = (token) => {
  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {
      algorithms: ['HS256'],
    });
    const claims = payload[HASURA_CLAIMS_URL] || {};
    return { payload, claims };
  } catch {
    throw new AppError('Invalid access token.', 401, ERROR_CODES.TOKEN_INVALID);
  }
};

export const pickRoleForRequest = (claims, requestedRoleHeader) => {
  const allowed = claims['x-hasura-allowed-roles'] || [];
  const allowedList = Array.isArray(allowed) ? allowed : [allowed].filter(Boolean);
  const fallback = claims['x-hasura-default-role'] || pickDefaultRole(allowedList);
  const requested = requestedRoleHeader?.trim();
  if (!requested) return fallback;
  if (!allowedList.includes(requested)) {
    throw new AppError('Role not permitted for this user.', 403, ERROR_CODES.FORBIDDEN);
  }
  return requested;
};

export const hasuraHookHeadersFromClaims = (claims, activeRole) => ({
  'X-Hasura-Role': String(activeRole),
  'X-Hasura-User-Id': String(claims['x-hasura-user-id'] || ''),
  'X-Hasura-School-Id': String(claims['x-hasura-school-id'] || PLATFORM_SCHOOL_ID),
  'X-Hasura-Session-Id': String(claims['x-hasura-session-id'] || ''),
  'X-Hasura-First-Name': String(claims['x-hasura-first-name'] || ''),
  'X-Hasura-Last-Name': String(claims['x-hasura-last-name'] || ''),
  ...(claims['x-hasura-branch-id']
    ? { 'X-Hasura-Branch-Id': String(claims['x-hasura-branch-id']) }
    : {}),
});
