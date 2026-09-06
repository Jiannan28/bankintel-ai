const HK_TZ = 'Asia/Hong_Kong';

// Formats a date in Hong Kong time as "Sep 6, 2026 · 21:45"
export function formatHKDateTime(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: HK_TZ,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (t) => parts.find(p => p.type === t)?.value || '';
  return `${get('month')} ${get('day')}, ${get('year')} · ${get('hour')}:${get('minute')}`;
}

// Formats a date in Hong Kong time as "21:45:30"
export function formatHKTime(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: HK_TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(d);
}