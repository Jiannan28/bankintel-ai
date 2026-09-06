import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Brain, Check, Loader2, Sparkles, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const PIPELINE = [
  'Gathering live customer signals',
  'Scanning market events & investment news',
  'Applying your targeting criteria',
  'Reasoning over segments, products & timing',
  'Formulating campaign concepts',
];

export default function ThinkingDialog({ state, onClose }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (state.phase !== 'running') return;
    setStep(0);
    const timer = setInterval(() => {
      setStep(s => Math.min(s + 1, PIPELINE.length - 1));
    }, 3000);
    return () => clearInterval(timer);
  }, [state.phase, state.open]);

  return (
    <Dialog open={state.open} onOpenChange={(o) => !o && state.phase !== 'running' && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-primary flex items-center gap-2">
            <Brain className="w-5 h-5 text-accent" /> AI Thinking Process
          </DialogTitle>
          <DialogDescription>
            {state.phase === 'running' && 'The AI Ideation Engine is working. Follow along with its reasoning.'}
            {state.phase === 'done' && 'Here is how the AI reasoned from your targeting criteria and the live market intelligence.'}
            {state.phase === 'error' && 'Generation did not complete.'}
          </DialogDescription>
        </DialogHeader>

        {state.phase === 'running' && (
          <div className="space-y-3 py-2">
            {PIPELINE.map((label, i) => (
              <div key={label} className="flex items-center gap-3">
                {i < step ? (
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0"><Check className="w-3 h-3" /></span>
                ) : i === step ? (
                  <Loader2 className="w-5 h-5 text-accent animate-spin shrink-0" />
                ) : (
                  <span className="w-5 h-5 rounded-full border border-slate-200 shrink-0" />
                )}
                <span className={cn('text-sm', i <= step ? 'text-foreground' : 'text-muted-foreground/60')}>{label}</span>
              </div>
            ))}
          </div>
        )}

        {state.phase === 'done' && (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border bg-slate-50 p-4">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">AI reasoning</div>
              <ol className="space-y-2">
                {state.reasoning.map((r, i) => (
                  <li key={i} className="flex gap-2 text-sm text-foreground leading-relaxed">
                    <span className="text-accent font-semibold shrink-0">{i + 1}.</span> {r}
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
                Generated concepts ({state.ideas.length})
              </div>
              <div className="space-y-2">
                {state.ideas.map(idea => (
                  <div key={idea.id} className="flex items-start gap-2.5 rounded-lg border bg-white px-3 py-2.5">
                    <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-primary truncate">{idea.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{idea.target_segment} · {idea.product}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {state.phase === 'error' && (
          <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-rose-50 p-4">
            <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{state.error}</p>
          </div>
        )}

        {state.phase !== 'running' && (
          <div className="flex justify-end pt-1">
            <Button onClick={onClose}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}