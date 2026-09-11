import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { campaign_idea_id, rm_count, digital_reach, scheduled_date,
            ab_test, variant_a_message_id, variant_b_message_id, variant_split, winner_metric } = body || {};

    if (!campaign_idea_id) return Response.json({ error: 'campaign_idea_id required' }, { status: 400 });

    const idea = await base44.asServiceRole.entities.CampaignIdea.get(campaign_idea_id);
    const messages = await base44.asServiceRole.entities.MarketingMessage.filter({ campaign_idea_id });

    const messageIds = (messages as any[]).map(m => m.id).join(',');

    // Mark messages as sent
    if (messageIds) {
      await base44.asServiceRole.entities.MarketingMessage.updateMany(
        { campaign_idea_id },
        { $set: { status: "sent" } }
      );
    }

    const distribution = await base44.asServiceRole.entities.Distribution.create({
      campaign_idea_id,
      campaign_title: idea.title,
      target_channels: idea.channels,
      rm_count: rm_count || 0,
      digital_reach: digital_reach || idea.expected_reach || 0,
      message_ids: messageIds,
      scheduled_date: scheduled_date || new Date().toISOString(),
      status: "dispatched",
      dispatched_by: user.full_name || user.email,
      ab_test: !!ab_test,
      variant_a_message_id: ab_test ? (variant_a_message_id || "") : "",
      variant_b_message_id: ab_test ? (variant_b_message_id || "") : "",
      variant_split: ab_test ? (Number(variant_split) || 50) : 0,
      winner_metric: ab_test ? (winner_metric || "") : ""
    });

    await base44.asServiceRole.entities.CampaignIdea.update(campaign_idea_id, { status: "launched" });

    return Response.json({ distribution, dispatched_messages: (messages as any[]).length });
  } catch (error) {
    return Response.json({ error: (error as any).message }, { status: 500 });
  }
}