import Joi from 'joi';
import { normalizePhone } from '../utils/phone.js';

/**
 * Express-only checks GraphQL actions cannot express (cross-field, password strength).
 * Types, required fields, and UUIDs belong in hasura/metadata/actions.graphql.
 */
export const registerSchoolSafetySchema = Joi.object()
  .unknown(true)
  .custom((value, helpers) => {
    const v = value || {};
    if (v.latitude != null && v.longitude == null) {
      return helpers.message('longitude is required when latitude is set');
    }
    if (v.longitude != null && v.latitude == null) {
      return helpers.message('latitude is required when longitude is set');
    }
    if (typeof v.admin_password === 'string' && v.admin_password.length < 8) {
      return helpers.message('admin_password must be at least 8 characters');
    }
    if (typeof v.owner_password === 'string' && v.owner_password.length < 8) {
      return helpers.message('owner_password must be at least 8 characters');
    }
    if (v.latitude != null && (v.latitude < -90 || v.latitude > 90)) {
      return helpers.message('latitude out of range');
    }
    if (v.longitude != null && (v.longitude < -180 || v.longitude > 180)) {
      return helpers.message('longitude out of range');
    }
    if (typeof v.admin_phone === 'string' && v.admin_phone.trim()) {
      try {
        normalizePhone(v.admin_phone);
      } catch {
        return helpers.message('admin_phone is invalid');
      }
    }
    if (typeof v.owner_phone === 'string' && v.owner_phone.trim()) {
      try {
        normalizePhone(v.owner_phone);
      } catch {
        return helpers.message('owner_phone is invalid');
      }
    }
    return v;
  });

export const loginSafetySchema = Joi.object()
  .unknown(true)
  .custom((value, helpers) => {
    const v = value || {};
    const hasEmail = typeof v.email === 'string' && v.email.trim().length > 0;
    const hasPhone = typeof v.phone === 'string' && v.phone.trim().length > 0;
    if (hasEmail === hasPhone) {
      return helpers.message('Provide exactly one of email or phone');
    }
    if (typeof v.password !== 'string' || v.password.length < 8) {
      return helpers.message('password must be at least 8 characters');
    }
    if (v.password.length > 256) {
      return helpers.message('password is too long');
    }
    return v;
  });

export const refreshSessionSafetySchema = Joi.object()
  .unknown(true)
  .custom((value, helpers) => {
    const v = value || {};
    if (typeof v.session_token === 'string' && v.session_token.length < 16) {
      return helpers.message('session_token is invalid');
    }
    return v;
  });
