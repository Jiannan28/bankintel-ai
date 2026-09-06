import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Rocket, ClipboardCheck, Percent, ArrowUpRight, ArrowDownRight, Pencil, PlusCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ProjectionVsActualChart from '@/components/performance/ProjectionVsActualChart';
import ResultsEntryDialog from '@/components/performance/ResultsEntryDialog';

const fmtNum = (v) => (v ?? 0).toLocaleString();
const fmtPct = (v) => `${(v ?? 0).toFixed(1)}%`;
const fmtHKD = (v) => `HK$${(v ?? 0).toLocaleString()}`;
const short = (t) => (t?.length > 20 ? `${t.slice(0, 17)}…` : t || '');
const latest = (arr) => [...arr].sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

function Variance({ projected, actual, fmt }) {
  if (projected == null || actual == null || projected === 0) return <span className="text-muted-foreground">—</span>;
  const diff = ((actual - projected) / Math.abs(projected)) * 100;
  const up = diff >= 0;
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', up ? 'text-emerald-600' : 'text-rose-600')}>
      {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {fmt(actual)} <span className="text-muted-foreground font-normal">({up ? '+' : ''}{diff.toFixed(0)}% vs {fmt(projected)})</span>
    </span>
  );
}

export default function Performance() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null);

  const load = async () => {
    try {
      const [ideas, sims, results] = await Promise.all([
        base44.entities.CampaignIdea.list('-created_date', 200),
        base44.entities.Simulation.list('-created_date', 200),
        base44.entities.CampaignResult.list('-created_date', 200),
      ]);
      const launched = (ideas || []).filter((i) => i.status === 'launched');
      setRows(
        launched.map((idea) => ({
          idea,
          sim: latest((sims || []).filter((s) => s.campaign_idea_id === idea.id && s.status !== 'archived')),
          result: latest((results || []).filter((r) => r.campaign_idea_id === idea.id)),
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const comparable = rows.filter((r) => r.sim && r.result);
  const chartData = comparable.map((r) => ({
    name: short(r.idea.title),
    reach: { projected: r.sim.projected_reach ?? 0, actual: r.result.actual_reach ?? 0 },
    conversion: { projected: r.sim.projected_conversion_pct ?? 0, actual: r.result.actual_conversion_pct ?? 0 },
    roi: { projected: r.sim.projected_roi_pct ?? 0, actual: r.result.actual_roi_pct ?? 0 },
  }));

  const resultsRecorded = rows.filter((r) => r.result).length;
  const roiVariances = comparable
    .filter((r) => r.sim.projected_roi_pct != null && r.result.actual_roi_pct != null)
    .map((r) => r.result.actual_roi_pct - r.sim.projected_roi_pct);
  const avgRoiVariance = roiVariances.length ? roiVariances.reduce((a, b) => a + b, 0) / roiVariances.length : null;

  const tiles = [
    { label: 'Launched Campaigns', value: rows.length, icon: Rocket, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Results Recorded', value: resultsRecorded, icon: ClipboardCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Avg ROI vs Projection', value: avgRoiVariance === null ? '—' : `${avgRoiVariance >= 0 ? '+' : ''}${avgRoiVariance.toFixed(1)}pts`, icon: Percent, color: avgRoiVariance >= 0 ? 'text-emerald-600' : 'text-rose-600', bg: 'bg-amber-50' },
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl lg:text-4xl text-primary mb-2">Campaign Performance</h1>
        <p className="text-muted-foreground">Track actual campaign results against initial projections for launched campaigns.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Card key={t.label} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', t.bg)}>
                  <Icon className={cn('w-5 h-5', t.color)} />
                </div>
              </div>
              <div className="font-display text-3xl text-primary">{t.value}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{t.label}</div>
            </Card>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <Card className="p-12 text-center">
          <Rocket className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-primary mb-1">No launched campaigns yet</p>
          <p className="text-sm text-muted-foreground">Launch campaigns from the Distribution page to start tracking performance against projections.</p>
        </Card>
      ) : (
        <>
          <div className="grid lg:grid-cols-3 gap-6 mb-10">
            <Card className="p-6">
              <h2 className="font-display text-lg text-primary mb-4">Reach — Projected vs Actual</h2>
              <ProjectionVsActualChart data={chartData.map((d) => ({ name: d.name, projected: d.reach.projected, actual: d.reach.actual }))} label="reach" format={(v) => fmtNum(Number(v))} />
            </Card>
            <Card className="p-6">
              <h2 className="font-display text-lg text-primary mb-4">Conversion Rate — Projected vs Actual</h2>
              <ProjectionVsActualChart data={chartData.map((d) => ({ name: d.name, projected: d.conversion.projected, actual: d.conversion.actual }))} label="conversion %" format={(v) => fmtPct(Number(v))} />
            </Card>
            <Card className="p-6">
              <h2 className="font-display text-lg text-primary mb-4">ROI — Projected vs Actual</h2>
              <ProjectionVsActualChart data={chartData.map((d) => ({ name: d.name, projected: d.roi.projected, actual: d.roi.actual }))} label="ROI %" format={(v) => fmtPct(Number(v))} />
            </Card>
          </div>

          <Card className="overflow-hidden">
            <div className="p-6 pb-3 flex items-center justify-between">
              <h2 className="font-display text-lg text-primary">Launched Campaign Details</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="px-4 py-3 font-medium">Campaign</th>
                    <th className="px-4 py-3 font-medium">Reach</th>
                    <th className="px-4 py-3 font-medium">Conversion</th>
                    <th className="px-4 py-3 font-medium">ROI</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.idea.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-medium text-primary">{r.idea.title}</div>
                        <div className="text-xs text-muted-foreground">{r.idea.target_segment} · {r.idea.product}</div>
                      </td>
                      <td className="px-4 py-3">
                        {r.result && r.sim
                          ? <Variance projected={r.sim.projected_reach} actual={r.result.actual_reach} fmt={fmtNum} />
                          : <span className="text-muted-foreground text-xs">{r.result ? 'No projection' : 'Awaiting results'}</span>}
                      </td>
                      <td className="px-4 py-3">
                        {r.result && r.sim
                          ? <Variance projected={r.sim.projected_conversion_pct} actual={r.result.actual_conversion_pct} fmt={fmtPct} />
                          : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {r.result && r.sim
                          ? <Variance projected={r.sim.projected_roi_pct} actual={r.result.actual_roi_pct} fmt={fmtPct} />
                          : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('text-[10px] px-2 py-1 rounded-full font-medium uppercase tracking-wide',
                          r.result ? 'bg-emerald-100 text-emerald-700' : r.sim ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600')}>
                          {r.result ? 'Results recorded' : r.sim ? 'Awaiting results' : 'No simulation'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="outline" size="sm" onClick={() => setDialog(r)}>
                          {r.result ? <><Pencil className="w-3 h-3" /> Update</> : <><PlusCircle className="w-3 h-3" /> Record results</>}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {dialog && (
        <ResultsEntryDialog
          open
          campaign={dialog.idea}
          result={dialog.result}
          projection={dialog.sim}
          onClose={() => setDialog(null)}
          onSaved={() => { setDialog(null); load(); }}
        />
      )}
    </div>
  );
}