import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Pencil, Rocket, Target } from 'lucide-react';
import { summarizeTargeting } from '@/components/ideation/TargetingDialog';

export default function TemplateCard({ template, onUse, onEdit, onDelete }) {
  const channels = (template.channels || '').split(',').map((c) => c.trim()).filter(Boolean);
  let targeting = null;
  try { targeting = template.targeting ? JSON.parse(template.targeting) : null; } catch (e) { targeting = null; }

  return (
    <Card className="p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-display text-lg text-primary">{template.name}</h3>
        <div className="flex gap-1 shrink-0">
          <button onClick={onEdit} className="text-muted-foreground hover:text-primary p-1"><Pencil className="w-4 h-4" /></button>
          <button onClick={onDelete} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>
      {template.description && <p className="text-sm text-muted-foreground mb-3">{template.description}</p>}

      <div className="flex flex-wrap gap-1.5 mb-3">
        {template.focus_product && <span className="text-[11px] bg-primary/10 text-primary px-2 py-1 rounded font-medium">Product: {template.focus_product}</span>}
        {template.objective && <span className="text-[11px] bg-primary/10 text-primary px-2 py-1 rounded font-medium">Objective: {template.objective}</span>}
        {channels.map((c) => (
          <span key={c} className="text-[11px] bg-slate-100 px-2 py-1 rounded text-slate-600">{c.replace(/_/g, ' ')}</span>
        ))}
      </div>

      {targeting && (
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-slate-50 rounded-lg p-2.5 mb-4">
          <Target className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{summarizeTargeting(targeting)}</span>
        </div>
      )}

      <Button className="bg-accent text-accent-foreground hover:bg-accent/90 mt-auto" onClick={onUse}>
        <Rocket className="w-4 h-4 mr-1.5" /> Use Template
      </Button>
    </Card>
  );
}