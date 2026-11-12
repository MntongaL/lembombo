import { matchesSearch, normalizeList } from '@/utils/list';
import { compact } from '@/utils/payload';
import { medicationSchema, registerSchema, treatmentSchema } from '@/schemas';

describe('normalizeList', () => {
  it('handles arrays and common page wrappers', () => {
    expect(normalizeList<number>([1, 2])).toEqual([1, 2]);
    expect(normalizeList<number>({ content: [1] })).toEqual([1]);
    expect(normalizeList<number>({ data: [3] })).toEqual([3]);
    expect(normalizeList<number>(null)).toEqual([]);
  });
});

describe('matchesSearch / compact', () => {
  it('matches case-insensitively', () => {
    expect(matchesSearch(['Ewe 42'], 'ewe')).toBe(true);
    expect(matchesSearch([undefined], 'x')).toBe(false);
    expect(matchesSearch(['a'], '  ')).toBe(true);
  });
  it('drops empty strings', () => {
    expect(compact({ a: 'x', b: '' })).toEqual({ a: 'x' });
  });
});

describe('schemas', () => {
  it('requires a medication name and numeric withdrawal days', () => {
    expect(medicationSchema.safeParse({ name: '', dosageInstructions: '', route: '', withdrawalPeriodDays: '' }).success).toBe(false);
    expect(medicationSchema.safeParse({ name: 'A', dosageInstructions: '', route: '', withdrawalPeriodDays: '1x' }).success).toBe(false);
    expect(medicationSchema.safeParse({ name: 'A', dosageInstructions: '', route: '', withdrawalPeriodDays: '14' }).success).toBe(true);
  });
  it('does not block same-day treatments (no uniqueness rule)', () => {
    const v = { sheepId: '1', medicationId: '2', dosage: '2 ml', treatmentDate: '2026-10-10', notes: '' };
    expect(treatmentSchema.safeParse(v).success).toBe(true);
    expect(treatmentSchema.safeParse(v).success).toBe(true);
  });
  it('checks password confirmation', () => {
    expect(registerSchema.safeParse({ fullName: 'A', email: 'a@b.co', password: 'password1', confirmPassword: 'password2' }).success).toBe(false);
  });
});
