import bcrypt from 'bcryptjs';
import { getClient } from '../../config/db.js';
import { AppError, ERROR_CODES } from '../../utils/errors.js';
import { ASSIGNMENT_SCOPE } from '../../constants/auth.js';
import { bumpAuthzVersion, grantRoleAssignment } from '../auth/roleAssignments.js';
import { resolveRecordMode } from '../academic/manageOperation.js';
import { assertSchoolExists, mapDbConstraint } from '../academic/schoolRefs.js';
import { resolveRegistrarTenant } from '../enrollment/registrarContext.js';
import { normalizePhone } from '../../utils/phone.js';
import { assertMayManageStaffUsers } from './staffAccess.js';
import {
  STAFF_MANAGEABLE_ROLES,
  assertScopeMatchesRole,
  normalizeScopeType,
  resolveStaffRoleById,
} from './staffRoles.js';
import {
  TEACHER_ROLE_NAME,
  assertTeacherDetailsOnCreate,
  deleteTeacherProfile,
  formatTeacherForOutput,
  loadTeacherProfile,
  parseTeacherInput,
  upsertTeacherProfile,
} from '../teacher/teacherProfile.js';

const loadStaffProfile = async (client, staffProfileId, schoolId) => {
  const { rows } = await client.query(
    `SELECT sp.id, sp.user_id, sp.school_id, sp.branch_id, sp.employee_code, sp.job_title, sp.hired_on,
            u.first_name, u.middle_name, u.last_name, u.email, u.phone, u.status
     FROM staff.staff_profiles sp
     INNER JOIN identity.users u ON u.id = sp.user_id
     WHERE sp.id = $1 AND sp.school_id = $2`,
    [staffProfileId, schoolId]
  );
  return rows[0] || null;
};

const loadPrimaryStaffAssignment = async (client, userId, schoolId) => {
  const { rows } = await client.query(
    `SELECT ra.id, ra.scope_type, ra.branch_id, r.id AS role_id, r.name AS role_name
     FROM identity.role_assignments ra
     INNER JOIN identity.roles r ON r.id = ra.role_id
     WHERE ra.user_id = $1 AND ra.school_id = $2 AND ra.revoked_at IS NULL
       AND r.name = ANY($3::text[])
     ORDER BY ra.created_at DESC
     LIMIT 1`,
    [userId, schoolId, STAFF_MANAGEABLE_ROLES]
  );
  return rows[0] || null;
};

const revokeStaffRoleAssignments = async (client, userId, schoolId) => {
  const { rowCount } = await client.query(
    `UPDATE identity.role_assignments ra
     SET revoked_at = NOW(), updated_at = NOW()
     FROM identity.roles r
     WHERE ra.role_id = r.id
       AND ra.user_id = $1
       AND ra.school_id = $2
       AND ra.revoked_at IS NULL
       AND r.name = ANY($3::text[])`,
    [userId, schoolId, STAFF_MANAGEABLE_ROLES]
  );
  if (rowCount > 0) {
    await bumpAuthzVersion(client, userId);
  }
};

const grantStaffRole = async (client, { userId, schoolId, roleId, roleName, scopeType, branchId, grantedBy }) => {
  await grantRoleAssignment(client, {
    userId,
    schoolId,
    roleId,
    roleName,
    scopeType,
    branchId: scopeType === ASSIGNMENT_SCOPE.BRANCH ? branchId : null,
    grantedBy,
  });
};

const formatRow = async (client, profileRow, assignment) => {
  const teacherRow = await loadTeacherProfile(client, profileRow.id);
  return {
    deleted: false,
    id: profileRow.id,
    userId: profileRow.user_id,
    schoolId: profileRow.school_id,
    branchId: profileRow.branch_id,
    roleId: assignment?.role_id || null,
    scopeType: assignment?.scope_type || null,
    assignmentBranchId: assignment?.branch_id || null,
    firstName: profileRow.first_name,
    middleName: profileRow.middle_name,
    lastName: profileRow.last_name,
    email: profileRow.email,
    phone: profileRow.phone,
    employeeCode: profileRow.employee_code,
    jobTitle: profileRow.job_title,
    hiredOn: profileRow.hired_on,
    status: profileRow.status,
    teacher: formatTeacherForOutput(teacherRow),
  };
};

