import { AppError, ERROR_CODES } from '../../utils/errors.js';
import { normalizePhone } from '../../utils/phone.js';

export const VALID_SEX = new Set(['male', 'female']);
export const VALID_GUARDIAN_RELATIONSHIPS = new Set([
  'father',
  'mother',
  'grandfather',
  'grandmother',
  'aunt',
  'uncle',
  'legal_guardian',
  'other',
]);
export const VALID_REG_TYPES = new Set(['NEW', 'PROMOTION']);

const VALID_PAYMENT_METHODS = new Set(['CASH', 'BANK_TRANSFER']);

export const parseRegistrationDate = (value, field) => {
  if (!value) throw new AppError(`${field} is required.`, 422, ERROR_CODES.VALIDATION_ERROR);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new AppError(`Invalid ${field}.`, 422, ERROR_CODES.VALIDATION_ERROR);
  }
  return value.slice(0, 10);
};

export const validatePaymentInput = (payment) => {
  if (!payment?.package_code || !payment?.payment_method) {
    throw new AppError('Payment package and method are required.', 422, ERROR_CODES.VALIDATION_ERROR);
  }
  const method = String(payment.payment_method).toUpperCase();
  if (!VALID_PAYMENT_METHODS.has(method)) {
    throw new AppError('Invalid payment method.', 422, ERROR_CODES.VALIDATION_ERROR);
  }
  if (method === 'BANK_TRANSFER' && !String(payment.transfer_reference || '').trim()) {
    throw new AppError('Transfer reference is required for bank transfer.', 422, ERROR_CODES.VALIDATION_ERROR);
  }
  if (method === 'CASH' && payment.transfer_reference) {
    throw new AppError('Transfer reference must not be set for cash payments.', 422, ERROR_CODES.VALIDATION_ERROR);
  }
  return method;
};

export const validateGuardiansList = (guardians) => {
  if (!guardians?.length) {
    throw new AppError('At least one guardian is required.', 422, ERROR_CODES.VALIDATION_ERROR);
  }
  for (const g of guardians) {
    if (!g.full_name?.trim() || !g.relationship) {
      throw new AppError('Each guardian requires full_name and relationship.', 422, ERROR_CODES.VALIDATION_ERROR);
    }
    if (!VALID_GUARDIAN_RELATIONSHIPS.has(String(g.relationship).toLowerCase())) {
      throw new AppError('Invalid guardian relationship.', 422, ERROR_CODES.VALIDATION_ERROR);
    }
    normalizePhone(g.phone);
  }
};

export const assertStudentInRegistrarScope = async (client, studentId, schoolId, branchId) => {
  const { rows } = await client.query(
    `SELECT id, user_id, registration_id FROM student.students WHERE id = $1 AND school_id = $2 AND branch_id = $3`,
    [studentId, schoolId, branchId]
  );
  if (!rows[0]) {
    throw new AppError('Student not found for this school and branch.', 404, ERROR_CODES.NOT_FOUND);
  }
  return rows[0];
};

export const assertStudentHasGuardians = async (client, studentId) => {
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS c FROM student.student_guardians WHERE student_id = $1`,
    [studentId]
  );
  if (!rows[0]?.c) {
    throw new AppError(
      'At least one guardian is required before completing registration.',
      422,
      ERROR_CODES.VALIDATION_ERROR
    );
  }
};

export const loadActiveSchoolBranch = async (client, schoolId, branchId) => {
  const { rows } = await client.query(
    `SELECT s.id AS school_id, s.name AS school_name, b.id AS branch_id
     FROM tenancy.schools s
     INNER JOIN tenancy.branches b ON b.school_id = s.id AND b.id = $2
     WHERE s.id = $1 AND s.status = 'active' AND b.status = 'active'`,
    [schoolId, branchId]
  );
  return rows[0] || null;
};
