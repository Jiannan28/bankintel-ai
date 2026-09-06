import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { campaign_idea_id, scenario_name, assumptions, avg_ticket_size, cost_estimate } = body || {};

    if (!campaign_idea_id) return Response.json({ error: 'campaign_idea_id required' }, { status: 400 });

    const idea = await base44.asServiceRole.entities.CampaignIdea.get(campaign_idea_id);

    const prompt = `You are a banking campaign forecasting analyst. Simulate the business outcome of the following campaign under the given scenario. Be realistic and conservative for a retail/commercial bank.

CAMPAIGN:
- Title: ${idea.title}
- Target segment: ${idea.target_segment}
- Objective: ${idea.objective}
- Product: ${idea.product}
- Channels: ${idea.channels}
- Expected reach: ${idea.expected_reach}
- Expected conversion %: ${idea.expected_conversion_pct}

SCENARIO: ${scenario_name || 'Base case'}
ASSUMPTIONS: ${assumptions || 'Standard market conditions'}
AVG TICKET SIZE (local currency): ${avg_ticket_size || 0}
ESTIMATED TOTAL COST (local currency): ${cost_estimate || 0}

Return a JSON object with:
- projected_reach: number
- projected_conversion_pct: number
- projected_respondents: number (reach * conversion)
- projected_revenue: number (respondents * ticket size)
- projected_cost: number
- projected_roi_pct: number ((revenue - cost) / cost * 100)
- risk_factors: 2-3 sentence summary of key risks`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          projected_reach: { type: "number" },
          projected_conversion_pct: { type: "number" },
          projected_respondents: { type: "number" },
          projected_revenue: { type: "number" },
          projected_cost: { type: "number" },
          projected_roi_pct: { type: "number" },
          risk_factors: { type: "string" }
        },
        required: ["projected_reach", "projected_conversion_pct", "projected_respondents", "projected_revenue", "projected_cost", "projected_roi_pct", "risk_factors"]
      }
    });

    const sim = await base44.asServiceRole.entities.Simulation.create({
      campaign_idea_id,
      campaign_title: idea.title,
      scenario_name: scenario_name || 'Base case',
      assumptions: assumptions || 'Standard market conditions',
      projected_reach: (result as any).projected_reach,
      projected_conversion_pct: (result as any).projected_conversion_pct,
      projected_respondents: (result as any).projected_respondents,
      avg_ticket_size: avg_ticket_size || 0,
      projected_revenue: (result as any).projected_revenue,
      projected_cost: (result as any).projected_cost,
      projected_roi_pct: (result as any).projected_roi_pct,
      risk_factors: (result as any).risk_factors,
      status: "completed"
    });

    await base44.asServiceRole.entities.CampaignIdea.update(campaign_idea_id, { status: "simulated" });

    return Response.json({ simulation: sim });
  } catch (error) {
    return Response.json({ error: (error as any).message }, { status: 500 });
  }
}