import { getClient } from '../../config/db.js';
import { AppError, ERROR_CODES } from '../../utils/errors.js';
import { assertMayConfigureSchoolAcademics } from './access.js';
import { resolveRecordMode } from './manageOperation.js';
import { assertSchoolExists, mapDbConstraint } from './schoolRefs.js';

export const manageGradeLevel = async (input, { actorRole, actorSchoolId }) => {
  const mode = resolveRecordMode(input);
  const schoolId = input.school_id;
  assertMayConfigureSchoolAcademics(actorRole, actorSchoolId, schoolId);

  const client = await getClient();
  try {
    await client.query('BEGIN');
    await assertSchoolExists(client, schoolId);

    if (mode === 'delete') {
      const { rowCount } = await client.query(
        `DELETE FROM academic.grade_levels WHERE id = $1 AND school_id = $2`,
        [input.id, schoolId]
      );
      if (!rowCount) {
        throw new AppError('Grade level not found.', 404, ERROR_CODES.NOT_FOUND);
      }
      await client.query('COMMIT');
      return { deleted: true, id: input.id, schoolId };
    }

    if (mode === 'update') {
      const levelType = input.level_type ? String(input.level_type).toUpperCase() : null;
      const { rows } = await client.query(
        `UPDATE academic.grade_levels SET
           name = COALESCE($3, name),
           code = COALESCE($4, code),
           level_type = COALESCE($5::academic.grade_level_type, level_type),
           sort_order = COALESCE($6, sort_order),
           is_active = COALESCE($7, is_active),
           updated_at = NOW()
         WHERE id = $1 AND school_id = $2
         RETURNING id, code, name, level_type, sort_order, is_active`,
        [
          input.id,
          schoolId,
          input.name ?? null,
          input.code ?? null,
          levelType,
          input.sort_order ?? null,
          input.is_active ?? null,
        ]
      );
      if (!rows[0]) {
        throw new AppError('Grade level not found.', 404, ERROR_CODES.NOT_FOUND);
      }
      await client.query('COMMIT');
      return { deleted: false, schoolId, row: rows[0] };
    }

    if (!input.name?.trim() || !input.code?.trim()) {
      throw new AppError('name and code are required to create a grade level.', 422, ERROR_CODES.VALIDATION_ERROR);
    }
    const levelType = (input.level_type || 'GRADE').toUpperCase();
    const { rows } = await client.query(
      `INSERT INTO academic.grade_levels (school_id, name, code, level_type, sort_order, is_active)
       VALUES ($1, $2, $3, $4::academic.grade_level_type, COALESCE($5, 0), COALESCE($6, true))
       RETURNING id, code, name, level_type, sort_order, is_active`,
      [schoolId, input.name.trim(), input.code.trim(), levelType, input.sort_order, input.is_active]
    );
    await client.query('COMMIT');
    return { deleted: false, schoolId, row: rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    mapDbConstraint(err, 'A grade level with this code already exists.');
  } finally {
    client.release();
  }
};
