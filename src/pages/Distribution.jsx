import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send, Users, Smartphone, CheckCircle2, Zap, Mail, Phone, Bell, MessageSquare } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import CampaignCalendar from '@/components/distribution/CampaignCalendar';
import { cn } from '@/lib/utils';

const channelIcons = { email: Mail, sms: Smartphone, push: Bell, whatsapp: MessageSquare, rm_call: Phone, in_app: Bell };

export default function Distribution() {
  const [ideas, setIdeas] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [rmCount, setRmCount] = useState(25);
  const [digitalReach, setDigitalReach] = useState(0);
  const [justDispatched, setJustDispatched] = useState(null);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testFeedback, setTestFeedback] = useState(null);
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().slice(0, 10));

  const load = async () => {
    setLoading(true);
    try {
      const [ideaData, distData, msgData] = await Promise.all([
        base44.entities.CampaignIdea.list('-created_date', 50),
        base44.entities.Distribution.list('-created_date', 20),
        base44.entities.MarketingMessage.list('-created_date', 50),
      ]);
      setIdeas((ideaData || []).filter(i => i.status === 'approved' || i.status === 'simulated' || i.status === 'launched'));
      setDistributions(distData || []);
      setMessages(msgData || []);
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const selectedIdea = ideas.find(i => i.id === selectedId);
  const selectedMessages = messages.filter(m => m.campaign_idea_id === selectedId);

  const dispatch = async () => {
    if (!selectedId) return;
    setDispatching(true);
    try {
      await base44.functions.invoke('distributeCampaign', {
        campaign_idea_id: selectedId,
        rm_count: Number(rmCount),
        digital_reach: Number(digitalReach) || selectedIdea?.expected_reach || 0,
        scheduled_date: scheduledDate ? new Date(scheduledDate + 'T09:00:00').toISOString() : new Date().toISOString(),
      });
      setJustDispatched(selectedIdea?.title);
      setSelectedId('');
      await load();
    } catch (e) {
      alert('Dispatch failed: ' + (e?.response?.data?.error || e.message));
    } finally { setDispatching(false); }
  };

  const hasEmailChannel = selectedIdea?.channels?.split(',').map(c => c.trim()).includes('email');

  const sendTestEmail = async () => {
    if (!testEmail || !/^\S+@\S+\.\S+$/.test(testEmail)) {
      setTestFeedback({ type: 'error', text: 'Enter a valid email address.' });
      return;
    }
    setSendingTest(true);
    setTestFeedback(null);
    try {
      await base44.functions.invoke('sendTestEmail', { campaign_idea_id: selectedId, test_email: testEmail });
      setTestFeedback({ type: 'success', text: `Test email sent to ${testEmail}.` });
    } catch (e) {
      setTestFeedback({ type: 'error', text: 'Test failed: ' + (e?.response?.data?.error || e.message) });
    } finally { setSendingTest(false); }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl lg:text-4xl text-primary mb-1">Distribution</h1>
        <p className="text-muted-foreground">One-click dispatch of approved campaign messages to Relationship Managers and digital channels.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Dispatcher */}
          <div className="lg:col-span-2">
            <Card className="p-6 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-accent" />
                <h2 className="font-display text-lg text-primary">Dispatch Console</h2>
              </div>

              {justDispatched && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-emerald-800">Campaign Dispatched</div>
                    <div className="text-xs text-emerald-700">"{justDispatched}" sent to RMs and digital channels.</div>
                  </div>
                </div>
              )}

              {ideas.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No approved campaigns ready for distribution. Approve messages first.</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label>Campaign</Label>
                    <select
                      value={selectedId}
                      onChange={e => { setSelectedId(e.target.value); setDigitalReach(ideas.find(i => i.id === e.target.value)?.expected_reach || 0); }}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">Select an approved campaign</option>
                      {ideas.map(i => <option key={i.id} value={i.id}>{i.title} ({i.status})</option>)}
                    </select>
                  </div>

                  {selectedIdea && (
                    <>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-[11px] text-muted-foreground uppercase mb-1">Channels</div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedIdea.channels?.split(',').map((c, i) => {
                            const Icon = channelIcons[c.trim()] || Mail;
                            return (
                              <span key={i} className="inline-flex items-center gap-1 text-[11px] bg-white px-2 py-1 rounded border">
                                <Icon className="w-3 h-3" /> {c.trim()}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>RM Count</Label>
                          <Input type="number" value={rmCount} onChange={e => setRmCount(e.target.value)} />
                        </div>
                        <div>
                          <Label>Digital Reach</Label>
                          <Input type="number" value={digitalReach} onChange={e => setDigitalReach(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <Label>Launch Date</Label>
                        <Input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
                      </div>

                      {hasEmailChannel && (
                        <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-primary" />
                            <span className="text-[11px] text-muted-foreground uppercase">Test Email Delivery</span>
                          </div>
                          <div className="flex gap-2">
                            <Input type="email" placeholder="name@example.com" value={testEmail} onChange={e => setTestEmail(e.target.value)} />
                            <Button variant="outline" onClick={sendTestEmail} disabled={sendingTest || !selectedId} className="shrink-0">
                              {sendingTest ? 'Sending...' : 'Send Test'}
                            </Button>
                          </div>
                          {testFeedback && (
                            <p className={cn('text-xs', testFeedback.type === 'success' ? 'text-emerald-600' : 'text-destructive')}>{testFeedback.text}</p>
                          )}
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground bg-slate-50 rounded-lg p-3">
                        <div className="flex justify-between mb-1"><span>Messages ready:</span><span className="font-medium text-primary">{selectedMessages.length}</span></div>
                        <div className="flex justify-between"><span>Approved:</span><span className="font-medium text-emerald-600">{selectedMessages.filter(m => m.status === 'approved' || m.status === 'sent').length}</span></div>
                      </div>

                      <Button onClick={dispatch} disabled={dispatching} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Send className="w-4 h-4 mr-1.5" /> {dispatching ? 'Dispatching...' : 'One-Click Dispatch'}
                      </Button>
                      <p className="text-[11px] text-muted-foreground text-center">Sends to {rmCount} RMs and ~{(Number(digitalReach) || 0).toLocaleString()} digital customers</p>
                    </>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* History & Calendar */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="calendar">
              <TabsList className="mb-4">
                <TabsTrigger value="calendar">Launch Calendar</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              <TabsContent value="calendar">
                <CampaignCalendar distributions={distributions} />
              </TabsContent>
              <TabsContent value="history">
            {distributions.length === 0 ? (
              <Card className="p-12 text-center">
                <Send className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">No distributions yet. Dispatch a campaign to see it here.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {distributions.map((d) => (
                  <Card key={d.id} className="p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-display text-lg text-primary">{d.campaign_title}</h3>
                        <p className="text-xs text-muted-foreground">Dispatched by {d.dispatched_by || 'System'}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium uppercase">{d.status}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-2">
                        <Users className="w-4 h-4 text-rose-600" />
                        <div>
                          <div className="text-[11px] text-muted-foreground">RMs</div>
                          <div className="font-display text-base text-primary">{d.rm_count}</div>
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-blue-600" />
                        <div>
                          <div className="text-[11px] text-muted-foreground">Digital Reach</div>
                          <div className="font-display text-base text-primary">{d.digital_reach?.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-emerald-600" />
                        <div>
                          <div className="text-[11px] text-muted-foreground">Messages</div>
                          <div className="font-display text-base text-primary">{d.message_ids?.split(',').length || 0}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t">
                      {d.target_channels?.split(',').map((c, i) => (
                        <span key={i} className="text-[11px] bg-slate-100 px-2 py-1 rounded text-slate-600">{c.trim()}</span>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
}