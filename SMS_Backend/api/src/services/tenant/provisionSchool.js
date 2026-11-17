import bcrypt from 'bcryptjs';
import { getClient, query } from '../../config/db.js';
import { AppError, ERROR_CODES } from '../../utils/errors.js';
import { grantSchoolScopeRoles } from '../auth/roleAssignments.js';
import { issueAuthSession, loadRoleNames } from '../auth/login.js';
import { slugify } from '../../utils/slugify.js';
import { normalizePhone } from '../../utils/phone.js';
const ensureUniqueSlug = async (client, base) => {
  let slug = base;
  let n = 0;
  for (;;) {
    const { rowCount } = await client.query(
      'SELECT 1 FROM tenancy.schools WHERE slug = $1',
      [slug]
    );
    if (!rowCount) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
};

const createUser = async (client, { email, password, schoolId, firstName, lastName, phone = null }) => {
  const hash = await bcrypt.hash(password, 12);
  const { rows } = await client.query(
    `INSERT INTO identity.users (email, phone, password_hash, school_id, first_name, last_name, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'active')
     RETURNING id`,
    [email ? String(email).trim().toLowerCase() : null, phone, hash, schoolId, firstName, lastName]
  );
  return rows[0].id;
};

const hasOwner = (data) =>
  Boolean(
    data.owner_email &&
      data.owner_phone &&
      data.owner_password &&
      data.owner_first_name &&
      data.owner_last_name
  );

const loadUserForSession = async (userId) => {
  const { rows } = await query(
    `SELECT id, email, phone, school_id, first_name, last_name, status FROM identity.users WHERE id = $1`,
    [userId]
  );
  return rows[0] || null;
};

/**
 * RegisterSchool action — single transaction (school, main branch, users, roles).
 */
export const provisionSchool = async (data, { provisionedBy = null, meta = {} } = {}) => {
  const adminPhone = normalizePhone(data.admin_phone);

  const partialOwner =
    data.owner_email ||
    data.owner_phone ||
    data.owner_password ||
    data.owner_first_name ||
    data.owner_last_name;
  if (partialOwner && !hasOwner(data)) {
    throw new AppError(
      'When creating a separate owner, provide owner_email, owner_phone, owner_password, owner_first_name, and owner_last_name.',
      422,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  if (hasOwner(data)) {
    const o = String(data.owner_email).trim().toLowerCase();
    const a = String(data.admin_email).trim().toLowerCase();
    if (o === a) {
      throw new AppError('Owner and administrator emails must differ.', 422, ERROR_CODES.VALIDATION_ERROR);
    }
    const ownerPhone = normalizePhone(data.owner_phone);
    if (ownerPhone === adminPhone) {
      throw new AppError('Owner and administrator phone numbers must differ.', 422, ERROR_CODES.VALIDATION_ERROR);
    }
  }

  const client = await getClient();
  let adminId;
  let ownerId;
  let mainBranchId;
  let schoolId;
  let tokenRoles;

  try {
    await client.query('BEGIN');

    const name = data.school_name;
    const slug = await ensureUniqueSlug(client, slugify(name));
    const address = data.school_address || null;
    const { latitude = null, longitude = null } = data;

    const schoolInsert = await client.query(
      `INSERT INTO tenancy.schools (name, slug, address, latitude, longitude, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING id`,
      [name, slug, address, latitude, longitude]
    );
    schoolId = schoolInsert.rows[0].id;

    const branchInsert = await client.query(
      `INSERT INTO tenancy.branches (
         school_id, code, name, is_main, address, latitude, longitude
       ) VALUES ($1, 'MAIN', $2, true, $3, $4, $5)
       RETURNING id`,
      [
        schoolId,
        data.main_branch_name || `${name} Main Branch`,
        address,
        latitude,
        longitude,
      ]
    );
    mainBranchId = branchInsert.rows[0].id;

    adminId = await createUser(client, {
      email: data.admin_email,
      phone: adminPhone,
      password: data.admin_password,
      schoolId,
      firstName: data.admin_first_name,
      lastName: data.admin_last_name,
    });

    ownerId = adminId;
    tokenRoles = ['SCHOOL_OWNER'];

    if (hasOwner(data)) {
      ownerId = await createUser(client, {
        email: data.owner_email,
        phone: normalizePhone(data.owner_phone),
        password: data.owner_password,
        schoolId,
        firstName: data.owner_first_name,
        lastName: data.owner_last_name,
      });
      await grantSchoolScopeRoles(client, {
        userId: ownerId,
        schoolId,
        roleNames: ['SCHOOL_OWNER'],
        grantedBy: provisionedBy,
      });
      await grantSchoolScopeRoles(client, {
        userId: adminId,
        schoolId,
        roleNames: ['SCHOOL_ADMIN'],
        grantedBy: provisionedBy,
      });
      tokenRoles = ['SCHOOL_ADMIN'];
    } else {
      await grantSchoolScopeRoles(client, {
        userId: adminId,
        schoolId,
        roleNames: ['SCHOOL_OWNER'],
        grantedBy: provisionedBy,
      });
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      throw new AppError('School slug, email, or phone already exists.', 409, ERROR_CODES.DUPLICATE_ENTRY);
    }
    throw err;
  } finally {
    client.release();
  }

  const user = await loadUserForSession(adminId);
  const roles = await loadRoleNames(adminId);
  const auth = await issueAuthSession(user, roles, meta);

  return {
    schoolId,
    mainBranchId,
    adminId,
    ownerId,
    provisionedBy,
    auth,
  };
};
