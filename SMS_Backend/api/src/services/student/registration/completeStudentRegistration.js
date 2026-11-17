import { getClient } from '../../../config/db.js';
import { AppError, ERROR_CODES } from '../../../utils/errors.js';
import { assertMayRegisterStudent } from '../../enrollment/registrarAccess.js';
import { resolveRegistrarTenant } from '../../enrollment/registrarContext.js';
import { assertAcademicPlacement } from '../../academic/placement.js';
import { resolveSectionForRegistration } from '../../academic/sections.js';
import { resolveRegistrationPayment } from '../../finance/registrationQuote.js';
import { insertEnrollmentAndPayment } from '../enrollmentWrite.js';
import {
  VALID_REG_TYPES,
  loadActiveSchoolBranch,
  parseRegistrationDate,
  validatePaymentInput,
  assertStudentInRegistrarScope,
  assertStudentHasGuardians,
} from '../registerInput.js';

const completeNewRegistration = async (client, input, ctx, tenantScope) => {
  const { schoolId, branchId } = tenantScope;
  const { actorUserId } = ctx;
  const studentId = input.student_id;
  const academicYearId = input.academic_year_id;
  const gradeLevelId = input.grade_level_id;
  const explicitSectionId = input.section_id || null;
  const enrolledOn = parseRegistrationDate(input.enrollment_date || input.enrolled_on, 'enrollment_date');
  const payment = input.payment;
  const method = validatePaymentInput(payment);

  const studentRow = await assertStudentInRegistrarScope(client, studentId, schoolId, branchId);
  await assertStudentHasGuardians(client, studentId);

  const dup = await client.query(
    `SELECT 1 FROM student.enrollments WHERE student_id = $1 AND academic_year_id = $2`,
    [studentId, academicYearId]
  );
  if (dup.rows[0]) {
    throw new AppError('Student is already enrolled for this academic year.', 409, ERROR_CODES.DUPLICATE_ENTRY);
  }

  await assertAcademicPlacement(client, {
    schoolId,
    branchId,
    academicYearId,
    gradeLevelId,
    sectionId: explicitSectionId,
  });
  const sectionId = await resolveSectionForRegistration(client, {
    schoolId,
    branchId,
    academicYearId,
    gradeLevelId,
    explicitSectionId,
  });
  const { pkg, amounts } = await resolveRegistrationPayment(client, {
    schoolId,
    academicYearId,
    gradeLevelId,
    packageCode: payment.package_code,
  });

  const ep = await insertEnrollmentAndPayment(client, {
    registrationType: 'NEW',
    schoolId,
    branchId,
    studentId,
    academicYearId,
    gradeLevelId,
    sectionId,
    enrolledOn,
    payment,
    method,
    pkg,
    amounts,
    actorUserId,
  });

  return {
    registrationType: 'NEW',
    studentId,
    userId: studentRow.user_id,
    registrationId: studentRow.registration_id,
    enrollmentId: ep.enrollmentId,
    sectionId,
    paymentId: ep.paymentId,
    paymentStatus: ep.paymentStatus,
    finalAmount: ep.finalAmount,
    baseAmount: amounts.baseAmount,
    discountAmount: amounts.discountAmount,
    packageCode: pkg.code,
  };
};

