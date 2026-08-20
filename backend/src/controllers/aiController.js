/**
 * aiController.js
 * HTTP handlers for AI-powered endpoints.
 */

import { analyzeStock, marketSummary, answerQuery, portfolioHealthReport, predictStockMovement } from '../services/aiService.js';
import { getQuote, getCompanyOverview, getTimeSeries } from '../services/marketDataService.js';
import { getStockNews } from '../services/newsService.js';
import { ok, fail } from '../utils/apiResponse.js';

/**
 * GET /api/ai/predict/:symbol
 * Structured AI price prediction and indicator signals.
 */
export async function predictStockHandler(req, res) {
  const { symbol } = req.params;
  if (!symbol) return fail(res, 'Symbol is required', 400);

  try {
    const [quoteRes, historyRes] = await Promise.allSettled([
      getQuote(symbol),
      getTimeSeries(symbol, '1day', 30),
    ]);

    const quote = quoteRes.status === 'fulfilled' ? quoteRes.value : {};
    const history = historyRes.status === 'fulfilled' ? historyRes.value : [];

    const prediction = await predictStockMovement(symbol.toUpperCase(), quote, history);
    return ok(res, prediction);
  } catch (err) {
    console.error('[AI] predictStockHandler error:', err.message);
    return fail(res, 'AI prediction unavailable', 500);
  }
}

/**
 * GET /api/ai/analyze/:symbol
 * Full stock analysis combining live data + news + fundamentals via Grok.
 */
export async function analyzeStockHandler(req, res) {
  const { symbol } = req.params;
  if (!symbol) return fail(res, 'Symbol is required', 400);

  try {
    // Fetch in parallel
    const [quote, fundamentals, news] = await Promise.allSettled([
      getQuote(symbol),
      getCompanyOverview(symbol),
      getStockNews(symbol),
    ]);

    const analysis = await analyzeStock(
      symbol.toUpperCase(),
      quote.status === 'fulfilled' ? quote.value : {},
      news.status === 'fulfilled' ? news.value : [],
      fundamentals.status === 'fulfilled' ? fundamentals.value : {},
    );

    return ok(res, {
      symbol: symbol.toUpperCase(),
      analysis,
      quote:        quote.value,
      fundamentals: fundamentals.value,
      news:         (news.value || []).slice(0, 5),
    });
  } catch (err) {
    console.error('[AI] analyzeStockHandler error:', err.message);
    return fail(res, err.message.includes('GROK_API_KEY') ? err.message : 'AI analysis unavailable', 503);
  }
}

/**
 * GET /api/ai/market-summary
 * Daily market narrative from Grok.
 */
export async function marketSummaryHandler(req, res) {
  const { getIndices, getTopMovers } = await import('../services/marketDataService.js');
  try {
    const [indices, movers] = await Promise.all([getIndices(), getTopMovers()]);
    const summary = await marketSummary(indices, movers);
    return ok(res, { summary, indices, movers });
  } catch (err) {
    console.error('[AI] marketSummaryHandler error:', err.message);
    return fail(res, 'Market summary unavailable', 503);
  }
}

/**
 * POST /api/ai/chat
 * Body: { question: string, context?: string }
 */
export async function chatHandler(req, res) {
  const { question, context } = req.body || {};
  if (!question?.trim()) return fail(res, 'question is required', 400);

  try {
    const answer = await answerQuery(question, context || '');
    return ok(res, { answer });
  } catch (err) {
    console.error('[AI] chatHandler error:', err.message);
    return fail(res, 'AI chat unavailable', 503);
  }
}

/**
 * GET /api/ai/portfolio-health
 * Requires auth — reads positions from Supabase via portfolioService.
 */
export async function portfolioHealthHandler(req, res) {
  const userId = req.user?.id;
  if (!userId) return fail(res, 'Unauthorized', 401);

  try {
    const { PortfolioService } = await import('../services/portfolioService.js');
    const [positions, summary] = await Promise.all([
      PortfolioService.getPositions(userId),
      PortfolioService.getPortfolioSummary(userId),
    ]);
    const report = await portfolioHealthReport(positions, summary);
    return ok(res, { report, summary });
  } catch (err) {
    console.error('[AI] portfolioHealthHandler error:', err.message);
    return fail(res, 'Portfolio health report unavailable', 503);
  }
}
