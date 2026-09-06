import { useState } from 'react';
import { ChevronLeft, ChevronRight, Mail, Smartphone, Bell, MessageSquare, Phone, CalendarDays } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const channelStyles = {
  email: 'bg-blue-100 text-blue-700',
  sms: 'bg-purple-100 text-purple-700',
  push: 'bg-amber-100 text-amber-700',
  whatsapp: 'bg-emerald-100 text-emerald-700',
  rm_call: 'bg-rose-100 text-rose-700',
  in_app: 'bg-teal-100 text-teal-700',
};
const channelIcons = { email: Mail, sms: Smartphone, push: Bell, whatsapp: MessageSquare, rm_call: Phone, in_app: Bell };
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CampaignCalendar({ distributions }) {
  const now = new Date();
  const [cursor, setCursor] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const startOffset = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const byDay = {};
  (distributions || []).forEach((d) => {
    const raw = d.scheduled_date || d.created_date;
    if (!raw) return;
    const dt = new Date(raw);
    const key = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(d);
  });

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthLabel = cursor.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const isToday = (d) => now.getFullYear() === year && now.getMonth() === month && now.getDate() === d;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-accent" />
          <h2 className="font-display text-lg text-primary">{monthLabel}</h2>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {weekdays.map((w) => (
          <div key={w} className="text-[11px] text-muted-foreground uppercase text-center font-medium py-1">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((d, i) => {
          if (d === null) return <div key={`e${i}`} />;
          const entries = byDay[`${year}-${month}-${d}`] || [];
          return (
            <div key={d} className={cn('min-h-[92px] rounded-lg border p-1.5 space-y-1', isToday(d) ? 'border-accent bg-accent/5' : 'border-border')}>
              <div className={cn('text-xs font-medium text-right px-0.5', isToday(d) ? 'text-accent' : 'text-muted-foreground')}>{d}</div>
              {entries.slice(0, 3).map((e) => {
                const ch = (e.target_channels || '').split(',')[0].trim();
                const Icon = channelIcons[ch] || Bell;
                const dt = new Date(e.scheduled_date || e.created_date);
                return (
                  <div key={e.id} className={cn('rounded px-1.5 py-1 text-[10px] leading-tight flex items-start gap-1', channelStyles[ch] || 'bg-slate-100 text-slate-700')} title={e.campaign_title}>
                    <Icon className="w-3 h-3 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="font-medium">{dt.getHours() > 9 ? dt.getHours() : '0' + dt.getHours()}:00</span>{' '}
                      <span className="line-clamp-2">{e.campaign_title}</span>
                    </div>
                  </div>
                );
              })}
              {entries.length > 3 && <div className="text-[10px] text-muted-foreground px-1">+{entries.length - 3} more</div>}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t">
        {Object.keys(channelStyles).map((ch) => {
          const Icon = channelIcons[ch];
          return (
            <span key={ch} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className={cn('w-4 h-4 rounded flex items-center justify-center', channelStyles[ch])}><Icon className="w-2.5 h-2.5" /></span>
              {ch.replace('_', ' ')}
            </span>
          );
        })}
      </div>
    </Card>
  );
}