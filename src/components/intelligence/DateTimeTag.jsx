import { Clock } from 'lucide-react';
import moment from 'moment';

export default function DateTimeTag({ date }) {
  if (!date) return null;
  const m = moment(date);
  if (!m.isValid()) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-mono whitespace-nowrap">
      <Clock className="w-3 h-3 shrink-0" /> {m.format('MMM D, YYYY · HH:mm')}
    </span>
  );
}