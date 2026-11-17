import { getClient } from '../../../config/db.js';
import { AppError, ERROR_CODES } from '../../../utils/errors.js';
import { assertMayRegisterStudent } from '../../enrollment/registrarAccess.js';
import { resolveRegistrarTenant } from '../../enrollment/registrarContext.js';
import { upsertGuardian } from '../guardians.js';
import { assertStudentInRegistrarScope, validateGuardiansList } from '../registerInput.js';

export const setStudentGuardiansWithClient = async (client, input, ctx) => {
  const { actorRole, actorSchoolId, actorBranchId } = ctx;
  const { schoolId, branchId } = await resolveRegistrarTenant(client, input, ctx);
  const studentId = input.student_id;

  if (!studentId) {
    throw new AppError('student_id is required.', 422, ERROR_CODES.VALIDATION_ERROR);
  }

  assertMayRegisterStudent(actorRole, actorSchoolId, schoolId, actorBranchId, branchId);
  await assertStudentInRegistrarScope(client, studentId, schoolId, branchId);

  const guardians = input.guardians || [];
  validateGuardiansList(guardians);

  await client.query(`DELETE FROM student.student_guardians WHERE student_id = $1`, [studentId]);

  for (const g of guardians) {
    const guardianId = await upsertGuardian(client, schoolId, g);
    await client.query(
      `INSERT INTO student.student_guardians
         (student_id, guardian_id, relationship, is_primary_contact, is_emergency_contact, is_authorized_pickup)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        studentId,
        guardianId,
        String(g.relationship).toLowerCase(),
        Boolean(g.is_primary_contact),
        Boolean(g.is_emergency_contact),
        Boolean(g.is_authorized_pickup),
      ]
    );
  }

  return {
    studentId,
    guardianCount: guardians.length,
    schoolId,
    branchId,
  };
};

export const setStudentGuardians = async (input, ctx) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await setStudentGuardiansWithClient(client, input, ctx);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
