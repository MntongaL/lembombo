import type { Medication, Treatment } from '@/types/api';
import { parseIsoDate } from './date';

export interface WithdrawalInfo { end: Date | null; active: boolean }

/** Prefers a server-provided end date; otherwise computes from the medication's withdrawal days if known. */
export function withdrawalFor(t: Treatment, med: Medication | undefined, now: Date = new Date()): WithdrawalInfo {
  const serverEnd = t.withdrawalDaysApplied ? parseIsoDate(t.administeredAt?.toString()) : null;
  const end = serverEnd ?? withdrawalEnd(t.treatmentDate, med?.withdrawalPeriodDays);
  return { end, active: isWithdrawalActive(end, now) };
}

export function withdrawalEnd(
  treatmentDate: string,
  withdrawalDays?: number | null,
): Date | null {
  if (!treatmentDate || withdrawalDays == null || withdrawalDays < 0) {
    return null;
  }

  const date = parseIsoDate(treatmentDate);

  if (!date) {
    return null;
  }

  date.setDate(date.getDate() + withdrawalDays);

  return date;
}

export function isWithdrawalActive(
  end: Date | null,
  now: Date = new Date(),
): boolean {
  if (!end) return false;

  // Withdrawal remains active through the end date.
  return now < new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate() + 1,
  );
}
