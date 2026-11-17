import { AppError, ERROR_CODES } from '../../utils/errors.js';

/** is_delete + id → delete; !is_delete + id → update; !is_delete + no id → insert */
export const resolveRecordMode = (input) => {
  const isDelete = Boolean(input.is_delete);
  const id = input.id || null;

  if (isDelete) {
    if (!id) {
      throw new AppError('id is required when is_delete is true.', 422, ERROR_CODES.VALIDATION_ERROR);
    }
    return 'delete';
  }
  if (id) {
    return 'update';
  }
  return 'insert';
};
