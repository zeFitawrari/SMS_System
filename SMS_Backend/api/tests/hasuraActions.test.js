import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  loginSafetySchema,
  refreshSessionSafetySchema,
  registerSchoolSafetySchema,
} from '../src/validators/hasuraActions.js';

describe('registerSchoolSafetySchema', () => {
  it('allows valid payload from Hasura', () => {
    const { error } = registerSchoolSafetySchema.validate({
      school_name: 'Test School',
      admin_email: 'a@test.local',
      admin_phone: '251911223344',
      admin_password: 'longenough',
      admin_first_name: 'A',
      admin_last_name: 'B',
    });
    assert.equal(error, undefined);
  });

  it('requires lat and long together', () => {
    const { error } = registerSchoolSafetySchema.validate({
      school_name: 'Test School',
      latitude: 9,
      admin_password: 'longenough',
    });
    assert.ok(error);
  });

  it('rejects short admin password', () => {
    const { error } = registerSchoolSafetySchema.validate({
      admin_password: 'short',
    });
    assert.ok(error);
  });

  it('rejects invalid admin_phone', () => {
    const { error } = registerSchoolSafetySchema.validate({
      admin_phone: '123',
      admin_password: 'longenough',
    });
    assert.ok(error);
  });
});

describe('loginSafetySchema', () => {
  it('allows login with email', () => {
    const { error } = loginSafetySchema.validate({
      email: 'a@test.local',
      password: 'secret123',
    });
    assert.equal(error, undefined);
  });

  it('requires email xor phone', () => {
    const { error } = loginSafetySchema.validate({
      email: 'a@test.local',
      phone: '251911223344',
      password: 'secret123',
    });
    assert.ok(error);
  });
});

describe('refreshSessionSafetySchema', () => {
  it('rejects short session token', () => {
    const { error } = refreshSessionSafetySchema.validate({ session_token: 'short' });
    assert.ok(error);
  });
});
