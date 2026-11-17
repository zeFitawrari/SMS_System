import { getClient } from '../../config/db.js';
import { AppError, ERROR_CODES } from '../../utils/errors.js';
import { assertMayConfigureSchoolAcademics } from './access.js';
import { resolveRecordMode } from './manageOperation.js';
import { assertSchoolExists, mapDbConstraint } from './schoolRefs.js';

export const manageSchoolRegistrationPackage = async (input, { actorRole, actorSchoolId }) => {
  const mode = resolveRecordMode(input);
  const schoolId = input.school_id;
  assertMayConfigureSchoolAcademics(actorRole, actorSchoolId, schoolId);

  const packageCode = String(input.package_code || '').trim();

  const client = await getClient();
  try {
    await client.query('BEGIN');
    await assertSchoolExists(client, schoolId);

    if (mode === 'delete') {
      const { rowCount } = await client.query(
        `DELETE FROM finance.school_registration_packages WHERE id = $1 AND school_id = $2`,
        [input.id, schoolId]
      );
      if (!rowCount) {
        throw new AppError('School package setting not found.', 404, ERROR_CODES.NOT_FOUND);
      }
      await client.query('COMMIT');
      return { deleted: true, id: input.id, schoolId };
    }

    if (mode === 'update') {
      const { rows } = await client.query(
        `UPDATE finance.school_registration_packages SET
           is_enabled = COALESCE($3, is_enabled),
           updated_at = NOW()
         WHERE id = $1 AND school_id = $2
         RETURNING id, package_code, is_enabled`,
        [input.id, schoolId, input.is_enabled ?? null]
      );
      if (!rows[0]) {
        throw new AppError('School package setting not found.', 404, ERROR_CODES.NOT_FOUND);
      }
      await client.query('COMMIT');
      return { deleted: false, schoolId, row: rows[0] };
    }

    if (!packageCode) {
      throw new AppError('package_code is required to enable a registration package.', 422, ERROR_CODES.VALIDATION_ERROR);
    }

    const pkg = await client.query(
      `SELECT code FROM finance.registration_payment_packages WHERE code = $1 AND is_active`,
      [packageCode]
    );
    if (!pkg.rows[0]) {
      throw new AppError('Unknown or inactive registration package.', 422, ERROR_CODES.VALIDATION_ERROR);
    }

    const { rows } = await client.query(
      `INSERT INTO finance.school_registration_packages (school_id, package_code, is_enabled)
       VALUES ($1, $2, COALESCE($3, true))
       RETURNING id, package_code, is_enabled`,
      [schoolId, packageCode, input.is_enabled]
    );
    await client.query('COMMIT');
    return { deleted: false, schoolId, row: rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    mapDbConstraint(err, 'This package is already enabled for the school.');
  } finally {
    client.release();
  }
};
