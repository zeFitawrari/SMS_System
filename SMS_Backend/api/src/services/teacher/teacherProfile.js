import { AppError, ERROR_CODES } from '../../utils/errors.js';

export const TEACHER_ROLE_NAME = 'TEACHER';

const EDUCATION_LEVELS = new Set([
  'CERTIFICATE',
  'DIPLOMA',
  'BACHELOR',
  'MASTER',
  'DOCTORATE',
  'OTHER',
]);

const EMPLOYMENT_TYPES = new Set(['FULL_TIME', 'PART_TIME', 'CONTRACT']);

const normalizeEnum = (value, allowed, field) => {
  if (value == null || value === '') return null;
  const v = String(value).toUpperCase();
  if (!allowed.has(v)) {
    throw new AppError(`Invalid ${field}.`, 422, ERROR_CODES.VALIDATION_ERROR);
  }
  return v;
};

export const parseTeacherInput = (teacher) => {
  if (!teacher || typeof teacher !== 'object') {
    return null;
  }
  const hasAny = Object.keys(teacher).some((k) => teacher[k] != null && teacher[k] !== '');
  if (!hasAny) return null;

  let years = teacher.years_of_experience;
  if (years != null && years !== '') {
    years = Number(years);
    if (!Number.isInteger(years) || years < 0) {
      throw new AppError('years_of_experience must be a non-negative integer.', 422, ERROR_CODES.VALIDATION_ERROR);
    }
  } else {
    years = null;
  }

  return {
    educationLevel: normalizeEnum(teacher.education_level, EDUCATION_LEVELS, 'education_level'),
    fieldOfStudy: teacher.field_of_study?.trim() || null,
    academicBackground: teacher.academic_background?.trim() || null,
    yearsOfExperience: years,
    teachingLicenseNumber: teacher.teaching_license_number?.trim() || null,
    employmentType: normalizeEnum(teacher.employment_type, EMPLOYMENT_TYPES, 'employment_type'),
  };
};

export const assertTeacherDetailsOnCreate = (roleName, parsedTeacher) => {
  if (roleName !== TEACHER_ROLE_NAME) return;
  if (!parsedTeacher?.educationLevel) {
    throw new AppError(
      'teacher.education_level is required when creating a teacher.',
      422,
      ERROR_CODES.VALIDATION_ERROR
    );
  }
};

export const loadTeacherProfile = async (client, staffProfileId) => {
  const { rows } = await client.query(
    `SELECT education_level, field_of_study, academic_background, years_of_experience,
            teaching_license_number, employment_type
     FROM teacher.teacher_profiles WHERE staff_profile_id = $1`,
    [staffProfileId]
  );
  return rows[0] || null;
};

export const deleteTeacherProfile = async (client, staffProfileId) => {
  await client.query(`DELETE FROM teacher.teacher_profiles WHERE staff_profile_id = $1`, [staffProfileId]);
};

export const upsertTeacherProfile = async (client, staffProfileId, parsed) => {
  if (!parsed) return null;

  const { rows } = await client.query(
    `INSERT INTO teacher.teacher_profiles
       (staff_profile_id, education_level, field_of_study, academic_background,
        years_of_experience, teaching_license_number, employment_type)
     VALUES ($1, $2::teacher.education_level, $3, $4, $5, $6, $7::teacher.employment_type)
     ON CONFLICT (staff_profile_id) DO UPDATE SET
       education_level = COALESCE(EXCLUDED.education_level, teacher.teacher_profiles.education_level),
       field_of_study = COALESCE(EXCLUDED.field_of_study, teacher.teacher_profiles.field_of_study),
       academic_background = COALESCE(EXCLUDED.academic_background, teacher.teacher_profiles.academic_background),
       years_of_experience = COALESCE(EXCLUDED.years_of_experience, teacher.teacher_profiles.years_of_experience),
       teaching_license_number = COALESCE(EXCLUDED.teaching_license_number, teacher.teacher_profiles.teaching_license_number),
       employment_type = COALESCE(EXCLUDED.employment_type, teacher.teacher_profiles.employment_type),
       updated_at = NOW()
     RETURNING education_level, field_of_study, academic_background, years_of_experience,
               teaching_license_number, employment_type`,
    [
      staffProfileId,
      parsed.educationLevel,
      parsed.fieldOfStudy,
      parsed.academicBackground,
      parsed.yearsOfExperience,
      parsed.teachingLicenseNumber,
      parsed.employmentType,
    ]
  );
  return rows[0];
};

export const formatTeacherForOutput = (row) => {
  if (!row) return null;
  return {
    educationLevel: row.education_level,
    fieldOfStudy: row.field_of_study,
    academicBackground: row.academic_background,
    yearsOfExperience: row.years_of_experience,
    teachingLicenseNumber: row.teaching_license_number,
    employmentType: row.employment_type,
  };
};
