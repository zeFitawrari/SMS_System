import { AppError, ERROR_CODES } from './errors.js';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isValidUuid = (value) => UUID_RE.test(String(value || '').trim());

export const assertValidUuid = (value, fieldName = 'id') => {
  if (!isValidUuid(value)) {
    throw new AppError(`Invalid ${fieldName} format.`, 422, ERROR_CODES.VALIDATION_ERROR);
  }
  return String(value).trim();
};
