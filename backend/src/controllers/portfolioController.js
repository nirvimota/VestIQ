import { PortfolioService, getFundsSummary } from '../services/portfolioService.js';
import { MarketDataService } from '../services/marketDataService.js';
import { ok, fail } from '../utils/apiResponse.js';

export async function holdings(req, res) {
  try {
    const userId = req.user.id;
    // Get both positions (stocks bought via orders) and holdings
    const positions = await PortfolioService.getPositions(userId);
    const holdingsData = await PortfolioService.getHoldings(userId);

    // Combine positions & holdings into unified array
    const allItems = [
      ...positions.map(p => ({
        id: p.id,
        symbol: p.symbol,
        name: p.symbol,
        qty: p.quantity,
        avg: p.average_price,
        current_price: p.current_price || p.average_price,
        type: 'stock'
      })),
      ...holdingsData.map(h => ({
        id: h.id,
        symbol: h.symbol,
        name: h.symbol,
        qty: h.quantity,
        avg: h.average_price,
        current_price: h.current_price || h.average_price,
        type: 'holding'
      }))
    ];

    // Fetch live market quotes for all symbols in parallel for real-time accuracy
    const enrichedItems = await Promise.all(
      allItems.map(async (item) => {
        try {
          const quote = await MarketDataService.getQuote(item.symbol);
          const ltp = quote?.price || item.current_price || item.avg;
          const up = ltp >= item.avg;
          return {
            ...item,
            name: quote?.name || item.symbol,
            ltp,
            up,
            change: quote?.change || 0,
            change_pct: quote?.change_pct || 0
          };
        } catch {
          return {
            ...item,
            ltp: item.current_price || item.avg,
            up: item.current_price >= item.avg
          };
        }
      })
    );

    return ok(res, enrichedItems);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function funds(req, res) {
  try {
    const data = await getFundsSummary(req.user.id);
    return ok(res, data);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}