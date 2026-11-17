import { AppError, ERROR_CODES } from '../../utils/errors.js';

const roundMoney = (n) => Math.round(Number(n) * 100) / 100;

export const calculateRegistrationPayment = ({ monthlyFee, durationMonths, discountPercent }) => {
  const monthly = Number(monthlyFee);
  const months = Number(durationMonths);
  const pct = Number(discountPercent);
  if (!Number.isFinite(monthly) || monthly < 0) {
    throw new AppError('Invalid monthly fee.', 422, ERROR_CODES.VALIDATION_ERROR);
  }
  if (!Number.isFinite(months) || months < 1) {
    throw new AppError('Invalid package duration.', 422, ERROR_CODES.VALIDATION_ERROR);
  }
  const baseAmount = roundMoney(monthly * months);
  const discountAmount = roundMoney(baseAmount * (pct / 100));
  const finalAmount = roundMoney(baseAmount - discountAmount);
  return { baseAmount, discountAmount, finalAmount, discountPercent: pct, durationMonths: months, monthlyFeeSnapshot: monthly };
};

export const addMonths = (startDate, months) => {
  const d = new Date(startDate);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
};

export const paymentStatusForMethod = (method) =>
  method === 'CASH' ? 'confirmed' : 'pending_verification';
