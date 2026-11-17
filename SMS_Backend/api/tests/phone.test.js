import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhone } from '../src/utils/phone.js';

describe('normalizePhone (Ethiopia 251)', () => {
  it('stores international input as 251 + 9 digits', () => {
    assert.equal(normalizePhone('251911223344'), '251911223344');
    assert.equal(normalizePhone('+251 91 122 3344'), '251911223344');
  });

  it('converts local 0-prefix to 251', () => {
    assert.equal(normalizePhone('0911223344'), '251911223344');
    assert.equal(normalizePhone('0911-223-344'), '251911223344');
  });

  it('converts 9-digit national mobile to 251', () => {
    assert.equal(normalizePhone('911223344'), '251911223344');
  });

  it('rejects too short or non-mobile', () => {
    assert.throws(() => normalizePhone('123'));
    assert.throws(() => normalizePhone('25191122334'));
    assert.throws(() => normalizePhone('0811223344'));
  });
});
