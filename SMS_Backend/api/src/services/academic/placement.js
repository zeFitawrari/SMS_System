import { AppError, ERROR_CODES } from '../../utils/errors.js';

/** Validates year, grade, and optional section belong to school + branch. */
export const assertAcademicPlacement = async (
  client,
  { schoolId, branchId, academicYearId, gradeLevelId, sectionId }
) => {
  const yearRow = await client.query(
    `SELECT id, name, code FROM academic.academic_years WHERE id = $1 AND school_id = $2`,
    [academicYearId, schoolId]
  );
  if (!yearRow.rows[0]) {
    throw new AppError('Academic year not found for this school.', 422, ERROR_CODES.VALIDATION_ERROR);
  }

  const gradeRow = await client.query(
    `SELECT id, name, code, level_type FROM academic.grade_levels
     WHERE id = $1 AND school_id = $2 AND is_active`,
    [gradeLevelId, schoolId]
  );
  if (!gradeRow.rows[0]) {
    throw new AppError('Grade level not found for this school.', 422, ERROR_CODES.VALIDATION_ERROR);
  }

  if (sectionId) {
    const sec = await client.query(
      `SELECT id, name FROM academic.sections
       WHERE id = $1 AND school_id = $2 AND branch_id = $3 AND academic_year_id = $4 AND grade_level_id = $5`,
      [sectionId, schoolId, branchId, academicYearId, gradeLevelId]
    );
    if (!sec.rows[0]) {
      throw new AppError('Section not found for this placement.', 422, ERROR_CODES.VALIDATION_ERROR);
    }
  }

  return { year: yearRow.rows[0], grade: gradeRow.rows[0] };
};
