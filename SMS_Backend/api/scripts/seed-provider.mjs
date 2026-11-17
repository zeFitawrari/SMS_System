import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiRoot = join(__dirname, '..');
const repoRoot = join(apiRoot, '..');
dotenv.config({ path: join(repoRoot, '.env') });
dotenv.config({ path: join(apiRoot, '.env') });

const PLATFORM_SCHOOL_ID = '00000000-0000-0000-0000-000000000001';
const email = process.env.SEED_PROVIDER_EMAIL || 'provider@smb.local';
const password = process.env.SEED_PROVIDER_PASSWORD || 'ProviderPass123!';
const databaseUrl =
  process.env.DATABASE_URL ||
  'postgres://smb_user:smb_pass@localhost:5434/smb_db';

const pool = new pg.Pool({ connectionString: databaseUrl });

const signToken = (userId, roles, firstName, lastName) => {
  const claims = {
    'x-hasura-allowed-roles': roles,
    'x-hasura-default-role': roles[0],
    'x-hasura-user-id': String(userId),
    'x-hasura-school-id': PLATFORM_SCHOOL_ID,
    'x-hasura-first-name': firstName,
    'x-hasura-last-name': lastName,
  };
  return jwt.sign(
    { sub: String(userId), 'https://hasura.io/jwt/claims': claims },
    process.env.ACCESS_TOKEN_SECRET,
    { algorithm: 'HS256', expiresIn: '24h' }
  );
};

async function main() {
  const client = await pool.connect();
  try {
    const hash = await bcrypt.hash(password, 12);
    let userId;
    const existing = await client.query('SELECT id FROM identity.users WHERE lower(email) = lower($1)', [
      email,
    ]);
    if (existing.rows[0]) {
      userId = existing.rows[0].id;
      console.log('Provider user already exists:', email);
    } else {
      const ins = await client.query(
        `INSERT INTO identity.users (email, password_hash, school_id, first_name, last_name)
         VALUES ($1, $2, $3, 'Platform', 'Provider')
         RETURNING id`,
        [email, hash, PLATFORM_SCHOOL_ID]
      );
      userId = ins.rows[0].id;
      const roleRow = await client.query(
        `SELECT id FROM identity.roles WHERE name = 'SUPER_PROVIDER_ADMIN' AND school_id IS NULL`
      );
      const roleId = roleRow.rows[0]?.id;
      if (roleId) {
        await client.query(
          `INSERT INTO identity.role_assignments (user_id, school_id, role_id, scope_type)
           SELECT $1, $2, $3, 'SCHOOL'
           WHERE NOT EXISTS (
             SELECT 1 FROM identity.role_assignments
             WHERE user_id = $1 AND role_id = $3 AND school_id = $2
               AND scope_type = 'SCHOOL' AND revoked_at IS NULL
           )`,
          [userId, PLATFORM_SCHOOL_ID, roleId]
        );
      }
      console.log('Created provider user:', email);
    }

    const token = signToken(userId, ['SUPER_PROVIDER_ADMIN'], 'Platform', 'Provider');
    console.log('\nUse this Bearer token for Hasura RegisterSchool (dev only):\n');
    console.log(token);
    console.log('\nPassword:', password);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
