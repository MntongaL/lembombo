export function todayIso(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function parseIsoDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = parseIsoDate(value);
  return d ? d.toLocaleDateString() : value;
}

export function formatDateTime(value?: string | null): string {

  if (!value) return 'never';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

export function formatDateObj(d: Date | null): string {
  return d ? d.toLocaleDateString() : '—';
}

export function getMonthOptions(): { label: string; value: string }[] {
  return [
    { label: 'January', value: '01' },
    { label: 'February', value: '02' },
    { label: 'March', value: '03' },
    { label: 'April', value: '04' },
    { label: 'May', value: '05' },
    { label: 'June', value: '06' },
    { label: 'July', value: '07' },
    { label: 'August', value: '08' },
    { label: 'September', value: '09' },
    { label: 'October', value: '10' },
    { label: 'November', value: '11' },
    { label: 'December', value: '12' },
  ];
}

export function formatMonth(value?: string | null): string {
  if (!value) return '—';
  const m = Number(value);
  if (Number.isNaN(m) || m < 1 || m > 12) return value;
  return new Date(2000, m - 1, 1).toLocaleString(undefined, { month: 'long' });
}