import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import TargetingDialog, { summarizeTargeting } from '@/components/ideation/TargetingDialog';
import { SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

const CHANNELS = ['email', 'sms', 'push', 'rm_call', 'whatsapp', 'in_app'];
const EMPTY = { name: '', description: '', focus_product: '', objective: '', channels: [], targeting: null };

function parseTargeting(template) {
  try { return template?.targeting ? JSON.parse(template.targeting) : null; } catch (e) { return null; }
}

export default function TemplateDialog({ open, template, onClose, onSave }) {
  const [draft, setDraft] = useState(EMPTY);
  const [targetingOpen, setTargetingOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (template) {
      setDraft({
        name: template.name || '',
        description: template.description || '',
        focus_product: template.focus_product || '',
        objective: template.objective || '',
        channels: template.channels ? template.channels.split(',').map((c) => c.trim()).filter(Boolean) : [],
        targeting: parseTargeting(template),
      });
    } else {
      setDraft(EMPTY);
    }
  }, [open, template]);

  const set = (key, val) => setDraft((d) => ({ ...d, [key]: val }));
  const toggleChannel = (c) =>
    setDraft((d) => ({ ...d, channels: d.channels.includes(c) ? d.channels.filter((x) => x !== c) : [...d.channels, c] }));

  const submit = () => {
    if (!draft.name.trim()) return;
    onSave({ ...draft, name: draft.name.trim() });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-primary">{template ? 'Edit Template' : 'New Campaign Template'}</DialogTitle>
            <DialogDescription>
              Save a reusable campaign setup and targeting criteria — apply it later to launch in one click.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. HNW Wealth Cross-sell" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                rows={2}
                value={draft.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="What this template is for and when to use it"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Focus product</Label>
                <Input value={draft.focus_product} onChange={(e) => set('focus_product', e.target.value)} placeholder="e.g. mortgage" />
              </div>
              <div>
                <Label>Objective</Label>
                <Input value={draft.objective} onChange={(e) => set('objective', e.target.value)} placeholder="e.g. Cross-sell" />
              </div>
            </div>
            <div>
              <Label>Channels</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {CHANNELS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleChannel(c)}
                    className={cn(
                      'text-xs px-3 py-1.5 rounded-full border transition-colors',
                      draft.channels.includes(c)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-primary/60'
                    )}
                  >
                    {c.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Targeting criteria</Label>
              <button
                type="button"
                onClick={() => setTargetingOpen(true)}
                className="mt-1.5 w-full h-9 rounded-md border border-input bg-transparent text-sm px-3 flex items-center justify-between gap-2 hover:bg-secondary/60 transition-colors"
              >
                <span className="truncate text-muted-foreground">{summarizeTargeting(draft.targeting) || 'All customers — configure targeting…'}</span>
                <SlidersHorizontal className="w-4 h-4 shrink-0 opacity-70" />
              </button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={submit} disabled={!draft.name.trim()}>
              {template ? 'Save Changes' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TargetingDialog
        open={targetingOpen}
        value={draft.targeting}
        onSave={(t) => set('targeting', t)}
        onClose={() => setTargetingOpen(false)}
      />
    </>
  );
}