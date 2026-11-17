import { getClient } from '../../../config/db.js';
import { AppError, ERROR_CODES } from '../../../utils/errors.js';
import { assertMayRegisterStudent } from '../../enrollment/registrarAccess.js';
import { resolveRegistrarTenant } from '../../enrollment/registrarContext.js';
import { insertStudentWithRegistrationId } from '../registrationId.js';
import {
  VALID_SEX,
  loadActiveSchoolBranch,
  parseRegistrationDate,
  assertStudentInRegistrarScope,
} from '../registerInput.js';
import { attachOptionalProfile } from '../studentProfileExtras.js';

const parseStudentIdentity = (input) => {
  const firstName = input.first_name?.trim();
  const lastName = input.last_name?.trim();
  const sex = String(input.sex || '').toLowerCase();
  const dob = parseRegistrationDate(input.date_of_birth, 'date_of_birth');

  if (!firstName || !lastName) {
    throw new AppError('Student first and last name are required.', 422, ERROR_CODES.VALIDATION_ERROR);
  }
  if (!VALID_SEX.has(sex)) {
    throw new AppError('Invalid sex value.', 422, ERROR_CODES.VALIDATION_ERROR);
  }

  return {
    firstName,
    middleName: input.middle_name?.trim() || null,
    lastName,
    dateOfBirth: dob,
    sex,
  };
};

const registrationIdReferenceDate = (input) => {
  if (input.enrollment_date || input.enrolled_on) {
    return parseRegistrationDate(input.enrollment_date || input.enrolled_on, 'enrollment_date');
  }
  return new Date().toISOString().slice(0, 10);
};

export const createStudentProfileWithClient = async (client, input, ctx) => {
  const { actorRole, actorSchoolId, actorBranchId, actorUserId } = ctx;
  const { schoolId, branchId } = await resolveRegistrarTenant(client, input, ctx);
  assertMayRegisterStudent(actorRole, actorSchoolId, schoolId, actorBranchId, branchId);

  if (input.student_id) {
    const existing = await assertStudentInRegistrarScope(client, input.student_id, schoolId, branchId);
    return {
      studentId: existing.id,
      userId: existing.user_id,
      registrationId: existing.registration_id,
      schoolId,
      branchId,
    };
  }

  const studentFields = parseStudentIdentity(input);
  const enrolledOn = registrationIdReferenceDate(input);

  const tenant = await loadActiveSchoolBranch(client, schoolId, branchId);
  if (!tenant) {
    throw new AppError('Invalid school or branch.', 422, ERROR_CODES.VALIDATION_ERROR);
  }

    const studentRow = await insertStudentWithRegistrationId(client, {
      schoolId,
      branchId,
      schoolName: tenant.school_name,
      enrolledOn,
      studentFields,
      contact: { email: input.email, phone: input.phone },
      actorUserId,
    });

  await attachOptionalProfile(client, studentRow.id, input);

  return {
    studentId: studentRow.id,
    userId: studentRow.user_id,
    registrationId: studentRow.registration_id,
    schoolId,
    branchId,
  };
};

export const createStudentProfile = async (input, ctx) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await createStudentProfileWithClient(client, input, ctx);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
