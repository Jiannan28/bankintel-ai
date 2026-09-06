import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, SlidersHorizontal, Plus, Save, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import DimensionTable from '@/components/scoring/DimensionTable';
import { DIMENSION_LABELS } from '@/lib/scoring';

export default function ScoringEngine() {
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('ai_gen');
  const [settingsId, setSettingsId] = useState(null);
  const [rows, setRows] = useState([]);
  const [deletedIds, setDeletedIds] = useState([]);
  const [newKey, setNewKey] = useState('conversion');
  const [saving, setSaving] = useState(false);
  const [savingMode, setSavingMode] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [settings, dims] = await Promise.all([
        base44.entities.ScoringSettings.list(),
        base44.entities.ScoringDimension.list('created_date'),
      ]);
      setMode(settings?.[0]?.mode || 'ai_gen');
      setSettingsId(settings?.[0]?.id || null);
      setRows((dims || []).map((d) => ({ id: d.id, name: d.name, key: d.key, weight: d.weight })));
      setDeletedIds([]);
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const chooseMode = async (m) => {
    if (m === mode || savingMode) return;
    const prev = mode;
    setMode(m);
    setSavingMode(true);
    try {
      if (settingsId) {
        await base44.entities.ScoringSettings.update(settingsId, { mode: m });
      } else {
        const rec = await base44.entities.ScoringSettings.create({ mode: m });
        setSettingsId(rec.id);
      }
      setSaveMsg(m === 'weighted'
        ? 'Configurable Dimensions scoring is now active on Campaign Ideation.'
        : 'AI Generated scoring is now active on Campaign Ideation.');
    } catch (e) {
      setMode(prev);
      setSaveMsg('Could not save engine mode: ' + (e?.response?.data?.error || e.message));
    } finally { setSavingMode(false); }
  };

  const onRowChange = (idx, patch) => {
    setRows(rows.map((r, i) => (i === idx ? { ...r, ...patch, _dirty: true } : r)));
  };

  const onDeleteRow = (idx) => {
    const row = rows[idx];
    if (row.id) setDeletedIds([...deletedIds, row.id]);
    setRows(rows.filter((_, i) => i !== idx));
  };

  const addRow = () => {
    setRows([...rows, { name: DIMENSION_LABELS[newKey], key: newKey, weight: 10 }]);
  };

  const totalWeight = rows.reduce((sum, r) => sum + (Number(r.weight) || 0), 0);

  const saveDimensions = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      for (const id of deletedIds) await base44.entities.ScoringDimension.delete(id);
      const updates = rows.filter((r) => r.id && r._dirty).map((r) => ({ id: r.id, name: r.name, weight: r.weight }));
      if (updates.length) await base44.entities.ScoringDimension.bulkUpdate(updates);
      const creates = rows.filter((r) => !r.id).map((r) => ({ name: r.name, key: r.key, weight: r.weight }));
      if (creates.length) await base44.entities.ScoringDimension.bulkCreate(creates);
      await load();
      setSaveMsg('Dimensions saved. Scores on Campaign Ideation now use the updated weights.');
    } catch (e) {
      setSaveMsg('Save failed: ' + (e?.response?.data?.error || e.message));
    } finally { setSaving(false); }
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl lg:text-4xl text-primary mb-1">Scoring Engine</h1>
        <p className="text-muted-foreground">Choose how campaign ideations are scored and ranked on the Campaign Ideation tab.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <>
          {/* Engine mode */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => chooseMode('ai_gen')}
              disabled={savingMode}
              className={cn(
                'text-left rounded-xl border-2 p-5 transition-all',
                mode === 'ai_gen' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/40'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="font-display text-lg text-primary">AI Generated Score</h3>
                </div>
                {mode === 'ai_gen' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground uppercase font-medium">Active</span>}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI evaluates each campaign idea end-to-end — segment relevance, product opportunity, timing and expected impact — and returns a single 0-100 business value score. Trigger it with "Score with AI" on the Campaign Ideation tab.
              </p>
            </button>

            <button
              onClick={() => chooseMode('weighted')}
              disabled={savingMode}
              className={cn(
                'text-left rounded-xl border-2 p-5 transition-all',
                mode === 'weighted' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/40'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-primary" />
                  <h3 className="font-display text-lg text-primary">Configurable Dimensions</h3>
                </div>
                {mode === 'weighted' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground uppercase font-medium">Active</span>}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Score is the weighted sum of the dimensions below. Adjust the weights to match your bank's priorities — ideations are then ranked so business users review the highest-scoring ideas first.
              </p>
            </button>
          </div>

          {/* Dimensions configuration */}
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
                <h2 className="font-display text-xl">Scoring Dimensions</h2>
              </div>
              <span className={cn('text-xs px-2 py-1 rounded-full font-medium', totalWeight === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
                Total weight: {totalWeight}%{totalWeight !== 100 && ' — ideally 100%'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Used by the Configurable Dimensions engine. Weights are normalized, so scores stay comparable even if the total isn't exactly 100%.
            </p>

            <DimensionTable rows={rows} onRowChange={onRowChange} onDeleteRow={onDeleteRow} />

            <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t">
              <Select value={newKey} onValueChange={setNewKey}>
                <SelectTrigger className="w-[230px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DIMENSION_LABELS).map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={addRow}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Dimension
              </Button>
              <Button size="sm" onClick={saveDimensions} disabled={saving || savingMode} className="ml-auto">
                <Save className="w-3.5 h-3.5 mr-1" /> {saving ? 'Saving...' : 'Save Dimensions'}
              </Button>
            </div>

            {saveMsg && (
              <p className="text-xs text-emerald-600 mt-3 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {saveMsg}
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}