const completePromotionRegistration = async (client, input, ctx, tenantScope) => {
  const { schoolId, branchId } = tenantScope;
  const { actorUserId } = ctx;
  const studentId = input.student_id;
  const academicYearId = input.academic_year_id;
  const gradeLevelId = input.grade_level_id;
  const explicitSectionId = input.section_id || null;
  const enrolledOn = parseRegistrationDate(input.enrollment_date || input.enrolled_on, 'enrollment_date');
  const payment = input.payment;
  const method = validatePaymentInput(payment);

  const st = await client.query(
    `SELECT id, user_id, school_id, branch_id, registration_id FROM student.students WHERE id = $1 AND school_id = $2`,
    [studentId, schoolId]
  );
  if (!st.rows[0]) {
    throw new AppError('Student not found in this school.', 404, ERROR_CODES.NOT_FOUND);
  }

  const dup = await client.query(
    `SELECT 1 FROM student.enrollments WHERE student_id = $1 AND academic_year_id = $2`,
    [studentId, academicYearId]
  );
  if (dup.rows[0]) {
    throw new AppError('Student is already enrolled for this academic year.', 409, ERROR_CODES.DUPLICATE_ENTRY);
  }

  await assertAcademicPlacement(client, {
    schoolId,
    branchId,
    academicYearId,
    gradeLevelId,
    sectionId: explicitSectionId,
  });
  const sectionId = await resolveSectionForRegistration(client, {
    schoolId,
    branchId,
    academicYearId,
    gradeLevelId,
    explicitSectionId,
  });
  const { pkg, amounts } = await resolveRegistrationPayment(client, {
    schoolId,
    academicYearId,
    gradeLevelId,
    packageCode: payment.package_code,
  });

  const prev = await client.query(
    `SELECT id FROM student.enrollments
     WHERE student_id = $1 AND status = 'active' AND academic_year_id <> $2
     ORDER BY enrolled_on DESC LIMIT 1`,
    [studentId, academicYearId]
  );
  const previousEnrollmentId = prev.rows[0]?.id || null;
  if (previousEnrollmentId) {
    await client.query(
      `UPDATE student.enrollments SET status = 'promoted', updated_at = NOW() WHERE id = $1`,
      [previousEnrollmentId]
    );
  }

  await client.query(`UPDATE student.students SET branch_id = $2, updated_at = NOW() WHERE id = $1`, [
    studentId,
    branchId,
  ]);

  const ep = await insertEnrollmentAndPayment(client, {
    registrationType: 'PROMOTION',
    schoolId,
    branchId,
    studentId,
    academicYearId,
    gradeLevelId,
    sectionId,
    enrolledOn,
    payment,
    method,
    pkg,
    amounts,
    actorUserId,
    previousEnrollmentId,
  });

  return {
    registrationType: 'PROMOTION',
    studentId,
    userId: st.rows[0].user_id,
    registrationId: st.rows[0].registration_id,
    enrollmentId: ep.enrollmentId,
    sectionId,
    paymentId: ep.paymentId,
    paymentStatus: ep.paymentStatus,
    finalAmount: ep.finalAmount,
    baseAmount: amounts.baseAmount,
    discountAmount: amounts.discountAmount,
    packageCode: pkg.code,
  };
};

export const completeStudentRegistrationWithClient = async (client, input, ctx) => {
  const { actorRole, actorSchoolId, actorBranchId } = ctx;
  const registrationType = String(input.registration_type || 'NEW').toUpperCase();
  if (!VALID_REG_TYPES.has(registrationType)) {
    throw new AppError('registration_type must be NEW or PROMOTION.', 422, ERROR_CODES.VALIDATION_ERROR);
  }

  const tenantScope = await resolveRegistrarTenant(client, input, ctx);
  const { schoolId, branchId } = tenantScope;
  assertMayRegisterStudent(actorRole, actorSchoolId, schoolId, actorBranchId, branchId);

  if (!input.student_id) {
    throw new AppError('student_id is required.', 422, ERROR_CODES.VALIDATION_ERROR);
  }

  const tenant = await loadActiveSchoolBranch(client, schoolId, branchId);
  if (!tenant) {
    throw new AppError('Invalid school or branch.', 422, ERROR_CODES.VALIDATION_ERROR);
  }

  if (registrationType === 'PROMOTION') {
    return completePromotionRegistration(client, input, ctx, tenantScope);
  }
  return completeNewRegistration(client, input, ctx, tenantScope);
};

export const completeStudentRegistration = async (input, ctx) => {
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
};
