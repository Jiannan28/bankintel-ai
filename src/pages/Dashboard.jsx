import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Radar, Sparkles, CheckSquare, LineChart, Mail, Send, TrendingUp, AlertCircle, Activity, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const statusColors = {
  draft: 'bg-slate-100 text-slate-600',
  validated: 'bg-blue-100 text-blue-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  simulated: 'bg-amber-100 text-amber-700',
  launched: 'bg-primary text-primary-foreground',
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    signals: 0, events: 0, news: 0, ideas: 0, validated: 0, simulated: 0, messages: 0, distributions: 0
  });
  const [recentIdeas, setRecentIdeas] = useState([]);
  const [recentNews, setRecentNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [signals, events, news, ideas, messages, distributions] = await Promise.all([
          base44.entities.CustomerSignal.list('-signal_date', 200),
          base44.entities.MarketEvent.list('-event_date', 200),
          base44.entities.InvestmentNews.list('-published_date', 200),
          base44.entities.CampaignIdea.list('-created_date', 200),
          base44.entities.MarketingMessage.list('-created_date', 200),
          base44.entities.Distribution.list('-created_date', 200),
        ]);
        const ideasArr = ideas || [];
        setStats({
          signals: (signals || []).length,
          events: (events || []).length,
          news: (news || []).length,
          ideas: ideasArr.length,
          validated: ideasArr.filter(i => i.status === 'validated' || i.status === 'approved').length,
          simulated: ideasArr.filter(i => i.status === 'simulated').length,
          messages: (messages || []).length,
          distributions: (distributions || []).length,
        });
        setRecentIdeas(ideasArr.slice(0, 5));
        setRecentNews((news || []).slice(0, 5));
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const tiles = [
    { label: 'Customer Signals', value: stats.signals, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50', path: '/intelligence' },
    { label: 'Market Events', value: stats.events, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', path: '/intelligence' },
    { label: 'Investment News', value: stats.news, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/intelligence' },
    { label: 'Campaign Ideas', value: stats.ideas, icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-50', path: '/ideation' },
    { label: 'Validated', value: stats.validated, icon: CheckSquare, color: 'text-indigo-600', bg: 'bg-indigo-50', path: '/validation' },
    { label: 'Simulated', value: stats.simulated, icon: LineChart, color: 'text-purple-600', bg: 'bg-purple-50', path: '/simulation' },
    { label: 'Messages', value: stats.messages, icon: Mail, color: 'text-teal-600', bg: 'bg-teal-50', path: '/messages' },
    { label: 'Distributions', value: stats.distributions, icon: Send, color: 'text-primary', bg: 'bg-slate-100', path: '/distribution' },
  ];

  const workflow = [
    { step: '01', label: 'Gather Intelligence', desc: 'Customer signals, market events, investment news', icon: Radar, path: '/intelligence' },
    { step: '02', label: 'Generate Ideations', desc: 'AI turns intelligence into campaign ideas', icon: Sparkles, path: '/ideation' },
    { step: '03', label: 'Validate', desc: 'Experts review and approve ideas', icon: CheckSquare, path: '/validation' },
    { step: '04', label: 'Simulate Outcomes', desc: 'Project reach, revenue and ROI', icon: LineChart, path: '/simulation' },
    { step: '05', label: 'Build Messages', desc: 'Channel-specific marketing copy', icon: Mail, path: '/messages' },
    { step: '06', label: 'Distribute', desc: 'One-click to RMs and digital channels', icon: Send, path: '/distribution' },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl lg:text-4xl text-primary mb-2">Market Intelligence Command Center</h1>
        <p className="text-muted-foreground">Real-time banking customer signals, market events, and AI-driven campaign ideation — from insight to distribution.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {tiles.map((t) => {
              const Icon = t.icon;
              return (
                <Link to={t.path} key={t.label}>
                  <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer group">
                    <div className="flex items-start justify-between mb-3">
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', t.bg)}>
                        <Icon className={cn('w-5 h-5', t.color)} />
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="font-display text-3xl text-primary">{t.value}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{t.label}</div>
                  </Card>
                </Link>
              );
            })}
          </div>

          <div className="mb-10">
            <h2 className="font-display text-xl text-primary mb-4">The Workflow</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {workflow.map((w) => {
                const Icon = w.icon;
                return (
                  <Link to={w.path} key={w.step}>
                    <Card className="p-4 h-full hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-accent">
                      <div className="text-[11px] font-mono text-muted-foreground mb-2">{w.step}</div>
                      <Icon className="w-5 h-5 text-accent mb-2" />
                      <div className="font-medium text-sm text-primary mb-1">{w.label}</div>
                      <div className="text-[11px] text-muted-foreground leading-snug">{w.desc}</div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg text-primary">Recent Campaign Ideations</h2>
                <Link to="/ideation"><Button variant="ghost" size="sm" className="text-accent">View all</Button></Link>
              </div>
              <div className="space-y-3">
                {recentIdeas.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No ideas generated yet. Start with Campaign Ideation.</p>}
                {recentIdeas.map((idea) => (
                  <div key={idea.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-primary truncate">{idea.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{idea.target_segment} · {idea.product}</div>
                    </div>
                    <span className={cn('text-[10px] px-2 py-1 rounded-full font-medium uppercase tracking-wide shrink-0', statusColors[idea.status])}>{idea.status}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg text-primary">Latest Investment News</h2>
                <Link to="/intelligence"><Button variant="ghost" size="sm" className="text-accent">View all</Button></Link>
              </div>
              <div className="space-y-3">
                {recentNews.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No news ingested yet.</p>}
                {recentNews.map((n) => (
                  <div key={n.id} className="pb-3 border-b last:border-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="font-medium text-sm text-primary">{n.headline}</div>
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0',
                        n.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-700' :
                        n.sentiment === 'negative' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                      )}>{n.sentiment}</span>
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{n.summary}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}