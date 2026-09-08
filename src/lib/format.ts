import { format, formatDistanceToNowStrict, isToday, isYesterday, parseISO } from 'date-fns';

const toDate = (value: string | Date): Date =>
  typeof value === 'string' ? parseISO(value) : value;

/** Indian digit grouping. en-US formatting gets lakhs and crores wrong. */
export function formatINR(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/** Compact money for dashboard tiles: ₹4.86 L, ₹1.2 Cr. */
export function formatINRShort(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  if (Math.abs(value) >= 10_000_000) return `₹${(value / 10_000_000).toFixed(2)} Cr`;
  if (Math.abs(value) >= 100_000) return `₹${(value / 100_000).toFixed(2)} L`;
  return formatINR(value);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return format(toDate(value), 'd MMM yyyy');
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return format(toDate(value), "d MMM yyyy 'at' h:mm a");
}

/** "2 hours ago" for anything recent, a real date once it stops being news. */
export function formatRelative(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = toDate(value);
  if (isToday(date)) return `${formatDistanceToNowStrict(date)} ago`;
  if (isYesterday(date)) return `Yesterday, ${format(date, 'h:mm a')}`;
  return format(date, 'd MMM, h:mm a');
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function truncate(text: string, max = 80): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
