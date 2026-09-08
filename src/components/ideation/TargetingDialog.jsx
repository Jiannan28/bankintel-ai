import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Wallet, TrendingUp, FileText, Trash2, ShieldOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const EMPTY = {
  segment: '',
  life_stage: '',
  age_range: '',
  income_band: '',
  holdings: [],
  aum_band: '',
  product_interest: [],
  risk_appetite: '',
  engagement_level: '',
  exclusions: { key_standard_excl: '', channel_standard_excl: '', product_standard_excl: '', pvc_standard_excl: '' },
  free_text: '',
};

const HOLDINGS = ['deposit', 'mortgage', 'credit_card', 'wealth_investments', 'insurance', 'fx', 'personal_loan'];
const INTERESTS = ['mortgage', 'credit_card', 'wealth', 'insurance', 'deposit', 'fx', 'personal_loan'];
const LIFE_STAGES = ['Student', 'Early career', 'Family builder', 'Pre-retiree', 'Retiree'];
const AGE_RANGES = ['Under 25', '25-34', '35-49', '50-64', '65+'];
const INCOME_BANDS = ['Below HK$300k', 'HK$300k-800k', 'HK$800k-2M', 'Above HK$2M'];
const AUM_BANDS = ['Below HK$500k', 'HK$500k-2M', 'HK$2M-10M', 'Above HK$10M'];
const RISK_APPETITES = ['Conservative', 'Balanced', 'Growth', 'Aggressive'];
const ENGAGEMENT = ['Highly digital', 'Mixed channels', 'Branch-preferred'];

const EXCLUSION_FIELDS = [
  { key: 'key_standard_excl', label: 'Key Standard Excl', options: ['Dormant 12m+', 'No active relationship', 'Staff accounts', 'Under 18', 'Non-resident'] },
  { key: 'channel_standard_excl', label: 'Channel Standard Excl', options: ['Do-not-contact (any channel)', 'Email unsubscribed', 'SMS opt-out', 'Push opt-out', 'Complaint flag 6m'] },
  { key: 'product_standard_excl', label: 'Product Standard Excl', options: ['Existing product holder', 'Recent application 30d', 'Recent application 90d', 'Product defaulted 12m', 'Cross-sell max reached'] },
  { key: 'pvc_standard_excl', label: 'PVC Standard Excl', options: ['High-value PVC only excluded', 'Low engagement PVC', 'PVC in review', 'PVC pending KYC', 'PVC suspended'] },
];

export function summarizeTargeting(t) {
  if (!t) return null;
  const parts = [];
  if (t.segment) parts.push(t.segment);
  if (t.age_range) parts.push(`Age ${t.age_range}`);
  if (t.income_band) parts.push(t.income_band);
  if (t.life_stage) parts.push(t.life_stage);
  if (t.holdings?.length) parts.push(`${t.holdings.length} holding${t.holdings.length > 1 ? 's' : ''}`);
  if (t.aum_band) parts.push(`AUM ${t.aum_band}`);
  if (t.product_interest?.length) parts.push(`Interest in ${t.product_interest.join(', ')}`);
  if (t.risk_appetite) parts.push(`${t.risk_appetite} risk`);
  if (t.engagement_level) parts.push(t.engagement_level);
  const excl = Object.values(t.exclusions || {}).filter(Boolean);
  if (excl.length) parts.push(`${excl.length} exclusion rule${excl.length > 1 ? 's' : ''}`);
  if (t.free_text) parts.push(`"${t.free_text.slice(0, 24)}${t.free_text.length > 24 ? '…' : ''}"`);
  return parts.length ? parts.join(' · ') : null;
}

function Chip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-xs px-3 py-1.5 rounded-full border transition-colors',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-white text-slate-600 border-slate-200 hover:border-primary/60'
      )}
    >
      {children}
    </button>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="rounded-lg border bg-slate-50/60 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-primary">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function TargetingDialog({ open, value, onSave, onClose }) {
  const [draft, setDraft] = useState(EMPTY);

  useEffect(() => {
    if (open) setDraft(value || EMPTY);
  }, [open, value]);

  const set = (key, val) => setDraft(d => ({ ...d, [key]: val }));
  const toggleIn = (key, item) => setDraft(d => ({
    ...d,
    [key]: d[key].includes(item) ? d[key].filter(i => i !== item) : [...d[key], item],
  }));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-primary">Targeting Criteria</DialogTitle>
          <DialogDescription>
            Define complex targeting for the AI Ideation Engine — demographics, holdings, potential and anything else.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Section icon={Users} title="Customer Demographics">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Customer segment</Label>
                <Input value={draft.segment} onChange={e => set('segment', e.target.value)} placeholder="e.g. HNW, SME, Young Professional" />
              </div>
              <div>
                <Label className="text-xs">Life stage</Label>
                <Select value={draft.life_stage || undefined} onValueChange={v => set('life_stage', v === draft.life_stage ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    {LIFE_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Age range</Label>
                <Select value={draft.age_range || undefined} onValueChange={v => set('age_range', v === draft.age_range ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    {AGE_RANGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Annual income band</Label>
                <Select value={draft.income_band || undefined} onValueChange={v => set('income_band', v === draft.income_band ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    {INCOME_BANDS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Section>

          <Section icon={Wallet} title="Current Holdings">
            <div className="flex flex-wrap gap-2 mb-3">
              {HOLDINGS.map(h => (
                <Chip key={h} active={draft.holdings.includes(h)} onClick={() => toggleIn('holdings', h)}>
                  {h.replace(/_/g, ' ')}
                </Chip>
              ))}
            </div>
            <div>
              <Label className="text-xs">Assets under management (AUM) band</Label>
              <Select value={draft.aum_band || undefined} onValueChange={v => set('aum_band', v === draft.aum_band ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  {AUM_BANDS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </Section>

          <Section icon={TrendingUp} title="Customer Potentials">
            <Label className="text-xs mb-2 block">Product interest / propensity</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {INTERESTS.map(p => (
                <Chip key={p} active={draft.product_interest.includes(p)} onClick={() => toggleIn('product_interest', p)}>
                  {p.replace(/_/g, ' ')}
                </Chip>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Risk appetite</Label>
                <Select value={draft.risk_appetite || undefined} onValueChange={v => set('risk_appetite', v === draft.risk_appetite ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    {RISK_APPETITES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Digital engagement</Label>
                <Select value={draft.engagement_level || undefined} onValueChange={v => set('engagement_level', v === draft.engagement_level ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    {ENGAGEMENT.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Section>

          <Section icon={ShieldOff} title="Exclusion Ruleset">
            <div className="grid grid-cols-2 gap-3">
              {EXCLUSION_FIELDS.map(f => (
                <div key={f.key}>
                  <Label className="text-xs">{f.label}</Label>
                  <Select
                    value={draft.exclusions?.[f.key] || undefined}
                    onValueChange={v => set('exclusions', { ...draft.exclusions, [f.key]: v === draft.exclusions?.[f.key] ? '' : v })}
                  >
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      {f.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </Section>

          <Section icon={FileText} title="Free-text Description">
            <Textarea
              value={draft.free_text}
              onChange={e => set('free_text', e.target.value)}
              rows={3}
              placeholder="Describe any other targeting criteria in your own words — behaviours, triggers, exclusions, geography…"
            />
          </Section>
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
          <Button variant="ghost" size="sm" onClick={() => setDraft(EMPTY)} className="text-muted-foreground">
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear all
          </Button>
          <Button onClick={() => { onSave(draft); onClose(); }}>Apply Targeting</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}