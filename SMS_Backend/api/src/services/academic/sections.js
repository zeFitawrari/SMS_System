import { getClient } from '../../config/db.js';
import { AppError, ERROR_CODES } from '../../utils/errors.js';
import { assertMayManageEnrollmentSection } from './access.js';

const PLACEMENT_LOCK_PREFIX = 'section-assign:';

export const lockGradePlacement = async (client, { schoolId, branchId, academicYearId, gradeLevelId }) => {
  const key = `${PLACEMENT_LOCK_PREFIX}${schoolId}:${branchId}:${academicYearId}:${gradeLevelId}`;
  await client.query(`SELECT pg_advisory_xact_lock(hashtext($1::text))`, [key]);
};

export const countActiveEnrollmentsInSection = async (client, sectionId, excludeEnrollmentId = null) => {
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS c FROM student.enrollments
     WHERE section_id = $1 AND status = 'active' AND ($2::uuid IS NULL OR id <> $2)`,
    [sectionId, excludeEnrollmentId]
  );
  return rows[0].c;
};

/** Materialize academic.sections row for a configured slot (lazy, idempotent). */
export const getOrCreateSectionForSlot = async (client, slot) => {
  const existing = await client.query(`SELECT id FROM academic.sections WHERE slot_id = $1`, [slot.id]);
  if (existing.rows[0]) {
    return existing.rows[0].id;
  }

  const byName = await client.query(
    `SELECT id FROM academic.sections
     WHERE school_id = $1 AND branch_id = $2 AND academic_year_id = $3 AND grade_level_id = $4 AND name = $5`,
    [slot.school_id, slot.branch_id, slot.academic_year_id, slot.grade_level_id, slot.section_name]
  );
  if (byName.rows[0]) {
    await client.query(
      `UPDATE academic.sections SET slot_id = $2, max_capacity = $3, updated_at = NOW() WHERE id = $1`,
      [byName.rows[0].id, slot.id, slot.max_capacity]
    );
    return byName.rows[0].id;
  }

  const ins = await client.query(
    `INSERT INTO academic.sections
       (school_id, branch_id, academic_year_id, grade_level_id, name, slot_id, max_capacity)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      slot.school_id,
      slot.branch_id,
      slot.academic_year_id,
      slot.grade_level_id,
      slot.section_name,
      slot.id,
      slot.max_capacity,
    ]
  );
  return ins.rows[0].id;
};

const loadSlotsForPlacement = async (client, { schoolId, branchId, academicYearId, gradeLevelId }) => {
  const { rows } = await client.query(
    `SELECT id, school_id, branch_id, academic_year_id, grade_level_id, slot_index, section_name, max_capacity
     FROM academic.grade_section_slots
     WHERE school_id = $1 AND branch_id = $2 AND academic_year_id = $3 AND grade_level_id = $4
     ORDER BY slot_index ASC`,
    [schoolId, branchId, academicYearId, gradeLevelId]
  );
  return rows;
};

