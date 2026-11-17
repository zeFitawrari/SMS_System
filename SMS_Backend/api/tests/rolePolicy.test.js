import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assertRoleSetAllowed } from '../src/constants/rolePolicy.js';

describe('assertRoleSetAllowed', () => {
  it('allows single role', () => {
    assert.deepEqual(assertRoleSetAllowed(['TEACHER']), ['TEACHER']);
  });

  it('allows PARENT plus one other', () => {
    assert.deepEqual(assertRoleSetAllowed(['PARENT', 'TEACHER']), ['PARENT', 'TEACHER']);
  });

  it('rejects three roles', () => {
    assert.throws(() => assertRoleSetAllowed(['PARENT', 'TEACHER', 'SCHOOL_ADMIN']));
  });

  it('rejects two non-parent roles', () => {
    assert.throws(() => assertRoleSetAllowed(['SCHOOL_ADMIN', 'TEACHER']));
  });
});
