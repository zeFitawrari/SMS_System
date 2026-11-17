import { AppError, ERROR_CODES } from '../../utils/errors.js';

export const assertSchoolExists = async (client, schoolId) => {
  const { rows } = await client.query(`SELECT id FROM tenancy.schools WHERE id = $1`, [schoolId]);
  if (!rows[0]) {
    throw new AppError('School not found.', 404, ERROR_CODES.NOT_FOUND);
  }
};

export const assertBranchInSchool = async (client, schoolId, branchId) => {
  const { rows } = await client.query(
    `SELECT id FROM tenancy.branches WHERE id = $1 AND school_id = $2`,
    [branchId, schoolId]
  );
  if (!rows[0]) {
    throw new AppError('Branch not found for this school.', 422, ERROR_CODES.VALIDATION_ERROR);
  }
};

export const assertYearInSchool = async (client, schoolId, academicYearId) => {
  const { rows } = await client.query(
    `SELECT id, code, name FROM academic.academic_years WHERE id = $1 AND school_id = $2`,
    [academicYearId, schoolId]
  );
  if (!rows[0]) {
    throw new AppError('Academic year not found for this school.', 422, ERROR_CODES.VALIDATION_ERROR);
  }
  return rows[0];
};

export const assertGradeInSchool = async (client, schoolId, gradeLevelId) => {
  const { rows } = await client.query(
    `SELECT id, code, name FROM academic.grade_levels WHERE id = $1 AND school_id = $2`,
    [gradeLevelId, schoolId]
  );
  if (!rows[0]) {
    throw new AppError('Grade level not found for this school.', 422, ERROR_CODES.VALIDATION_ERROR);
  }
  return rows[0];
};

export const mapDbConstraint = (err, fallbackMessage) => {
  if (err.code === '23503') {
    throw new AppError('Cannot delete: record is in use.', 409, ERROR_CODES.VALIDATION_ERROR);
  }
  if (err.code === '23505') {
    throw new AppError(fallbackMessage || 'Duplicate record.', 409, ERROR_CODES.DUPLICATE_ENTRY);
  }
  throw err;
};
