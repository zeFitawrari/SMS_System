import { addMonths, paymentStatusForMethod } from '../finance/registrationPaymentCalc.js';
import { parseRegistrationDate } from './registerInput.js';

export const insertEnrollmentAndPayment = async (
  client,
  {
    registrationType,
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
    previousEnrollmentId = null,
  }
) => {
  const enrollmentIns = await client.query(
    `INSERT INTO student.enrollments
       (student_id, school_id, branch_id, academic_year_id, grade_level_id, section_id,
        enrolled_on, status, previous_enrollment_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8)
     RETURNING id`,
    [
      studentId,
      schoolId,
      branchId,
      academicYearId,
      gradeLevelId,
      sectionId,
      enrolledOn,
      previousEnrollmentId,
    ]
  );
  const enrollmentId = enrollmentIns.rows[0].id;

  const packageStarts = enrolledOn;
  const packageEnds = addMonths(enrolledOn, pkg.duration_months);
  const payStatus = paymentStatusForMethod(method);

  const payIns = await client.query(
    `INSERT INTO finance.registration_payments
       (school_id, branch_id, student_id, enrollment_id, package_code, registration_type,
        monthly_fee_snapshot, duration_months, discount_percent, base_amount, discount_amount, final_amount,
        payment_method, transfer_reference, payment_status, paid_on, package_starts_on, package_ends_on, recorded_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
     RETURNING id, payment_status, final_amount`,
    [
      schoolId,
      branchId,
      studentId,
      enrollmentId,
      pkg.code,
      registrationType,
      amounts.monthlyFeeSnapshot,
      amounts.durationMonths,
      amounts.discountPercent,
      amounts.baseAmount,
      amounts.discountAmount,
      amounts.finalAmount,
      method,
      method === 'BANK_TRANSFER' ? String(payment.transfer_reference).trim() : null,
      payStatus,
      payment.payment_date ? parseRegistrationDate(payment.payment_date, 'payment_date') : enrolledOn,
      packageStarts,
      packageEnds,
      actorUserId,
    ]
  );

  return {
    enrollmentId,
    paymentId: payIns.rows[0].id,
    paymentStatus: payIns.rows[0].payment_status,
    finalAmount: payIns.rows[0].final_amount,
  };
};
