import { AppError, ERROR_CODES } from './errors.js';

/** Ethiopia country code — all stored phones use 251 + 9-digit mobile (12 digits total). */
export const ETHIOPIA_COUNTRY_CODE = '251';

const MOBILE_NINE_DIGITS = /^9\d{8}$/;

/**
 * Normalize to canonical storage: 251XXXXXXXXX (no +, no leading 0).
 * Accepts: 0912345678, 912345678, 251912345678, +251 91 234 5678
 */
export const normalizePhone = (raw) => {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) {
    throw new AppError('Phone number is required.', 422, ERROR_CODES.VALIDATION_ERROR);
  }

  let nationalNine = null;

  if (digits.startsWith(ETHIOPIA_COUNTRY_CODE)) {
    const rest = digits.slice(ETHIOPIA_COUNTRY_CODE.length);
    if (rest.length === 9 && MOBILE_NINE_DIGITS.test(rest)) {
      nationalNine = rest;
    }
  } else if (digits.length === 10 && digits.startsWith('0')) {
    const rest = digits.slice(1);
    if (MOBILE_NINE_DIGITS.test(rest)) {
      nationalNine = rest;
    }
  } else if (digits.length === 9 && MOBILE_NINE_DIGITS.test(digits)) {
    nationalNine = digits;
  }

  if (!nationalNine) {
    throw new AppError(
      'Phone must be a valid Ethiopian mobile number (e.g. 0912345678 or 251912345678).',
      422,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  return `${ETHIOPIA_COUNTRY_CODE}${nationalNine}`;
};

export const isPhoneLike = (value) => {
  try {
    normalizePhone(value);
    return true;
  } catch {
    return false;
  }
};
