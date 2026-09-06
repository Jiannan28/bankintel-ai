import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const ideas: any[] = await base44.entities.CampaignIdea.list('-created_date', 30);
    if (!ideas || ideas.length === 0) {
      return Response.json({ error: 'No campaign ideas to score yet' }, { status: 400 });
    }

    const ideasText = ideas.map(i =>
      `ID ${i.id} | Title: ${i.title} | Objective: ${i.objective} | Segment: ${i.target_segment} | Product: ${i.product} | Priority: ${i.priority} | Expected reach: ${i.expected_reach} | Expected conversion: ${i.expected_conversion_pct}% | Status: ${i.status}`
    ).join('\n');

    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a senior banking marketing strategist scoring campaign ideations for business value. Evaluate each campaign idea below on: relevance to the target segment, product opportunity, expected business impact, timing, and feasibility of execution.

CAMPAIGN IDEAS:
${ideasText}

Score each idea from 0 to 100, where 100 is the highest business value. Return exactly one score per idea, reusing the exact ID provided. Do not invent new IDs.`,
      response_json_schema: {
        type: "object",
        properties: {
          scores: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                score: { type: "number" }
              },
              required: ["id", "score"]
            }
          }
        },
        required: ["scores"]
      }
    });

    const ideaIds = new Set(ideas.map((i: any) => i.id));
    const updates = ((llm as any).scores || [])
      .filter((s: any) => s.id && ideaIds.has(s.id) && typeof s.score === 'number')
      .map((s: any) => ({ id: s.id, ai_score: Math.max(0, Math.min(100, Math.round(s.score))) }));

    if (updates.length > 0) {
      await base44.entities.CampaignIdea.bulkUpdate(updates);
    }

    return Response.json({ scored: updates.length, ids: updates.map((u: any) => u.id) });
  } catch (error) {
    return Response.json({ error: (error as any).message }, { status: 500 });
  }
}