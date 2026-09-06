import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { contextSummary, focusProduct, focusSegment } = body || {};

    // Pull live intelligence to ground the ideation
    const [signals, events, news] = await Promise.all([
      base44.asServiceRole.entities.CustomerSignal.list('-signal_date', 15),
      base44.asServiceRole.entities.MarketEvent.list('-event_date', 10),
      base44.asServiceRole.entities.InvestmentNews.list('-published_date', 10)
    ]);

    const signalsText = (signals as any[]).map(s =>
      `- [${s.signal_type}] ${s.customer_segment}: ${s.description} (intensity ${s.intensity || 'n/a'}, product interest: ${s.product_interest || 'unknown'})`
    ).join('\n');
    const eventsText = (events as any[]).map(e =>
      `- ${e.title} (${e.category}, ${e.impact_level} impact): ${e.description}`
    ).join('\n');
    const newsText = (news as any[]).map(n =>
      `- ${n.headline} (${n.category}, ${n.sentiment}): ${n.summary}`
    ).join('\n');

    const prompt = `You are a senior banking marketing strategist. Based on the following market intelligence, generate 3 high-impact, actionable campaign ideations for a bank's CRM and marketing teams.

CUSTOMER SIGNALS:
${signalsText || 'None available'}

MARKET EVENTS:
${eventsText || 'None available'}

INVESTMENT NEWS:
${newsText || 'None available'}

${focusProduct ? `Focus product: ${focusProduct}` : ''}
${focusSegment ? `Focus segment: ${focusSegment}` : ''}

For each campaign idea, provide:
- title: concise campaign name
- description: what the campaign does and why, grounded in the intelligence above
- target_segment: the customer segment it targets
- objective: one of Cross-sell, Retention, Acquisition, Activation
- product: the banking product promoted
- channels: comma separated from email, sms, push, rm_call, whatsapp, in_app
- expected_reach: integer number of customers
- expected_conversion_pct: number 0-100
- priority: low, medium, or high
- source_intelligence: brief summary of which signals/events/news informed this idea

Return a JSON object with an "ideas" array. Each idea object must have exactly those fields.`;

    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          ideas: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                target_segment: { type: "string" },
                objective: { type: "string" },
                product: { type: "string" },
                channels: { type: "string" },
                expected_reach: { type: "number" },
                expected_conversion_pct: { type: "number" },
                priority: { type: "string" },
                source_intelligence: { type: "string" }
              },
              required: ["title", "description", "target_segment", "objective", "product", "channels", "expected_reach", "expected_conversion_pct", "priority", "source_intelligence"]
            }
          }
        },
        required: ["ideas"]
      }
    });

    const ideas = (llm as any).ideas || [];

    // Persist the generated ideas
    const created = await base44.asServiceRole.entities.CampaignIdea.bulkCreate(
      ideas.map((idea: any) => ({
        title: idea.title,
        description: idea.description,
        target_segment: idea.target_segment,
        objective: idea.objective,
        product: idea.product,
        channels: idea.channels,
        expected_reach: idea.expected_reach,
        expected_conversion_pct: idea.expected_conversion_pct,
        priority: idea.priority,
        source_intelligence: idea.source_intelligence,
        status: "draft",
        generated_by: "ai"
      }))
    );

    return Response.json({ ideas: created, count: (created as any[]).length });
  } catch (error) {
    return Response.json({ error: (error as any).message }, { status: 500 });
  }
}