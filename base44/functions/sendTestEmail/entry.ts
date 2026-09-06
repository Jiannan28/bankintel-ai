import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { campaign_idea_id, test_email } = body || {};

    if (!campaign_idea_id) return Response.json({ error: 'campaign_idea_id required' }, { status: 400 });
    if (!test_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(test_email)) {
      return Response.json({ error: 'A valid test_email is required' }, { status: 400 });
    }

    const idea = await base44.entities.CampaignIdea.get(campaign_idea_id);
    const messages = await base44.entities.MarketingMessage.filter({ campaign_idea_id, channel: 'email' });
    const emailMessage = (messages as any[])[0];
    if (!emailMessage) return Response.json({ error: 'No email message found for this campaign' }, { status: 404 });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: test_email,
      subject: `[TEST] ${emailMessage.subject || idea.title}`,
      body: emailMessage.body,
      from_name: 'Campaign Test',
    });

    return Response.json({ sent: true, to: test_email, subject: emailMessage.subject });
  } catch (error) {
    return Response.json({ error: (error as any).message }, { status: 500 });
  }
}