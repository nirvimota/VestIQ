/**
 * aiService.js
 * AI-powered market analysis using xAI Grok 4.5.
 * The xAI API is OpenAI-compatible, so we use the `openai` SDK
 * pointed at api.x.ai.
 */

import OpenAI from 'openai';
import { env } from '../config/env.js';

// ── Client ───────────────────────────────────────────────────────────────────
function getClient() {
  if (!env.grokApiKey || env.grokApiKey === 'your_grok_api_key_here') {
    throw new Error('GROK_API_KEY is not configured. Add it to your .env file.');
  }
  return new OpenAI({
    apiKey:  env.grokApiKey,
    baseURL: env.grokBaseUrl || 'https://api.x.ai/v1',
  });
}

const MODEL = () => env.grokModel || 'grok-4-5';

// ── Shared helper ─────────────────────────────────────────────────────────────
async function chat(messages, { maxTokens = 1024, temperature = 0.4, timeoutMs = 12000 } = {}) {
  try {
    const client = getClient();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await client.chat.completions.create(
      {
        model:       MODEL(),
        messages,
        max_tokens:  maxTokens,
        temperature,
      },
      { signal: controller.signal }
    ).finally(() => clearTimeout(timer));

    return res.choices[0]?.message?.content?.trim() ?? 'Analysis unavailable.';
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error('[AIService] Grok API request timed out');
      return 'The AI engine request timed out. Please try again in a moment.';
    }
    console.error('[AIService] Grok API call failed:', err.message);
    return `Unable to generate AI response at this time. (${err.message})`;
  }
}

// ── System prompt base ────────────────────────────────────────────────────────
const SYSTEM_BASE = `You are VestIQ AI, an expert financial analyst specializing in Indian equity markets (NSE/BSE).
You have deep knowledge of NIFTY, SENSEX, sector dynamics, SEBI regulations, and INR-denominated investment strategies.
Always be factual, concise, and clearly state when data is unavailable or uncertain.
Format numbers in Indian style (lakhs, crores). Never give definitive buy/sell advice — frame insights as analysis.`;

// ── Exported functions ────────────────────────────────────────────────────────

/**
 * Analyze a stock and return a structured insight.
 * @param {string} symbol
 * @param {Object} quote  – { price, change_pct, high, low, volume, ... }
 * @param {Array}  news   – array of { title, description } headlines
 * @param {Object} fundamentals – { pe_ratio, eps, market_cap, ... }
 */
export async function analyzeStock(symbol, quote = {}, news = [], fundamentals = {}) {
  const newsText = news.length
    ? news.slice(0, 5).map((n, i) => `${i + 1}. ${n.title}`).join('\n')
    : 'No recent news available.';

  const fundText = fundamentals
    ? `P/E: ${fundamentals.pe_ratio ?? 'N/A'} | EPS: ${fundamentals.eps ?? 'N/A'} | Market Cap: ₹${fundamentals.market_cap ? (fundamentals.market_cap / 1e7).toFixed(1) + ' Cr' : 'N/A'} | 52W High: ${fundamentals.week_52_high ?? 'N/A'} | 52W Low: ${fundamentals.week_52_low ?? 'N/A'}`
    : 'Fundamentals unavailable.';

  const messages = [
    { role: 'system', content: SYSTEM_BASE },
    {
      role: 'user',
      content: `Analyze ${symbol} for an Indian retail investor.

**Live Quote**
Price: ₹${quote.price ?? 'N/A'} | Change: ${quote.change_pct ?? 'N/A'}% | 
High: ₹${quote.high ?? 'N/A'} | Low: ₹${quote.low ?? 'N/A'} | Volume: ${quote.volume ?? 'N/A'}

**Fundamentals**
${fundText}

**Recent Headlines**
${newsText}

Provide:
1. **Sentiment** (Bullish / Neutral / Bearish) with a brief reason
2. **Key Risks** (2–3 bullet points)
3. **Key Opportunities** (2–3 bullet points)
4. **Technical Note** (support/resistance, trend)
5. **Analyst Summary** (2–3 sentences for a retail investor)

Keep the response concise and actionable.`,
    },
  ];

  return await chat(messages, { maxTokens: 800, temperature: 0.3 });
}

/**
 * Generate a daily market summary narrative.
 * @param {Array}  indices  – [{ name, price, change_pct }, ...]
 * @param {Object} movers   – { gainers: [...], losers: [...] }
 */
export async function marketSummary(indices = [], movers = {}) {
  const indexText = indices
    .map(i => `${i.name}: ${i.price} (${i.change_pct > 0 ? '+' : ''}${i.change_pct?.toFixed(2)}%)`)
    .join(' | ');

  const gainersText = (movers.gainers || [])
    .slice(0, 3)
    .map(g => `${g.symbol} +${g.change_pct?.toFixed(2)}%`)
    .join(', ');

  const losersText = (movers.losers || [])
    .slice(0, 3)
    .map(l => `${l.symbol} ${l.change_pct?.toFixed(2)}%`)
    .join(', ');

  const messages = [
    { role: 'system', content: SYSTEM_BASE },
    {
      role: 'user',
      content: `Write a concise daily Indian market summary (3–4 sentences max) for VestIQ users.

Indices: ${indexText || 'Data unavailable'}
Top Gainers: ${gainersText || 'N/A'}
Top Losers:  ${losersText || 'N/A'}

Tone: professional but approachable. Include what drove movements if inferable.`,
    },
  ];

  return await chat(messages, { maxTokens: 300, temperature: 0.5 });
}

/**
 * Answer a freeform investment question from a user.
 * @param {string} question
 * @param {string} contextData  – optional JSON string of portfolio/market context
 */
export async function answerQuery(question, contextData = '') {
  const messages = [
    { role: 'system', content: SYSTEM_BASE },
    ...(contextData ? [{
      role: 'system',
      content: `User context (portfolio / market data): ${contextData}`,
    }] : []),
    { role: 'user', content: question },
  ];

  return await chat(messages, { maxTokens: 600, temperature: 0.4 });
}

/**
 * Generate a portfolio health report.
 * @param {Array} positions – [{ symbol, quantity, average_price, current_price, unrealized_pnl }]
 * @param {Object} summary  – { totalMarketValue, totalUnrealizedPNL, totalReturnPercent }
 */
export async function portfolioHealthReport(positions = [], summary = {}) {
  const posText = positions
    .slice(0, 10)
    .map(p => `${p.symbol}: ${p.quantity} shares @ avg ₹${p.average_price?.toFixed(2)}, CMP ₹${p.current_price?.toFixed(2)}, P&L ₹${p.unrealized_pnl?.toFixed(2)}`)
    .join('\n');

  const messages = [
    { role: 'system', content: SYSTEM_BASE },
    {
      role: 'user',
      content: `Review this Indian investor's portfolio and give a health assessment.

**Portfolio Summary**
Total Value: ₹${summary.totalMarketValue?.toFixed(2) ?? 'N/A'}
Total Unrealized P&L: ₹${summary.totalUnrealizedPNL?.toFixed(2) ?? 'N/A'}
Overall Return: ${summary.totalReturnPercent?.toFixed(2) ?? 'N/A'}%

**Holdings**
${posText || 'No positions.'}

Provide:
1. **Health Score** (1–10) with brief justification
2. **Concentration Risk** assessment
3. **Top 2 Suggestions** to improve the portfolio
Keep it under 250 words.`,
    },
  ];

  return await chat(messages, { maxTokens: 500, temperature: 0.35 });
}

export default { analyzeStock, marketSummary, answerQuery, portfolioHealthReport };
