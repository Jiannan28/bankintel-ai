import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const SIGNIFICANT_RELEVANCE = 70;
const HIGH_IMPACT = 70;
const ACTIVE_STATUSES = ['approved', 'launched'];

export default async function(req) {
  try {
    // Workflow-invoked: runs with service role (no app-user token in scope)
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    const body = await req.json().catch(() => ({}));
    const newsId = body.news_id;
    if (!newsId) {
      return Response.json({ error: 'news_id is required' }, { status: 400 });
    }

    const news = await svc.entities.InvestmentNews.get(newsId);
    if (!news) {
      return Response.json({ error: 'Investment news not found' }, { status: 404 });
    }

    // Significance gate: only client-relevant news is scored
    if ((news.relevance_score ?? 0) < SIGNIFICANT_RELEVANCE) {
      return Response.json({
        significant: false,
        impact_score: 0,
        rationale: 'Relevance score below significance threshold (' + SIGNIFICANT_RELEVANCE + ')'
      });
    }

    // Active campaigns = approved or launched
    const campaigns = await svc.entities.CampaignIdea.list('-updated_date', 100);
    const active = campaigns.filter(c => ACTIVE_STATUSES.includes(c.status));
    if (active.length === 0) {
      return Response.json({
        significant: false,
        impact_score: 0,
        rationale: 'No active campaigns to impact'
      });
    }

    const campaignList = active
      .map(c => `- "${c.title}" (product: ${c.product || 'n/a'}; segment: ${c.target_segment}; status: ${c.status})`)
      .join('\n');

    const prompt = `You are a banking marketing strategist. A significant investment news item was detected. Score its potential impact on the bank's ACTIVE marketing campaigns.

INVESTMENT NEWS:
Headline: ${news.headline}
Summary: ${news.summary}
Category: ${news.category}
Sentiment: ${news.sentiment}
Affected products: ${news.affected_products || 'n/a'}
Client relevance score: ${news.relevance_score}/100

ACTIVE CAMPAIGNS:
${campaignList}

Consider: does this news make any active campaign messaging outdated, contradictory, risky, or unexpectedly relevant? Could it shift client behavior around the promoted products? Score the overall impact on the active campaign portfolio from 0 (no impact) to 100 (severe impact requiring immediate action). List the titles of the most affected campaigns.`;

    const result = await svc.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          impact_score: { type: 'number', description: 'Overall impact on active campaigns, 0-100' },
          rationale: { type: 'string', description: '2-3 sentence explanation of the impact' },
          affected_campaigns: { type: 'array', items: { type: 'string' }, description: 'Titles of most affected active campaigns' }
        },
        required: ['impact_score', 'rationale']
      }
    });

    const impactScore = Math.max(0, Math.min(100, Math.round(Number(result.impact_score) || 0)));
    return Response.json({
      significant: impactScore >= HIGH_IMPACT,
      impact_score: impactScore,
      rationale: result.rationale || '',
      affected_campaigns: Array.isArray(result.affected_campaigns) ? result.affected_campaigns : []
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}