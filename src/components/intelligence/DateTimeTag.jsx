import { Clock } from 'lucide-react';
import { formatHKDateTime } from '@/lib/time';

export default function DateTimeTag({ date }) {
  const formatted = formatHKDateTime(date);
  if (!formatted) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-mono whitespace-nowrap">
      <Clock className="w-3 h-3 shrink-0" /> {formatted} HKT
    </span>
  );
}