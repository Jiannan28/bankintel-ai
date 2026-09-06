import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
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
  { key: 'event', label: 'Market Events', icon: AlertCircle },
  { key: 'news', label: 'Investment News', icon: TrendingUp },
];

export default function Intelligence() {
  const [activeTab, setActiveTab] = useState('signal');
  const [signals, setSignals] = useState([]);
  const [events, setEvents] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, e, n] = await Promise.all([
        base44.entities.CustomerSignal.list('-signal_date', 50),
        base44.entities.MarketEvent.list('-event_date', 50),
        base44.entities.InvestmentNews.list('-published_date', 50),
      ]);
      setSignals(s || []);
      setEvents(e || []);
      setNews(n || []);
    } catch (err) { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, []);

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl text-primary mb-1">Intelligence Hub</h1>
          <p className="text-muted-foreground">Customer signals, market events, investment news and omni-channel behaviors.</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="w-4 h-4 mr-1.5" /> Add Intelligence
        </Button>
      </div>

      <div className="flex gap-1 mb-6 border-b overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
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

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" /></div>
      ) : activeTab === 'signal' ? (
        <SignalList items={signals} />
      ) : activeTab === 'event' ? (
        <EventList items={events} />
      ) : (
        <NewsList items={news} />
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
          <div className="flex flex-wrap gap-2 text-xs">
            <Tag label="Segment" value={s.customer_segment} />
            <Tag label="Channel" value={s.channel} />
            <Tag label="Product" value={s.product_interest} />
          </div>
        </Card>
      ))}
    </div>
  );
}

function EventList({ items }) {
  const impactColors = { low: 'bg-slate-100 text-slate-600', medium: 'bg-amber-100 text-amber-700', high: 'bg-rose-100 text-rose-700' };
  const catColors = { regulatory: 'bg-indigo-50 text-indigo-700', economic: 'bg-blue-50 text-blue-700', competitor: 'bg-purple-50 text-purple-700', market: 'bg-emerald-50 text-emerald-700', geopolitical: 'bg-rose-50 text-rose-700' };
  if (items.length === 0) return <EmptyState label="market events" />;
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
          </div>
          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{e.description}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <Tag label="Affected" value={e.affected_segments} />
            <Tag label="Source" value={e.source} />
          </div>
        </Card>
      ))}
    </div>
  );
}

function NewsList({ items }) {
  const sentColors = { positive: 'bg-emerald-100 text-emerald-700', negative: 'bg-rose-100 text-rose-700', neutral: 'bg-slate-100 text-slate-600' };
  if (items.length === 0) return <EmptyState label="investment news" />;
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

function EmptyState({ label }) {
  return (
    <Card className="p-12 text-center">
      <Filter className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
      <p className="text-muted-foreground">No {label} yet. Add intelligence to fuel campaign ideation.</p>
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
                <SelectItem value="event">Market Event</SelectItem>
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
                <div><Label>Source</Label><Input value={form.source || ''} onChange={e => setForm({...form, source: e.target.value})} placeholder="Bloomberg" /></div>
              </div>
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