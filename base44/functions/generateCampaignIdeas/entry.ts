import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { focusProduct } = body || {};
    // New structured targeting criteria; fall back to the legacy free-text segment
    const targeting: any = body?.targeting || (body?.focusSegment ? { segment: body.focusSegment } : {});

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

    // Build the structured targeting criteria block
    const criteria: string[] = [];
    if (targeting.segment) criteria.push(`- Customer segment: ${targeting.segment}`);
    if (targeting.life_stage) criteria.push(`- Life stage: ${targeting.life_stage}`);
    if (targeting.age_range) criteria.push(`- Age range: ${targeting.age_range}`);
    if (targeting.income_band) criteria.push(`- Annual income band: ${targeting.income_band}`);
    if (Array.isArray(targeting.holdings) && targeting.holdings.length) criteria.push(`- Current product holdings: ${targeting.holdings.join(', ')}`);
    if (targeting.aum_band) criteria.push(`- Assets under management band: ${targeting.aum_band}`);
    if (Array.isArray(targeting.product_interest) && targeting.product_interest.length) criteria.push(`- Product interest / propensity signals: ${targeting.product_interest.join(', ')}`);
    if (targeting.risk_appetite) criteria.push(`- Risk appetite: ${targeting.risk_appetite}`);
    if (targeting.engagement_level) criteria.push(`- Digital engagement: ${targeting.engagement_level}`);
    if (targeting.free_text) criteria.push(`- Additional criteria (free text): ${targeting.free_text}`);

    const targetingText = criteria.length
      ? `TARGETING CRITERIA - every campaign must be precisely aimed at customers matching ALL of the criteria below:\n${criteria.join('\n')}`
      : 'TARGETING CRITERIA - none specified; propose the highest-impact segments the intelligence supports.';

    const prompt = `You are a senior banking marketing strategist. Based on the following market intelligence and targeting criteria, generate 3 high-impact, actionable campaign ideations for a bank's CRM and marketing teams.

${targetingText}

CUSTOMER SIGNALS:
${signalsText || 'None available'}

MARKET EVENTS:
${eventsText || 'None available'}

INVESTMENT NEWS:
${newsText || 'None available'}

${focusProduct ? `Focus product: ${focusProduct}` : ''}

For each campaign idea, provide:
- title: concise campaign name
- description: what the campaign does and why, grounded in the intelligence above
- target_segment: the customer segment it targets (must match the targeting criteria when given)
- objective: one of Cross-sell, Retention, Acquisition, Activation
- product: the banking product promoted
- channels: comma separated from email, sms, push, rm_call, whatsapp, in_app
- expected_reach: integer number of customers
- expected_conversion_pct: number 0-100
- priority: low, medium, or high
- source_intelligence: brief summary of which signals/events/news informed this idea

Also return a "reasoning" field: an array of 4-6 short thinking steps (one sentence each), in order, describing how you analyzed the intelligence and the targeting criteria and why the resulting campaigns are promising. Write it as the strategist's thinking process.

Return a JSON object with a "reasoning" array and an "ideas" array. Each idea object must have exactly the fields listed above.`;

    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          reasoning: {
            type: "array",
            items: { type: "string" }
          },
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
        required: ["reasoning", "ideas"]
      }
    });

    const ideas = (llm as any).ideas || [];
    const reasoning = (llm as any).reasoning || [];

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

    return Response.json({ ideas: created, reasoning, count: (created as any[]).length });
  } catch (error) {
    return Response.json({ error: (error as any).message }, { status: 500 });
  }
}