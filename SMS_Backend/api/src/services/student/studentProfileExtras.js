import { AppError, ERROR_CODES } from '../../utils/errors.js';

export const attachOptionalProfile = async (client, studentId, input) => {
  const health = input.health;
  if (health && Object.keys(health).some((k) => health[k])) {
    await client.query(
      `INSERT INTO student.student_health
         (student_id, medical_conditions, allergies, medications, medical_history, special_needs, emergency_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        studentId,
        health.medical_conditions || null,
        health.allergies || null,
        health.medications || null,
        health.medical_history || null,
        health.special_needs || null,
        health.emergency_notes || null,
      ]
    );
  }

  const addr = input.address;
  if (addr?.label || addr?.address_line || addr?.latitude != null) {
    if (addr.latitude != null && (addr.latitude < -90 || addr.latitude > 90)) {
      throw new AppError('Latitude out of range.', 422, ERROR_CODES.VALIDATION_ERROR);
    }
    if (addr.longitude != null && (addr.longitude < -180 || addr.longitude > 180)) {
      throw new AppError('Longitude out of range.', 422, ERROR_CODES.VALIDATION_ERROR);
    }
    await client.query(
      `INSERT INTO student.student_addresses (student_id, label, address_line, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5)`,
      [studentId, addr.label || 'home', addr.address_line || null, addr.latitude ?? null, addr.longitude ?? null]
    );
  }
};
