import { getQuote, getIndices, getMovers, searchSymbols, getTimeSeries } from '../services/marketDataService.js';
import { ok, fail } from '../utils/apiResponse.js';

export async function quote(req, res) {
  const data = await getQuote(req.params.symbol);
  if (!data) return fail(res, `Unknown symbol: ${req.params.symbol}`, 404);
  return ok(res, data);
}

export async function indices(req, res) {
  return ok(res, await getIndices());
}

export async function movers(req, res) {
  return ok(res, await getMovers());
}

export async function search(req, res) {
  const q = req.query.q || req.query.query;
  if (!q) return fail(res, 'Query parameter "q" is required', 400);
  const results = await searchSymbols(q);
  return ok(res, results);
}

export async function history(req, res) {
  const { symbol } = req.params;
  const { interval = '1day', outputsize = 30 } = req.query;
  const series = await getTimeSeries(symbol, interval, parseInt(outputsize, 10));
  return ok(res, series);
}