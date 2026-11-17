import { getClient } from '../../config/db.js';
import { AppError, ERROR_CODES } from '../../utils/errors.js';
import { assertMayConfigureSchoolAcademics } from './access.js';
import { resolveRecordMode } from './manageOperation.js';
import {
  assertBranchInSchool,
  assertGradeInSchool,
  assertSchoolExists,
  assertYearInSchool,
  mapDbConstraint,
} from './schoolRefs.js';
import { syncMaterializedSectionFromSlot } from './sections.js';

export const manageSectionSlot = async (input, { actorRole, actorSchoolId }) => {
  const mode = resolveRecordMode(input);
  const schoolId = input.school_id;
  assertMayConfigureSchoolAcademics(actorRole, actorSchoolId, schoolId);

  const client = await getClient();
  try {
    await client.query('BEGIN');
    await assertSchoolExists(client, schoolId);

    if (mode === 'delete') {
      const { rowCount } = await client.query(
        `DELETE FROM academic.grade_section_slots WHERE id = $1 AND school_id = $2`,
        [input.id, schoolId]
      );
      if (!rowCount) {
        throw new AppError('Section slot not found.', 404, ERROR_CODES.NOT_FOUND);
      }
      await client.query('COMMIT');
      return { deleted: true, id: input.id, schoolId };
    }

    if (mode === 'update') {
      const name = input.section_name != null ? String(input.section_name).trim() : null;
      if (name !== null && !name) {
        throw new AppError('section_name cannot be empty.', 422, ERROR_CODES.VALIDATION_ERROR);
      }
      const maxCap = input.max_capacity != null ? Number(input.max_capacity) : null;
      if (maxCap != null && (!Number.isInteger(maxCap) || maxCap < 1)) {
        throw new AppError('max_capacity must be a positive integer.', 422, ERROR_CODES.VALIDATION_ERROR);
      }
      const slotIndex = input.slot_index != null ? Number(input.slot_index) : null;
      if (slotIndex != null && (!Number.isInteger(slotIndex) || slotIndex < 1)) {
        throw new AppError('slot_index must be a positive integer.', 422, ERROR_CODES.VALIDATION_ERROR);
      }

      const { rows } = await client.query(
        `UPDATE academic.grade_section_slots SET
           section_name = COALESCE($3, section_name),
           max_capacity = COALESCE($4, max_capacity),
           slot_index = COALESCE($5, slot_index),
           updated_at = NOW()
         WHERE id = $1 AND school_id = $2
         RETURNING id, branch_id, academic_year_id, grade_level_id, slot_index, section_name, max_capacity`,
        [input.id, schoolId, name, maxCap, slotIndex]
      );
      if (!rows[0]) {
        throw new AppError('Section slot not found.', 404, ERROR_CODES.NOT_FOUND);
      }
      await syncMaterializedSectionFromSlot(client, rows[0].id);
      await client.query('COMMIT');
      return { deleted: false, schoolId, row: rows[0] };
    }

    const name = String(input.section_name || '').trim();
    const slotIndex = Number(input.slot_index);
    const maxCapacity = Number(input.max_capacity);
    if (!input.branch_id || !input.academic_year_id || !input.grade_level_id) {
      throw new AppError('branch_id, academic_year_id, and grade_level_id are required to create a section slot.', 422, ERROR_CODES.VALIDATION_ERROR);
    }
    if (!name) {
      throw new AppError('section_name is required.', 422, ERROR_CODES.VALIDATION_ERROR);
    }
    if (!Number.isInteger(slotIndex) || slotIndex < 1) {
      throw new AppError('slot_index must be a positive integer.', 422, ERROR_CODES.VALIDATION_ERROR);
    }
    if (!Number.isInteger(maxCapacity) || maxCapacity < 1) {
      throw new AppError('max_capacity must be a positive integer.', 422, ERROR_CODES.VALIDATION_ERROR);
    }

    await assertBranchInSchool(client, schoolId, input.branch_id);
    await assertYearInSchool(client, schoolId, input.academic_year_id);
    await assertGradeInSchool(client, schoolId, input.grade_level_id);

    const { rows } = await client.query(
      `INSERT INTO academic.grade_section_slots
         (school_id, branch_id, academic_year_id, grade_level_id, slot_index, section_name, max_capacity)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, branch_id, academic_year_id, grade_level_id, slot_index, section_name, max_capacity`,
      [
        schoolId,
        input.branch_id,
        input.academic_year_id,
        input.grade_level_id,
        slotIndex,
        name,
        maxCapacity,
      ]
    );
    await syncMaterializedSectionFromSlot(client, rows[0].id);
    await client.query('COMMIT');
    return { deleted: false, schoolId, row: rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    mapDbConstraint(err, 'A section slot with this index already exists for this placement.');
  } finally {
    client.release();
  }
};
