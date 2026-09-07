import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import LiveFeed from '@/components/intelligence/LiveFeed';
import AutoNewsSync from '@/components/intelligence/AutoNewsSync';
import DateTimeTag from '@/components/intelligence/DateTimeTag';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Activity, AlertCircle, TrendingUp, Plus, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { key: 'signal', label: 'Customer Signals', icon: Activity },
  { key: 'event', label: 'CIO Insights', icon: AlertCircle },
  { key: 'news', label: 'Investment News', icon: TrendingUp },
];

const eventCategories = [
  { value: 'regulatory', label: 'Regulatory' },
  { value: 'economic', label: 'Economic' },
  { value: 'competitor', label: 'Competitor' },
  { value: 'market', label: 'Market' },
  { value: 'geopolitical', label: 'Geopolitical' },
];

const signalCategories = [
  { value: 'transactional', label: 'Transactional' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'life_event', label: 'Life Event' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'portfolio', label: 'Portfolio' },
];

const signalSorts = [
  { value: 'intensity_desc', label: 'Intensity: High to Low' },
  { value: 'intensity_asc', label: 'Intensity: Low to High' },
  { value: 'newest', label: 'Newest First' },
];

const newsCategories = [
  { value: 'equities', label: 'Equities' },
  { value: 'securities', label: 'Securities' },
  { value: 'fixed_income', label: 'Fixed Income (Bonds)' },
  { value: 'fx', label: 'FX' },
  { value: 'commodities', label: 'Commodities' },
  { value: 'macro', label: 'Macro' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'insurance', label: 'Insurance' },
];

