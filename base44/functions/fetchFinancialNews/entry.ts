import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const FEED_URLS = [
  'https://finance.yahoo.com/news/rssindex',
  'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114',
  'https://news.google.com/rss/search?q=hong+kong+banking+OR+finance+OR+investment+when:2d&hl=en-HK&gl=HK&ceid=HK:en',
];
const MAX_ITEMS = 10;

const decode = (s) => s
  .replace(/<!\[CDATA\[|\]\]>/g, '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ')
  .trim();

function parseFeed(xml) {
  const out = [];
  const blocks = xml.split('<item>').slice(1);
  for (const block of blocks) {
    const title = block.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1];
    if (!title) continue;
    let headline = decode(title);
    let source = block.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1];
    const idx = headline.lastIndexOf(' - ');
    if (idx > 0) {
      if (!source) source = headline.slice(idx + 3);
      headline = headline.slice(0, idx);
    }
    out.push({
      headline,
      source: source ? decode(source) : 'Google News',
      published_date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
    });
  }
  return out;
}

const normalize = (h) => (h || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ');

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const res = await fetch(FEED_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return Response.json({ error: `Feed fetch failed: ${res.status}` }, { status: 502 });
    const feedItems = parseFeed(await res.text());
    if (feedItems.length === 0) return Response.json({ created: 0, checked: 0 });

    // Dedupe against headlines already in the hub
    const existing = await base44.entities.InvestmentNews.list('-published_date', 200);
    const seen = new Set((existing || []).map((n) => normalize(n.headline)));
    const fresh = [];
    for (const item of feedItems) {
      const key = normalize(item.headline);
      if (key && !seen.has(key) && !fresh.some((f) => normalize(f.headline) === key)) {
        fresh.push(item);
      }
      if (fresh.length >= MAX_ITEMS) break;
    }
    if (fresh.length === 0) return Response.json({ created: 0, checked: feedItems.length });

    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a news analyst for a Hong Kong retail and wealth bank. Classify each news item below for the bank's marketing intelligence hub.

For each item return:
- index: the item's number
- category: one of equities, securities, fixed_income, fx, commodities, macro, crypto, real_estate, insurance
- sentiment: positive, negative, or neutral
- relevance_score: 1-100, relevance to Hong Kong bank retail and wealth clients
- affected_products: comma separated subset of wealth, funds, mortgage, credit_card, insurance, deposit, fx, bonds, equities (empty string if none)
- summary: one factual sentence based only on the headline — do not invent details

Items:
${fresh.map((f, i) => `${i}. ${f.headline}`).join('\n')}

Respond with items in the same order.`,
      response_json_schema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                index: { type: 'number' },
                category: { type: 'string' },
                sentiment: { type: 'string' },
                relevance_score: { type: 'number' },
                affected_products: { type: 'string' },
                summary: { type: 'string' },
              },
              required: ['index', 'category', 'sentiment', 'relevance_score', 'summary'],
            },
          },
        },
        required: ['items'],
      },
    });

    const validCategories = ['equities', 'securities', 'fixed_income', 'fx', 'commodities', 'macro', 'crypto', 'real_estate', 'insurance'];
    const classified = (llm && Array.isArray(llm.items)) ? llm.items : [];
    const toCreate = [];
    for (const c of classified) {
      const item = fresh[c.index];
      if (!item || !item.headline) continue;
      toCreate.push({
        headline: item.headline,
        summary: (c.summary || item.headline).slice(0, 500),
        category: validCategories.includes(c.category) ? c.category : 'macro',
        sentiment: ['positive', 'negative', 'neutral'].includes(c.sentiment) ? c.sentiment : 'neutral',
        relevance_score: Math.max(1, Math.min(100, Math.round(c.relevance_score || 50))),
        source: item.source,
        published_date: item.published_date,
        affected_products: c.affected_products || '',
        status: 'new',
      });
    }

    if (toCreate.length === 0) return Response.json({ created: 0, checked: feedItems.length });

    await base44.entities.InvestmentNews.bulkCreate(toCreate);
    return Response.json({ created: toCreate.length, checked: feedItems.length, items: toCreate });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}