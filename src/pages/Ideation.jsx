import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Wand2, ArrowRight, Trash2, Gauge, TrendingUp, SlidersHorizontal } from 'lucide-react';
import TargetingDialog, { summarizeTargeting } from '@/components/ideation/TargetingDialog';
import ThinkingDialog from '@/components/ideation/ThinkingDialog';
import { weightedScore } from '@/lib/scoring';
import { cn } from '@/lib/utils';

const statusColors = {
  draft: 'bg-slate-100 text-slate-600',
  validated: 'bg-blue-100 text-blue-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  simulated: 'bg-amber-100 text-amber-700',
  launched: 'bg-primary text-primary-foreground',
};

const priorityColors = { low: 'bg-slate-100 text-slate-600', medium: 'bg-blue-100 text-blue-700', high: 'bg-accent text-accent-foreground' };

export default function Ideation() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [focusProduct, setFocusProduct] = useState('');
  const [targeting, setTargeting] = useState(null);
  const [targetingOpen, setTargetingOpen] = useState(false);
  const [thinking, setThinking] = useState({ open: false, phase: 'running', reasoning: [], ideas: [], error: null });
  const [settings, setSettings] = useState({ mode: 'ai_gen' });
  const [dimensions, setDimensions] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const [scoring, setScoring] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [data, settingsData, dimensionData] = await Promise.all([
        base44.entities.CampaignIdea.list('-created_date', 50),
        base44.entities.ScoringSettings.list(),
        base44.entities.ScoringDimension.list(),
      ]);
      setIdeas(data || []);
      setSettings(settingsData?.[0] || { mode: 'ai_gen' });
      setDimensions(dimensionData || []);
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Pre-fill from an applied template (Template Library)
  useEffect(() => {
    const raw = sessionStorage.getItem('applyTemplate');
    if (!raw) return;
    sessionStorage.removeItem('applyTemplate');
    try {
      const t = JSON.parse(raw);
      if (t.focus_product) setFocusProduct(t.focus_product);
      if (t.targeting) setTargeting(t.targeting);
    } catch (e) {}
  }, []);

  const generate = async () => {
    setGenerating(true);
    setThinking({ open: true, phase: 'running', reasoning: [], ideas: [], error: null });
    try {
      const res = await base44.functions.invoke('generateCampaignIdeas', { focusProduct, targeting });
      const data = res?.ideas !== undefined ? res : (res?.data ?? {});
      setThinking({ open: true, phase: 'done', reasoning: data?.reasoning || [], ideas: data?.ideas || [], error: null });
      await load();
    } catch (e) {
      setThinking({ open: true, phase: 'error', reasoning: [], ideas: [], error: e?.response?.data?.error || e.message });
    } finally { setGenerating(false); }
  };

  const remove = async (id) => {
    await base44.entities.CampaignIdea.delete(id);
    setIdeas(ideas.filter(i => i.id !== id));
  };

  const scoreOf = (idea) => settings.mode === 'weighted'
    ? weightedScore(idea, ideas, dimensions)
    : idea.ai_score;

  const runAiScoring = async () => {
    setScoring(true);
    try {
      await base44.functions.invoke('scoreCampaignIdeas', {});
      await load();
    } catch (e) {
      alert('AI scoring failed: ' + (e?.response?.data?.error || e.message));
    } finally { setScoring(false); }
  };

  const sortedIdeas = [...ideas];
  if (sortBy === 'score') sortedIdeas.sort((a, b) => (scoreOf(b) ?? -1) - (scoreOf(a) ?? -1));

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl lg:text-4xl text-primary mb-1">Campaign Ideation</h1>
        <p className="text-muted-foreground">AI generates targeted campaign ideas grounded in your live market intelligence.</p>
      </div>

      {/* Generator panel */}
      <Card className="p-6 mb-8 bg-primary text-primary-foreground border-0">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Wand2 className="w-5 h-5 text-accent" />
              <h2 className="font-display text-xl">AI Ideation Engine</h2>
            </div>
            <p className="text-sm text-white/70">Analyzes customer signals, CIO insights & investment news to propose 3 campaign concepts.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:w-80">
            <div>
              <Label className="text-white/80">Focus Product</Label>
              <Input value={focusProduct} onChange={e => setFocusProduct(e.target.value)} placeholder="e.g. mortgage" className="bg-white/10 border-white/20 text-white placeholder:text-white/40" />
            </div>
            <div>
              <Label className="text-white/80">Targeting Criteria</Label>
              <button
                type="button"
                onClick={() => setTargetingOpen(true)}
                className="w-full h-9 rounded-md bg-white/10 border border-white/20 text-white text-sm px-3 flex items-center justify-between gap-2 hover:bg-white/15 transition-colors"
              >
                <span className="truncate">{summarizeTargeting(targeting) || 'All customers — configure targeting…'}</span>
                <SlidersHorizontal className="w-4 h-4 shrink-0 opacity-70" />
              </button>
            </div>
          </div>
          <Button onClick={generate} disabled={generating} className="bg-accent text-accent-foreground hover:bg-accent/90 lg:self-end">
            <Sparkles className="w-4 h-4 mr-1.5" /> {generating ? 'Generating...' : 'Generate Ideas'}
          </Button>
        </div>
      </Card>

      {/* Scoring engine control bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 text-sm">
          <Gauge className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">Scoring Engine:</span>
          <span className="font-medium text-primary">{settings.mode === 'weighted' ? 'Configurable Dimensions' : 'AI Generated'}</span>
          <Link to="/scoring" className="text-accent text-xs underline underline-offset-2">Configure</Link>
        </div>
        <div className="flex items-center gap-2">
          {settings.mode === 'ai_gen' && ideas.length > 0 && (
            <Button variant="outline" size="sm" onClick={runAiScoring} disabled={scoring}>
              <Sparkles className="w-3.5 h-3.5 mr-1" /> {scoring ? 'Scoring...' : 'Score with AI'}
            </Button>
          )}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Sort: Newest first</SelectItem>
              <SelectItem value="score">Sort: Highest score</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" /></div>
      ) : ideas.length === 0 ? (
        <Card className="p-12 text-center">
          <Sparkles className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No campaign ideas yet. Use the AI Ideation Engine above to generate your first concepts.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedIdeas.map((idea) => (
            <Card key={idea.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide', statusColors[idea.status])}>{idea.status}</span>
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium uppercase', priorityColors[idea.priority])}>{idea.priority} priority</span>
                    {idea.generated_by === 'ai' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium uppercase">AI</span>}
                    {scoreOf(idea) != null && (
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1', scoreOf(idea) >= 70 ? 'bg-emerald-100 text-emerald-700' : scoreOf(idea) >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600')}>
                        <TrendingUp className="w-3 h-3" /> Score {scoreOf(idea)}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-xl text-primary mb-1">{idea.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{idea.description}</p>
                </div>
                <button onClick={() => remove(idea.id)} className="text-muted-foreground hover:text-destructive p-1 shrink-0"><Trash2 className="w-4 h-4" /></button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 mb-4">
                <Metric label="Segment" value={idea.target_segment} />
                <Metric label="Product" value={idea.product} />
                <Metric label="Objective" value={idea.objective} />
                <Metric label="Expected Reach" value={idea.expected_reach?.toLocaleString()} />
              </div>

              {idea.source_intelligence && (
                <div className="bg-slate-50 rounded-lg p-3 mb-3">
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Source Intelligence</div>
                  <p className="text-xs text-primary leading-relaxed">{idea.source_intelligence}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex flex-wrap gap-1.5">
                  {idea.channels?.split(',').map((c, i) => (
                    <span key={i} className="text-[11px] bg-slate-100 px-2 py-1 rounded text-slate-600">{c.trim()}</span>
                  ))}
                </div>
                <Link to="/validation">
                  <Button variant="outline" size="sm">Validate <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      <TargetingDialog
        open={targetingOpen}
        value={targeting}
        onSave={setTargeting}
        onClose={() => setTargetingOpen(false)}
      />
      <ThinkingDialog state={thinking} onClose={() => setThinking(t => ({ ...t, open: false }))} />
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="text-sm font-medium text-primary truncate">{value || '—'}</div>
    </div>
  );
}