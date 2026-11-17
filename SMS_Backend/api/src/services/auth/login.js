import { query } from '../../config/db.js';
import { comparePassword } from '../../utils/auth.js';
import { AppError, ERROR_CODES } from '../../utils/errors.js';
import { PLATFORM_SCHOOL_ID } from '../../constants/platform.js';
import {
  PLATFORM_ROLES,
  SCHOOL_LOGIN_BLOCKED_STATUSES,
} from '../../constants/auth.js';
import { assertRoleSetAllowed } from '../../constants/rolePolicy.js';
import { normalizePhone } from '../../utils/phone.js';
import { createSession, rotateSession } from './sessionStore.js';
import { recordAuthEvent, AUTH_EVENT } from './authEvents.js';
import { defaultActiveRole, loadActiveAssignmentRoles } from './roleAssignments.js';
import { mintTokenFromSessionContext } from './contextService.js';

const USER_AUTH_SELECT = `u.id, u.email, u.phone, u.password_hash, u.school_id, u.authz_version, u.first_name, u.last_name, u.status,
            s.status AS school_status`;

const USER_PUBLIC_SELECT = `u.id, u.email, u.phone, u.school_id, u.authz_version, u.first_name, u.last_name, u.status,
            s.status AS school_status`;

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const loadUserByEmail = async (email) => {
  const { rows } = await query(
    `SELECT ${USER_AUTH_SELECT}
     FROM identity.users u
     LEFT JOIN tenancy.schools s ON s.id = u.school_id
     WHERE lower(u.email) = $1`,
    [normalizeEmail(email)]
  );
  return rows[0] || null;
};

const loadUserByPhone = async (phone) => {
  const normalized = normalizePhone(phone);
  const { rows } = await query(
    `SELECT ${USER_AUTH_SELECT}
     FROM identity.users u
     LEFT JOIN tenancy.schools s ON s.id = u.school_id
     WHERE u.phone = $1`,
    [normalized]
  );
  return rows[0] || null;
};

const loadUserById = async (userId) => {
  const { rows } = await query(
    `SELECT ${USER_PUBLIC_SELECT}
     FROM identity.users u
     LEFT JOIN tenancy.schools s ON s.id = u.school_id
     WHERE u.id = $1`,
    [userId]
  );
  return rows[0] || null;
};

export const loadRoleNames = async (userId, schoolId = null) => {
  const sid = schoolId || (await loadUserById(userId))?.school_id || PLATFORM_SCHOOL_ID;
  return loadActiveAssignmentRoles(query, userId, sid);
};

export const assertMayLogin = (user, roles) => {
  assertRoleSetAllowed(roles);

  if (user.status !== 'active') {
    throw new AppError('This account has been deactivated.', 403, ERROR_CODES.FORBIDDEN);
  }

  const isPlatformUser = roles.some((r) => PLATFORM_ROLES.includes(r));
  if (isPlatformUser) return;

  if (!user.school_id) {
    throw new AppError('Account is not assigned to a school.', 403, ERROR_CODES.FORBIDDEN);
  }

  const schoolStatus = user.school_status;
  if (schoolStatus && SCHOOL_LOGIN_BLOCKED_STATUSES.includes(String(schoolStatus))) {
    throw new AppError('This school is not available. Contact support.', 403, ERROR_CODES.FORBIDDEN);
  }
};

const buildSessionResult = (
  user,
  roles,
  accessToken,
  sessionToken,
  sessionId,
  activeRole = null,
  activeBranchId = null
) => {
  const schoolId = user.school_id || PLATFORM_SCHOOL_ID;
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    firstName: user.first_name,
    lastName: user.last_name,
    schoolId,
    roles,
    activeRole,
    activeBranchId,
    accessToken,
    sessionToken,
    sessionId,
  };
};

export const issueAuthSession = async (user, roles, meta = {}) => {
  const validatedRoles = assertRoleSetAllowed(roles);
  const activeRole = defaultActiveRole(validatedRoles);

  const { sessionToken, sessionId } = await createSession(user.id, {
    userAgent: meta.userAgent,
    clientIp: meta.clientIp,
    activeRole,
    activeBranchId: null,
  });

  const minted = await mintTokenFromSessionContext(user.id, sessionId);

  return buildSessionResult(
    user,
    validatedRoles,
    minted.accessToken,
    sessionToken,
    sessionId,
    minted.activeRole,
    minted.activeBranchId
  );
};

export const loginWithCredentials = async ({ email, phone, password }, meta = {}) => {
  const user = email ? await loadUserByEmail(email) : await loadUserByPhone(phone);

  if (!user || !user.password_hash || !(await comparePassword(password, user.password_hash))) {
    await recordAuthEvent({
      eventType: AUTH_EVENT.LOGIN_FAILURE,
      clientIp: meta.clientIp,
      userAgent: meta.userAgent,
      metadata: { email: email || null, phone: phone || null },
    }).catch(() => {});
    throw new AppError('Incorrect credentials.', 401, ERROR_CODES.INVALID_CREDENTIALS);
  }

  const roles = await loadRoleNames(user.id, user.school_id);
  assertMayLogin(user, roles);

  await query(`UPDATE identity.users SET last_login_at = NOW() WHERE id = $1`, [user.id]);

  const session = await issueAuthSession(user, roles, meta);
  await recordAuthEvent({
    userId: user.id,
    eventType: AUTH_EVENT.LOGIN_SUCCESS,
    clientIp: meta.clientIp,
    userAgent: meta.userAgent,
    metadata: { session_id: session.sessionId },
  }).catch(() => {});

  return session;
};

export const refreshAuthSession = async (sessionTokenPlain, meta = {}) => {
  let userId;
  let sessionToken;
  let sessionId;
  try {
    ({ userId, sessionToken, sessionId } = await rotateSession(sessionTokenPlain, meta));
  } catch (err) {
    await recordAuthEvent({
      eventType: AUTH_EVENT.REFRESH_FAILURE,
      clientIp: meta.clientIp,
      userAgent: meta.userAgent,
      metadata: { message: err.message },
    }).catch(() => {});
    throw err;
  }

  const user = await loadUserById(userId);
  if (!user) {
    throw new AppError('Invalid session.', 401, ERROR_CODES.SESSION_INVALID);
  }

  const roles = await loadRoleNames(userId, user.school_id);
  assertMayLogin(user, roles);

  const minted = await mintTokenFromSessionContext(userId, sessionId);

  await recordAuthEvent({
    userId,
    eventType: AUTH_EVENT.REFRESH_SUCCESS,
    clientIp: meta.clientIp,
    userAgent: meta.userAgent,
    metadata: { session_id: sessionId },
  }).catch(() => {});

  return buildSessionResult(
    user,
    minted.allRoles,
    minted.accessToken,
    sessionToken,
    sessionId,
    minted.activeRole,
    minted.activeBranchId
  );
};
