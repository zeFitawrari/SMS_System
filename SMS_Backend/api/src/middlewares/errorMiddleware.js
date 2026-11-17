import { AppError, ERROR_CODES } from '../utils/errors.js';

const normalizeError = (err) => {
  if (err instanceof AppError) return err;
  const pgCode = err?.code || err?.cause?.code;
  if (pgCode === '22P02') {
    return new AppError('Invalid identifier format.', 422, ERROR_CODES.VALIDATION_ERROR);
  }
  return err;
};

export const globalErrorHandler = (err, _req, res, _next) => {
  err = normalizeError(err);
  const status = err.statusCode || 500;
  const body = {
    message: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
  };
  if (err.details) body.details = err.details;
  if (process.env.NODE_ENV === 'development' && status === 500 && !(err instanceof AppError)) {
    body.stack = err.stack;
  }
  res.status(status).json(body);
};
