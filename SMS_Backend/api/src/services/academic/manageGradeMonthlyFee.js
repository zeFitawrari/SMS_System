import { getClient } from '../../config/db.js';
import { AppError, ERROR_CODES } from '../../utils/errors.js';
import { assertMayConfigureSchoolAcademics } from './access.js';
import { resolveRecordMode } from './manageOperation.js';
import {
  assertGradeInSchool,
  assertSchoolExists,
  assertYearInSchool,
  mapDbConstraint,
} from './schoolRefs.js';

export const manageGradeMonthlyFee = async (input, { actorRole, actorSchoolId }) => {
  const mode = resolveRecordMode(input);
  const schoolId = input.school_id;
  assertMayConfigureSchoolAcademics(actorRole, actorSchoolId, schoolId);

  const client = await getClient();
  try {
    await client.query('BEGIN');
    await assertSchoolExists(client, schoolId);

    if (mode === 'delete') {
      const { rowCount } = await client.query(
        `DELETE FROM finance.grade_monthly_fees WHERE id = $1 AND school_id = $2`,
        [input.id, schoolId]
      );
      if (!rowCount) {
        throw new AppError('Grade fee not found.', 404, ERROR_CODES.NOT_FOUND);
      }
      await client.query('COMMIT');
      return { deleted: true, id: input.id, schoolId };
    }

    if (mode === 'update') {
      if (input.monthly_amount == null) {
        throw new AppError('monthly_amount is required for update.', 422, ERROR_CODES.VALIDATION_ERROR);
      }
      const amount = Number(input.monthly_amount);
      if (!Number.isFinite(amount) || amount < 0) {
        throw new AppError('monthly_amount must be a non-negative number.', 422, ERROR_CODES.VALIDATION_ERROR);
      }
      const { rows } = await client.query(
        `UPDATE finance.grade_monthly_fees SET monthly_amount = $3, updated_at = NOW()
         WHERE id = $1 AND school_id = $2
         RETURNING id, academic_year_id, grade_level_id, monthly_amount`,
        [input.id, schoolId, amount]
      );
      if (!rows[0]) {
        throw new AppError('Grade fee not found.', 404, ERROR_CODES.NOT_FOUND);
      }
      await client.query('COMMIT');
      return { deleted: false, schoolId, row: rows[0] };
    }

    if (!input.academic_year_id || !input.grade_level_id || input.monthly_amount == null) {
      throw new AppError('academic_year_id, grade_level_id, and monthly_amount are required to create a fee.', 422, ERROR_CODES.VALIDATION_ERROR);
    }
    const amount = Number(input.monthly_amount);
    if (!Number.isFinite(amount) || amount < 0) {
      throw new AppError('monthly_amount must be a non-negative number.', 422, ERROR_CODES.VALIDATION_ERROR);
    }

    await assertYearInSchool(client, schoolId, input.academic_year_id);
    await assertGradeInSchool(client, schoolId, input.grade_level_id);

    const { rows } = await client.query(
      `INSERT INTO finance.grade_monthly_fees (school_id, academic_year_id, grade_level_id, monthly_amount)
       VALUES ($1, $2, $3, $4)
       RETURNING id, academic_year_id, grade_level_id, monthly_amount`,
      [schoolId, input.academic_year_id, input.grade_level_id, amount]
    );
    await client.query('COMMIT');
    return { deleted: false, schoolId, row: rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    mapDbConstraint(err, 'A fee already exists for this year and grade.');
  } finally {
    client.release();
  }
};
