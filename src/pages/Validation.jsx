import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Check, X, MessageSquare, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Validation() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);
  const [notes, setNotes] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.CampaignIdea.list('-created_date', 50);
      setIdeas((data || []).filter(i => i.status === 'draft' || i.status === 'validated' || i.status === 'rejected'));
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openReview = (idea) => { setReviewing(idea); setNotes(idea.expert_notes || ''); };

  const decide = async (status) => {
    await base44.entities.CampaignIdea.update(reviewing.id, { status, expert_notes: notes });
    setReviewing(null);
    await load();
  };

  const drafts = ideas.filter(i => i.status === 'draft');
  const reviewed = ideas.filter(i => i.status !== 'draft');

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl lg:text-4xl text-primary mb-1">Expert Validation</h1>
        <p className="text-muted-foreground">Business experts review AI-generated ideas, add notes, and approve or reject them.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <>
          {drafts.length === 0 && reviewed.length === 0 && (
            <Card className="p-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">No ideas awaiting validation. Generate ideas in the Ideation page first.</p>
              <Link to="/ideation"><Button className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90">Go to Ideation</Button></Link>
            </Card>
          )}

          {drafts.length > 0 && (
            <>
              <h2 className="font-display text-lg text-primary mb-3">Awaiting Review ({drafts.length})</h2>
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {drafts.map((idea) => (
                  <Card key={idea.id} className="p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-display text-lg text-primary">{idea.title}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium uppercase shrink-0">draft</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3 leading-relaxed">{idea.description}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <Tag>{idea.target_segment}</Tag>
                      <Tag>{idea.product}</Tag>
                      <Tag>{idea.objective}</Tag>
                    </div>
                    <Button onClick={() => openReview(idea)} className="w-full bg-primary hover:bg-primary/90">
                      <MessageSquare className="w-4 h-4 mr-1.5" /> Review & Validate
                    </Button>
                  </Card>
                ))}
              </div>
            </>
          )}

          {reviewed.length > 0 && (
            <>
              <h2 className="font-display text-lg text-primary mb-3">Reviewed</h2>
              <div className="space-y-2">
                {reviewed.map((idea) => (
                  <Card key={idea.id} className="p-4 flex items-center gap-4">
                    <span className={cn('w-2 h-2 rounded-full shrink-0', idea.status === 'validated' ? 'bg-blue-500' : 'bg-rose-500')} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-primary truncate">{idea.title}</div>
                      {idea.expert_notes && <div className="text-xs text-muted-foreground truncate italic">"{idea.expert_notes}"</div>}
                    </div>
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium uppercase', idea.status === 'validated' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700')}>{idea.status}</span>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Review dialog */}
      <Dialog open={!!reviewing} onOpenChange={(o) => !o && setReviewing(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Validate Campaign Idea</DialogTitle>
          </DialogHeader>
          {reviewing && (
            <div className="space-y-4 py-2">
              <div>
                <h3 className="font-display text-lg text-primary">{reviewing.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">{reviewing.description}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><div className="text-[11px] text-muted-foreground uppercase">Segment</div><div className="font-medium">{reviewing.target_segment}</div></div>
                <div><div className="text-[11px] text-muted-foreground uppercase">Product</div><div className="font-medium">{reviewing.product}</div></div>
                <div><div className="text-[11px] text-muted-foreground uppercase">Objective</div><div className="font-medium">{reviewing.objective}</div></div>
              </div>
              {reviewing.source_intelligence && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-[11px] text-muted-foreground uppercase mb-1">Source Intelligence</div>
                  <p className="text-xs text-primary">{reviewing.source_intelligence}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium">Expert Notes</label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Add your validation notes, refinements, or concerns..." />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => decide('rejected')} className="text-destructive hover:text-destructive">
              <X className="w-4 h-4 mr-1.5" /> Reject
            </Button>
            <Button onClick={() => decide('validated')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Check className="w-4 h-4 mr-1.5" /> Validate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Tag({ children }) {
  return <span className="text-[11px] bg-slate-100 px-2 py-1 rounded text-slate-600">{children}</span>;
}