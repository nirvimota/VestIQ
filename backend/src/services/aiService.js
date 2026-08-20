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
      content: `Analyze ${symbol} for an Indian retail trader/investor.

**Live Quote**
Price: ₹${quote.price ?? 'N/A'} | Change: ${quote.change_pct ?? 'N/A'}% | 
High: ₹${quote.high ?? 'N/A'} | Low: ₹${quote.low ?? 'N/A'} | Volume: ${quote.volume ?? 'N/A'}

**Fundamentals**
${fundText}

**Recent Headlines**
${newsText}

Provide:
1. **Trading Strategy & Horizon** (e.g., "Hold for 1–2 days for target profit of 3-5%" or "Avoid buying right now")
2. **Sentiment & Recommendation** (Bullish / Neutral / Bearish with buy/sell trigger price)
3. **Target Price & Stop Loss**
4. **Key Risks & Catalyst Drivers** (2–3 bullet points)
5. **Actionable Summary for Practice Session**

Keep the response clear, structured, and actionable.`,
    },
  ];

  const result = await chat(messages, { maxTokens: 800, temperature: 0.3 });

  if (result.includes('Unable to generate AI response') || result.includes('GROK_API_KEY is not configured')) {
    const isUp = (quote.change_pct ?? 0) >= 0;
    const cmp = Number(quote.price || 100);
    const targetVal = (cmp * (isUp ? 1.04 : 0.96)).toFixed(2);
    const stopVal = (cmp * (isUp ? 0.97 : 1.02)).toFixed(2);

    return `### **Trading Strategy & Recommendation**: ${isUp ? 'BUY & HOLD' : 'AVOID / SHORT'}
⏱️ **Suggested Horizon**: ${isUp ? 'Hold for 1–3 trading days for a ~4% profit target.' : 'Wait for pullback consolidation (1-2 days).'}

🎯 **Target Price**: ₹${targetVal} | 🛑 **Stop Loss**: ₹${stopVal}

**Key Catalyst & Drivers**:
- Live momentum: ${isUp ? 'Positive price strength (+ ' + (quote.change_pct || 0) + '%)' : 'Under seller pressure (' + (quote.change_pct || 0) + '%)'}
- Trading volume support at ₹${cmp}.

**Actionable Insight for Practice Session**:
${isUp ? `Enter paper buy order near ₹${cmp}. Set limit target at ₹${targetVal} and execute sell within 1-2 sessions.` : `Do not enter long positions yet. Wait until price breaks above ₹${targetVal} before placing buy order.`}`;
  }

  return result;
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

export async function predictStockMovement(symbol, quote = {}, history = []) {
  const currentPrice = Number(quote.price || (history.length > 0 ? history[history.length - 1].close : 100));

  // Compute 20-period SMA and RSI (14) if history exists
  let sma20 = currentPrice;
  let rsi14 = 50;

  if (history.length >= 14) {
    const closes = history.map(h => Number(h.close || h.price || currentPrice));
    const recent20 = closes.slice(-20);
    sma20 = recent20.reduce((a, b) => a + b, 0) / recent20.length;

    let gains = 0;
    let losses = 0;
    for (let i = closes.length - 14; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }
    const avgGain = gains / 14;
    const avgLoss = losses / 14;
    if (avgLoss === 0) {
      rsi14 = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsi14 = 100 - (100 / (1 + rs));
    }
  }

  const promptText = `Provide a structured AI trading prediction payload for stock ${symbol}.
Current Price: ₹${currentPrice.toFixed(2)}
20-day SMA: ₹${sma20.toFixed(2)}
RSI (14): ${rsi14.toFixed(1)}

Respond STRICTLY in JSON format without markdown code blocks:
{
  "sentiment": "Bullish" | "Bearish" | "Neutral",
  "confidence_pct": number (50-95),
  "price_target_1w": number,
  "stop_loss": number,
  "timeframe_outlook": "string (explicit recommendation e.g. 'Hold position for 1–2 days to capture ~3.5% profit target at ₹... before closing trade')",
  "signals": ["string", "string"]
}`;

  const messages = [
    { role: 'system', content: SYSTEM_BASE + ' Respond ONLY in valid JSON string format without markdown formatting.' },
    { role: 'user', content: promptText },
  ];

  const rawRes = await chat(messages, { maxTokens: 400, temperature: 0.2 });

  try {
    const cleanJson = rawRes.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    return {
      symbol,
      price: currentPrice,
      sentiment: parsed.sentiment || (rsi14 > 55 ? 'Bullish' : rsi14 < 45 ? 'Bearish' : 'Neutral'),
      confidence_pct: parsed.confidence_pct || 72,
      price_target_1w: Number(parsed.price_target_1w || (currentPrice * (rsi14 > 50 ? 1.035 : 0.965)).toFixed(2)),
      stop_loss: Number(parsed.stop_loss || (currentPrice * 0.96).toFixed(2)),
      timeframe_outlook: parsed.timeframe_outlook || `Recommended Strategy: Hold position for 1–2 sessions targeting ₹${(currentPrice * 1.035).toFixed(2)} (+3.5% profit target). RSI sitting at ${rsi14.toFixed(1)}.`,
      signals: parsed.signals || [
        currentPrice >= sma20 ? 'Trading above 20 SMA support' : 'Trading below 20 SMA resistance',
        rsi14 > 60 ? 'Strong upward momentum (RSI > 60)' : rsi14 < 40 ? 'Oversold condition detected (RSI < 40)' : 'Neutral momentum bounds',
      ],
    };
  } catch {
    // Deterministic fallback engine when LLM JSON parsing fails or GROK key is offline
    const isBull = rsi14 >= 50;
    const targetPrice = Number((currentPrice * (isBull ? 1.035 : 0.965)).toFixed(2));
    return {
      symbol,
      price: currentPrice,
      sentiment: isBull ? 'Bullish' : 'Bearish',
      confidence_pct: 68,
      price_target_1w: targetPrice,
      stop_loss: Number((currentPrice * (isBull ? 0.96 : 1.03)).toFixed(2)),
      timeframe_outlook: isBull
        ? `Hold paper buy position for 1–2 trading days to target ₹${targetPrice} (+3.5% profit). Technical 20-day SMA support at ₹${sma20.toFixed(2)}.`
        : `Cautious momentum (RSI ${rsi14.toFixed(1)}). Avoid holding longer than 1 day unless price re-takes 20 SMA (₹${sma20.toFixed(2)}).`,
      signals: [
        currentPrice >= sma20 ? 'Price action holding above 20 SMA' : 'Price testing lower 20 SMA bounds',
        `Relative Strength Index (RSI 14): ${rsi14.toFixed(1)}`,
      ],
    };
  }
}

export default { analyzeStock, marketSummary, answerQuery, portfolioHealthReport, predictStockMovement };

