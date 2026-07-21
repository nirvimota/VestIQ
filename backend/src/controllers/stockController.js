import { getQuote, getIndices, getMovers } from '../services/marketDataService.js';
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