export default function Intelligence() {
  const [activeTab, setActiveTab] = useState('signal');
  const [signals, setSignals] = useState([]);
  const [events, setEvents] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [signalTypeFilter, setSignalTypeFilter] = useState('all');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [signalSort, setSignalSort] = useState('intensity_desc');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [newIds, setNewIds] = useState(() => new Set());
  const seenIdsRef = useRef(null);

  const fetchAll = async () => {
    const [s, e, n] = await Promise.all([
      base44.entities.CustomerSignal.list('-signal_date', 50),
      base44.entities.MarketEvent.list('-event_date', 50),
      base44.entities.InvestmentNews.list('-published_date', 50),
    ]);
    return { s: s || [], e: e || [], n: n || [] };
  };

  const applyData = ({ s, e, n }) => {
    const keys = [
      ...s.map(i => `signal-${i.id}`),
      ...e.map(i => `event-${i.id}`),
      ...n.map(i => `news-${i.id}`),
    ];
    if (seenIdsRef.current) {
      setNewIds(new Set(keys.filter(k => !seenIdsRef.current.has(k))));
    } else {
      setNewIds(new Set());
    }
    seenIdsRef.current = new Set(keys);
    setSignals(s);
    setEvents(e);
    setNews(n);
    setLastUpdated(new Date());
  };

  const loadAll = async () => {
    setLoading(true);
    try { applyData(await fetchAll()); } catch (err) { /* ignore */ } finally { setLoading(false); }
  };

  const refreshFeed = useCallback(async () => {
    setRefreshing(true);
    try { applyData(await fetchAll()); } catch (err) { /* ignore */ } finally { setRefreshing(false); }
  }, []);

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    const iv = setInterval(refreshFeed, 12 * 60 * 60 * 1000); // every 12 hours
    return () => clearInterval(iv);
  }, [refreshFeed]);

  const filteredSignals = signals
    .filter(s =>
      (signalTypeFilter === 'all' || s.signal_type === signalTypeFilter) &&
      (segmentFilter === 'all' || s.customer_segment === segmentFilter)
    )
    .sort((a, b) => {
      if (signalSort === 'intensity_desc') return (b.intensity || 0) - (a.intensity || 0);
      if (signalSort === 'intensity_asc') return (a.intensity || 0) - (b.intensity || 0);
      return 0;
    });
  const signalSegments = [...new Set(signals.map(s => s.customer_segment).filter(Boolean))].sort();

  const filteredEvents = categoryFilter === 'all' ? events : events.filter(e => e.category === categoryFilter);
  const filteredNews = news.filter(n =>
    (categoryFilter === 'all' || n.category === categoryFilter) &&
    (sentimentFilter === 'all' || n.sentiment === sentimentFilter)
  );

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl text-primary mb-1">Intelligence Hub</h1>
          <p className="text-muted-foreground">Customer signals, CIO insights from the Chief Investment Office, investment news and omni-channel behaviors.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AutoNewsSync onSynced={refreshFeed} />
          <Button onClick={() => setAddOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="w-4 h-4 mr-1.5" /> Add Intelligence
          </Button>
        </div>
      </div>

      <LiveFeed
        signals={signals}
        events={events}
        news={news}
        newIds={newIds}
        lastUpdated={lastUpdated}
        refreshing={refreshing}
        onRefresh={refreshFeed}
      />

      <div className="flex gap-1 mb-6 border-b overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => { setActiveTab(t.key); setCategoryFilter('all'); setSentimentFilter('all'); }}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                active ? "border-accent text-primary" : "border-transparent text-muted-foreground hover:text-primary"
              )}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded-full">
                {t.key === 'signal' ? signals.length : t.key === 'event' ? events.length : news.length}
              </span>
            </button>
          );
        })}
      </div>

      {activeTab === 'signal' && !loading && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" /> Drill down
          </div>
          <Select value={signalTypeFilter} onValueChange={setSignalTypeFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {signalCategories.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={segmentFilter} onValueChange={setSegmentFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Segments</SelectItem>
              {signalSegments.map(seg => (
                <SelectItem key={seg} value={seg}>{seg}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={signalSort} onValueChange={setSignalSort}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {signalSorts.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {(activeTab === 'event' || activeTab === 'news') && !loading && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" /> Drill down
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {(activeTab === 'event' ? eventCategories : newsCategories).map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeTab === 'news' && (
            <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sentiments</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" /></div>
      ) : activeTab === 'signal' ? (
        <SignalList items={filteredSignals} filtered={signalTypeFilter !== 'all' || segmentFilter !== 'all'} />
      ) : activeTab === 'event' ? (
        <EventList items={filteredEvents} filtered={categoryFilter !== 'all'} />
      ) : (
        <NewsList items={filteredNews} filtered={categoryFilter !== 'all' || sentimentFilter !== 'all'} />
      )}

      <AddDialog open={addOpen} onOpenChange={setAddOpen} onAdded={loadAll} defaultType={activeTab} />
    </div>
  );
}

function SignalList({ items }) {
  const typeColors = {
    transactional: 'bg-blue-50 text-blue-700',
    behavioral: 'bg-purple-50 text-purple-700',
    life_event: 'bg-amber-50 text-amber-700',
    engagement: 'bg-teal-50 text-teal-700',
    portfolio: 'bg-emerald-50 text-emerald-700',
  };
  if (items.length === 0) return <EmptyState label="customer signals" />;
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {items.map((s) => (
        <Card key={s.id} className="p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <span className={cn('text-[11px] px-2 py-1 rounded-full font-medium uppercase tracking-wide', typeColors[s.signal_type] || 'bg-slate-100')}>{s.signal_type?.replace('_', ' ')}</span>
            <div className="flex items-center gap-1.5">
              <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-accent" style={{ width: `${s.intensity || 50}%` }} />
              </div>
              <span className="text-xs font-mono text-muted-foreground">{s.intensity || 0}</span>
            </div>
          </div>
          <p className="text-sm text-primary mb-3 leading-relaxed">{s.description}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <DateTimeTag date={s.signal_date} />
            <Tag label="Segment" value={s.customer_segment} />
            <Tag label="Channel" value={s.channel} />
            <Tag label="Product" value={s.product_interest} />
          </div>
        </Card>
      ))}
    </div>
  );
}

function EventList({ items, filtered }) {
  const impactColors = { low: 'bg-slate-100 text-slate-600', medium: 'bg-amber-100 text-amber-700', high: 'bg-rose-100 text-rose-700' };
  const catColors = { regulatory: 'bg-indigo-50 text-indigo-700', economic: 'bg-blue-50 text-blue-700', competitor: 'bg-purple-50 text-purple-700', market: 'bg-emerald-50 text-emerald-700', geopolitical: 'bg-rose-50 text-rose-700' };
  if (items.length === 0) return <EmptyState label="CIO insights" filtered={filtered} />;
  return (
    <div className="space-y-3">
      {items.map((e) => (
        <Card key={e.id} className="p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={cn('text-[11px] px-2 py-0.5 rounded-full font-medium', catColors[e.category])}>{e.category}</span>
                <span className={cn('text-[11px] px-2 py-0.5 rounded-full font-medium uppercase', impactColors[e.impact_level])}>{e.impact_level} impact</span>
              </div>
              <h3 className="font-display text-lg text-primary">{e.title}</h3>
            </div>
            <DateTimeTag date={e.event_date} />
          </div>
          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{e.description}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <Tag label="Affected Segment" value={e.affected_segments} />
            <Tag label="Product Category" value={e.product_category} />
            <Tag label="Source" value={e.source} />
          </div>
        </Card>
      ))}
    </div>
  );
}

function NewsList({ items, filtered }) {
  const sentColors = { positive: 'bg-emerald-100 text-emerald-700', negative: 'bg-rose-100 text-rose-700', neutral: 'bg-slate-100 text-slate-600' };
  if (items.length === 0) return <EmptyState label="investment news" filtered={filtered} />;
  return (
    <div className="space-y-3">
      {items.map((n) => (
        <Card key={n.id} className="p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 uppercase">{n.category}</span>
                <span className={cn('text-[11px] px-2 py-0.5 rounded-full font-medium', sentColors[n.sentiment])}>{n.sentiment}</span>
                <span className="text-[11px] text-muted-foreground">Relevance: {n.relevance_score || 0}</span>
              </div>
              <h3 className="font-display text-lg text-primary mb-1">{n.headline}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{n.summary}</p>
            </div>
            <DateTimeTag date={n.published_date} />
          </div>
          <div className="flex flex-wrap gap-2 text-xs mt-3">
            <Tag label="Source" value={n.source} />
            <Tag label="Products" value={n.affected_products} />
          </div>
        </Card>
      ))}
    </div>
  );
}

function Tag({ label, value }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium text-primary">{value}</span>
    </span>
  );
}

function EmptyState({ label, filtered }) {
  return (
    <Card className="p-12 text-center">
      <Filter className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
      <p className="text-muted-foreground">
        {filtered ? `No ${label} match the current filters.` : `No ${label} yet. Add intelligence to fuel campaign ideation.`}
      </p>
    </Card>
  );
}

function AddDialog({ open, onOpenChange, onAdded, defaultType }) {
  const [type, setType] = useState(defaultType);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { setType(defaultType); setForm({}); }, [defaultType, open]);

  const save = async () => {
    setSaving(true);
    try {
      if (type === 'signal') {
        await base44.entities.CustomerSignal.create({
          customer_segment: form.customer_segment || 'Mass Affluent',
          signal_type: form.signal_type || 'behavioral',
          description: form.description,
          intensity: Number(form.intensity) || 50,
          channel: form.channel || 'mobile',
          product_interest: form.product_interest || '',
          status: 'new',
          signal_date: new Date().toISOString(),
        });
      } else if (type === 'event') {
        await base44.entities.MarketEvent.create({
          title: form.title,
          category: form.category || 'market',
          description: form.description,
          impact_level: form.impact_level || 'medium',
          affected_segments: form.affected_segments || '',
          product_category: form.product_category || '',
          source: form.source || '',
          event_date: new Date().toISOString(),
          status: 'new',
        });
      } else {
        await base44.entities.InvestmentNews.create({
          headline: form.title,
          summary: form.description,
          category: form.category || 'macro',
          sentiment: form.sentiment || 'neutral',
          relevance_score: Number(form.relevance_score) || 50,
          source: form.source || '',
          published_date: new Date().toISOString(),
          affected_products: form.affected_products || '',
          status: 'new',
        });
      }
      onOpenChange(false);
      onAdded();
      setForm({});
    } catch (e) { /* ignore */ } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Add Intelligence</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Intelligence Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="signal">Customer Signal</SelectItem>
                <SelectItem value="event">CIO Insight</SelectItem>
                <SelectItem value="news">Investment News</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === 'signal' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Customer Segment</Label><Input value={form.customer_segment || ''} onChange={e => setForm({...form, customer_segment: e.target.value})} placeholder="Mass Affluent" /></div>
                <div><Label>Signal Type</Label><Select value={form.signal_type || 'behavioral'} onValueChange={v => setForm({...form, signal_type: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="transactional">Transactional</SelectItem><SelectItem value="behavioral">Behavioral</SelectItem><SelectItem value="life_event">Life Event</SelectItem><SelectItem value="engagement">Engagement</SelectItem><SelectItem value="portfolio">Portfolio</SelectItem></SelectContent></Select></div>
              </div>
              <div><Label>Description</Label><Textarea value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} rows={3} placeholder="Describe the signal..." /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Intensity (1-100)</Label><Input type="number" value={form.intensity || ''} onChange={e => setForm({...form, intensity: e.target.value})} /></div>
                <div><Label>Channel</Label><Input value={form.channel || ''} onChange={e => setForm({...form, channel: e.target.value})} placeholder="mobile" /></div>
                <div><Label>Product Interest</Label><Input value={form.product_interest || ''} onChange={e => setForm({...form, product_interest: e.target.value})} placeholder="mortgage" /></div>
              </div>
            </>
          )}

          {type === 'event' && (
            <>
              <div><Label>Title</Label><Input value={form.title || ''} onChange={e => setForm({...form, title: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Category</Label><Select value={form.category || 'market'} onValueChange={v => setForm({...form, category: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="regulatory">Regulatory</SelectItem><SelectItem value="economic">Economic</SelectItem><SelectItem value="competitor">Competitor</SelectItem><SelectItem value="market">Market</SelectItem><SelectItem value="geopolitical">Geopolitical</SelectItem></SelectContent></Select></div>
                <div><Label>Impact</Label><Select value={form.impact_level || 'medium'} onValueChange={v => setForm({...form, impact_level: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent></Select></div>
              </div>
              <div><Label>Description</Label><Textarea value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Affected Segments</Label><Input value={form.affected_segments || ''} onChange={e => setForm({...form, affected_segments: e.target.value})} placeholder="HNW, Mass Affluent" /></div>
                <div><Label>Product Category</Label><Input value={form.product_category || ''} onChange={e => setForm({...form, product_category: e.target.value})} placeholder="Wealth, Funds" /></div>
              </div>
              <div><Label>Source</Label><Input value={form.source || ''} onChange={e => setForm({...form, source: e.target.value})} placeholder="Chief Investment Office" /></div>
            </>
          )}

          {type === 'news' && (
            <>
              <div><Label>Headline</Label><Input value={form.title || ''} onChange={e => setForm({...form, title: e.target.value})} /></div>
              <div><Label>Summary</Label><Textarea value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} rows={3} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Category</Label><Select value={form.category || 'macro'} onValueChange={v => setForm({...form, category: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="equities">Equities</SelectItem><SelectItem value="fixed_income">Fixed Income</SelectItem><SelectItem value="fx">FX</SelectItem><SelectItem value="commodities">Commodities</SelectItem><SelectItem value="macro">Macro</SelectItem></SelectContent></Select></div>
                <div><Label>Sentiment</Label><Select value={form.sentiment || 'neutral'} onValueChange={v => setForm({...form, sentiment: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="positive">Positive</SelectItem><SelectItem value="negative">Negative</SelectItem><SelectItem value="neutral">Neutral</SelectItem></SelectContent></Select></div>
                <div><Label>Relevance (1-100)</Label><Input type="number" value={form.relevance_score || ''} onChange={e => setForm({...form, relevance_score: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Source</Label><Input value={form.source || ''} onChange={e => setForm({...form, source: e.target.value})} placeholder="Reuters" /></div>
                <div><Label>Affected Products</Label><Input value={form.affected_products || ''} onChange={e => setForm({...form, affected_products: e.target.value})} placeholder="Wealth, Funds" /></div>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">{saving ? 'Saving...' : 'Save Intelligence'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}