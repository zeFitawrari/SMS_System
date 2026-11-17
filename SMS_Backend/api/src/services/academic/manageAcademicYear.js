import { getClient } from '../../config/db.js';
import { AppError, ERROR_CODES } from '../../utils/errors.js';
import { assertMayConfigureSchoolAcademics } from './access.js';
import { resolveRecordMode } from './manageOperation.js';
import { assertSchoolExists, mapDbConstraint } from './schoolRefs.js';

export const manageAcademicYear = async (input, { actorRole, actorSchoolId }) => {
  const mode = resolveRecordMode(input);
  const schoolId = input.school_id;
  assertMayConfigureSchoolAcademics(actorRole, actorSchoolId, schoolId);

  const client = await getClient();
  try {
    await client.query('BEGIN');
    await assertSchoolExists(client, schoolId);

    if (mode === 'delete') {
      const { rowCount } = await client.query(
        `DELETE FROM academic.academic_years WHERE id = $1 AND school_id = $2`,
        [input.id, schoolId]
      );
      if (!rowCount) {
        throw new AppError('Academic year not found.', 404, ERROR_CODES.NOT_FOUND);
      }
      await client.query('COMMIT');
      return { deleted: true, id: input.id, schoolId };
    }

    if (mode === 'update') {
      if (input.is_current) {
        await client.query(`UPDATE academic.academic_years SET is_current = false WHERE school_id = $1`, [schoolId]);
      }
      const { rows } = await client.query(
        `UPDATE academic.academic_years SET
           name = COALESCE($3, name),
           code = COALESCE($4, code),
           starts_on = COALESCE($5, starts_on),
           ends_on = COALESCE($6, ends_on),
           is_current = COALESCE($7, is_current),
           updated_at = NOW()
         WHERE id = $1 AND school_id = $2
         RETURNING id, code, name, starts_on, ends_on, is_current`,
        [
          input.id,
          schoolId,
          input.name ?? null,
          input.code ?? null,
          input.starts_on ?? null,
          input.ends_on ?? null,
          input.is_current ?? null,
        ]
      );
      if (!rows[0]) {
        throw new AppError('Academic year not found.', 404, ERROR_CODES.NOT_FOUND);
      }
      await client.query('COMMIT');
      return { deleted: false, schoolId, row: rows[0] };
    }

    if (!input.name?.trim() || !input.code?.trim() || !input.starts_on || !input.ends_on) {
      throw new AppError('name, code, starts_on, and ends_on are required to create an academic year.', 422, ERROR_CODES.VALIDATION_ERROR);
    }
    if (input.is_current) {
      await client.query(`UPDATE academic.academic_years SET is_current = false WHERE school_id = $1`, [schoolId]);
    }
    const { rows } = await client.query(
      `INSERT INTO academic.academic_years (school_id, name, code, starts_on, ends_on, is_current)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, false))
       RETURNING id, code, name, starts_on, ends_on, is_current`,
      [schoolId, input.name.trim(), input.code.trim(), input.starts_on, input.ends_on, input.is_current ?? false]
    );
    await client.query('COMMIT');
    return { deleted: false, schoolId, row: rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    mapDbConstraint(err, 'An academic year with this code already exists.');
  } finally {
    client.release();
  }
};
