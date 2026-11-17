import crypto from 'crypto';
import { normalizePhone } from '../../utils/phone.js';
import { ASSIGNMENT_SCOPE } from '../../constants/auth.js';
import { grantRoleAssignment } from '../auth/roleAssignments.js';

export const PROFILE_INTERNAL_EMAIL_SUFFIX = '@profile.internal';

export const isInternalProfileEmail = (email) =>
  String(email || '')
    .toLowerCase()
    .endsWith(PROFILE_INTERNAL_EMAIL_SUFFIX);

/**
 * Creates identity.users row for a school member without login yet (student, future staff types).
 * Assigns STUDENT role at branch scope when assignStudentRole is true.
 */
export const createSchoolProfileUser = async (
  client,
  {
    schoolId,
    branchId,
    firstName,
    middleName = null,
    lastName,
    email = null,
    phone = null,
    assignStudentRole = true,
    grantedBy = null,
  }
) => {
  const userId = crypto.randomUUID();
  let emailValue = email ? String(email).trim().toLowerCase() : null;
  let phoneValue = phone ? normalizePhone(phone) : null;

  if (!emailValue && !phoneValue) {
    emailValue = `student-${userId}${PROFILE_INTERNAL_EMAIL_SUFFIX}`;
  }

  const { rows } = await client.query(
    `INSERT INTO identity.users
       (id, email, phone, password_hash, school_id, first_name, middle_name, last_name, status)
     VALUES ($1, $2, $3, NULL, $4, $5, $6, $7, 'active')
     RETURNING id`,
    [userId, emailValue, phoneValue, schoolId, firstName, middleName, lastName]
  );

  if (assignStudentRole) {
    const roleRow = await client.query(
      `SELECT id FROM identity.roles WHERE name = 'STUDENT' AND school_id IS NULL LIMIT 1`
    );
    const roleId = roleRow.rows[0]?.id;
    if (roleId) {
      await grantRoleAssignment(client, {
        userId: rows[0].id,
        schoolId,
        roleId,
        roleName: 'STUDENT',
        scopeType: ASSIGNMENT_SCOPE.BRANCH,
        branchId,
        grantedBy,
      });
    }
  }

  return rows[0].id;
};
