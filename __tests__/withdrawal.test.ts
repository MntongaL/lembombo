import { isWithdrawalActive, withdrawalEnd } from '@/utils/withdrawal';
import { withdrawalFor } from '@/utils/treatmentWithdrawal';

describe('withdrawalEnd', () => {
  it('adds days to the treatment date', () => {
    const end = withdrawalEnd('2026-10-01', 10);
    expect(end?.getFullYear()).toBe(2026);
    expect(end?.getMonth()).toBe(9);
    expect(end?.getDate()).toBe(11);
  });
  it('returns null when days are unknown (nothing is invented)', () => {
    expect(withdrawalEnd('2026-10-01', undefined)).toBeNull();
    expect(withdrawalEnd('2026-10-01', null)).toBeNull();
  });
  it('returns null for invalid dates or negative days', () => {
    expect(withdrawalEnd('nope', 5)).toBeNull();
    expect(withdrawalEnd('2026-10-01', -1)).toBeNull();
  });
  it('is active through the end date and inactive after', () => {
    const end = withdrawalEnd('2026-10-01', 10);
    expect(isWithdrawalActive(end, new Date(2026, 9, 11, 15))).toBe(true);
    expect(isWithdrawalActive(end, new Date(2026, 9, 12))).toBe(false);
    expect(isWithdrawalActive(null)).toBe(false);
  });
});

describe('withdrawalFor', () => {
  const t = { id: 1, sheepId: 1, medicationId: 2, treatmentDate: '2026-10-01' };
  it('uses server end date when provided', () => {
    const w = withdrawalFor({ ...t, withdrawalEndDate: '2026-10-20' }, undefined, new Date(2026, 9, 15));
    expect(w.active).toBe(true);
  });
  it('has no warning without data', () => {
    expect(withdrawalFor(t, undefined).end).toBeNull();
    expect(withdrawalFor(t, { id: 2, name: 'X' }).active).toBe(false);
  });
});
