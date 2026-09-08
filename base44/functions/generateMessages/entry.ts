import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { campaign_idea_id, channels, tone, language } = body || {};

    if (!campaign_idea_id) return Response.json({ error: 'campaign_idea_id required' }, { status: 400 });

    const idea = await base44.asServiceRole.entities.CampaignIdea.get(campaign_idea_id);
    const channelList = (channels || idea.channels || 'email, sms, push').split(',').map((c: string) => c.trim()).filter(Boolean);

    const languageGuides: Record<string, string> = {
      Cantonese: 'Write in colloquial Hong Kong Cantonese (spoken-style Cantonese vocabulary and phrasing, e.g. 你哋, 而家, 唔好錯過), using Traditional Chinese characters throughout. Keep the tone natural as a Hong Konger would speak.',
      Mandarin: 'Write in standard mainland China style Mandarin (mainland vocabulary and phrasing conventions, e.g. 您, 优惠, 理财产品), using Simplified Chinese characters throughout.'
    };
    const languageGuide = languageGuides[language] || 'Write in clear professional English.';

    const prompt = `You are a senior banking copywriter. Generate marketing messages for the following campaign, one per channel. Each message must be compliant, professional, and tailored to the channel's format and length conventions.

CAMPAIGN:
- Title: ${idea.title}
- Description: ${idea.description}
- Target segment: ${idea.target_segment}
- Product: ${idea.product}
- Objective: ${idea.objective}

CHANNELS: ${channelList.join(', ')}
TONE: ${tone || 'professional'}
LANGUAGE: ${language || 'English'}

LANGUAGE INSTRUCTIONS: ${languageGuide}

For each channel produce:
- channel: the channel name
- subject: a short subject line (for email/push/in_app) or opening hook (for sms/whatsapp) or call script title (for rm_call)
- body: the message body. For email: 80-150 words. For sms: under 160 chars. For push: under 90 chars. For whatsapp: 60-120 words. For in_app: 40-70 words. For rm_call: a 120-180 word talking-points script for the relationship manager.

Return a JSON object with a "messages" array, one object per channel with fields channel, subject, body.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          messages: {
            type: "array",
            items: {
              type: "object",
              properties: {
                channel: { type: "string" },
                subject: { type: "string" },
                body: { type: "string" }
              },
              required: ["channel", "subject", "body"]
            }
          }
        },
        required: ["messages"]
      }
    });

    const messages = (result as any).messages || [];

    const created = await base44.asServiceRole.entities.MarketingMessage.bulkCreate(
      messages.map((m: any) => ({
        campaign_idea_id,
        campaign_title: idea.title,
        channel: m.channel,
        subject: m.subject,
        body: m.body,
        tone: tone || 'professional',
        language: language || 'English',
        status: "draft"
      }))
    );

    await base44.asServiceRole.entities.CampaignIdea.update(campaign_idea_id, { status: "approved" });

    return Response.json({ messages: created, count: (created as any[]).length });
  } catch (error) {
    return Response.json({ error: (error as any).message }, { status: 500 });
  }
}