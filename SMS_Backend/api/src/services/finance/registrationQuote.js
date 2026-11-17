import { getClient } from '../../config/db.js';
import { AppError, ERROR_CODES } from '../../utils/errors.js';
import { calculateRegistrationPayment } from './registrationPaymentCalc.js';
import { assertAcademicPlacement } from '../academic/placement.js';
import { assertMayRegisterStudent } from '../enrollment/registrarAccess.js';
import { resolveRegistrarTenant } from '../enrollment/registrarContext.js';

export const resolveRegistrationPayment = async (
  client,
  { schoolId, academicYearId, gradeLevelId, packageCode }
) => {
  const feeRow = await client.query(
    `SELECT monthly_amount FROM finance.grade_monthly_fees
     WHERE school_id = $1 AND academic_year_id = $2 AND grade_level_id = $3`,
    [schoolId, academicYearId, gradeLevelId]
  );
  if (!feeRow.rows[0]) {
    throw new AppError('Monthly fee is not configured for this grade and year.', 422, ERROR_CODES.VALIDATION_ERROR);
  }

  const pkgRow = await client.query(
    `SELECT p.code, p.label, p.duration_months, p.discount_percent
     FROM finance.registration_payment_packages p
     INNER JOIN finance.school_registration_packages sp
       ON sp.package_code = p.code AND sp.school_id = $1 AND sp.is_enabled
     WHERE p.code = $2 AND p.is_active`,
    [schoolId, packageCode]
  );
  const pkg = pkgRow.rows[0];
  if (!pkg) {
    throw new AppError('Payment package is not enabled for this school.', 422, ERROR_CODES.VALIDATION_ERROR);
  }

  const amounts = calculateRegistrationPayment({
    monthlyFee: feeRow.rows[0].monthly_amount,
    durationMonths: pkg.duration_months,
    discountPercent: pkg.discount_percent,
  });

  return { pkg, amounts, monthlyFee: feeRow.rows[0].monthly_amount };
};

export const listRegistrationPaymentQuotes = async (client, { schoolId, academicYearId, gradeLevelId }) => {
  const feeRow = await client.query(
    `SELECT monthly_amount FROM finance.grade_monthly_fees
     WHERE school_id = $1 AND academic_year_id = $2 AND grade_level_id = $3`,
    [schoolId, academicYearId, gradeLevelId]
  );
  if (!feeRow.rows[0]) {
    throw new AppError('Monthly fee is not configured for this grade and year.', 422, ERROR_CODES.VALIDATION_ERROR);
  }

  const { rows } = await client.query(
    `SELECT p.code, p.label, p.duration_months, p.discount_percent
     FROM finance.registration_payment_packages p
     INNER JOIN finance.school_registration_packages sp
       ON sp.package_code = p.code AND sp.school_id = $1 AND sp.is_enabled
     WHERE p.is_active
     ORDER BY p.sort_order`,
    [schoolId]
  );

  return rows.map((pkg) => {
    const amounts = calculateRegistrationPayment({
      monthlyFee: feeRow.rows[0].monthly_amount,
      durationMonths: pkg.duration_months,
      discountPercent: pkg.discount_percent,
    });
    return {
      packageCode: pkg.code,
      label: pkg.label,
      durationMonths: pkg.duration_months,
      discountPercent: Number(pkg.discount_percent),
      monthlyFee: Number(feeRow.rows[0].monthly_amount),
      ...amounts,
    };
  });
};

export const getRegistrationPaymentQuote = async (input, ctx) => {
  const { actorRole, actorSchoolId, actorBranchId } = ctx;
  const client = await getClient();
  try {
    const { schoolId, branchId } = await resolveRegistrarTenant(client, input, ctx);
    assertMayRegisterStudent(actorRole, actorSchoolId, schoolId, actorBranchId, branchId);
    await assertAcademicPlacement(client, {
      schoolId,
      branchId,
      academicYearId: input.academic_year_id,
      gradeLevelId: input.grade_level_id,
      sectionId: null,
    });
    const packages = await listRegistrationPaymentQuotes(client, {
      schoolId,
      academicYearId: input.academic_year_id,
      gradeLevelId: input.grade_level_id,
    });
    return { packages };
  } finally {
    client.release();
  }
};
