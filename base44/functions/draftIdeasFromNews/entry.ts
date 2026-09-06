import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const ACTIVE_STATUSES = ['approved', 'launched'];
const APP_URL = 'https://awesome-bank-pulse-ai.base44.app';
const MAX_EMAILS = 20;

export default async function(req) {
  try {
    // Workflow-invoked: runs with service role (no app-user token in scope)
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    const body = await req.json().catch(() => ({}));
    const newsId = body.news_id;
    const impactScore = Number(body.impact_score) || 0;
    if (!newsId) {
      return Response.json({ error: 'news_id is required' }, { status: 400 });
    }

    const news = await svc.entities.InvestmentNews.get(newsId);
    if (!news) {
      return Response.json({ error: 'Investment news not found' }, { status: 404 });
    }

    // Grounding context: active campaigns to differentiate from, recent signals for relevance
    const [campaigns, signals] = await Promise.all([
      svc.entities.CampaignIdea.list('-updated_date', 100),
      svc.entities.CustomerSignal.list('-created_date', 10)
    ]);
    const active = campaigns.filter(c => ACTIVE_STATUSES.includes(c.status));

    const activeList = active.map(c => `- "${c.title}" (${c.product || 'n/a'}, ${c.target_segment})`).join('\n') || 'None';
    const signalList = signals
      .map(s => `- [${s.customer_segment}] ${s.description} (interest: ${s.product_interest || 'n/a'})`)
      .join('\n');

    const prompt = `You are a senior banking marketing strategist. A high-impact investment news item was detected (impact score ${impactScore}/100 on active campaigns). Draft EXACTLY 3 new campaign ideas that respond to this news so the bank can capitalize on or mitigate it.

INVESTMENT NEWS:
Headline: ${news.headline}
Summary: ${news.summary}
Category: ${news.category}
Sentiment: ${news.sentiment}
Affected products: ${news.affected_products || 'n/a'}

ACTIVE CAMPAIGNS (do not duplicate these):
${activeList}

RECENT CUSTOMER SIGNALS (use for targeting relevance):
${signalList || 'None available'}

Each idea must be concrete and executable: clear title, 2-3 sentence description, target customer segment (e.g. Mass Affluent, HNW, Retail, SME, Young Professional), objective (Cross-sell, Retention, Acquisition, or Activation), banking product promoted, channels (comma separated subset of: email,sms,push,rm_call,whatsapp,in_app), estimated expected reach (number of customers), expected conversion percentage (number), priority (low, medium, or high), a brief source_intelligence note referencing the news headline, and an ai_score for business value 0-100.`;

    const result = await svc.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          ideas: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                target_segment: { type: 'string' },
                objective: { type: 'string' },
                product: { type: 'string' },
                channels: { type: 'string' },
                expected_reach: { type: 'number' },
                expected_conversion_pct: { type: 'number' },
                priority: { type: 'string' },
                source_intelligence: { type: 'string' },
                ai_score: { type: 'number' }
              },
              required: ['title', 'description', 'target_segment', 'objective']
            }
          }
        },
        required: ['ideas']
      }
    });

    const ideas = (result.ideas || []).slice(0, 3);
    if (ideas.length === 0) {
      return Response.json({ error: 'No ideas generated' }, { status: 500 });
    }

    // Persist drafts
    const saved = [];
    for (const idea of ideas) {
      const record = await svc.entities.CampaignIdea.create({
        title: String(idea.title || 'Untitled idea'),
        description: String(idea.description || ''),
        target_segment: String(idea.target_segment || 'Mass Affluent'),
        objective: String(idea.objective || 'Cross-sell'),
        product: idea.product ? String(idea.product) : undefined,
        channels: idea.channels ? String(idea.channels) : undefined,
        expected_reach: Number(idea.expected_reach) || undefined,
        expected_conversion_pct: Number(idea.expected_conversion_pct) || undefined,
        priority: ['low', 'medium', 'high'].includes(idea.priority) ? idea.priority : 'medium',
        source_intelligence: String(idea.source_intelligence || `Responds to: ${news.headline}`),
        status: 'draft',
        generated_by: 'ai',
        ai_score: Number(idea.ai_score) || undefined
      });
      saved.push(record);
    }

    // Email the team for immediate review
    const ideaRows = saved
      .map(
        (i, idx) =>
          `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;vertical-align:top;"><b>${idx + 1}. ${i.title}</b><br><span style="color:#555;">${i.description || ''}</span><br><span style="font-size:12px;color:#777;">Segment: ${i.target_segment} &middot; Objective: ${i.objective} &middot; Product: ${i.product || 'n/a'} &middot; Priority: ${i.priority}</span></td></tr>`
      )
      .join('');

    const emailBody = `<div style="font-family:Arial,sans-serif;max-width:640px;">
      <h2 style="color:#0d5c46;margin-bottom:4px;">High-Impact Market News Detected</h2>
      <p style="margin-top:0;">The news item below was scored <b>${impactScore}/100</b> for impact on active campaigns and 3 new draft campaign ideas have been created for your immediate review.</p>
      <div style="background:#f4f7f6;border-left:4px solid #b02a37;padding:10px 14px;margin:14px 0;">
        <b>${news.headline}</b><br><span style="color:#444;">${news.summary || ''}</span><br>
        <span style="font-size:12px;color:#777;">Category: ${news.category} &middot; Sentiment: ${news.sentiment}</span>
      </div>
      <table style="border-collapse:collapse;width:100%;">${ideaRows}</table>
      <p style="margin-top:18px;"><a href="${APP_URL}/validation" style="background:#0d5c46;color:#fff;padding:10px 18px;text-decoration:none;border-radius:6px;display:inline-block;">Review drafts in Validation</a></p>
      <p style="font-size:12px;color:#888;">Automated alert from BankIntel AI &middot; Market Intelligence Platform</p>
    </div>`;

    const subject = `Campaign Alert: High-impact news "${news.headline}" — 3 new draft ideas for review`;
    const users = await svc.entities.User.list();
    let emailed = 0;
    for (const u of users.slice(0, MAX_EMAILS)) {
      if (!u.email) continue;
      await svc.integrations.Core.SendEmail({
        to: u.email,
        subject,
        body: emailBody,
        from_name: 'BankIntel AI'
      });
      emailed++;
    }

    return Response.json({
      news_headline: news.headline,
      impact_score: impactScore,
      ideas: saved.map(i => ({ id: i.id, title: i.title })),
      emailed
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}