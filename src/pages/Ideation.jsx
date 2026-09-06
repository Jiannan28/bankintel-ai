import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Wand2, ArrowRight, Trash2 } from 'lucide-react';
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
  const [focusSegment, setFocusSegment] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.CampaignIdea.list('-created_date', 50);
      setIdeas(data || []);
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const generate = async () => {
    setGenerating(true);
    try {
      await base44.functions.invoke('generateCampaignIdeas', { focusProduct, focusSegment });
      await load();
    } catch (e) {
      alert('Generation failed: ' + (e?.response?.data?.error || e.message));
    } finally { setGenerating(false); }
  };

  const remove = async (id) => {
    await base44.entities.CampaignIdea.delete(id);
    setIdeas(ideas.filter(i => i.id !== id));
  };

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
            <p className="text-sm text-white/70">Analyzes customer signals, market events & investment news to propose 3 campaign concepts.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:w-80">
            <div>
              <Label className="text-white/80">Focus Product</Label>
              <Input value={focusProduct} onChange={e => setFocusProduct(e.target.value)} placeholder="e.g. mortgage" className="bg-white/10 border-white/20 text-white placeholder:text-white/40" />
            </div>
            <div>
              <Label className="text-white/80">Focus Segment</Label>
              <Input value={focusSegment} onChange={e => setFocusSegment(e.target.value)} placeholder="e.g. HNW" className="bg-white/10 border-white/20 text-white placeholder:text-white/40" />
            </div>
          </div>
          <Button onClick={generate} disabled={generating} className="bg-accent text-accent-foreground hover:bg-accent/90 lg:self-end">
            <Sparkles className="w-4 h-4 mr-1.5" /> {generating ? 'Generating...' : 'Generate Ideas'}
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" /></div>
      ) : ideas.length === 0 ? (
        <Card className="p-12 text-center">
          <Sparkles className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No campaign ideas yet. Use the AI Ideation Engine above to generate your first concepts.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {ideas.map((idea) => (
            <Card key={idea.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide', statusColors[idea.status])}>{idea.status}</span>
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium uppercase', priorityColors[idea.priority])}>{idea.priority} priority</span>
                    {idea.generated_by === 'ai' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium uppercase">AI</span>}
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