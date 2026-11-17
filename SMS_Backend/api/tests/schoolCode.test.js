import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { schoolCodeFromName, yearCodeFromDate } from '../src/utils/schoolCode.js';
import { buildRegistrationId } from '../src/services/student/registrationId.js';
import { calculateRegistrationPayment } from '../src/services/finance/registrationPaymentCalc.js';

describe('schoolCodeFromName', () => {
  it('uses first three letters', () => {
    assert.equal(schoolCodeFromName('ABC Academy'), 'ABC');
  });

  it('pads short names', () => {
    assert.equal(schoolCodeFromName('Ab'), 'ABX');
  });

  it('strips non-letters', () => {
    assert.equal(schoolCodeFromName('St. Mary'), 'STM');
  });
});

describe('buildRegistrationId', () => {
  it('matches ABC26######## pattern length', () => {
    const id = buildRegistrationId('Test School', '2026-09-01');
    assert.match(id, /^TES26\d{8}$/);
  });
});

describe('calculateRegistrationPayment', () => {
  it('applies ten-month discount', () => {
    const r = calculateRegistrationPayment({
      monthlyFee: 1000,
      durationMonths: 10,
      discountPercent: 15,
    });
    assert.equal(r.baseAmount, 10000);
    assert.equal(r.discountAmount, 1500);
    assert.equal(r.finalAmount, 8500);
  });
});

describe('yearCodeFromDate', () => {
  it('returns two-digit year', () => {
    assert.equal(yearCodeFromDate('2026-01-15'), '26');
  });
});
