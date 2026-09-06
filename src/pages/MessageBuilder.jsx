import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Sparkles, Save, Send, Smartphone, MessageSquare, Phone, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

const channelMeta = {
  email: { icon: Mail, label: 'Email', color: 'text-blue-600 bg-blue-50' },
  sms: { icon: Smartphone, label: 'SMS', color: 'text-purple-600 bg-purple-50' },
  push: { icon: Bell, label: 'Push', color: 'text-amber-600 bg-amber-50' },
  whatsapp: { icon: MessageSquare, label: 'WhatsApp', color: 'text-emerald-600 bg-emerald-50' },
  rm_call: { icon: Phone, label: 'RM Call', color: 'text-rose-600 bg-rose-50' },
  in_app: { icon: Bell, label: 'In-App', color: 'text-teal-600 bg-teal-50' },
};

export default function MessageBuilder() {
  const [ideas, setIdeas] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [tone, setTone] = useState('professional');
  const [language, setLanguage] = useState('English');
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [ideaData, msgData] = await Promise.all([
        base44.entities.CampaignIdea.list('-created_date', 50),
        base44.entities.MarketingMessage.list('-created_date', 50),
      ]);
      setIdeas((ideaData || []).filter(i => i.status === 'validated' || i.status === 'approved' || i.status === 'simulated'));
      setMessages(msgData || []);
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const generate = async () => {
    if (!selectedId) return;
    setGenerating(true);
    try {
      await base44.functions.invoke('generateMessages', { campaign_idea_id: selectedId, tone, language });
      await load();
    } catch (e) {
      alert('Generation failed: ' + (e?.response?.data?.error || e.message));
    } finally { setGenerating(false); }
  };

  const saveMessage = async (msg) => {
    await base44.entities.MarketingMessage.update(msg.id, { subject: msg.subject, body: msg.body, tone: msg.tone });
    setEditing(null);
    await load();
  };

  const approveMessage = async (msg) => {
    await base44.entities.MarketingMessage.update(msg.id, { status: 'approved' });
    await load();
  };

  const filteredMessages = selectedId ? messages.filter(m => m.campaign_idea_id === selectedId) : messages;

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl lg:text-4xl text-primary mb-1">Message Builder</h1>
        <p className="text-muted-foreground">AI generates channel-specific marketing messages, ready for expert editing and approval.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <>
          {/* Generator */}
          <Card className="p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4">
              <div className="flex-1">
                <Label>Campaign Idea</Label>
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger><SelectValue placeholder="Select a validated/simulated idea" /></SelectTrigger>
                  <SelectContent>
                    {ideas.map(i => <SelectItem key={i.id} value={i.id}>{i.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="lg:w-44">
                <Label>Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="warm">Warm</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="advisory">Advisory</SelectItem>
                    <SelectItem value="celebratory">Celebratory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="lg:w-40">
                <Label>Language</Label>
                <Input value={language} onChange={e => setLanguage(e.target.value)} />
              </div>
              <Button onClick={generate} disabled={generating || !selectedId} className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Sparkles className="w-4 h-4 mr-1.5" /> {generating ? 'Generating...' : 'Generate Messages'}
              </Button>
            </div>
          </Card>

          {ideas.length === 0 && (
            <Card className="p-12 text-center">
              <Mail className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">No validated ideas available. Validate or simulate an idea first.</p>
            </Card>
          )}

          {/* Messages */}
          {filteredMessages.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredMessages.map((msg) => {
                const meta = channelMeta[msg.channel] || channelMeta.email;
                const Icon = meta.icon;
                const isEditing = editing?.id === msg.id;
                return (
                  <Card key={msg.id} className="p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', meta.color)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-medium text-sm text-primary">{meta.label}</div>
                          <div className="text-[10px] text-muted-foreground uppercase">{msg.tone} · {msg.language}</div>
                        </div>
                      </div>
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium uppercase',
                        msg.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        msg.status === 'sent' ? 'bg-primary text-primary-foreground' : 'bg-slate-100 text-slate-600'
                      )}>{msg.status}</span>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <Input value={editing.subject} onChange={e => setEditing({...editing, subject: e.target.value})} placeholder="Subject" />
                        <Textarea value={editing.body} onChange={e => setEditing({...editing, body: e.target.value})} rows={6} />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveMessage(editing)} className="bg-primary hover:bg-primary/90">
                            <Save className="w-3.5 h-3.5 mr-1" /> Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="font-medium text-sm text-primary mb-1">{msg.subject}</div>
                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap line-clamp-4">{msg.body}</p>
                        <div className="flex gap-2 mt-3 pt-3 border-t">
                          <Button size="sm" variant="outline" onClick={() => setEditing({...msg})}>Edit</Button>
                          {msg.status === 'draft' && (
                            <Button size="sm" onClick={() => approveMessage(msg)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                              Approve
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}