const syncTeacherExtension = async (
  client,
  staffProfileId,
  roleName,
  teacherInput,
  { isCreate, previousRoleName = null }
) => {
  const parsed = parseTeacherInput(teacherInput);
  if (isCreate) {
    assertTeacherDetailsOnCreate(roleName, parsed);
    if (roleName === TEACHER_ROLE_NAME) {
      await upsertTeacherProfile(client, staffProfileId, parsed);
    }
    return;
  }

  if (previousRoleName === TEACHER_ROLE_NAME && roleName !== TEACHER_ROLE_NAME) {
    await deleteTeacherProfile(client, staffProfileId);
    return;
  }

  if (roleName === TEACHER_ROLE_NAME && parsed) {
    await upsertTeacherProfile(client, staffProfileId, parsed);
  }
};

const parseContact = (input, required = false) => {
  const email = input.email ? String(input.email).trim().toLowerCase() : null;
  const phone = input.phone ? normalizePhone(input.phone) : null;
  if (required && !email && !phone) {
    throw new AppError('email or phone is required for staff.', 422, ERROR_CODES.VALIDATION_ERROR);
  }
  return { email, phone };
};

export const manageUser = async (input, ctx) => {
  const mode = resolveRecordMode(input);
  const { actorRole, actorSchoolId, actorBranchId, actorUserId } = ctx;

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { schoolId, branchId: tenantBranchId } = await resolveRegistrarTenant(client, input, ctx);
    assertMayManageStaffUsers(actorRole, actorSchoolId, schoolId);
    await assertSchoolExists(client, schoolId);

    if (mode === 'delete') {
      const profile = await loadStaffProfile(client, input.id, schoolId);
      if (!profile) {
        throw new AppError('Staff profile not found.', 404, ERROR_CODES.NOT_FOUND);
      }
      await revokeStaffRoleAssignments(client, profile.user_id, schoolId);
      await client.query(`DELETE FROM staff.staff_profiles WHERE id = $1`, [input.id]);
      await client.query(
        `UPDATE identity.users SET status = 'inactive', updated_at = NOW() WHERE id = $1`,
        [profile.user_id]
      );
      await bumpAuthzVersion(client, profile.user_id);
      await client.query('COMMIT');
      return { deleted: true, id: input.id, userId: profile.user_id, schoolId };
    }

    if (mode === 'update') {
      const profile = await loadStaffProfile(client, input.id, schoolId);
      if (!profile) {
        throw new AppError('Staff profile not found.', 404, ERROR_CODES.NOT_FOUND);
      }

      const contact = parseContact(input, false);
      let passwordHash = null;
      if (input.password) {
        passwordHash = await bcrypt.hash(String(input.password), 12);
      }

      const profileBranchId =
        input.branch_id !== undefined ? input.branch_id : profile.branch_id;

      await client.query(
        `UPDATE identity.users SET
           first_name = COALESCE($2, first_name),
           middle_name = COALESCE($3, middle_name),
           last_name = COALESCE($4, last_name),
           email = COALESCE($5, email),
           phone = COALESCE($6, phone),
           password_hash = COALESCE($7, password_hash),
           status = COALESCE($8, status),
           updated_at = NOW()
         WHERE id = $1`,
        [
          profile.user_id,
          input.first_name?.trim() ?? null,
          input.middle_name?.trim() ?? null,
          input.last_name?.trim() ?? null,
          contact.email,
          contact.phone,
          passwordHash,
          input.status ?? null,
        ]
      );

      await client.query(
        `UPDATE staff.staff_profiles SET
           branch_id = COALESCE($2, branch_id),
           employee_code = COALESCE($3, employee_code),
           job_title = COALESCE($4, job_title),
           hired_on = COALESCE($5, hired_on),
           updated_at = NOW()
         WHERE id = $1`,
        [
          input.id,
          profileBranchId,
          input.employee_code?.trim() ?? null,
          input.job_title?.trim() ?? null,
          input.hired_on ?? null,
        ]
      );

      const priorAssignment = await loadPrimaryStaffAssignment(client, profile.user_id, schoolId);
      const priorRoleName = priorAssignment?.role_name || null;

      let activeRoleName = priorRoleName;
      if (input.role_id) {
        const { id: roleId, name: roleName } = await resolveStaffRoleById(client, input.role_id);
        activeRoleName = roleName;
        const scopeType = normalizeScopeType(input.scope_type, roleName);
        const assignmentBranchId =
          scopeType === ASSIGNMENT_SCOPE.BRANCH
            ? input.scope_branch_id || input.branch_id || profileBranchId || tenantBranchId
            : null;
        assertScopeMatchesRole(roleName, scopeType, assignmentBranchId);
        await revokeStaffRoleAssignments(client, profile.user_id, schoolId);
        await grantStaffRole(client, {
          userId: profile.user_id,
          schoolId,
          roleId,
          roleName,
          scopeType,
          branchId: assignmentBranchId,
          grantedBy: actorUserId,
        });
      }

      await syncTeacherExtension(client, input.id, activeRoleName, input.teacher, {
        isCreate: false,
        previousRoleName: priorRoleName,
      });

      const updated = await loadStaffProfile(client, input.id, schoolId);
      const assignment = await loadPrimaryStaffAssignment(client, updated.user_id, schoolId);
      await client.query('COMMIT');
      return formatRow(client, updated, assignment);
    }

    const firstName = input.first_name?.trim();
    const lastName = input.last_name?.trim();
    if (!firstName || !lastName) {
      throw new AppError('first_name and last_name are required.', 422, ERROR_CODES.VALIDATION_ERROR);
    }

    if (!input.role_id) {
      throw new AppError('role_id is required when creating staff.', 422, ERROR_CODES.VALIDATION_ERROR);
    }

    const { id: roleId, name: roleName } = await resolveStaffRoleById(client, input.role_id);
    const scopeType = normalizeScopeType(input.scope_type, roleName);
    const assignmentBranchId =
      scopeType === ASSIGNMENT_SCOPE.BRANCH
        ? input.scope_branch_id || input.branch_id || tenantBranchId
        : null;
    const profileBranchId = input.branch_id ?? assignmentBranchId;
    assertScopeMatchesRole(roleName, scopeType, assignmentBranchId);

    const { email, phone } = parseContact(input, true);
    const passwordHash = input.password ? await bcrypt.hash(String(input.password), 12) : null;

    const userIns = await client.query(
      `INSERT INTO identity.users
         (email, phone, password_hash, school_id, first_name, middle_name, last_name, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
       RETURNING id`,
      [
        email,
        phone,
        passwordHash,
        schoolId,
        firstName,
        input.middle_name?.trim() || null,
        lastName,
      ]
    );
    const userId = userIns.rows[0].id;

    const { rows: profileRows } = await client.query(
      `INSERT INTO staff.staff_profiles
         (user_id, school_id, branch_id, employee_code, job_title, hired_on)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, school_id, branch_id, employee_code, job_title, hired_on`,
      [
        userId,
        schoolId,
        profileBranchId,
        input.employee_code?.trim() || null,
        input.job_title?.trim() || null,
        input.hired_on || null,
      ]
    );

    await grantStaffRole(client, {
      userId,
      schoolId,
      roleId,
      roleName,
      scopeType,
      branchId: assignmentBranchId,
      grantedBy: actorUserId,
    });

    await syncTeacherExtension(client, profileRows[0].id, roleName, input.teacher, { isCreate: true });

    const fullProfile = await loadStaffProfile(client, profileRows[0].id, schoolId);
    const assignment = await loadPrimaryStaffAssignment(client, userId, schoolId);
    await client.query('COMMIT');
    return formatRow(client, fullProfile, assignment);
  } catch (err) {
    await client.query('ROLLBACK');
    mapDbConstraint(err, 'A staff member with this employee code or contact already exists.');
  } finally {
    client.release();
  }
};