/** First slot with free seats; creates section row when needed. */
export const assignSectionAutomatically = async (client, placement) => {
  await lockGradePlacement(client, placement);

  const slots = await loadSlotsForPlacement(client, placement);
  if (slots.length === 0) {
    throw new AppError(
      'No section slots configured for this grade. Configure section slots in school academics first.',
      422,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  for (const slot of slots) {
    const sectionId = await getOrCreateSectionForSlot(client, slot);
    const count = await countActiveEnrollmentsInSection(client, sectionId);
    if (count < slot.max_capacity) {
      return sectionId;
    }
  }

  throw new AppError(
    'All sections for this grade are at capacity. Add slots/capacity or assign manually.',
    422,
    ERROR_CODES.SECTION_CAPACITY_EXCEEDED
  );
};

export const resolveSectionForRegistration = async (client, placement) => {
  const { explicitSectionId, ...rest } = placement;
  if (explicitSectionId) {
    return explicitSectionId;
  }
  return assignSectionAutomatically(client, rest);
};

export const assertSectionHasCapacity = async (
  client,
  { sectionId, maxCapacity, excludeEnrollmentId, allowOverCapacity }
) => {
  if (allowOverCapacity !== false || maxCapacity == null) return { overCapacity: false };
  const count = await countActiveEnrollmentsInSection(client, sectionId, excludeEnrollmentId);
  if (count >= maxCapacity) {
    throw new AppError(
      'Section is at capacity. Set allow_over_capacity to override.',
      422,
      ERROR_CODES.SECTION_CAPACITY_EXCEEDED
    );
  }
  return { overCapacity: false };
};

export const loadSlotForEnrollment = async (client, slotId, schoolId) => {
  const { rows } = await client.query(
    `SELECT id, school_id, branch_id, academic_year_id, grade_level_id, slot_index, section_name, max_capacity
     FROM academic.grade_section_slots WHERE id = $1 AND school_id = $2`,
    [slotId, schoolId]
  );
  return rows[0] || null;
};

export const syncMaterializedSectionFromSlot = async (client, slotId) => {
  await client.query(
    `UPDATE academic.sections s
     SET name = sl.section_name,
         max_capacity = sl.max_capacity,
         updated_at = NOW()
     FROM academic.grade_section_slots sl
     WHERE s.slot_id = sl.id AND sl.id = $1`,
    [slotId]
  );
};

/** Admin reassignment (quota optional). */
export const updateEnrollmentSection = async (input, { actorRole, actorSchoolId, actorBranchId }) => {
  const enrollmentId = input.enrollment_id;
  const unassign = Boolean(input.unassign);
  const sectionIdInput = input.section_id;
  const slotId = input.slot_id || null;
  const allowOverCapacity = input.allow_over_capacity !== false;

  if (unassign && (sectionIdInput || slotId)) {
    throw new AppError('Use unassign alone, or section_id, or slot_id — not combined.', 422, ERROR_CODES.VALIDATION_ERROR);
  }
  if (sectionIdInput && slotId) {
    throw new AppError('Provide either section_id or slot_id, not both.', 422, ERROR_CODES.VALIDATION_ERROR);
  }
  if (!unassign && !sectionIdInput && !slotId) {
    throw new AppError('Specify section_id, slot_id, or unassign.', 422, ERROR_CODES.VALIDATION_ERROR);
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const enr = await client.query(
      `SELECT id, school_id, branch_id, academic_year_id, grade_level_id, section_id, status
       FROM student.enrollments WHERE id = $1`,
      [enrollmentId]
    );
    const enrollment = enr.rows[0];
    if (!enrollment) {
      throw new AppError('Enrollment not found.', 404, ERROR_CODES.NOT_FOUND);
    }
    if (enrollment.status !== 'active') {
      throw new AppError('Only active enrollments can be reassigned.', 422, ERROR_CODES.VALIDATION_ERROR);
    }

    assertMayManageEnrollmentSection(actorRole, actorSchoolId, actorBranchId, {
      schoolId: enrollment.school_id,
      branchId: enrollment.branch_id,
    });

    let targetSectionId = null;
    let warning = null;

    if (unassign) {
      targetSectionId = null;
    } else if (slotId) {
      const slot = await loadSlotForEnrollment(client, slotId, enrollment.school_id);
      if (!slot) {
        throw new AppError('Section slot not found.', 404, ERROR_CODES.NOT_FOUND);
      }
      if (
        String(slot.branch_id) !== String(enrollment.branch_id) ||
        String(slot.academic_year_id) !== String(enrollment.academic_year_id) ||
        String(slot.grade_level_id) !== String(enrollment.grade_level_id)
      ) {
        throw new AppError('Slot does not match this enrollment placement.', 422, ERROR_CODES.VALIDATION_ERROR);
      }
      targetSectionId = await getOrCreateSectionForSlot(client, slot);
    } else {
      const sec = await client.query(
        `SELECT id FROM academic.sections
         WHERE id = $1 AND school_id = $2 AND branch_id = $3
           AND academic_year_id = $4 AND grade_level_id = $5`,
        [
          sectionIdInput,
          enrollment.school_id,
          enrollment.branch_id,
          enrollment.academic_year_id,
          enrollment.grade_level_id,
        ]
      );
      if (!sec.rows[0]) {
        throw new AppError('Section not found for this enrollment placement.', 422, ERROR_CODES.VALIDATION_ERROR);
      }
      targetSectionId = sec.rows[0].id;
    }

    if (targetSectionId) {
      const secMeta = await client.query(`SELECT max_capacity FROM academic.sections WHERE id = $1`, [
        targetSectionId,
      ]);
      const maxCap = secMeta.rows[0]?.max_capacity;
      await assertSectionHasCapacity(client, {
        sectionId: targetSectionId,
        maxCapacity: maxCap,
        excludeEnrollmentId: enrollmentId,
        allowOverCapacity,
      });
      if (allowOverCapacity && maxCap != null) {
        const count = await countActiveEnrollmentsInSection(client, targetSectionId, enrollmentId);
        if (count >= maxCap) {
          warning = 'over_capacity';
        }
      }
    }

    await client.query(
      `UPDATE student.enrollments SET section_id = $2, updated_at = NOW() WHERE id = $1`,
      [enrollmentId, targetSectionId]
    );

    await client.query('COMMIT');

    return { enrollmentId, sectionId: targetSectionId, warning };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
