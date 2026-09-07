import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, AlertCircle, TrendingUp, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatHKTime } from '@/lib/time';
import DateTimeTag from './DateTimeTag';

const KINDS = {
  signal: { label: 'Signal', icon: Activity, classes: 'bg-blue-50 text-blue-700' },
  event: { label: 'CIO Insight', icon: AlertCircle, classes: 'bg-amber-50 text-amber-700' },
  news: { label: 'Market Event', icon: TrendingUp, classes: 'bg-emerald-50 text-emerald-700' },
};

export default function LiveFeed({ signals, events, news, newIds, lastUpdated, refreshing, onRefresh }) {
  const feed = useMemo(() => {
    const s = (signals || []).map(i => ({
      key: `signal-${i.id}`, kind: 'signal', title: i.description,
      meta: [i.customer_segment, i.signal_type?.replace('_', ' ')].filter(Boolean).join(' · '),
      date: i.signal_date || i.created_date,
    }));
    const e = (events || []).map(i => ({
      key: `event-${i.id}`, kind: 'event', title: i.title,
      meta: [i.category, i.impact_level ? `${i.impact_level} impact` : ''].filter(Boolean).join(' · '),
      date: i.event_date || i.created_date,
    }));
    const n = (news || []).map(i => ({
      key: `news-${i.id}`, kind: 'news', title: i.headline,
      meta: [i.category, i.sentiment].filter(Boolean).join(' · '),
      date: i.published_date || i.created_date,
    }));
    return [...s, ...e, ...n]
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 8);
  }, [signals, events, news]);

  const newCount = newIds?.size || 0;

  return (
    <Card className="mb-6 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b bg-secondary/40">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
          </span>
          <h2 className="font-display text-lg text-primary">Live Intelligence Feed</h2>
          <span className="text-xs text-muted-foreground font-mono">
            {lastUpdated ? `Updated ${formatHKTime(lastUpdated)} HKT` : 'Loading…'}
          </span>
          {newCount > 0 && (
            <span className="text-[11px] font-semibold bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
              +{newCount} new
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw className={cn('w-3.5 h-3.5 mr-1', refreshing && 'animate-spin')} /> Refresh
        </Button>
      </div>
      <div className="divide-y">
        {feed.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">
            No intelligence yet — add signals, events or news to start the feed.
          </p>
        ) : feed.map((item) => {
          const kind = KINDS[item.kind];
          const Icon = kind.icon;
          const isNew = newIds?.has(item.key);
          return (
            <div key={item.key} className={cn('flex items-start gap-3 px-5 py-3', isNew && 'bg-accent/5')}>
              <span className={cn('shrink-0 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium mt-0.5', kind.classes)}>
                <Icon className="w-3 h-3" /> {kind.label}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-primary leading-snug truncate">{item.title}</p>
                {item.meta && <p className="text-[11px] text-muted-foreground capitalize truncate">{item.meta}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isNew && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide bg-accent text-accent-foreground px-1.5 py-0.5 rounded">
                    New
                  </span>
                )}
                <DateTimeTag date={item.date} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}