// Formatting helpers for vi.ts templates: "{name}" placeholders, numbers and durations.
import { vi } from './vi';

/** Replaces `{key}` placeholders; unknown keys are left as-is. */
export function t(template: string, params: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (m, key: string) =>
    key in params ? String(params[key]) : m,
  );
}

const intFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
const decFormat = new Intl.NumberFormat('vi-VN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateTimeFormat = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
  day: '2-digit',
  month: '2-digit',
});

const timeFormat = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' });

/** Local clock time of an epoch-ms timestamp, e.g. 03:20. */
export const formatTime = (at: number): string => timeFormat.format(at);

/** Local time and date of an epoch-ms timestamp, e.g. 14:05 01/10. */
export const formatDateTime = (at: number): string => dateTimeFormat.format(at);

/** Grouped integer, e.g. 8.420. */
export const formatInt = (n: number): string => intFormat.format(Math.floor(n));

/** Two-decimal number, e.g. 1,11. */
export const formatDec = (n: number): string => decFormat.format(n);

/** Human duration from milliseconds using vi.time. */
export function formatDuration(ms: number): string {
  const totalMin = Math.max(0, Math.ceil(ms / 60_000));
  if (ms < 60_000) return t(vi.time.seconds, { n: Math.max(0, Math.ceil(ms / 1000)) });
  const days = Math.floor(totalMin / 1440);
  if (days >= 1) return t(vi.time.days, { n: days });
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return t(vi.time.minutes, { n: m });
  return m === 0 ? t(vi.time.hours, { n: h }) : t(vi.time.hoursMinutes, { h, m });
}
