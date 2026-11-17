import { normalizePhone } from '../../utils/phone.js';

export const upsertGuardian = async (client, schoolId, g) => {
  const phone = normalizePhone(g.phone);
  const phoneAlt = g.phone_alt ? normalizePhone(g.phone_alt) : null;
  const email = g.email ? String(g.email).trim().toLowerCase() : null;

  const existing = await client.query(
    `SELECT id FROM student.guardians WHERE school_id = $1 AND phone = $2`,
    [schoolId, phone]
  );
  if (existing.rows[0]) {
    const gid = existing.rows[0].id;
    await client.query(
      `UPDATE student.guardians
       SET full_name = $2, phone_alt = COALESCE($3, phone_alt), email = COALESCE($4, email),
           address = COALESCE($5, address), updated_at = NOW()
       WHERE id = $1`,
      [gid, g.full_name, phoneAlt, email, g.address || null]
    );
    return gid;
  }

  const ins = await client.query(
    `INSERT INTO student.guardians (school_id, full_name, phone, phone_alt, email, address)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [schoolId, g.full_name, phone, phoneAlt, email, g.address || null]
  );
  return ins.rows[0].id;
};
