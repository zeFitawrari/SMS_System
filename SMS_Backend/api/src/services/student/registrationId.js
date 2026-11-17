import crypto from 'crypto';
import { schoolCodeFromName, yearCodeFromDate } from '../../utils/schoolCode.js';
import { createSchoolProfileUser } from '../identity/createSchoolProfileUser.js';

const RANDOM_DIGITS = Number(process.env.STUDENT_REG_RANDOM_DIGITS || 8);
const MAX_ATTEMPTS = 8;

export const buildRegistrationId = (schoolName, enrolledOnDate) => {
  const prefix = schoolCodeFromName(schoolName);
  const year = yearCodeFromDate(enrolledOnDate);
  const max = 10 ** RANDOM_DIGITS;
  const num = crypto.randomInt(0, max);
  const randomPart = String(num).padStart(RANDOM_DIGITS, '0');
  return `${prefix}${year}${randomPart}`;
};

/**
 * Creates identity.users + student.students with generated registration_id.
 */
export const insertStudentWithRegistrationId = async (
  client,
  {
    schoolId,
    branchId,
    schoolName,
    enrolledOn,
    studentFields,
    contact = {},
    actorUserId = null,
  }
) => {
  const userId = await createSchoolProfileUser(client, {
    schoolId,
    branchId,
    firstName: studentFields.firstName,
    middleName: studentFields.middleName,
    lastName: studentFields.lastName,
    email: contact.email,
    phone: contact.phone,
    grantedBy: actorUserId,
  });

  let lastError;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const registrationId = buildRegistrationId(schoolName, enrolledOn);
    try {
      const { rows } = await client.query(
        `INSERT INTO student.students
           (school_id, branch_id, registration_id, user_id, date_of_birth, sex)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, registration_id, user_id`,
        [
          schoolId,
          branchId,
          registrationId,
          userId,
          studentFields.dateOfBirth,
          studentFields.sex,
        ]
      );
      return rows[0];
    } catch (err) {
      if (err.code === '23505' && err.constraint === 'students_school_registration_id_key') {
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  throw lastError || new Error('Failed to allocate registration_id');
};
