/** Server config and auth policy (not GraphQL enums — those live in hasura/metadata/actions.graphql). */

export const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '15m';

export const SESSION_TTL_DAYS = Number(
  process.env.SESSION_TTL_DAYS || process.env.REFRESH_TOKEN_TTL_DAYS || 7
);
export const SESSION_TTL_SEC = SESSION_TTL_DAYS * 24 * 60 * 60;

/** Max concurrent server sessions per user (0 = unlimited). Oldest sessions revoked on new login. */
export const MAX_ACTIVE_SESSIONS_PER_USER = Number(process.env.MAX_ACTIVE_SESSIONS_PER_USER || 10);

export const PLATFORM_ROLES = ['SUPER_PROVIDER_ADMIN', 'PROVIDER_ADMIN'];

export const SCHOOL_LOGIN_BLOCKED_STATUSES = ['suspended', 'inactive'];

/** Matches GraphQL `RoleAssignmentScope` and DB `identity.role_assignment_scope`. */
export const ASSIGNMENT_SCOPE = {
  SCHOOL: 'SCHOOL',
  BRANCH: 'BRANCH',
};

export const SCHOOL_GRANTOR_ROLES = ['SCHOOL_OWNER', 'SCHOOL_ADMIN'];

export const canGrantRoles = (roleName) =>
  PLATFORM_ROLES.includes(roleName) || SCHOOL_GRANTOR_ROLES.includes(roleName);
