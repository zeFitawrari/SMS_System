import { getClient } from '../../config/db.js';
import { AppError, ERROR_CODES } from '../../utils/errors.js';
import { VALID_REG_TYPES, validateGuardiansList } from './registerInput.js';
import { createStudentProfileWithClient } from './registration/createStudentProfile.js';
import { setStudentGuardiansWithClient } from './registration/setStudentGuardians.js';
import { completeStudentRegistrationWithClient } from './registration/completeStudentRegistration.js';

export const registerStudent = async (input, ctx) => {
  const registrationType = String(input.registration_type || 'NEW').toUpperCase();
  if (!VALID_REG_TYPES.has(registrationType)) {
    throw new AppError('registration_type must be NEW or PROMOTION.', 422, ERROR_CODES.VALIDATION_ERROR);
  }

  if (registrationType === 'PROMOTION') {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const result = await completeStudentRegistrationWithClient(client, input, ctx);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  validateGuardiansList(input.guardians);

  const client = await getClient();
  try {
    await client.query('BEGIN');
    const profile = await createStudentProfileWithClient(client, input, ctx);
    await setStudentGuardiansWithClient(
      client,
      { ...input, student_id: profile.studentId },
      ctx
    );
    const result = await completeStudentRegistrationWithClient(
      client,
      { ...input, student_id: profile.studentId },
      ctx
    );
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
