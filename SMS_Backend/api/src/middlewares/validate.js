import { AppError, ERROR_CODES } from '../utils/errors.js';

/** Rules GraphQL action inputs cannot express (password strength, email xor phone, etc.). */
export const validateHasuraAction = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.hasuraInput ?? {}, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const err = new AppError('Validation failed', 422, ERROR_CODES.VALIDATION_ERROR);
    err.details = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message.replace(/['"]/g, ''),
    }));
    return next(err);
  }
  req.hasuraInput = value;
  next();
};
