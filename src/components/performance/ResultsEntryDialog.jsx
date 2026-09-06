import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';

const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

export default function ResultsEntryDialog({ open, campaign, result, projection, onClose, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setError('');
      setForm({
        actual_reach: result?.actual_reach ?? '',
        actual_conversion_pct: result?.actual_conversion_pct ?? '',
        actual_respondents: result?.actual_respondents ?? '',
        actual_revenue: result?.actual_revenue ?? '',
        actual_cost: result?.actual_cost ?? '',
        notes: result?.notes ?? '',
      });
    }
  }, [open, result]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const revenue = num(form.actual_revenue) ?? 0;
  const cost = num(form.actual_cost) ?? 0;
  const roi = cost > 0 ? ((revenue - cost) / cost) * 100 : null;

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        campaign_idea_id: campaign.id,
        campaign_title: campaign.title,
        actual_reach: num(form.actual_reach) ?? 0,
        actual_conversion_pct: num(form.actual_conversion_pct) ?? 0,
        actual_respondents: num(form.actual_respondents) ?? 0,
        actual_revenue: revenue,
        actual_cost: cost,
        actual_roi_pct: roi ?? 0,
        notes: form.notes || '',
        report_date: new Date().toISOString(),
      };
      if (result?.id) {
        await base44.entities.CampaignResult.update(result.id, payload);
      } else {
        await base44.entities.CampaignResult.create(payload);
      }
      onSaved();
    } catch (e) {
      setError(e.message || 'Failed to save results.');
    } finally {
      setSaving(false);
    }
  };

  const proj = (v, fmt) =>
    projection ? (
      <p className="text-[11px] text-muted-foreground">Projected: {fmt}</p>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">Campaign Results — {campaign?.title}</DialogTitle>
          <DialogDescription>
            {result ? 'Update actual performance figures.' : 'Record the actual performance of this launched campaign.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="actual_reach">Customers reached</Label>
            <Input id="actual_reach" type="number" min="0" value={form.actual_reach ?? ''} onChange={set('actual_reach')} />
            {proj(projection?.projected_reach, (projection.projected_reach ?? 0).toLocaleString())}
          </div>
          <div className="space-y-1">
            <Label htmlFor="actual_conversion_pct">Conversion rate (%)</Label>
            <Input id="actual_conversion_pct" type="number" step="0.1" min="0" value={form.actual_conversion_pct ?? ''} onChange={set('actual_conversion_pct')} />
            {proj(projection?.projected_conversion_pct, `${(projection?.projected_conversion_pct ?? 0).toFixed(1)}%`)}
          </div>
          <div className="space-y-1">
            <Label htmlFor="actual_respondents">Respondents / conversions</Label>
            <Input id="actual_respondents" type="number" min="0" value={form.actual_respondents ?? ''} onChange={set('actual_respondents')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="actual_revenue">Revenue (HK$)</Label>
            <Input id="actual_revenue" type="number" min="0" value={form.actual_revenue ?? ''} onChange={set('actual_revenue')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="actual_cost">Cost (HK$)</Label>
            <Input id="actual_cost" type="number" min="0" value={form.actual_cost ?? ''} onChange={set('actual_cost')} />
          </div>
          <div className="space-y-1">
            <Label>Computed ROI</Label>
            <div className="h-9 px-3 flex items-center rounded-md border border-input bg-muted/50 text-sm font-medium text-primary">
              {roi === null ? '—' : `${roi.toFixed(1)}%`}
            </div>
            {proj(projection?.projected_roi_pct, `${(projection?.projected_roi_pct ?? 0).toFixed(1)}%`)}
          </div>
          <div className="col-span-2 space-y-1">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={2} value={form.notes ?? ''} onChange={set('notes')} placeholder="Commentary on performance vs projection" />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || num(form.actual_reach) === null && num(form.actual_revenue) === null && num(form.actual_respondents) === null}>
            {saving ? 'Saving…' : result ? 'Update results' : 'Save results'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}