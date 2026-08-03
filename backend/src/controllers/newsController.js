/**
 * newsController.js
 * HTTP handlers for news endpoints.
 */

import { getStockNews, getMarketNews, getTopHeadlines } from '../services/newsService.js';
import { ok, fail } from '../utils/apiResponse.js';

/** GET /api/news/market */
export async function marketNewsHandler(req, res) {
  try {
    const news = await getMarketNews();
    return ok(res, news);
  } catch (err) {
    console.error('[News] marketNewsHandler error:', err.message);
    return fail(res, 'News unavailable', 503);
  }
}

/** GET /api/news/headlines */
export async function headlinesHandler(req, res) {
  try {
    const headlines = await getTopHeadlines();
    return ok(res, headlines);
  } catch (err) {
    console.error('[News] headlinesHandler error:', err.message);
    return fail(res, 'Headlines unavailable', 503);
  }
}

/** GET /api/news/stock/:symbol */
export async function stockNewsHandler(req, res) {
  const { symbol } = req.params;
  if (!symbol) return fail(res, 'Symbol is required', 400);

  try {
    const news = await getStockNews(symbol);
    return ok(res, news);
  } catch (err) {
    console.error(`[News] stockNewsHandler(${symbol}) error:`, err.message);
    return fail(res, 'Stock news unavailable', 503);
  }
}
