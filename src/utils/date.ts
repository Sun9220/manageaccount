import type { DurationTemplate } from '../types';

export const nowIso = () => new Date().toISOString();

export const calcEndAt = (startAt: string, duration: DurationTemplate) => {
  if (duration.unit === 'lifetime') return undefined;
  const date = new Date(startAt);
  if (Number.isNaN(date.getTime())) return undefined;
  if (duration.unit === 'week') date.setDate(date.getDate() + duration.value * 7);
  if (duration.unit === 'month') date.setMonth(date.getMonth() + duration.value);
  if (duration.unit === 'year') date.setFullYear(date.getFullYear() + duration.value);
  return date.toISOString();
};

export const formatDateTime = (input?: string) =>
  input ? new Date(input).toLocaleString() : '—';
