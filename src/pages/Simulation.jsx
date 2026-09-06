import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart as LineIcon, Play, TrendingUp, Users, DollarSign, Percent, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Simulation() {
  const [ideas, setIdeas] = useState([]);
  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState({ scenario_name: 'Base case', assumptions: '', avg_ticket_size: 5000, cost_estimate: 50000 });

  const load = async () => {
    setLoading(true);
    try {
      const [ideaData, simData] = await Promise.all([
        base44.entities.CampaignIdea.list('-created_date', 50),
        base44.entities.Simulation.list('-created_date', 20),
      ]);
      setIdeas((ideaData || []).filter(i => i.status === 'validated' || i.status === 'approved' || i.status === 'simulated'));
      setSimulations(simData || []);
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const run = async () => {
    if (!selectedId) return;
    setSimulating(true);
    try {
      await base44.functions.invoke('simulateCampaign', {
        campaign_idea_id: selectedId,
        scenario_name: form.scenario_name,
        assumptions: form.assumptions,
        avg_ticket_size: Number(form.avg_ticket_size),
        cost_estimate: Number(form.cost_estimate),
      });
      await load();
    } catch (e) {
      alert('Simulation failed: ' + (e?.response?.data?.error || e.message));
    } finally { setSimulating(false); }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl lg:text-4xl text-primary mb-1">Outcome Simulation</h1>
        <p className="text-muted-foreground">Project reach, conversion, revenue and ROI before launching a campaign.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Simulator */}
          <div className="lg:col-span-2">
            <Card className="p-6 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <LineIcon className="w-5 h-5 text-accent" />
                <h2 className="font-display text-lg text-primary">Run Simulation</h2>
              </div>
              {ideas.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No validated ideas to simulate. Validate ideas first.</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label>Campaign Idea</Label>
                    <Select value={selectedId} onValueChange={setSelectedId}>
                      <SelectTrigger><SelectValue placeholder="Select a validated idea" /></SelectTrigger>
                      <SelectContent>
                        {ideas.map(i => <SelectItem key={i.id} value={i.id}>{i.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Scenario Name</Label>
                    <Input value={form.scenario_name} onChange={e => setForm({...form, scenario_name: e.target.value})} />
                  </div>
                  <div>
                    <Label>Assumptions</Label>
                    <Textarea value={form.assumptions} onChange={e => setForm({...form, assumptions: e.target.value})} rows={2} placeholder="e.g. Rate cut expected, Q4 seasonality..." />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Avg Ticket Size</Label>
                      <Input type="number" value={form.avg_ticket_size} onChange={e => setForm({...form, avg_ticket_size: e.target.value})} />
                    </div>
                    <div>
                      <Label>Cost Estimate</Label>
                      <Input type="number" value={form.cost_estimate} onChange={e => setForm({...form, cost_estimate: e.target.value})} />
                    </div>
                  </div>
                  <Button onClick={run} disabled={simulating || !selectedId} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                    <Play className="w-4 h-4 mr-1.5" /> {simulating ? 'Simulating...' : 'Run Simulation'}
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-4">
            <h2 className="font-display text-lg text-primary">Simulation Results</h2>
            {simulations.length === 0 ? (
              <Card className="p-12 text-center">
                <LineIcon className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">No simulations yet. Run one to see projected outcomes.</p>
              </Card>
            ) : (
              simulations.map((sim) => (
                <Card key={sim.id} className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-display text-lg text-primary">{sim.campaign_title}</h3>
                      <p className="text-xs text-muted-foreground">{sim.scenario_name}</p>
                    </div>
                    <span className={cn('text-xs px-2 py-1 rounded-full font-medium',
                      sim.projected_roi_pct >= 100 ? 'bg-emerald-100 text-emerald-700' :
                      sim.projected_roi_pct >= 0 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                    )}>ROI {sim.projected_roi_pct?.toFixed(0)}%</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <Stat icon={Users} label="Projected Reach" value={sim.projected_reach?.toLocaleString()} color="text-blue-600" bg="bg-blue-50" />
                    <Stat icon={Percent} label="Conversion" value={`${sim.projected_conversion_pct?.toFixed(1)}%`} color="text-purple-600" bg="bg-purple-50" />
                    <Stat icon={TrendingUp} label="Respondents" value={sim.projected_respondents?.toLocaleString()} color="text-teal-600" bg="bg-teal-50" />
                    <Stat icon={DollarSign} label="Revenue" value={sim.projected_revenue?.toLocaleString(undefined, { maximumFractionDigits: 0 })} color="text-emerald-600" bg="bg-emerald-50" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-[11px] text-muted-foreground uppercase">Projected Cost</div>
                      <div className="font-display text-lg text-primary">{sim.projected_cost?.toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-[11px] text-muted-foreground uppercase">Net ROI</div>
                      <div className="font-display text-lg text-primary">{((sim.projected_revenue || 0) - (sim.projected_cost || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    </div>
                  </div>

                  {sim.risk_factors && (
                    <div className="flex items-start gap-2 bg-amber-50 rounded-lg p-3">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[11px] text-amber-700 uppercase font-medium mb-0.5">Risk Factors</div>
                        <p className="text-xs text-amber-800">{sim.risk_factors}</p>
                      </div>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, color, bg }) {
  return (
    <div className={cn('rounded-lg p-3', bg)}>
      <Icon className={cn('w-4 h-4 mb-1.5', color)} />
      <div className="text-[11px] text-muted-foreground uppercase">{label}</div>
      <div className="font-display text-base text-primary">{value}</div>
    </div>
  );
}