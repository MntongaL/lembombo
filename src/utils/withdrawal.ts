import { parseIsoDate } from './date';

/**
 * Withdrawal end date = treatment date + withdrawal days.
 * Returns null unless BOTH values are present (nothing is ever assumed or invented).
 */
export function withdrawalEndAt(treatmentDate: string, days?: number | null): Date | null {
  if (days === undefined || days === null || !Number.isFinite(days) || days < 0) return null;
  const start = parseIsoDate(treatmentDate);
  if (!start) return null;
  const end = new Date(start);
  end.setDate(end.getDate() + days);
  return end;
}

export function isWithdrawalActive(end: Date | null, now: Date = new Date()): boolean {
  if (!end) return false;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return end.getTime() >= startOfToday.getTime();
}
