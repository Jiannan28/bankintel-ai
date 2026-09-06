import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, LayoutTemplate } from 'lucide-react';
import TemplateCard from '@/components/templates/TemplateCard';
import TemplateDialog from '@/components/templates/TemplateDialog';

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.CampaignTemplate.list('-created_date', 100);
      setTemplates(data || []);
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async (draft) => {
    const payload = {
      name: draft.name,
      description: draft.description,
      focus_product: draft.focus_product,
      objective: draft.objective,
      channels: draft.channels.join(','),
      targeting: draft.targeting ? JSON.stringify(draft.targeting) : '',
    };
    try {
      if (editing) {
        await base44.entities.CampaignTemplate.update(editing.id, payload);
      } else {
        await base44.entities.CampaignTemplate.create(payload);
      }
      setDialogOpen(false);
      await load();
    } catch (e) {
      alert('Could not save template: ' + (e?.response?.data?.error || e.message));
    }
  };

  const remove = async (t) => {
    await base44.entities.CampaignTemplate.delete(t.id);
    setTemplates(templates.filter((x) => x.id !== t.id));
  };

  const applyTemplate = (t) => {
    let targeting = null;
    try { targeting = t.targeting ? JSON.parse(t.targeting) : null; } catch (e) { targeting = null; }
    sessionStorage.setItem('applyTemplate', JSON.stringify({ focus_product: t.focus_product || '', targeting }));
    navigate('/ideation');
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl text-primary mb-1">Template Library</h1>
          <p className="text-muted-foreground">
            Save frequently used campaign setups and targeting criteria — apply one to launch new initiatives faster.
          </p>
        </div>
        <Button
          onClick={() => { setEditing(null); setDialogOpen(true); }}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Plus className="w-4 h-4 mr-1.5" /> New Template
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" /></div>
      ) : templates.length === 0 ? (
        <Card className="p-12 text-center">
          <LayoutTemplate className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No templates yet. Create your first reusable campaign setup to speed up future launches.</p>
          <Button variant="outline" onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-1.5" /> Create your first template
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onUse={() => applyTemplate(t)}
              onEdit={() => { setEditing(t); setDialogOpen(true); }}
              onDelete={() => remove(t)}
            />
          ))}
        </div>
      )}

      <TemplateDialog
        open={dialogOpen}
        template={editing}
        onClose={() => setDialogOpen(false)}
        onSave={save}
      />
    </div>
  );
}